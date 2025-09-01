import { Lifecycle, Sim } from '@dooboostore/simple-boot/decorators/SimDecorator';
import { Component } from '@dooboostore/simple-boot-front/decorators/Component';
import template from './event-distribution.route.component.html';
import style from './event-distribution.route.component.css';
import { ComponentBase, query } from '@dooboostore/dom-render/components/ComponentBase';
import { SwtSessionData } from '../../../../Swt';
import { ChartComponent } from '../ChartComponent';
import * as am5 from '@amcharts/amcharts5';
import * as am5xy from '@amcharts/amcharts5/xy';
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';
import { DomRenderNoProxy } from '@dooboostore/dom-render/decorators/DomRenderNoProxy';
import { SwtSessionDataConvertUtils } from '../../../../utils/SwtSessionDataConvertUtils';

interface ChartData {
  page: string;

  [key: string]: any;
}

@Sim({
  scope: Lifecycle.Transient
})
@Component({
  selector: 'EventDistributionRouteComponent',
  template: template,
  styles: style
})
export class EventDistributionRouteComponent extends ComponentBase implements ChartComponent {
  // @DomRenderNoProxy
  @query('.chart')
  private chartElement?: HTMLDivElement;
  private sessionIds?: string[];
  private sessions?: SwtSessionData[];

  setSessions(sessionIds: string[], sessions: SwtSessionData[]): void {
    this.sessionIds = sessionIds;
    this.sessions = sessions;
    this.onRenderedChatContainer(this.chartElement);
  }

  onRenderedChatContainer(element?: HTMLDivElement) {
    if (!element || !this.sessionIds || !this.sessions) return;

    const targetSessions = this.sessions.filter(it => this.sessionIds!.includes(it.id));
    const logsByPage = SwtSessionDataConvertUtils.groupByPathname(targetSessions);

    const eventCountsByPage = new Map<string, Map<string, number>>();
    const allEventTypes = new Set<string>();

    logsByPage.forEach((logs, page) => {
      const eventCounts = new Map<string, number>();
      logs.forEach(log => {
        const eventType = log.type;
        eventCounts.set(eventType, (eventCounts.get(eventType) || 0) + 1);
        allEventTypes.add(eventType);
      });
      eventCountsByPage.set(page, eventCounts);
    });

    const chartData: ChartData[] = [];
    eventCountsByPage.forEach((events, page) => {
      const dataPoint: ChartData = {page};
      events.forEach((count, eventType) => {
        dataPoint[eventType] = count;
      });
      chartData.push(dataPoint);
    });

    this.drawChart(element, chartData, Array.from(allEventTypes));
  }

  private drawChart(element: HTMLDivElement, data: ChartData[], eventTypes: string[]) {
    if ((element as any)._root) {
      (element as any)._root.dispose();
    }
    const root = am5.Root.new(element);
    (element as any)._root = root;

    root.setThemes([am5themes_Animated.new(root)]);

    const chart = root.container.children.push(am5xy.XYChart.new(root, {
      panX: false,
      panY: false,
      wheelX: 'panX',
      wheelY: 'zoomX',
      layout: root.verticalLayout
    }));

    chart.set('scrollbarX', am5.Scrollbar.new(root, { orientation: 'horizontal' }));
    chart.set('cursor', am5xy.XYCursor.new(root, {}));

    const yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
      min: 0,
      max: 100,
      strictMinMax: true,
      calculateTotals: true,
      renderer: am5xy.AxisRendererY.new(root, {
        strokeOpacity: 0.1
      })
    }));
    // @ts-ignore
    yAxis.get('renderer').labels.template.setAll({numberFormat: '#\'%\''});

    const xAxis = chart.xAxes.push(am5xy.CategoryAxis.new(root, {
      categoryField: 'page',
      renderer: am5xy.AxisRendererX.new(root, {
        minGridDistance: 30
      }),
      tooltip: am5.Tooltip.new(root, {})
    }));

    xAxis.get('renderer').labels.template.setAll({
      rotation: -45,
      centerY: am5.p50,
      centerX: am5.p100,
      paddingRight: 15
    });

    xAxis.data.setAll(data);

    const legend = chart.children.push(am5.Legend.new(root, {
      centerX: am5.p50,
      x: am5.p50
    }));

    eventTypes.forEach(eventType => {
      const series = chart.series.push(am5xy.ColumnSeries.new(root, {
        name: eventType,
        xAxis: xAxis,
        yAxis: yAxis,
        valueYField: eventType,
        valueYShow: 'valueYTotalPercent',
        categoryXField: 'page',
        stacked: true,
        tooltip: am5.Tooltip.new(root, {
          labelText: '{name}: {valueY} ({valueYTotalPercent.formatNumber(\'#.00\')})%'
        })
      }));

      series.bullets.push(function() {
        return am5.Bullet.new(root, {
          locationY: 0.5,
          sprite: am5.Label.new(root, {
            text: '{valueYTotalPercent.formatNumber(\'#.00\')}%',
            fill: root.interfaceColors.get('background'),
            centerY: am5.p50,
            centerX: am5.p50,
            populateText: true
          })
        });
      });

      series.data.setAll(data);
      series.appear();
    });

    legend.data.setAll(chart.series.values);
    chart.appear(1000, 100);
  }
}