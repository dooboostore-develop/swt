import { Lifecycle, Sim } from '@dooboostore/simple-boot/decorators/SimDecorator';
import { Component } from '@dooboostore/simple-boot-front/decorators/Component';
import template from './path-flow.route.component.html'
import style from './path-flow.route.component.css'
import { ComponentBase, query } from '@dooboostore/dom-render/components/ComponentBase';
import { OnCreateRender } from '@dooboostore/dom-render/lifecycle/OnCreateRender';
import { isDocumentLoaded, isNewSession, isWindowPopstate, SwtSessionData } from '../../../../Swt';
import { ChartComponent } from '../ChartComponent';
import * as am5 from '@amcharts/amcharts5';
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';
import * as am5flow from '@amcharts/amcharts5/flow';
import { DomRenderNoProxy } from '@dooboostore/dom-render/decorators/DomRenderNoProxy';

@Sim({
  scope: Lifecycle.Transient
})
@Component({
  selector:'PathFlowRouteComponent',
  template: template,
  styles: style
})
export class PathFlowRouteComponent extends ComponentBase implements ChartComponent {
  private sessionIds?: string[];
  private sessions?: SwtSessionData[];
  // @DomRenderNoProxy
  @query('.chart')
  private chartElement?: HTMLDivElement;


  setSessions(sessionIds: string[], sessions: SwtSessionData[]): void {
    this.sessionIds = sessionIds;
    this.sessions = sessions;
    this.onRenderedChatContainer(this.chartElement);
  }

  onRenderedChatContainer(element?: HTMLDivElement ) {
    if (!element) return;

    const targetSessions = (this.sessions ?? []).filter(it => this.sessionIds?.includes(it.id));

    const urlLogs = targetSessions.flatMap(it => it.log).filter(it => isWindowPopstate(it) || isNewSession(it) || isDocumentLoaded(it));
    const transitions = new Map<string, number>();
    for (let i = 0; i < urlLogs.length - 1; i++) {
      const from = urlLogs[i].pathname;
      const to = urlLogs[i + 1].pathname;
      if (from && to && from !== to) {
        const key = `${from}->${to}`;
        transitions.set(key, (transitions.get(key) || 0) + 1);
      }
    }
    const chordChartData = Array.from(transitions.entries()).map(([key, value]) => {
      const [from, to] = key.split('->');
      return {from, to, value};
    });
    // if (chordChartData.length > 0) {
      this.drawChart(element, chordChartData);
    // }
  }

  private drawChart(element: HTMLDivElement, data: { from: string, to: string, value: number }[]) {
    if ((element as any)._root) {
      (element as any)._root.dispose();
    }
    const root = am5.Root.new(element);
    (element as any)._root = root;

    root.setThemes([
      am5themes_Animated.new(root)
    ]);

    const series = root.container.children.push(
      am5flow.ChordDirected.new(root, {
        sourceIdField: 'from',
        targetIdField: 'to',
        valueField: 'value',
        sort: 'ascending',
      })
    );

    series.links.template.set('fillStyle', 'source');
    series.nodes.get('colors')?.set('step', 2);

    series.bullets.push((_root, _series, dataItem) => {
      const bullet = am5.Bullet.new(root, {
        locationY: Math.random(),
        sprite: am5.Circle.new(root, {
          radius: 5,
          fill: (dataItem.get('source') as any)?.get('fill')
        })
      });

      bullet.animate({
        key: 'locationY',
        to: 1,
        from: 0,
        duration: Math.random() * 1000 + 2000,
        loops: Infinity
      });

      return bullet;
    });

    series.nodes.labels.template.setAll({
      textType: 'radial',
      centerX: 0,
      fontSize: 9
    });

    series.data.setAll(data);
    series.appear(1000, 100);
  }


}


// export default {
//
// }