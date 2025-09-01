import 'reflect-metadata';
import { SimFrontOption } from '@dooboostore/simple-boot-front/option/SimFrontOption';
import { SimpleBootFront } from '@dooboostore/simple-boot-front/SimpleBootFront';
import { Component } from '@dooboostore/simple-boot-front/decorators/Component';
import { OnInitRender } from '@dooboostore/dom-render/lifecycle/OnInitRender';
import { Router } from '@dooboostore/simple-boot/decorators/route/Router';
import { Router as DomRenderRouter } from '@dooboostore/dom-render/routers/Router';
import { ComponentRouterBase } from '@dooboostore/simple-boot-front/component/ComponentRouterBase';
import { Sim } from '@dooboostore/simple-boot/decorators/SimDecorator';
import styles from './index.router.component.css';
import template from './index.router.component.html';
import { ComponentBase, query } from '@dooboostore/dom-render/components/ComponentBase';
import { RawSet } from '@dooboostore/dom-render/rawsets/RawSet';
import { AboutRouteComponent } from './about/about.route.component';
// import { RoutingDataSet } from '@dooboostore/simple-boot/routing/RoutingDataSet';
import { PathFlowRouteComponent } from './chart/path-flow/path-flow.route.component';
import { TimeLineRouteComponent } from './chart/time-line/time-line.route.component';
import { EventDistributionRouteComponent } from './chart/event-distribution/event-distribution.route.component';
import { HeatmapRouteComponent } from './chart/heatmap/heatmap.route.component';
import { SankeyPathDepthRouteComponent } from './chart/sankey-path-depth/sankey-path-depth.route.component';
import { ErrorLogRouteComponent } from './chart/error-log/error-log.route.component';
import { Command, Message, MessageManager, MessageResponse, MessageResponseGetSwtSessions, MessageResponseGetSwtStatus, Type } from '../../MessageManager';
import { SwtSessionData, SwtStatus } from '../../Swt';
import { ChartComponent, isChartComponent } from './chart/ChartComponent';


@Sim({
  // scope: Lifecycle.Transient,
})
@Router({
  path: '',
  route: {
    '/': '/chart/path-flow',
    '/chart/path-flow': PathFlowRouteComponent,
    '/chart/time-line': TimeLineRouteComponent,
    '/chart/event-distribution': EventDistributionRouteComponent,
    '/chart/heatmap': HeatmapRouteComponent,
    '/chart/sankey-path-depth': SankeyPathDepthRouteComponent,
    '/chart/error-log': ErrorLogRouteComponent,
    '/about': AboutRouteComponent,
  },
})
@Component({
  selector: 'IndexRouterComponent',
  template: template,
  styles: styles
})
export class IndexRouterComponent extends ComponentRouterBase implements OnInitRender {
  @query('#flow-chart-container')
  private flowChartContainer!: HTMLDivElement;
  @query('#timeline-chart-container')
  private timelineChartContainer!: HTMLDivElement;
  private messageManager: MessageManager;
  sessions: SwtSessionData[] = [];
  selectedSession: string | null = null;
  sidebarCollapsed = false;
  private childComponent?: any;

  name = 'IndexRouterComponent;'

  constructor(private simFrontOption: SimFrontOption, private router: DomRenderRouter) {
    super();
    this.messageManager = new MessageManager(this.simFrontOption.window);
  }

  onInitRender(param: any, rawSet: RawSet) {
    super.onInitRender(param, rawSet); //ddddd
    this.setupMessageListener();
    this.requestDataFromOpener();
  }


  private drawTimelineChart(timelineData: any[], flagData: any[]) {

  }

  private setupMessageListener() {
    if (this.simFrontOption.window.opener) {
      this.messageManager.setupMessageListener(this.simFrontOption.window, (data: Message) => {
        if (data.type === Type.swtResponse) {
          this.handleMessageResponse(data);
        }
      });
    } else {
      this.sessionStorageSendResponseData();
    }
  }

  private sessionStorageSendResponseData() {
    const status: MessageResponseGetSwtStatus = {
      type: Type.swtResponse,
      data: this.messageManager.getSwtStatus(),
      command: Command.getSwtStatus
    }
    this.handleMessageResponse(status);

    const sessions: MessageResponseGetSwtSessions = {
      type: Type.swtResponse,
      data: this.messageManager.getAllSessions(),
      command: Command.getSwtSessions
    }
    this.handleMessageResponse(sessions);
  }

  private handleMessageResponse(data: MessageResponse) {
    switch (data.command) {
      case 'get-swt-status':
        this.setStatus(data.data);
        break;
      case 'get-swt-sessions':
        this.setSessions(data.data || []);
        break;
    }
  }

  setStatus(status: SwtStatus | null) {

  }

  setSessions(sessions: SwtSessionData[]) {
    this.sessions = sessions;
    console.log('----------setssion!', this.sessions);
    // if (this.sessions.length > 0) {
    //   this.selectedSession = this.sessions[0].id;
    // }


  }

  onSessionChange(element?: HTMLSelectElement) {
    if (element) {
      this.selectedSession = element.value;
    } else {
      this.selectedSession = null;
    }
    this.onChangeChild();
  }

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  private requestDataFromOpener() {
    if (this.simFrontOption.window.opener) {
      this.messageManager.sendCommand(this.simFrontOption.window.opener, {type: Type.swtCommand, command: Command.getSwtStatus});
      this.messageManager.sendCommand(this.simFrontOption.window.opener, {type: Type.swtCommand, command: Command.getSwtSessions});
    } else {
      console.warn('Dashboard opened without an opener window. Cannot request data.');
      this.sessionStorageSendResponseData();
    }
  }


  refreshData() {
    this.requestDataFromOpener();
  }

  viewSessionLog(sessionId: string) {
  }

  onChangeChild(component: any | undefined = this.childComponent) {
    if (!component) return;

    const selectedSessions: string[] = []
    if (this.selectedSession) {
      selectedSessions.push(this.selectedSession);
    } else {
      selectedSessions.push(...this.sessions.map(it => it.id));
    }
    if (isChartComponent(component)) {
      component.setSessions(selectedSessions, this.sessions);
    }
    this.childComponent = component;
  }
}