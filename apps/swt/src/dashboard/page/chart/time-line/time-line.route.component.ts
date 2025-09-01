import { Lifecycle, Sim, SimConfig } from '@dooboostore/simple-boot/decorators/SimDecorator';
import { Component } from '@dooboostore/simple-boot-front/decorators/Component';
import template from './time-line.route.component.html'
import style from './time-line.route.component.css'
import { ComponentBase, query } from '@dooboostore/dom-render/components/ComponentBase';
import { OnCreateRender } from '@dooboostore/dom-render/lifecycle/OnCreateRender';
import { SwtSessionData } from 'apps/swt/src/Swt';
import { ChartComponent } from 'apps/swt/src/dashboard/page/chart/ChartComponent';
import * as am5 from '@amcharts/amcharts5';
import * as am5flow from '@amcharts/amcharts5/flow';
import * as am5xy from '@amcharts/amcharts5/xy';
import * as am5timeline from '@amcharts/amcharts5/timeline';
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';
import { DownloadUtils } from '@dooboostore/core-web/download/DownloadUtils';
import { SimFrontOption } from '@dooboostore/simple-boot-front/option/SimFrontOption';
import { DomRenderNoProxy } from '@dooboostore/dom-render/decorators/DomRenderNoProxy';

type FlagData = {
  category: string
  date: number
  dateISO: string
  data: any
  letter: string
};

type TimeLineData = {
  category: string
  start: number
  end: number
  color: am5.Color | undefined
  task: string
};

@Sim({
  scope: Lifecycle.Transient
})
@Component({
  selector: 'TimeLineRouteComponent',
  template: template,
  styles: style
})
export class TimeLineRouteComponent extends ComponentBase implements ChartComponent {
  private sessionIds?: string[];
  private sessions?: SwtSessionData[];
  // @DomRenderNoProxy
  // @query('.chart')
  private chartElement?: HTMLDivElement;
  private flagDatas?: FlagData[];
  private timelineDatas?: TimeLineData[];
  constructor(private simFrontOption: SimFrontOption) {
    super();
  }
  setSessions(sessionIds: string[], sessions: SwtSessionData[]): void {
    this.sessionIds = sessionIds;
    this.sessions = sessions;
    this.onRenderedChatContainer(this.chartElement);
  }

  onRenderedChatContainer(element?: HTMLDivElement) {
    if (!element) return;
    this.chartElement = element;
    const targetSessions = (this.sessions ?? []).filter(it => this.sessionIds?.includes(it.id));


    // Timeline Chart
    const colorSet = am5.ColorSet.new(am5.Root.new(document.createElement('div')), {});
    const sessionColors = new Map<string, am5.Color>();
    targetSessions.forEach((session, index) => {
      sessionColors.set(session.id, colorSet.getIndex(index));
    });

    const timelineDatas = targetSessions.map(session => {
      if (session.log.length === 0) {
        return null;
      }
      const dates = session.log.map(log => new Date(log.date).getTime());
      const minDate = Math.min(...dates);
      const maxDate = Math.max(...dates);

      return {
        category: session.id,
        start: minDate,
        end: maxDate,
        color: sessionColors.get(session.id),
        task: `Session (${session.log.length} events)`
      };
    }).filter(item => item !== null);

    const flagDatas = targetSessions.flatMap(session => {
      return session.log.map(logEntry => {
        const date = new Date(logEntry.date);
        const newVar:FlagData = {
          category: session.id,
          date: date.getTime(),
          dateISO: date.toISOString(),
          data: logEntry,
          letter: logEntry.type as string
        };
        return newVar;
      });
    });

    this.drawChart(element, timelineDatas, flagDatas);
    this.flagDatas = flagDatas
    this.timelineDatas = timelineDatas;
  }

  drawChart(element: HTMLDivElement, timelineDatas: TimeLineData[], flagDatas: FlagData[]) {
    if ((element as any)._root) {
      (element as any)._root.dispose();
    }

    const root = am5.Root.new(element);
    (element as any)._root = root;

    root.setThemes([
      am5themes_Animated.new(root)
    ]);

    const chart = root.container.children.push(am5timeline.SerpentineChart.new(root, {
      // orientation: "horizontal",
      levelCount: 3,
      startLocation: 0.2,
      endLocation: 1,
      wheelY: 'zoomX'
    }));

    chart.set('scrollbarX', am5.Scrollbar.new(root, {
      orientation: 'horizontal'
    }));

    const yRenderer = am5timeline.AxisRendererCurveY.new(root, {});
    yRenderer.labels.template.setAll({
      centerY: am5.p50,
      centerX: am5.p100,
      fontSize: 11
    });
    yRenderer.grid.template.set('forceHidden', true);

    const xRenderer = am5timeline.AxisRendererCurveX.new(root, {
      yRenderer: yRenderer,
      strokeDasharray: [2, 3],
      strokeOpacity: 0.5,
      stroke: am5.color(0x000000)
    });
    xRenderer.labels.template.setAll({
      centerY: am5.p50,
      fontSize: 11,
      minPosition: 0.01
    });
    xRenderer.labels.template.setup = (target) => {
      target.set('layer', 30);
      target.set('background', am5.Rectangle.new(root, {
        fill: am5.color(0xffffff),
        fillOpacity: 1
      }));
    };

    const yAxis = chart.yAxes.push(am5xy.CategoryAxis.new(root, {
      maxDeviation: 0,
      categoryField: 'category',
      renderer: yRenderer
    }));

    const xAxis = chart.xAxes.push(am5xy.DateAxis.new(root, {
      baseInterval: {timeUnit: 'millisecond', count: 1},
      renderer: xRenderer,
      tooltip: am5.Tooltip.new(root, {})
    }));

    const series = chart.series.push(am5timeline.CurveColumnSeries.new(root, {
      xAxis: xAxis,
      yAxis: yAxis,
      baseAxis: yAxis,
      valueXField: 'end',
      openValueXField: 'start',
      categoryYField: 'category',
      layer: 30
    }));

    series.columns.template.setAll({
      height: am5.percent(10),
      strokeOpacity: 0
    });

    series.columns.template.adapters.add('fill', (fill, target) => {
      return (target.dataItem?.dataContext as any)?.color;
    });

    series.bullets.push(() => {
      const circle = am5.Circle.new(root, {
        radius: 4,
        strokeWidth: 2,
        strokeOpacity: 0.5,
        layer: 30
      });
      circle.adapters.add('fill', (fill, target) => {
        return (target.dataItem?.dataContext as any)?.color;
      });
      return am5.Bullet.new(root, {
        sprite: circle,
        locationX: 0,
        locationY: 0.5
      });
    });

    series.bullets.push(() => {
      const circle = am5.Circle.new(root, {
        radius: 4,
        strokeWidth: 2,
        strokeOpacity: 0.5,
        layer: 30
      });
      circle.adapters.add('fill', (fill, target) => {
        return (target.dataItem?.dataContext as any)?.color;
      });
      return am5.Bullet.new(root, {
        sprite: circle,
        locationX: 1
      });
    });

    series.data.setAll(timelineDatas);

    // line series for flags
    // @ts-ignore
    const lineSeries = chart.series.push(am5timeline.CurveLineSeries.new(root, {
      xAxis: xAxis, yAxis: yAxis, categoryYField: 'category', valueXField: 'date'
    }));
    //@ts-ignore
    lineSeries.strokes.template.set('forceHidden', true);

    lineSeries.bullets.push((root, series, dataItem) => {
      // @ts-ignore
      const flag = am5.Tooltip.new(root, {
        centerY: 28,
        paddingBottom: 4, paddingLeft: 7, paddingRight: 7, paddingTop: 4, layer: 30
      })

      // @ts-ignore
      flag.get('background')?.setAll({stroke: am5.color(0x000000), cornerRadius: 0})

      // @ts-ignore
      flag.label.setAll({
        fill: am5.color(0x000000),
        text: (dataItem.dataContext as any).letter,
        fontSize: '0.8em'
      });
      flag.show();
      return am5.Bullet.new(root, {
        sprite: flag,
        locationX: 0.5, locationY: 0.5
      })
    });

    lineSeries.data.setAll(flagDatas);

    const yAxisData = timelineDatas.map(it => ({category: it.category})).filter((value, index, self) => self.findIndex(v => v.category === value.category) === index);
    yAxis.data.setAll(yAxisData);

    series.appear(1000);
    chart.appear(1000, 100);
  }

  exportToCsv() {
    if (!this.flagDatas || this.flagDatas.length === 0) {
      alert('No data to export.');
      return;
    }

    const exportData = this.flagDatas.map(it => ({...it, _rawData: {...it}}))
    DownloadUtils.csvDownload(this.simFrontOption.window, exportData, {headers:['category','dateISO','letter', '_rawData']})

  }
}


// export default {
//
// }