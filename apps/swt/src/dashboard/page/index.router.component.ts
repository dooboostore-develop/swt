import 'reflect-metadata';
import Components from '../components'; // using setting
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
import { SessionReplayRouteComponent } from './chart/session-replay/session-replay.route.component';
import { Command, Message, MessageManager, MessageResponse, MessageResponseGetSwtSessions, MessageResponseGetSwtStatus, Type } from '../../MessageManager';
import { SwtSessionData, SwtStatus } from '../../Swt';
import { ChartComponent, isChartComponent } from './chart/ChartComponent';

// 필터 조건 객체의 타입을 정의합니다.
import { Filter, AvailableField, AvailableOperator } from '../types/filter';
import { ObjectUtils } from '@dooboostore/core/object/ObjectUtils';

export interface DateFilter {
    from: string;
    to: string;
}

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
    '/chart/session-replay': SessionReplayRouteComponent,
    '/about': AboutRouteComponent,
  },
})
@Component({
  selector: 'IndexRouterComponent',
  template: template,
  styles: styles,
  using: [Components]
})
export class IndexRouterComponent extends ComponentRouterBase implements OnInitRender {
  @query('#flow-chart-container')
  private flowChartContainer!: HTMLDivElement;
  @query('#timeline-chart-container')
  private timelineChartContainer!: HTMLDivElement;
  private messageManager: MessageManager;

  // --- 상태 속성들 ---
  sessions: SwtSessionData[] = []; // 필터링된 세션 목록이 저장됩니다.
  private originalSessions: SwtSessionData[] = []; // 원본 세션 목록을 보관합니다.
  selectedSession: string | null = null;
  sidebarCollapsed = false;
  private childComponent?: any;

  // --- 필터 UI를 위한 속성들 ---
  filters: Filter[] = [];
  dateFilter: DateFilter = { from: '', to: '' };
  availableFields: AvailableField[] = [];
  availableOperators = [
    {label: '=', value: 'eq'},
    {label: '!=', value: 'neq'},
    {label: '>', value: 'gt'},
    {label: '<', value: 'lt'},
    {label: '>=', value: 'gte'},
    {label: '<=', value: 'lte'},
    {label: 'contains', value: 'contains'},
    {label: 'exists', value: 'exists'},       // 값 존재 여부
    {label: 'not exists', value: 'not_exists'}, // 값 없음 여부
  ];
  isFilterDialogOpen = false;

  name = 'IndexRouterComponent;'

  constructor(private simFrontOption: SimFrontOption, private router: DomRenderRouter) {
    super();
    this.messageManager = new MessageManager(this.simFrontOption.window);
    // this.requestDataFromOpener();
  }

  onInitRender(param: any, rawSet: RawSet) {
    super.onInitRender(param, rawSet);
    this.setupMessageListener();
    this.requestDataFromOpener();
  }

  // --- 다이얼로그 관련 메소드 ---
  openFilterDialog() {
    this.isFilterDialogOpen = true;
  }

  closeFilterDialog() {
    this.isFilterDialogOpen = false;
  }

  onApplyFilters(newFilters: Filter[], dateFilter: DateFilter) {
    this.filters = newFilters;
    this.dateFilter = dateFilter;
    this.closeFilterDialog();
    this.applyFilters();
  }

  onClearAllFilters() {
    this.filters = [];
    this.dateFilter = { from: '', to: '' };
    this.applyFilters();
  }

  // --- 필터 UI 이벤트 핸들러 ---
  addFilter() {
    this.filters.push({field: '', operator: 'eq', value: ''});
  }

  removeFilter(index: number) {
    this.filters.splice(index, 1);
    // 필터가 모두 제거되면, 필터를 다시 적용하여 전체 목록을 보여줍니다.
    if (this.filters.length === 0) {
      this.applyFilters();
    }
  }

  applyFilters() {
    // Deep copy to avoid modifying original data
    let filtered = JSON.parse(JSON.stringify(this.originalSessions));

    // Date range filter on logs
    const { from, to } = this.dateFilter;
    if (from || to) {
        const fromDate = from ? new Date(from).getTime() : 0;
        const toDate = to ? new Date(to).getTime() : Infinity;

        filtered.forEach(session => {
            if (session.log) { // Ensure log exists
                session.log = session.log.filter((logItem: any) => {
                    const logDate = new Date(logItem.date).getTime();
                    return logDate >= fromDate && logDate <= toDate;
                });
            }
        });
    }

    // Attribute filters on sessions
    if (this.filters.length > 0) {
      filtered = filtered.filter(session => {
        return this.filters.every(filter => {
          if (!filter.field || !filter.operator) {
            return true;
          }
          const actualValue = this.getProperty(session, filter.field);
          return this.evaluateCondition(actualValue, filter.operator, filter.value);
        });
      });
    }
    
    // After all filtering, update sessions.
    this.sessions = filtered;
    // this.onChangeChild(); // 자식 컴포넌트를 업데이트합니다.
  }

  // --- 필터링 헬퍼 메소드 ---
  private getProperty(obj: any, path: string): any {
    // ObjectUtils.Path.get을 사용하여 점으로 연결된 문자열 경로의 값을 가져옵니다.
    return ObjectUtils.Path.get(obj, path);
  }

  private evaluateCondition(actual: any, operator: string, expected: string): boolean {
    if (operator === 'exists') return actual !== undefined && actual !== null;
    if (operator === 'not_exists') return actual === undefined || actual === null;

    if (actual === undefined || actual === null) return false;

    const expectedAsNumber = parseFloat(expected);
    const isNumericalComparison = !isNaN(expectedAsNumber) && typeof actual === 'number';

    console.log('-------', operator, actual, expectedAsNumber, expected)
    switch (operator) {
      case 'eq':
        return String(actual).toLowerCase() == expected.toLowerCase();
      case 'neq':
        return String(actual).toLowerCase() != expected.toLowerCase();
      case 'gt':
        return isNumericalComparison ? actual > expectedAsNumber : String(actual) > expected;
      case 'lt':
        return isNumericalComparison ? actual < expectedAsNumber : String(actual) < expected;
      case 'gte':
        return isNumericalComparison ? actual >= expectedAsNumber : String(actual) >= expected;
      case 'lte':
        return isNumericalComparison ? actual <= expectedAsNumber : String(actual) <= expected;
      case 'contains':
        return String(actual).toLowerCase().includes(expected.toLowerCase());
      default:
        return true;
    }
  }

  private generateAvailableFields(obj: any): AvailableField[] {
    if (!obj) return [];

    // ObjectUtils.Path.availablePath를 사용하여 모든 경로를 가져오고 필터링합니다.
    const allPaths = ObjectUtils.Path.availablePath(obj, (path, value) => {
      // log, rect, end 필드는 제외하고, 배열이 아닌 단순 값만 포함합니다.
      const excludedFields = ['log', 'rect', 'end'];
      const pathParts = path.split('.');
      const lastPart = pathParts[pathParts.length - 1];
      
      // 제외할 필드가 경로에 포함되어 있는지 확인
      const hasExcludedField = excludedFields.some(field => path.includes(field));
      
      // 배열 인덱스 패턴 [숫자] 제외
      const hasArrayIndex = /\[\d+\]/.test(path);
      
      return !hasExcludedField && !hasArrayIndex && 
             typeof value !== 'object' && 
             value !== null && 
             value !== undefined;
    });

    // 경로를 사용자 친화적인 이름으로 변환합니다.
    return allPaths.map(path => ({
      path: path,
      name: path.replace(/\./g, ' > ') // 점을 ' > '로 변경하여 계층 구조를 표시
    }));
  }

  // --- 기존 메소드 수정 ---
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
    this.originalSessions = sessions; // 원본 데이터 저장
    this.sessions = [...this.originalSessions]; // 화면에 표시될 데이터 초기화
    if (sessions.length > 0) {
      const fieldMap = new Map<string, string>();

      // 모든 세션을 순회하며 필드를 수집합니다.
      for (const session of sessions) {
        const fields = this.generateAvailableFields(session);
        for (const field of fields) {
          if (!fieldMap.has(field.path)) {
            fieldMap.set(field.path, field.name);
          }
        }
      }

      // Map을 UI에서 사용할 배열 형태로 변환하고, 사용자 친화적으로 정렬합니다.
      this.availableFields = Array.from(fieldMap.entries()).map(([path, name]) => ({path, name}));
      this.availableFields.sort((a, b) => a.name.localeCompare(b.name));
      // console.log('availableFields', this.availableFields);
    }
    // this.applyFilters(); // 초기 데이터 로드 후 필터 적용
  }

  onSessionChange(element?: HTMLSelectElement, apply: boolean = true) {
    if (element) {
      this.selectedSession = element.value;
    } else {
      this.selectedSession = null;
    }
    if (apply) {
      this.onChangeChild();
    }
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

    // `this.sessions`는 이미 `applyFilters()`를 통해 필터링된 상태입니다.
    // 여기에 추가로 세션 ID 선택 드롭다운 필터를 적용합니다.
    let sessionsForChild = this.sessions;
    const selectedSessionIds: string[] = [];

    if (this.selectedSession) {
      sessionsForChild = this.sessions.filter(it => it.id === this.selectedSession);
      selectedSessionIds.push(this.selectedSession);
    } else {
      selectedSessionIds.push(...this.sessions.map(it => it.id));
    }

    if (isChartComponent(component)) {
      component.setSessions(selectedSessionIds, sessionsForChild); // 자식에게는 필터링된 ID 목록과 필터링된 세션 목록을 전달
    }
    this.childComponent = component;
  }
}
