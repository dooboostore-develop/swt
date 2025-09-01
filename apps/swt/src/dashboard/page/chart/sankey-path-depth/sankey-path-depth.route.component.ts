import { Lifecycle, Sim } from '@dooboostore/simple-boot/decorators/SimDecorator';
import { Component } from '@dooboostore/simple-boot-front/decorators/Component';
import template from './sankey-path-depth.route.component.html';
import style from './sankey-path-depth.route.component.css';
import { ComponentBase, query } from '@dooboostore/dom-render/components/ComponentBase';
import { isDocumentLoaded, isWindowChangeState, SwtSessionData } from '../../../../Swt';
import { SwtSessionDataConvertUtils } from '../../../../utils/SwtSessionDataConvertUtils';
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

    const initialTargetSessions = (this.sessions ?? []).filter(it => this.sessionIds?.includes(it.id));

    // Step 1: Filter logs using filterSessionLogs for the first condition
    const filteredSessionsByLogType = SwtSessionDataConvertUtils.filterSessionLogs(
      initialTargetSessions,
      (log, session) => isWindowChangeState(log) || isDocumentLoaded(log)
    );

    // Step 2: Apply the second filtering condition (removing consecutive same-pathname logs)
    const sessionsWithProcessedLogs = filteredSessionsByLogType;


    const dataMap = new Map<string, SankeyData>();

    sessionsWithProcessedLogs.forEach(sessionData => {
      const logs = sessionData.log;

      // Handle the very first transition from session start
      if (logs.length > 0 && logs[0].pathname !== sessionData.start.pathname) {
        this._addSankeyTransition(dataMap, sessionData.start.pathname, logs[0].pathname, sessionData.id);
      }

      // Continue with the rest of the transitions within logs
      for (let i = 0; i < logs.length; i += 1) {
        const from = logs[i];
        const to = logs[i + 1];
        if (!to) {
          continue;
        }
        this._addSankeyTransition(dataMap, from.pathname, to.pathname, sessionData.id);
      }
    });

    const datas = Array.from(dataMap.values());
    this.drawChart(element, datas);

  }

  private drawChart(element: HTMLDivElement, data: SankeyData[]) {
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

  

  private _addSankeyTransition(
    dataMap: Map<string, SankeyData>,
    fromPathname: string,
    toPathname: string,
    sessionId: string
  ) {
    const fromSplit = fromPathname.split('/');
    const toSplit = toPathname.split('/');

    const key = `${sessionId}:${fromPathname} -> ${toPathname}`;
    const isDeeper = this.selectedDepthOption === 'deeper' && fromSplit.length < toSplit.length;
    const isBack = this.selectedDepthOption === 'back' && fromSplit.length > toSplit.length;
    const isEquals = this.selectedDepthOption === 'equals' && fromSplit.length === toSplit.length;

    if (isDeeper || isBack || isEquals) {
      const data = dataMap.get(key) ?? {from: `${fromPathname}${isEquals?'-from':''}`, to: `${toPathname}${isEquals?'-to':''}`, value: 0, id: sessionId};
      // const data = dataMap.get(key) ?? {from: `${fromPathname}${isEquals?''-from'':''}`, to: `${toPathname}${isEquals?''-to'':''}`, value: 0, id: sessionId};
      data.value++;
      dataMap.set(key, data);
    }
  }


}

