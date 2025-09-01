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

export type Session = {
  id: string;
  startDate: string;
  endDate?: string;
}

export type SwtStatus = {
  id: string;
  sessions: Session[];
  // sessions: WithRequiredProperty<Session, 'endDate'>[];
}

export type SwtSessionData = {
  id: string;
  log: Log[];
}

export type SwtConfig = {
  window: Window;
  scriptUrl: string;
  token?: string;
  postUrl?: string;
  targetQuerySelector?: string[];
  openDashboardDelay?: number;
  postBufferTime?: number;
}

type NewSession = {
  type: 'new-session';
  data: { [key: string]: string | undefined };
  pathname: string;
  url: string;
  date: string;
}

type CloseSession = {
  type: 'close-session';
  date: string;
}

type SwtElementClick = {
  type: 'swt-element-click';
  tagName: string;
  id: string;
  dataset: { [key: string]: string | undefined }
  rect: DOMRectReadOnly;
  date: string;
}

type SwtElementVisible = {
  type: 'swt-element-visible';
  tagName: string;
  id: string;
  dataset: { [key: string]: string | undefined };
  rect: DOMRectReadOnly;
  date: string;
};

type SwtElementInvisible = {
  type: 'swt-element-invisible';
  tagName: string;
  id: string;
  dataset: { [key: string]: string | undefined };
  rect: DOMRectReadOnly;
  date: string;
};

type SwtElementBind = {
  type: 'swt-element-bind';
  tagName: string;
  id: string;
  dataset: { [key: string]: string | undefined };
  rect: DOMRectReadOnly;
  date: string;
};

type SwtElementUnbind = {
  type: 'swt-element-unbind';
  tagName: string;
  id: string;
  dataset: { [key: string]: string | undefined };
  rect: DOMRectReadOnly;
  date: string;
};

type DocumentClickLog = {
  type: 'document-click'
  window: { w: number, h: number };
  x: number;
  y: number;
  date: string;
};

type DocumentMouseMove = {
  type: 'document-mousemove'
  window: { w: number, h: number };
  x: number;
  y: number;
  date: string;
};

type WindowScroll = {
  type: 'window-scroll';
  window: { w: number, h: number };
  x: number;
  y: number;
  date: string;
};

type WindowPopstate = {
  type: 'window-popstate';
  url: string;
  pathname: string;
  date: string;
};

type DocumentLoaded = {
  type: 'document-loaded',
  url: string;
  pathname: string;
  date: string;
};

type WindowResize = {
  type: 'window-resize'
  w: number, h: number;
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

export const isWindowPopstate = (obj: any): obj is WindowPopstate =>
  obj?.type === 'window-popstate';

export const isNewSession = (obj: any): obj is NewSession =>
  obj?.type === 'new-session';

export const isDocumentLoaded = (obj: any): obj is DocumentLoaded =>
  obj?.type === 'document-loaded';

export const isWindowResize = (obj: any): obj is WindowResize =>
  obj?.type === 'window-resize';

export const isSwtError = (obj: any): obj is SwtError =>
    obj?.type === 'swt-error';

export const isChangeUrlLog = (obj: any): obj is DocumentLoaded | WindowPopstate =>
  obj?.type === 'document-loaded' || obj?.type === 'window-popstate';

export type Log = (NewSession | CloseSession | DocumentMouseMove | DocumentClickLog | WindowScroll | DocumentLoaded | WindowResize | WindowPopstate | SwtElementClick | SwtElementVisible | SwtElementInvisible | SwtElementBind | SwtElementUnbind | SwtError);// & { date: string };


export class Swt implements Runnable {
  private observer: MutationObserver | null = null;
  private intersectionObserver: IntersectionObserver | null = null;
  // private currentSessionData: SwtSessionData | null = null;
  private readonly boundSwtElementClickListener: (event: Event) => void;
  private readonly boundIntersectionObserverCallback: (entries: IntersectionObserverEntry[]) => void;
  private subject = new Subject<Log>()
  // private dashboardWindow?: Window;
  private messageManager: MessageManager;

  constructor(private config: SwtConfig) {
    this.boundSwtElementClickListener = this.swtElementClickListener.bind(this);
    this.boundIntersectionObserverCallback = this.handleIntersection.bind(this);
    this.messageManager = new MessageManager(this.config.window);
  }

  get observable() {
    return this.subject.asObservable();
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

  addTargetQuerySelector(selector: string){
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
    console.log('-run', this.config);
    if (this.config.postUrl) {
      this.observable.pipe(
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

  newSession(options: { id?: string; data?: { [key: string]: string | undefined; }; } = {}) {
    const {id: sessionId = RandomUtils.uuid4(), data = {}} = options;
    const status = this.status();
    const existingSessions = status?.sessions ?? [];

    // End current session if exists
    if (status && status.id !== sessionId) {
      // Add a log to the old session before closing it
      const oldSessionData = this.session(status.id);
      if (oldSessionData) {
        const closeLogEntry: Omit<Log, 'date'> = {type: 'close-session'};
        const logWithDate = {...closeLogEntry, date: new Date().toISOString()};
        oldSessionData.log.push(logWithDate as Log);
        this.config.window.sessionStorage.setItem(`${SessionStorageKey.swtSession}-${status.id}`, JSON.stringify(oldSessionData));
      }

      // Update endDate in the main status object
      const select = existingSessions.find(s => s.id === status.id);
      if (select) {
        select.endDate = new Date().toISOString();
      }
    }

    // Create new session
    const newSessionData: Session = {
      id: sessionId,
      startDate: new Date().toISOString(),
    };

    const newSwtStatus: SwtStatus = {
      id: sessionId,
      sessions: [...existingSessions.filter(it => it.id !== newSessionData.id), newSessionData],
    };

    // Save to storage
    this.config.window.sessionStorage.setItem(SessionStorageKey.swtStatus, JSON.stringify(newSwtStatus));

    const currentSessionData = this.session(sessionId) ?? {
      id: sessionId,
      log: [],
    };
    this.config.window.sessionStorage.setItem(`${SessionStorageKey.swtSession}-${sessionId}`, JSON.stringify(currentSessionData));
    const win = this.config.window;
    const doc = win.document;
    const logEntry: NewSession = {
      type: 'new-session',
      data: data,
      url: win.location.href,
      pathname: win.location.pathname,
      date: new Date().toISOString()
    };
    this.addLog(logEntry);
  }

  private addLog(logEntry: Log) {
    const session = this.session();
    const status = this.status();

    if (session) {
      session.log.push(logEntry);
      this.config.window.sessionStorage.setItem(`${SessionStorageKey.swtSession}-${session.id}`, JSON.stringify(session));
      this.subject.next(logEntry);
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
          element.setAttribute('data-swt-id', selector);
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
        dataset: element.dataset,
        rect: element.getBoundingClientRect(),
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

    const logEntry: SwtElementBind = {
      type: 'swt-element-bind',
      tagName: element.tagName,
      id: swtId,
      dataset: element.dataset,
      rect: element.getBoundingClientRect(),
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

    const logEntry: SwtElementUnbind = {
      type: 'swt-element-unbind',
      tagName: element.tagName,
      id: swtId,
      dataset: element.dataset,
      rect: element.getBoundingClientRect(),
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
      this.processExistingElements();
      this.startObservingDOM();
    }

    console.log('document.readyState',document.readyState)
    if (document.readyState !== 'complete') {
      doc.addEventListener('DOMContentLoaded', () => {
        console.log('DOMContentLoadedEvent ')
        const logEntry: DocumentLoaded = {type: 'document-loaded', url: win.location.href, pathname: win.location.pathname, date: new Date().toISOString()};
        this.addLog(logEntry);
        startDetecting();
      });
    } else {
        startDetecting();
      // 이미 DOMContentLoaded 됨
    }


    // Non-debounced click listener
    doc.addEventListener('click', (e) => {
      const logEntry: DocumentClickLog = {type: 'document-click', window: {w: win.innerWidth, h: win.innerHeight}, x: e.clientX, y: e.clientY, date: new Date().toISOString()};
      this.addLog(logEntry);
    });

    // Debounced event listeners using pipe
    fromEvent<MouseEvent>(doc, 'mousemove').pipe(
      debounceTime(100)
    ).subscribe({
      next: e => {
        const logEntry: DocumentMouseMove = {type: 'document-mousemove', window: {w: win.innerWidth, h: win.innerHeight}, x: e.clientX, y: e.clientY, date: new Date().toISOString()};
        this.addLog(logEntry);
      }
    });

    fromEvent<Event>(win, 'scroll').pipe(
      debounceTime(100)
    ).subscribe({
      next: () => {
        const logEntry: WindowScroll = {type: 'window-scroll', window: {w: win.innerWidth, h: win.innerHeight}, x: win.scrollX, y: win.scrollY, date: new Date().toISOString()};
        this.addLog(logEntry);
      }
    });

    fromEvent<UIEvent>(win, 'resize').pipe(
      debounceTime(100)
    ).subscribe({
      next: () => {
        const logEntry: WindowResize = {type: 'window-resize', w: win.innerWidth, h: win.innerHeight, date: new Date().toISOString()};
        this.addLog(logEntry);
      }
    });

    fromEvent<PopStateEvent>(win, 'popstate').pipe(
      debounceTime(100)
    ).subscribe({
      next: () => {
        const logEntry: WindowPopstate = {type: 'window-popstate', url: win.location.href, pathname: win.location.pathname, date: new Date().toISOString()};
        this.addLog(logEntry);
      }
    });

    // History patches (no debounce)
    const originalPushState = win.history.pushState;
    win.history.pushState = (...args: any[]) => {
      originalPushState.apply(win.history, args);
      const logEntry: WindowPopstate = {type: 'window-popstate', url: win.location.href, pathname: win.location.pathname, date: new Date().toISOString()};
      this.addLog(logEntry);
    };

    const originalReplaceState = win.history.replaceState;
    win.history.replaceState = (...args: any[]) => {
      originalReplaceState.apply(win.history, args);
      const logEntry: WindowPopstate = {type: 'window-popstate', url: win.location.href, pathname: win.location.pathname, date: new Date().toISOString()};
      this.addLog(logEntry);
    };

    win.addEventListener('error', (event: ErrorEvent) => {
      const { message, filename, lineno, colno, error } = event;
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
      console.log('---------setupMessageListener-----', data)
      const senderWindow = event.source as Window;
      if (senderWindow && data.type === Type.swtCommand) {
        const responseData = this.messageManager.makeMessageResponse(data);
        if (responseData) {
          this.messageManager.sendResponse(senderWindow, responseData);
        }
      }
    });

    console.log('General event listeners added.');
  }

  private initIntersectionObserver() {
    this.intersectionObserver = new IntersectionObserver(this.boundIntersectionObserverCallback, {
      root: null, // viewport
      rootMargin: '0px',
      threshold: 0.1 // Trigger when 10% of the element is visible/hidden
    });
    console.log('IntersectionObserver initialized.');
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
          dataset: element.dataset,
          rect: element.getBoundingClientRect(),
          date: new Date().toISOString()
        };
        this.addLog(logEntry);
      } else {
        const logEntry: SwtElementInvisible = {
          type: 'swt-element-invisible',
          tagName: element.tagName,
          id: swtId,
          dataset: element.dataset,
          rect: element.getBoundingClientRect(),
          date: new Date().toISOString()
        };
        this.addLog(logEntry);
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
}

