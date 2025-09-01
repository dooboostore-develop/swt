import { Lifecycle, Sim } from '@dooboostore/simple-boot/decorators/SimDecorator';
import { Component } from '@dooboostore/simple-boot-front/decorators/Component';
import template from './error-log.route.component.html';
import style from './error-log.route.component.css';
import { ComponentBase, query } from '@dooboostore/dom-render/components/ComponentBase';
import { isSwtError, SwtSessionData } from '../../../../Swt';
import { ChartComponent } from '../ChartComponent';
import * as am5 from '@amcharts/amcharts5';
import * as am5xy from '@amcharts/amcharts5/xy';
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';
import { SwtSessionDataConvertUtils } from '../../../../utils/SwtSessionDataConvertUtils';

interface ChartData {
  pathname: string;
  error: number;
  unhandledrejection: number;
}

@Sim({
  scope: Lifecycle.Transient
})
@Component({
  selector: 'ErrorLogRouteComponent',
  template: template,
  styles: style
})
export class ErrorLogRouteComponent extends ComponentBase implements ChartComponent {
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

    const chartData: ChartData[] = [];

    logsByPage.forEach((logs, pathname) => {
      const errorLogs = logs.filter(isSwtError);
      if (errorLogs.length > 0) {
        const dataPoint: ChartData = {
          pathname,
          error: 0,
          unhandledrejection: 0,
        };
        errorLogs.forEach(log => {
          if (log.errorType === 'error') {
            dataPoint.error++;
          } else if (log.errorType === 'unhandledrejection') {
            dataPoint.unhandledrejection++;
          }
        });
        chartData.push(dataPoint);
      }
    });

    this.drawChart(element, chartData);
  }

  private drawChart(element: HTMLDivElement, data: ChartData[]) {
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
      paddingLeft: 0,
      layout: root.verticalLayout
    }));

    chart.set("scrollbarX", am5.Scrollbar.new(root, {
      orientation: "horizontal"
    }));

    const xAxis = chart.xAxes.push(am5xy.CategoryAxis.new(root, {
      categoryField: 'pathname',
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

    const yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
      min: 0,
      renderer: am5xy.AxisRendererY.new(root, {
        strokeOpacity: 0.1
      })
    }));

    const legend = chart.children.push(am5.Legend.new(root, {
      centerX: am5.p50,
      x: am5.p50
    }));

    const makeSeries = (name: string, fieldName: 'error' | 'unhandledrejection') => {
      const series = chart.series.push(am5xy.ColumnSeries.new(root, {
        name: name,
        stacked: true,
        xAxis: xAxis,
        yAxis: yAxis,
        valueYField: fieldName,
        categoryXField: 'pathname'
      }));

      series.columns.template.setAll({
        tooltipText: '{name}, {categoryX}: {valueY}',
        tooltipY: am5.percent(90)
      });
      series.data.setAll(data);
      series.appear();

      series.bullets.push(function () {
        return am5.Bullet.new(root, {
          sprite: am5.Label.new(root, {
            text: '{valueY}',
            fill: root.interfaceColors.get('alternativeText'),
            centerY: am5.p50,
            centerX: am5.p50,
            populateText: true
          })
        });
      });

      legend.data.push(series);
    }

    makeSeries('Error', 'error');
    makeSeries('Unhandled Rejection', 'unhandledrejection');

    chart.appear(1000, 100);
  }
}
