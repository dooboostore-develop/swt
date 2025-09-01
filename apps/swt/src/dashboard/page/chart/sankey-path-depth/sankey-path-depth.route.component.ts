import { Lifecycle, Sim } from '@dooboostore/simple-boot/decorators/SimDecorator';
import { Component } from '@dooboostore/simple-boot-front/decorators/Component';
import template from './sankey-path-depth.route.component.html';
import style from './sankey-path-depth.route.component.css';
import { ComponentBase, query } from '@dooboostore/dom-render/components/ComponentBase';
import { isDocumentLoaded, isNewSession, isWindowPopstate, SwtSessionData } from '../../../../Swt';
import { ChartComponent } from '../ChartComponent';
import * as am5 from '@amcharts/amcharts5';
import * as am5flow from '@amcharts/amcharts5/flow';
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';
import { DomRenderNoProxy } from '@dooboostore/dom-render/decorators/DomRenderNoProxy';

type SankeyData = {
  from: string;
  to: string;
  value: number;
  id: string; // Add id field for traceability
};

type DepthOption = 'deeper' | 'back' | 'equals';

@Sim({
  scope: Lifecycle.Transient
})
@Component({
  selector: 'SankeyPathDepthRouteComponent',
  template: template,
  styles: style
})
export class SankeyPathDepthRouteComponent extends ComponentBase implements ChartComponent {
  // @DomRenderNoProxy
  @query('.chart')
  private chartElement?: HTMLDivElement;
  private sessionIds?: string[];
  private sessions?: SwtSessionData[];

  selectedDepthOption: DepthOption = 'deeper';

  setSessions(sessionIds: string[], sessions: SwtSessionData[]): void {
    this.sessionIds = sessionIds;
    this.sessions = sessions;
    this.onRenderedChatContainer(this.chartElement);
  }

  onDepthChange(option: DepthOption) {
    this.selectedDepthOption = option;
    this.onRenderedChatContainer(this.chartElement);
  }

  onRenderedChatContainer(element?: HTMLDivElement) {
    if (!element) return;

    const dataMap = new Map<string, SankeyData>();
    const targetSessions = (this.sessions ?? []).filter(it => this.sessionIds?.includes(it.id));
    targetSessions.forEach(sessionData => {
      const logs = sessionData.log.filter(it => isWindowPopstate(it) || isNewSession(it) || isDocumentLoaded(it)).filter((log, idx, arr) => {
        // 다음 요소가 존재하고 pathname이 같으면 제거
        if (idx < arr.length - 1 && log.pathname === arr[idx + 1].pathname) {
          return false;
        }
        return true;
      });

      for (let i = 0; i < logs.length; i += 1) {
        const from = logs[i];
        const to = logs[i + 1];
        if (!from || !to) {
          continue;
        }

        const fromSplit = from.pathname.split('/')
        const toSplit = to.pathname.split('/')

        const key = `${sessionData.id}:${from.pathname} -> ${to.pathname}`;
        const isDeeper = this.selectedDepthOption === 'deeper' && fromSplit.length < toSplit.length;
        const isBack = this.selectedDepthOption === 'back' && fromSplit.length > toSplit.length;
        const isEquals = this.selectedDepthOption === 'equals' && fromSplit.length === toSplit.length;
        if (isDeeper || isBack || isEquals) {
          const data = dataMap.get(key) ?? {from: `${from.pathname}${isEquals?'-from':''}`, to: `${to.pathname}${isEquals?'-to':''}`, value: 0, id: sessionData.id};
          data.value++;
          dataMap.set(key, data);
        }
      }
    })

    const datas = Array.from(dataMap.values())
    this.drawChart(element, datas);

  }

  private drawChart(element: HTMLDivElement, data: SankeyData[]) {
    console.log('data-->', data)
    if ((element as any)._root) {
      (element as any)._root.dispose();
    }
    const root = am5.Root.new(element);
    (element as any)._root = root;

    root.setThemes([am5themes_Animated.new(root)]);

    const max = Math.max(...data.map(it=>it.to.length))
    let series = root.container.children.push(
      am5flow.Sankey.new(root, {
        sourceIdField: "from",
        targetIdField: "to",
        valueField: "value",
        paddingRight: max*8,
        idField: "id"
      })
    );

    series.links.template.setAll({ fillStyle: "solid", fillOpacity: 0.15 });

    // highlight all links with the same id beginning
    series.links.template.events.on("pointerover", function (event) {
      let dataItem = event.target.dataItem;
      // @ts-ignore
      let id = dataItem.get("id").split("-")[0];

      am5.array.each(series.dataItems, function (dataItem) {
        // @ts-ignore
        if (dataItem.get("id").indexOf(id) != -1) {
          dataItem.get("link").hover();
        }
      });
    });

    series.links.template.events.on("pointerout", function (event) {
      am5.array.each(series.dataItems, function (dataItem) {
        dataItem.get("link").unhover();
      });
    });

    series.data.setAll(data);

    series.appear(1000, 100);
  }


}

