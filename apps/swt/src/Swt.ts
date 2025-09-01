import { Runnable } from '@dooboostore/core/runs/Runnable';
import { debounceTime } from '@dooboostore/core/message/operators/debounceTime';
import { fromEvent } from '@dooboostore/core/message/internal/fromEvent';
import { isDefined, WithRequiredProperty } from '@dooboostore/core/types';
import { RandomUtils } from '@dooboostore/core/random/RandomUtils';
import { Message, MessageManager, Type } from './MessageManager';
import { Subject } from '@dooboostore/core/message/Subject';
import { bufferTime } from '@dooboostore/core/message/operators/bufferTime';
import { filter } from '@dooboostore/core/message/operators';

export enum SessionStorageKey {
  swtStatus = 'swt-status',
  swtSession = 'swt-session',
}

type SwtSessionDataDetailsData = {
  // id: string;
  pathname: string;
  url: string;
  userAgent?: string;
  appCodeName?: string;
  appName?: string;
  vendor?: string;
  platform?: string;
  language?: string;
  isOnline?: boolean;
  cookieEnabled?: boolean;
  screenWidth?: number;
  screenHeight?: number;
  screenAvailWidth?: number;
  screenAvailHeight?: number;
  screenColorDepth?: number;
  windowInnerWidth: number;
  windowInnerHeight: number;
  windowScrollX: number;
  windowScrollY: number;
  documentScrollHeight?: number; // Added
  documentScrollWidth?: number;  // Added
  referrer?: string;
  historyLength?: number;
  date: string;
}
export type SwtSessionDataDetailsDataStart = SwtSessionDataDetailsData & { data: { [key: string]: string | number | null | undefined }; };
export type SwtSessionDataDetailsDataEnd = SwtSessionDataDetailsData;


export type SwtStatusSession = {
  id: string;
  start: SwtSessionDataDetailsDataStart,
  end?: SwtSessionDataDetailsDataEnd,
}

export type SwtStatus = {
  id: string;
  sessions: SwtStatusSession[];
  // sessions: WithRequiredProperty<Session, 'endDate'>[];
}

export type SwtSessionData<T extends SwtLog = SwtLog> = {
  id: string;
  start: SwtSessionDataDetailsDataStart,
  end?: SwtSessionDataDetailsDataEnd,
  log: T[];
}

// export type SwtSessionDataResponse = Session & {
//   log: Log[];
// }

export type SwtConfig = {
  window: Window;
  scriptUrl: string;
  token?: string;
  postUrl?: string;
  targetQuerySelector?: string[];
  openDashboardDelay?: number;
  postBufferTime?: number;
  swtElementResizeDebounceTime?: number;
  documentMouseMoveDebounceTime?: number;
  windowScrollDebounceTime?: number;
  windowResizeDebounceTime?: number;
  windowChangeStateDebounceTime?: number;
}

// export type SwtNewSession = {
//   type: 'swt-new-session';
//   data: { [key: string]: string | undefined };
//   date: string;
// } & SwtSessionDataDetailData
//
// export type SwtCloseSession = {
//   type: 'swt-close-session';
//   date: string;
// } & SwtSessionDataDetailData

export type SwtElementClick = {
  type: 'swt-element-click';
  tagName: string;
  id: string;
  mouseX: number;
  mouseY: number;
  dataset: { [key: string]: string | undefined }
  rect: DOMRectReadOnly;
  windowInnerWidth: number;
  windowInnerHeight: number;
  windowScrollX: number; // Added
  windowScrollY: number; // Added
  documentScrollHeight: number;
  documentScrollWidth: number;
  date: string;
};

export type SwtElementVisible = {
  type: 'swt-element-visible';
  tagName: string;
  id: string;
  targetSelector?: string | null;
  dataset: { [key: string]: string | undefined };
  rect: DOMRectReadOnly;
  windowInnerWidth: number;
  windowInnerHeight: number;
  windowScrollX: number; // Added
  windowScrollY: number; // Added
  documentScrollHeight: number;
  documentScrollWidth: number;
  date: string;
};

export type SwtElementInvisible = {
  type: 'swt-element-invisible';
  tagName: string;
  id: string;
  targetSelector?: string | null;
  dataset: { [key: string]: string | undefined };
  rect: DOMRectReadOnly;
  windowInnerWidth: number;
  windowInnerHeight: number;
  windowScrollX: number; // Added
  windowScrollY: number; // Added
  documentScrollHeight: number;
  documentScrollWidth: number;
  date: string;
};

export type SwtElementLayoutChange = {
  type: 'swt-element-layout-change';
  tagName: string;
  id: string;
  dataset: { [key: string]: string | undefined };
  rect: DOMRectReadOnly;
  windowInnerWidth: number;
  windowInnerHeight: number;
  windowScrollX: number; // Added
  windowScrollY: number; // Added
  documentScrollHeight: number;
  documentScrollWidth: number;
  date: string;
};

export type SwtElementBind = {
  type: 'swt-element-bind';
  tagName: string;
  id: string;
  targetSelector?: string | null;
  dataset: { [key: string]: string | undefined };
  rect: DOMRectReadOnly;
  windowInnerWidth: number;
  windowInnerHeight: number;
  windowScrollX: number; // Added
  windowScrollY: number; // Added
  documentScrollHeight: number;
  documentScrollWidth: number;
  date: string;
};

export type SwtElementUnbind = {
  type: 'swt-element-unbind';
  tagName: string;
  id: string;
  targetSelector?: string | null;
  dataset: { [key: string]: string | undefined };
  rect: DOMRectReadOnly;
  windowInnerWidth: number;
  windowInnerHeight: number;
  windowScrollX: number; // Added
  windowScrollY: number; // Added
  documentScrollHeight: number;
  documentScrollWidth: number;
  date: string;
};

export type DocumentClickLog = {
  type: 'document-click'
  windowInnerWidth: number;
  windowInnerHeight: number;
  windowScrollX: number;
  windowScrollY: number;
  documentScrollHeight: number; // Added
  documentScrollWidth: number;  // Added
  mouseX: number;
  mouseY: number;
  target?: {
    tagName: string;
    id: string;
    dataset: DOMStringMap;
    rect: DOMRectReadOnly;
  };
  date: string;
};

export type DocumentMouseMove = {
  type: 'document-mousemove'
  windowInnerWidth: number;
  windowInnerHeight: number;
  windowScrollX: number;
  windowScrollY: number;
  documentScrollHeight: number; // Added
  documentScrollWidth: number;  // Added
  mouseX: number;
  mouseY: number;
  target?: {
    tagName: string;
    id: string;
    dataset: DOMStringMap;
    rect: DOMRectReadOnly;
  };
  date: string;
};

export type WindowScroll = {
  type: 'window-scroll';
  windowInnerWidth: number;
  windowInnerHeight: number;
  windowScrollX: number;
  windowScrollY: number;
  documentScrollHeight: number; // Added
  documentScrollWidth: number;  // Added
  date: string;
};

export type DocumentDragStart = {
  type: 'document-drag-start';
  startX: number;
  startY: number;
  windowInnerWidth: number;
  windowInnerHeight: number;
  windowScrollX: number;
  windowScrollY: number;
  documentScrollHeight: number;
  documentScrollWidth: number;
  date: string;
}

export type DocumentDragEnd = {
  type: 'document-drag-end';
  endX: number;
  endY: number;
  windowInnerWidth: number;
  windowInnerHeight: number;
  windowScrollX: number;
  windowScrollY: number;
  documentScrollHeight: number;
  documentScrollWidth: number;
  date: string;
}

type WindowChangeState = {
  type: 'window-change-state';
  url: string;
  pathname: string;
  windowInnerWidth: number;
  windowInnerHeight: number;
  windowScrollX: number;
  windowScrollY: number;
  documentScrollHeight: number; // Added
  documentScrollWidth: number;  // Added
  date: string;
};

type DocumentLoaded = {
  type: 'document-loaded',
  url: string;
  pathname: string;
  windowInnerWidth: number;
  windowInnerHeight: number;
  windowScrollX: number;
  windowScrollY: number;
  documentScrollHeight: number; // Added
  documentScrollWidth: number;  // Added
  date: string;
};

type WindowResize = {
  type: 'window-resize';
  windowInnerWidth: number;
  windowInnerHeight: number;
  windowScrollX: number;
  windowScrollY: number;
  documentScrollHeight: number; // Added
  documentScrollWidth: number;  // Added
  date: string;
};

type SwtError = {
  type: 'swt-error';
  errorType: 'error' | 'unhandledrejection';
  data: {
    message?: string;
    filename?: string;
    lineno?: number;
    colno?: number;
    stack?: string;
    reason?: any;
  };
  date: string;
};

export const isSwtElementClick = (obj: any): obj is SwtElementClick =>
  obj?.type === 'swt-element-click';

export const isSwtElementVisible = (obj: any): obj is SwtElementVisible =>
  obj?.type === 'swt-element-visible';

export const isSwtElementInvisible = (obj: any): obj is SwtElementInvisible =>
  obj?.type === 'swt-element-invisible';

export const isSwtElementLayoutChange = (obj: any): obj is SwtElementLayoutChange =>
  obj?.type === 'swt-element-layout-change';

export const isSwtElementBind = (obj: any): obj is SwtElementBind =>
  obj?.type === 'swt-element-bind';

export const isSwtElementUnbind = (obj: any): obj is SwtElementUnbind =>
  obj?.type === 'swt-element-unbind';

export const isDocumentClickLog = (obj: any): obj is DocumentClickLog =>
  obj?.type === 'document-click';

export const isDocumentMouseMove = (obj: any): obj is DocumentMouseMove =>
  obj?.type === 'document-mousemove';

export const isWindowScroll = (obj: any): obj is WindowScroll =>
  obj?.type === 'window-scroll';

export const isDocumentDragStart = (obj: any): obj is DocumentDragStart =>
  obj?.type === 'document-drag-start';

export const isDocumentDragEnd = (obj: any): obj is DocumentDragEnd =>
  obj?.type === 'document-drag-end';

export const isWindowChangeState = (obj: any): obj is WindowChangeState =>
  obj?.type === 'window-change-state';

// export const isSwtNewSession = (obj: any): obj is SwtNewSession =>
//   obj?.type === 'swt-new-session';
//
// export const isSwtCloseSession = (obj: any): obj is SwtCloseSession =>
//   obj?.type === 'swt-close-session';

export const isDocumentLoaded = (obj: any): obj is DocumentLoaded =>
  obj?.type === 'document-loaded';

export const isWindowResize = (obj: any): obj is WindowResize =>
  obj?.type === 'window-resize';

export const isSwtError = (obj: any): obj is SwtError =>
  obj?.type === 'swt-error';

export const isChangeUrlLog = (obj: any): obj is DocumentLoaded | WindowChangeState =>
  obj?.type === 'document-loaded' || obj?.type === 'window-change-state';

export type SwtLog = (DocumentMouseMove | DocumentClickLog | WindowScroll | DocumentLoaded | WindowResize | WindowChangeState | SwtElementClick | SwtElementVisible | SwtElementInvisible | SwtElementBind | SwtElementUnbind | SwtElementLayoutChange | SwtError | DocumentDragStart | DocumentDragEnd);// & { date: string };


export class Swt implements Runnable {
  private observer: MutationObserver | null = null;
  private intersectionObserver: IntersectionObserver | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private trackedElements: Map<HTMLElement, DOMRectReadOnly> = new Map();
  // private currentSessionData: SwtSessionData | null = null;
  private readonly boundSwtElementClickListener: (event: Event) => void;
  private readonly boundIntersectionObserverCallback: (entries: IntersectionObserverEntry[]) => void;
  private swtElementResizeSubject = new Subject<ResizeObserverEntry[]>();
  private postDataSubject = new Subject<SwtLog>()
  // private dashboardWindow?: Window;
  private messageManager: MessageManager;
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private readonly DRAG_THRESHOLD = 10; // 드래그로 인식할 최소 픽셀 이동 거리

  constructor(private config: SwtConfig) {
    this.boundSwtElementClickListener = this.swtElementClickListener.bind(this);
    this.boundIntersectionObserverCallback = this.handleIntersection.bind(this);
    this.messageManager = new MessageManager(this.config.window);

    this.swtElementResizeSubject.pipe(
      debounceTime(this.config.swtElementResizeDebounceTime ?? 100)
    ).subscribe(entries => {
      this.handleResize(entries);
    });
  }

  get postDataObservable() {
    return this.postDataSubject.asObservable();
  }

  setOpenDashboardDelay(delay: number) {
    this.config.openDashboardDelay = delay;
  }

  setPostUrl(url: string) {
    this.config.postUrl = url;
  }

  setPostBufferTime(time: number) {
    this.config.postBufferTime = time;
  }

  setToken(token: string) {
    this.config.token = token;
  }

  setTargetQuerySelector(selectors: string[]) {
    this.config.targetQuerySelector = selectors;
  }

  addTargetQuerySelector(selector: string) {
    if (!this.config.targetQuerySelector) {
      this.config.targetQuerySelector = [];
    }
    if (!this.config.targetQuerySelector.includes(selector)) {
      this.config.targetQuerySelector.push(selector);
    }
  }

  removeTargetQuerySelector(selector: string) {
    if (this.config.targetQuerySelector) {
      const index = this.config.targetQuerySelector.indexOf(selector);
      if (index !== -1) {
        this.config.targetQuerySelector.splice(index, 1);
      }
    }
  }

  setScriptUrl(url: string) {
    this.config.scriptUrl = url;
  }


  help() {
    const yellow = '\x1b[33m';
    const cyan = '\x1b[36m';
    const reset = '\x1b[0m';
    const green = '\x1b[32m';

    console.log(`
${yellow}--- SWT Tracker Help ---${reset}`);
    console.log(`${cyan}Usage:${reset} Access the SWT instance (e.g., window.swt) in your browser console.`);
    console.log(`
${green}Methods:${reset}`);
    console.log(`  ${cyan}swt.run()${reset}: Initializes the tracker. Automatically called on DOMContentLoaded.`);
    console.log(`  ${cyan}swt.help()${reset}: Displays this help message.`);
    console.log(`  ${cyan}swt.status()${reset}: Returns the current session status and a list of past sessions.`);
    console.log(`  ${cyan}swt.showSession()${reset}: Displays the ID of the current active session.`);
    console.log(`  ${cyan}swt.newSession(${yellow}{ id?: string, data?: object }${reset})${reset}: Creates a new session. If id is not provided, generates a random UUID.`);
    console.log(`  ${cyan}swt.openDashboard()${reset}: Opens a new window to display the current session's recorded log data.`);
    console.log(`
${yellow}------------------------${reset}
`);
  }

  run(): any {
    // console.log('-run', this.config);
    if (this.config.postUrl) {
      this.postDataObservable.pipe(
        bufferTime(this.config.postBufferTime ?? 0),
        filter(it => it.length > 0)
      ).subscribe(it => {
        if (this.config.postUrl && it.length > 0) {
          fetch(this.config.postUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(this.config.token ? {'Authorization': `${this.config.token}`} : {})
            },
            body: JSON.stringify(it)
          });
        }
      })
    }
    const status = this.status();
    if (status === null) {
      this.newSession();
    }

    // if (status && !this.currentSessionData){
    //   this.currentSessionData = {
    //     id: status.id,
    //     log: []
    //   }
    // }
    this.addEventListeners();
  }

  private processExistingElements() {
    // Process elements with existing data-swt-id
    this.config.window.document.querySelectorAll('[data-swt-id]').forEach(el => {
      if (el instanceof HTMLElement) {
        this.processElementForTracking(el);
      }
    });
    // Process elements matching targetQuerySelector without data-swt-id
    if (this.config.targetQuerySelector) {
      for (const selector of this.config.targetQuerySelector) {
        this.config.window.document.querySelectorAll(selector).forEach(el => {
          if (el instanceof HTMLElement && !el.hasAttribute('data-swt-id')) {
            this.processElementForTracking(el); // This will set data-swt-id and add listener
          }
        });
      }
    }
  }

  status() {
    const storedStatus = this.config.window.sessionStorage.getItem(SessionStorageKey.swtStatus);
    if (storedStatus) {
      const swtStatus: SwtStatus = JSON.parse(storedStatus);
      return swtStatus;
    } else {
      return null;
    }
  }

  sessions() {
    const status = this.status();
    const ts: SwtSessionData[] = status?.sessions.map(it => (this.session(it.id))).filter(isDefined) ?? [];
    return ts
  }

  session(sessionId?: string): SwtSessionData | null {
    const status = this.status();
    if (!status) {
      this.newSession();
      return this.session(sessionId);
    }

    if (!sessionId) {
      return this.session(status.id);
    }
    const session = this.config.window.sessionStorage.getItem(`${SessionStorageKey.swtSession}-${sessionId}`);
    if (session) {
      return JSON.parse(session) as SwtSessionData;
    } else {
      return null;
    }
  }

  showSession() {
    const storedStatus = this.config.window.sessionStorage.getItem(SessionStorageKey.swtStatus);
    if (storedStatus) {
      const swtStatus: SwtStatus = JSON.parse(storedStatus);
    } else {
    }
  }

  openDashboard() {
    if (!this.session()) {
      console.log('No current session data to display.');
      return;
    }

    const dashboardWindow = this.config.window.open('', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
    if (dashboardWindow) {
      // Write the initial HTML structure without the script tag
      dashboardWindow.document.write(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA==" crossorigin="anonymous" referrerpolicy="no-referrer" />
            <title>SWT DashBoard</title>
            <style>
            </style>
        </head>
        <body>
        </body>
        </html>
      `);
      dashboardWindow.document.close(); // Close the document stream

      setTimeout(() => {
        // Now, dynamically create and append the script element
        const scriptElement = dashboardWindow.document.createElement('script');
        scriptElement.id = 'swt';
        scriptElement.dataset.swtMode = 'dashboard';
        scriptElement.dataset.swtDashboardSelector = 'body';
        scriptElement.type = 'module';
        scriptElement.src = this.config.scriptUrl;

        // Append the script to the body of the new window's document
        dashboardWindow.document.body.appendChild(scriptElement);
        // this.dashboardWindow = dashboardWindow;
      }, this.config.openDashboardDelay ?? 0)


    } else {
      console.error('Failed to open viewer window. Pop-ups might be blocked.');
    }
  }

  // newSession(options: { id?: string; data?: { [key: string]: string | undefined; }; } = {}) {
  newSession(data: { [key: string]: string | undefined | null; } = {}) {
    const sessionId: string = RandomUtils.uuid4();
    const status = this.status();
    const existingSessions = status?.sessions ?? [];
    const win = this.config.window;
    // if (navigator.userAgentData) {
    //   navigator.userAgentData.getHighEntropyValues(["platform", "platformVersion", "model"])
    //     .then(ua => {
    //       console.log(ua);          // 예: {brands: [...], mobile: false, platform: "macOS"}
    // });
    // }
    const date = new Date().toISOString();
    const sessionData: SwtSessionDataDetailsData = {
      url: win.location.href,
      pathname: win.location.pathname,
      userAgent: win.navigator.userAgent,
      appCodeName: win.navigator.appCodeName,
      appName: win.navigator.appName,
      vendor: win.navigator.vendor,
      platform: win.navigator.platform,
      language: win.navigator.language,
      isOnline: win.navigator.onLine,
      cookieEnabled: win.navigator.cookieEnabled,
      screenWidth: win.screen.width,
      screenHeight: win.screen.height,
      screenAvailWidth: win.screen.availWidth,
      screenAvailHeight: win.screen.availHeight,
      screenColorDepth: win.screen.colorDepth,
      windowInnerWidth: win.innerWidth,
      windowInnerHeight: win.innerHeight,
      windowScrollX: win.scrollX,
      windowScrollY: win.scrollY,
      documentScrollHeight: win.document.documentElement.scrollHeight, // Added
      documentScrollWidth: win.document.documentElement.scrollWidth,   // Added
      referrer: win.document.referrer,
      historyLength: win.history.length,
      date: date,
    }
    // End current session if exists
    if (status && status.id !== sessionId) {
      // Add a log to the old session before closing it
      const oldSessionData = this.session(status.id);
      if (oldSessionData) {
        oldSessionData.end = sessionData;
        this.config.window.sessionStorage.setItem(`${SessionStorageKey.swtSession}-${status.id}`, JSON.stringify(oldSessionData));
      }

      // Update endDate in the main status object
      const select = existingSessions.find(s => s.id === status.id && !s.end);
      if (select) {
        select.end = sessionData;
      }
    }

    ///////////////////// Create new session
    const newSessionData: SwtStatusSession = {
      id: sessionId,
      start: {...sessionData, data},
    };

    const newSwtStatus: SwtStatus = {
      id: sessionId,
      sessions: [...existingSessions.filter(it => it.id !== newSessionData.id), newSessionData],
    };

    // Save to storage
    this.config.window.sessionStorage.setItem(SessionStorageKey.swtStatus, JSON.stringify(newSwtStatus));

    const currentSessionData: SwtSessionData = {
      id: sessionId,
      start: {...sessionData, data},
      log: [],
    };
    this.config.window.sessionStorage.setItem(`${SessionStorageKey.swtSession}-${sessionId}`, JSON.stringify(currentSessionData));
  }

  private addLog(logEntry: SwtLog) {
    const session = this.session();
    const status = this.status();

    if (session) {
      session.log.push(logEntry);
      this.config.window.sessionStorage.setItem(`${SessionStorageKey.swtSession}-${session.id}`, JSON.stringify(session));
      this.postDataSubject.next(logEntry);
    } else {
      console.error('SWT: Failed to get or create a session.');
    }
  }


  private processElementForTracking(element: HTMLElement) {
    // If it already has data-swt-id, just add the listener
    if (element.hasAttribute('data-swt-id')) {
      this.addElementListener(element);
      return;
    }

    // If it doesn't have data-swt-id, check targetQuerySelector
    if (this.config.targetQuerySelector) {
      for (const selector of this.config.targetQuerySelector) {
        if (element.matches(selector)) {
          element.setAttribute('data-swt-id', RandomUtils.uuid4());
          element.setAttribute('data-swt-target-selector', selector);
          this.addElementListener(element);
          return; // Processed, no need to check other selectors
        }
      }
    }
  }

  private swtElementClickListener(event: Event) {
    const element = event.currentTarget as HTMLElement;
    const swtId = element.dataset.swtId;

    if (swtId) {
      const logEntry: SwtElementClick = {
        type: 'swt-element-click',
        tagName: element.tagName,
        id: swtId,
        mouseX: (event as MouseEvent).clientX,
        mouseY: (event as MouseEvent).clientY,
        dataset: element.dataset,
        rect: element.getBoundingClientRect(),
        windowInnerWidth: this.config.window.innerWidth,
        windowInnerHeight: this.config.window.innerHeight,
        windowScrollX: this.config.window.scrollX, // Added
        windowScrollY: this.config.window.scrollY, // Added
        documentScrollHeight: this.config.window.document.documentElement.scrollHeight,
        documentScrollWidth: this.config.window.document.documentElement.scrollWidth,
        date: new Date().toISOString()
      };
      this.addLog(logEntry);
    }
  }

  private addElementListener(element: HTMLElement) {
    const swtId = element.getAttribute('data-swt-id') as string;
    element.addEventListener('click', this.boundSwtElementClickListener);
    if (this.intersectionObserver) {
      this.intersectionObserver.observe(element);
    }
    if (this.resizeObserver) {
      this.resizeObserver.observe(element);
    }

    const rect = element.getBoundingClientRect();
    this.trackedElements.set(element, rect);

    const logEntry: SwtElementBind = {
      type: 'swt-element-bind',
      tagName: element.tagName,
      id: swtId,
      targetSelector: element.getAttribute('data-swt-target-selector'),
      dataset: element.dataset,
      rect: rect,
      windowInnerWidth: this.config.window.innerWidth,
      windowInnerHeight: this.config.window.innerHeight,
      windowScrollX: this.config.window.scrollX, // Added
      windowScrollY: this.config.window.scrollY, // Added
      documentScrollHeight: this.config.window.document.documentElement.scrollHeight,
      documentScrollWidth: this.config.window.document.documentElement.scrollWidth,
      date: new Date().toISOString()
    };
    this.addLog(logEntry);
  }

  private removeElementListener(element: HTMLElement) {
    const swtId = element.getAttribute('data-swt-id') as string;
    element.removeEventListener('click', this.boundSwtElementClickListener);
    if (this.intersectionObserver) {
      this.intersectionObserver.unobserve(element);
    }
    if (this.resizeObserver) {
      this.resizeObserver.unobserve(element);
    }
    this.trackedElements.delete(element);

    const logEntry: SwtElementUnbind = {
      type: 'swt-element-unbind',
      tagName: element.tagName,
      id: swtId,
      targetSelector: element.getAttribute('data-swt-target-selector'),
      dataset: element.dataset,
      rect: element.getBoundingClientRect(),
      windowInnerWidth: this.config.window.innerWidth,
      windowInnerHeight: this.config.window.innerHeight,
      windowScrollX: this.config.window.scrollX, // Added
      windowScrollY: this.config.window.scrollY, // Added
      documentScrollHeight: this.config.window.document.documentElement.scrollHeight,
      documentScrollWidth: this.config.window.document.documentElement.scrollWidth,
      date: new Date().toISOString()
    };
    this.addLog(logEntry);
  }

  private addEventListeners() {
    const win = this.config.window;
    const doc = win.document;

    const startDetecting = () => {
      // Moved these calls here
      this.initIntersectionObserver();
      this.initResizeObserver();
      this.processExistingElements();
      this.startObservingDOM();
    }

    console.log('document.readyState', document.readyState)
    if (document.readyState !== 'complete') {
      doc.addEventListener('DOMContentLoaded', () => {
        const logEntry: DocumentLoaded = {type: 'document-loaded', url: win.location.href, pathname: win.location.pathname, windowInnerWidth: win.innerWidth, windowInnerHeight: win.innerHeight, windowScrollX: win.scrollX, windowScrollY: win.scrollY, documentScrollHeight: win.document.documentElement.scrollHeight, documentScrollWidth: win.document.documentElement.scrollWidth, date: new Date().toISOString()};
        this.addLog(logEntry);
        startDetecting();
      });
    } else {
      startDetecting();
      // 이미 DOMContentLoaded 됨
    }


    // Non-debounced click listener
    // Non-debounced click listener
    doc.addEventListener('click', (e) => {
      let targetInfo: DocumentClickLog['target'];
      if (e.target instanceof HTMLElement) {
        targetInfo = {
          tagName: e.target.tagName,
          id: e.target.id,
          dataset: e.target.dataset,
          rect: e.target.getBoundingClientRect()
        };
      }
      const logEntry: DocumentClickLog = {type: 'document-click', windowInnerWidth: win.innerWidth, windowInnerHeight: win.innerHeight, windowScrollX: win.scrollX, windowScrollY: win.scrollY, documentScrollHeight: win.document.documentElement.scrollHeight, documentScrollWidth: win.document.documentElement.scrollWidth, mouseX: e.clientX, mouseY: e.clientY, target: targetInfo, date: new Date().toISOString()};
      this.addLog(logEntry);
    });

    // 드래그 이벤트 처리 (Pointer Events 사용으로 모바일/데스크탑 동시 지원)
    doc.addEventListener('pointerdown', (e) => {
      this.dragStartX = e.clientX;
      this.dragStartY = e.clientY;
    });

    doc.addEventListener('pointermove', (e) => {
      if (this.dragStartX === 0 && this.dragStartY === 0) return; // pointerdown이 발생하지 않았으면 무시

      const dx = Math.abs(e.clientX - this.dragStartX);
      const dy = Math.abs(e.clientY - this.dragStartY);

      if (!this.isDragging && (dx > this.DRAG_THRESHOLD || dy > this.DRAG_THRESHOLD)) {
        this.isDragging = true;
        const logEntry: DocumentDragStart = {
          type: 'document-drag-start',
          startX: this.dragStartX,
          startY: this.dragStartY,
          windowInnerWidth: win.innerWidth,
          windowInnerHeight: win.innerHeight,
          windowScrollX: win.scrollX,
          windowScrollY: win.scrollY,
          documentScrollHeight: doc.documentElement.scrollHeight,
          documentScrollWidth: doc.documentElement.scrollWidth,
          date: new Date().toISOString(),
        };
        this.addLog(logEntry);
      }
    });

    doc.addEventListener('pointerup', (e) => {
      if (this.isDragging) {
        const logEntry: DocumentDragEnd = {
          type: 'document-drag-end',
          endX: e.clientX,
          endY: e.clientY,
          windowInnerWidth: win.innerWidth,
          windowInnerHeight: win.innerHeight,
          windowScrollX: win.scrollX,
          windowScrollY: win.scrollY,
          documentScrollHeight: doc.documentElement.scrollHeight,
          documentScrollWidth: doc.documentElement.scrollWidth,
          date: new Date().toISOString(),
        };
        this.addLog(logEntry);
      }
      this.isDragging = false;
      this.dragStartX = 0;
      this.dragStartY = 0;
    });

    // Debounced event listeners using pipe
    fromEvent<MouseEvent>(doc, 'mousemove').pipe(
      debounceTime(100)
    ).subscribe({
      next: e => {
        let targetInfo: DocumentMouseMove['target'];
        if (e.target instanceof HTMLElement) {
          targetInfo = {
            tagName: e.target.tagName,
            id: e.target.id,
            dataset: e.target.dataset,
            rect: e.target.getBoundingClientRect()
          };
        }
        const logEntry: DocumentMouseMove = {type: 'document-mousemove', windowInnerWidth: win.innerWidth, windowInnerHeight: win.innerHeight, windowScrollX: win.scrollX, windowScrollY: win.scrollY, documentScrollHeight: win.document.documentElement.scrollHeight, documentScrollWidth: win.document.documentElement.scrollWidth, mouseX: e.clientX, mouseY: e.clientY, target: targetInfo, date: new Date().toISOString()};
        this.addLog(logEntry);
      }
    });

    fromEvent<Event>(win, 'scroll').pipe(
      debounceTime(this.config.windowScrollDebounceTime ?? 100)
    ).subscribe({
      next: () => {
        const logEntry: WindowScroll = {type: 'window-scroll', windowInnerWidth: win.innerWidth, windowInnerHeight: win.innerHeight, windowScrollX: win.scrollX, windowScrollY: win.scrollY, documentScrollHeight: win.document.documentElement.scrollHeight, documentScrollWidth: win.document.documentElement.scrollWidth, date: new Date().toISOString()};
        this.addLog(logEntry);
        this.checkTrackedElementsPosition();
      }
    });

    fromEvent<UIEvent>(win, 'resize').pipe(
      debounceTime(this.config.windowResizeDebounceTime ?? 100)
    ).subscribe({
      next: () => {
        const logEntry: WindowResize = {type: 'window-resize', windowInnerWidth: win.innerWidth, windowInnerHeight: win.innerHeight, windowScrollX: win.scrollX, windowScrollY: win.scrollY, documentScrollHeight: win.document.documentElement.scrollHeight, documentScrollWidth: win.document.documentElement.scrollWidth, date: new Date().toISOString()};
        this.addLog(logEntry);
        this.checkTrackedElementsPosition();
      }
    });

    fromEvent<PopStateEvent>(win, 'popstate').pipe(
      debounceTime(this.config.windowChangeStateDebounceTime ?? 100)
    ).subscribe({
      next: () => {
        const logEntry: WindowChangeState = {type: 'window-change-state', url: win.location.href, pathname: win.location.pathname, windowInnerWidth: win.innerWidth, windowInnerHeight: win.innerHeight, windowScrollX: win.scrollX, windowScrollY: win.scrollY, documentScrollHeight: win.document.documentElement.scrollHeight, documentScrollWidth: win.document.documentElement.scrollWidth, date: new Date().toISOString()};
        this.addLog(logEntry);
      }
    });

    // History patches (no debounce)
    const originalPushState = win.history.pushState;
    win.history.pushState = (...args: any[]) => {
      originalPushState.apply(win.history, args);
      const logEntry: WindowChangeState = {type: 'window-change-state', url: win.location.href, pathname: win.location.pathname, windowInnerWidth: win.innerWidth, windowInnerHeight: win.innerHeight, windowScrollX: win.scrollX, windowScrollY: win.scrollY, documentScrollHeight: win.document.documentElement.scrollHeight, documentScrollWidth: win.document.documentElement.scrollWidth, date: new Date().toISOString()};
      this.addLog(logEntry);
    };

    const originalReplaceState = win.history.replaceState;
    win.history.replaceState = (...args: any[]) => {
      originalReplaceState.apply(win.history, args);
      const logEntry: WindowChangeState = {type: 'window-change-state', url: win.location.href, pathname: win.location.pathname, windowInnerWidth: win.innerWidth, windowInnerHeight: win.innerHeight, windowScrollX: win.scrollX, windowScrollY: win.scrollY, documentScrollHeight: win.document.documentElement.scrollHeight, documentScrollWidth: win.document.documentElement.scrollWidth, date: new Date().toISOString()};
      this.addLog(logEntry);
    };

    win.addEventListener('error', (event: ErrorEvent) => {
      const {message, filename, lineno, colno, error} = event;
      const logEntry: SwtError = {
        type: 'swt-error',
        errorType: 'error',
        data: {
          message,
          filename,
          lineno,
          colno,
          stack: error?.stack,
        },
        date: new Date().toISOString()
      };
      this.addLog(logEntry);
    });

    win.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
      const logEntry: SwtError = {
        type: 'swt-error',
        errorType: 'unhandledrejection',
        data: {
          reason: event.reason?.stack ?? event.reason,
        },
        date: new Date().toISOString()
      };
      this.addLog(logEntry);
    });

    // Setup message handling for dashboard communication
    this.messageManager.setupMessageListener(win, (data: Message, event: MessageEvent) => {
      const senderWindow = event.source as Window;
      if (senderWindow && data.type === Type.swtCommand) {
        const responseData = this.messageManager.makeMessageResponse(data);
        if (responseData) {
          this.messageManager.sendResponse(senderWindow, responseData);
        }
      }
    });

  }

  private initIntersectionObserver() {
    this.intersectionObserver = new IntersectionObserver(this.boundIntersectionObserverCallback, {
      root: null, // viewport
      rootMargin: '0px',
      threshold: 0.1 // Trigger when 10% of the element is visible/hidden
    });
  }

  private initResizeObserver() {
    this.resizeObserver = new ResizeObserver(entries => {
      this.swtElementResizeSubject.next(entries);
    });
  }

  private handleIntersection(entries: IntersectionObserverEntry[]) {
    for (const entry of entries) {
      const element = entry.target as HTMLElement;
      const swtId = element.dataset.swtId;
      if (!swtId) continue;

      if (entry.isIntersecting) {
        const logEntry: SwtElementVisible = {
          type: 'swt-element-visible',
          tagName: element.tagName,
          id: swtId,
          targetSelector: element.getAttribute('data-swt-target-selector'),
          dataset: element.dataset,
          rect: element.getBoundingClientRect(),
          windowInnerWidth: this.config.window.innerWidth,
          windowInnerHeight: this.config.window.innerHeight,
          windowScrollX: this.config.window.scrollX, // Added
          windowScrollY: this.config.window.scrollY, // Added
          documentScrollHeight: this.config.window.document.documentElement.scrollHeight,
          documentScrollWidth: this.config.window.document.documentElement.scrollWidth,
          date: new Date().toISOString()
        };
        this.addLog(logEntry);
      } else {
        const logEntry: SwtElementInvisible = {
          type: 'swt-element-invisible',
          tagName: element.tagName,
          id: swtId,
          targetSelector: element.getAttribute('data-swt-target-selector'),
          dataset: element.dataset,
          rect: element.getBoundingClientRect(),
          windowInnerWidth: this.config.window.innerWidth,
          windowInnerHeight: this.config.window.innerHeight,
          windowScrollX: this.config.window.scrollX, // Added
          windowScrollY: this.config.window.scrollY, // Added
          documentScrollHeight: this.config.window.document.documentElement.scrollHeight,
          documentScrollWidth: this.config.window.document.documentElement.scrollWidth,
          date: new Date().toISOString()
        };
        this.addLog(logEntry);
      }
    }
  }

  private handleResize(entries: ResizeObserverEntry[]) {
    for (const entry of entries) {
      const element = entry.target as HTMLElement;
      const swtId = element.dataset.swtId;
      if (!swtId) continue;

      const oldRect = this.trackedElements.get(element);
      if (!oldRect) continue;

      const newRect = element.getBoundingClientRect();

      // Check for size change
      if (newRect.width !== oldRect.width || newRect.height !== oldRect.height) {
        const logEntry: SwtElementLayoutChange = {
          type: 'swt-element-layout-change',
          tagName: element.tagName,
          id: swtId,
          dataset: element.dataset,
          rect: newRect,
          windowInnerWidth: this.config.window.innerWidth,
          windowInnerHeight: this.config.window.innerHeight,
          windowScrollX: this.config.window.scrollX, // Added
          windowScrollY: this.config.window.scrollY, // Added
          documentScrollHeight: this.config.window.document.documentElement.scrollHeight,
          documentScrollWidth: this.config.window.document.documentElement.scrollWidth,
          date: new Date().toISOString()
        };
        this.addLog(logEntry);
        this.trackedElements.set(element, newRect); // Update state
      }
    }
  }

  private checkTrackedElementsPosition() {
    for (const [element, oldRect] of this.trackedElements.entries()) {
      const newRect = element.getBoundingClientRect();

      // Check for position change
      if (newRect.x !== oldRect.x || newRect.y !== oldRect.y) {
        const swtId = element.dataset.swtId;
        if (!swtId) continue;

        const logEntry: SwtElementLayoutChange = {
          type: 'swt-element-layout-change',
          tagName: element.tagName,
          id: swtId,
          dataset: element.dataset,
          rect: newRect,
          windowInnerWidth: this.config.window.innerWidth,
          windowInnerHeight: this.config.window.innerHeight,
          windowScrollX: this.config.window.scrollX, // Added
          windowScrollY: this.config.window.scrollY, // Added
          documentScrollHeight: this.config.window.document.documentElement.scrollHeight,
          documentScrollWidth: this.config.window.document.documentElement.scrollWidth,
          date: new Date().toISOString()
        };
        this.addLog(logEntry);
        this.trackedElements.set(element, newRect); // Update state
      }
    }
  }

  private startObservingDOM() {
    if (this.observer) {
      this.observer.disconnect();
    }

    this.observer = new MutationObserver(this.handleMutations.bind(this));
    this.observer.observe(this.config.window.document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeOldValue: true,
      attributeFilter: ['data-swt-id']
    });
  }

  private handleMutations(mutations: MutationRecord[]) {
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach(node => {
          if (node instanceof HTMLElement) {
            this.processElementForTracking(node); // Process the added node itself
            // Process descendants
            node.querySelectorAll('*').forEach(el => { // Select all descendants
              if (el instanceof HTMLElement) {
                this.processElementForTracking(el);
              }
            });
          }
        });

        mutation.removedNodes.forEach(node => {
          if (node instanceof HTMLElement) {
            if (node.hasAttribute('data-swt-id')) {
              this.removeElementListener(node);
            }
            node.querySelectorAll('[data-swt-id]').forEach(el => this.removeElementListener(el as HTMLElement));
          }
        });
      } else if (mutation.type === 'attributes') {
        const targetElement = mutation.target as HTMLElement;
        // Since attributeFilter is ['data-swt-id'], we only get mutations for data-swt-id
        const oldValue = mutation.oldValue; // This is the value of data-swt-id before the change
        const newValue = targetElement.getAttribute('data-swt-id'); // Current value

        if (oldValue && !newValue) {
          // data-swt-id was removed
          this.removeElementListener(targetElement);
          // After removal, check if it now matches a targetQuerySelector
          this.processElementForTracking(targetElement);
        } else if (!oldValue && newValue) {
          // data-swt-id was added
          this.addElementListener(targetElement);
        } else if (oldValue !== newValue) { // data-swt-id was changed (value modified)
          this.removeElementListener(targetElement); // Remove old listener
          this.addElementListener(targetElement); // Add new listener with new ID
        }
      }
    }
  }

  // private getDocumentRelativeRect(element: HTMLElement, win: Window): DOMRectReadOnly {
  //   const rect = element.getBoundingClientRect();
  //   return {
  //     x: rect.x + win.scrollX,
  //     y: rect.y + win.scrollY,
  //     width: rect.width,
  //     height: rect.height,
  //     top: rect.top + win.scrollY,
  //     right: rect.right + win.scrollX,
  //     bottom: rect.bottom + win.scrollY,
  //     left: rect.left + win.scrollX,
  //     toJSON: () => ({ // Add toJSON for serialization
  //       x: rect.x + win.scrollX,
  //       y: rect.y + win.scrollY,
  //       width: rect.width,
  //       height: rect.height,
  //       top: rect.top + win.scrollY,
  //       right: rect.right + win.scrollX,
  //       bottom: rect.bottom + win.scrollY,
  //       left: rect.left + win.scrollX,
  //     })
  //   };
  // }
}

