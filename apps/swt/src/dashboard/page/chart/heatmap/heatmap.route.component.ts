import { Lifecycle, Sim } from '@dooboostore/simple-boot/decorators/SimDecorator';
import { Component } from '@dooboostore/simple-boot-front/decorators/Component';
import template from './heatmap.route.component.html';
import style from './heatmap.route.component.css';
import { ComponentBase, query } from '@dooboostore/dom-render/components/ComponentBase';
import { isSwtElementBind, isSwtElementUnbind, isSwtElementVisible, isSwtElementInvisible, isSwtElementClick, SwtSessionData } from '../../../../Swt';
import { ChartComponent } from '../ChartComponent';
import * as am5 from '@amcharts/amcharts5';
import * as am5xy from '@amcharts/amcharts5/xy';
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';
import { SwtSessionDataConvertUtils } from '../../../../utils/SwtSessionDataConvertUtils';
import { DomRenderNoProxy } from '@dooboostore/dom-render/decorators/DomRenderNoProxy';

interface ChartData {
  page: string;
  elementId: string;
  count: number;
}

type SelectedType = 'bind' | 'unbind' | 'visible' | 'invisible' | 'click';

@Sim({
  scope: Lifecycle.Transient
})
@Component({
  selector: 'HeatmapRouteComponent',
  template: template,
  styles: style
})
export class HeatmapRouteComponent extends ComponentBase implements ChartComponent {
  // @DomRenderNoProxy
  @query('.chart')
  private chartElement?: HTMLDivElement;
  private sessionIds?: string[];
  private sessions?: SwtSessionData[];

  selectedType: SelectedType = 'bind';
  showUnbind: boolean = true;
  showVisible: boolean = true;
  showInvisible: boolean = true;
  showClick: boolean = true;

  constructor() {
    super();
  }

  setSessions(sessionIds: string[], sessions: SwtSessionData[]): void {
    this.sessionIds = sessionIds;
    this.sessions = sessions;
    this.onRenderedChatContainer(this.chartElement);
  }

  onFilterChange(type: SelectedType) {
    this.selectedType = type;
    this.onRenderedChatContainer(this.chartElement); // Re-render chart with new filters
  }

  onRenderedChatContainer(element?: HTMLDivElement) {
    if (!element || !this.sessionIds || !this.sessions) return;

    const targetSessions = this.sessions.filter(it => this.sessionIds!.includes(it.id));
    const logsByPage = SwtSessionDataConvertUtils.groupByPathname(targetSessions);

    const heatMapData: ChartData[] = [];
    const allPages = new Set<string>();
    const allElementIds = new Set<string>();

    logsByPage.forEach((logs, page) => {
      allPages.add(page);
      const eventCounts = new Map<string, number>();
      logs.forEach(log => {
        let eventType: string | null = null;
        let elementId: string | null = null;

        if (isSwtElementBind(log) && this.selectedType === 'bind') {
          eventType = 'bind';
          elementId = log.id;
        } else if (isSwtElementUnbind(log) && this.selectedType === 'unbind') {
          eventType = 'unbind';
          elementId = log.id;
        } else if (isSwtElementVisible(log) && this.selectedType === 'visible') {
          eventType = 'visible';
          elementId = log.id;
        } else if (isSwtElementInvisible(log) && this.selectedType === 'invisible') {
          eventType = 'invisible';
          elementId = log.id;
        } else if (isSwtElementClick(log) && this.selectedType === 'click') {
          eventType = 'click';
          elementId = log.id;
        }

        if (eventType && elementId) {
          const compositeId = elementId;
          allElementIds.add(compositeId);
          eventCounts.set(compositeId, (eventCounts.get(compositeId) || 0) + 1);
        }
      });

      eventCounts.forEach((count, elementId) => {
        heatMapData.push({ page, elementId, count });
      });
    });

    this.drawChart(element, heatMapData, Array.from(allPages), Array.from(allElementIds));
  }

  private drawChart(element: HTMLDivElement, data: ChartData[], pages: string[], elementIds: string[]) {
    if ((element as any)._root) {
      (element as any)._root.dispose();
    }
    const root = am5.Root.new(element);
    (element as any)._root = root;

    root.setThemes([am5themes_Animated.new(root)]);

    const chart = root.container.children.push(am5xy.XYChart.new(root, {
      panX: false,
      panY: false,
      wheelX: "none",
      wheelY: "none",
      paddingLeft: 0,
      layout: root.verticalLayout
    }));

    // Create axes and their renderers
    const yRenderer = am5xy.AxisRendererY.new(root, {
      visible: false,
      minGridDistance: 20,
      inversed: true,
      minorGridEnabled: true
    });
    yRenderer.grid.template.set("visible", false);

    const yAxis = chart.yAxes.push(am5xy.CategoryAxis.new(root, {
      maxDeviation: 0,
      renderer: yRenderer,
      categoryField: "page"
    }));
    yAxis.data.setAll(pages.map(page => ({ page })));

    const xRenderer = am5xy.AxisRendererX.new(root, {
      visible: false,
      minGridDistance: 30,
      opposite: true,
      minorGridEnabled: true
    });
    xRenderer.grid.template.set("visible", false);

    const xAxis = chart.xAxes.push(am5xy.CategoryAxis.new(root, {
      renderer: xRenderer,
      categoryField: "elementId"
    }));
    xAxis.data.setAll(elementIds.map(elementId => ({ elementId })));

    // Create series
    const series = chart.series.push(am5xy.ColumnSeries.new(root, {
      calculateAggregates: true,
      stroke: am5.color(0xffffff),
      clustered: false,
      xAxis: xAxis,
      yAxis: yAxis,
      categoryXField: "elementId",
      categoryYField: "page",
      valueField: "count"
    }));

    series.columns.template.setAll({
      tooltipText: "{value}",
      strokeOpacity: 1,
      strokeWidth: 2,
      width: am5.percent(100),
      height: am5.percent(100)
    });

    // Add heat legend
    const heatLegend = chart.bottomAxesContainer.children.push(am5.HeatLegend.new(root, {
      orientation: "horizontal",
      endColor: am5.color(0xfffb77),
      startColor: am5.color(0xfe131a)
    }));

    series.columns.template.events.on("pointerover", function(event) {
      let di = event.target.dataItem;
      if (di) {
        //@ts-ignore
        heatLegend.showValue(di.get("value", 0));
      }
    });

    series.events.on("datavalidated", function() {
      heatLegend.set("startValue", series.getPrivate("valueHigh"));
      heatLegend.set("endValue", series.getPrivate("valueLow"));
    });

    // Set up heat rules
    series.set("heatRules", [{
      target: series.columns.template,
      min: am5.color(0xfffb77),
      max: am5.color(0xfe131a),
      dataField: "value",
      key: "fill"
    }]);

    series.data.setAll(data);

    chart.appear(1000, 100);
  }
}