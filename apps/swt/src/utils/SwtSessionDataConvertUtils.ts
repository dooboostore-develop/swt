import {
  isDocumentClickLog,
  isDocumentMouseMove,
  isSwtElementBind,
  isSwtElementClick,
  isSwtElementInvisible,
  isSwtElementLayoutChange,
  isSwtElementUnbind,
  isSwtElementVisible,
  isWindowResize,
  isWindowScroll,
  isWindowChangeState,
  isDocumentLoaded,
  SwtLog,
  SwtSessionData, isChangeUrlLog, isDocumentDragStart, isDocumentDragEnd,
} from '../Swt';

export namespace SwtSessionDataConvertUtils {

  export type StateTimeLine<T extends SwtLog = SwtLog> = {
    id: string,
    pathname: string,
    url: string,
    windowInnerWidth: number,
    windowInnerHeight: number,
    mouseX: number;
    mouseY: number;
    windowScrollX: number;
    windowScrollY: number;
    documentScrollHeight?: number; // Added
    documentScrollWidth?: number;  // Added
    swtElements: { id: string, tagName: string, targetSelector?: string | null, visible: boolean, rect: DOMRectReadOnly }[],
    log: T
  };

  export function stateTimelineGroupBySessionId<T extends SwtLog>(
    sessions: SwtSessionData[],
    filter: (log: SwtLog, session: SwtSessionData) => log is T
  ): Map<string, StateTimeLine<T>[]>;
  export function stateTimelineGroupBySessionId(
    sessions: SwtSessionData[]
  ): Map<string, StateTimeLine<SwtLog>[]>;
  export function stateTimelineGroupBySessionId(
    sessions: SwtSessionData[],
    filter?: (log: SwtLog, session: SwtSessionData) => boolean
  ): Map<string, StateTimeLine<SwtLog>[]> {
    const sortedSessions = sessions.slice().sort((a, b) => new Date(a.start.date).getTime() - new Date(b.start.date).getTime());

    const sessionStateTimeline = new Map<string, StateTimeLine<SwtLog>[]>();
    sortedSessions.forEach(session => {
      const stateTimelines: StateTimeLine<SwtLog>[] = [];
      let currentState: Omit<StateTimeLine<SwtLog>, 'log'> = {
        id: session.id,
        pathname: session.start.pathname,
        url: session.start.url,
        windowInnerWidth: session.start.windowInnerWidth,
        windowInnerHeight: session.start.windowInnerHeight,
        mouseX: -999,
        mouseY: -999,
        windowScrollX: session.start.windowScrollX,
        windowScrollY: session.start.windowScrollY,
        documentScrollHeight: session.start.documentScrollHeight, // Added
        documentScrollWidth: session.start.documentScrollWidth,   // Added
        swtElements: [],
      };

      const sortedLogs = session.log.slice().sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      for (const log of sortedLogs) {
        if (!filter || filter(log, session)) { // Apply filter here
          // Create a deep copy for modification
          let nextElementsState = currentState.swtElements.map(el => ({...el}));
          let nextPathname = currentState.pathname;
          let nextUrl = currentState.url;
          let nextId = currentState.id;
          let nextWindowInnerWidth = currentState.windowInnerWidth;
          let nextWindowInnerHeight = currentState.windowInnerHeight;
          let nextMouseX = currentState.mouseX;
          let nextMouseY = currentState.mouseY;
          let nextWindowScrollX = currentState.windowScrollX;
          let nextWindowScrollY = currentState.windowScrollY;
          let nextDocumentScrollHeight = currentState.documentScrollHeight; // Added
          let nextDocumentScrollWidth = currentState.documentScrollWidth;   // Added

          // Update common properties based on log type
          if (isDocumentLoaded(log) || isWindowChangeState(log) ||
            isDocumentClickLog(log) || isDocumentMouseMove(log) || isWindowScroll(log) || isWindowResize(log) ||
            isSwtElementClick(log) || isSwtElementVisible(log) || isSwtElementInvisible(log) ||
            isSwtElementLayoutChange(log) || isSwtElementBind(log) || isSwtElementUnbind(log) || isDocumentDragStart(log) || isDocumentDragEnd(log)) {
            nextWindowInnerWidth = log.windowInnerWidth;
            nextWindowInnerHeight = log.windowInnerHeight;
            nextWindowScrollX = log.windowScrollX;
            nextWindowScrollY = log.windowScrollY;
            nextDocumentScrollHeight = log.documentScrollHeight; // Added
            nextDocumentScrollWidth = log.documentScrollWidth;   // Added
          }

          if (isChangeUrlLog(log)) {
            nextPathname = log.pathname;
            nextUrl = log.url;
          }
          if (isDocumentLoaded(log)) {
            nextElementsState = [];
          }

          if (isDocumentClickLog(log) || isDocumentMouseMove(log) || isSwtElementClick(log)) {
            nextMouseX = log.mouseX;
            nextMouseY = log.mouseY;
          } else if (isDocumentDragStart(log)) {
            nextMouseX = log.startX;
            nextMouseY = log.startY;
          } else if (isDocumentDragEnd(log)) {
            nextMouseX = log.endX;
            nextMouseY = log.endY;
          }

          // Element-specific updates
          if (isSwtElementBind(log)) {
            // Avoid duplicates
            if (!nextElementsState.find(el => el.id === log.id)) {
              nextElementsState.push({id: log.id, tagName: log.tagName, targetSelector: log.targetSelector, visible: false, rect: log.rect});
            }
          } else if (isSwtElementUnbind(log)) {
            nextElementsState = nextElementsState.filter(el => el.id !== log.id);
          } else if (isSwtElementVisible(log)) {
            const el = nextElementsState.find(e => e.id === log.id);
            if (el) {
              el.visible = true;
              el.rect = log.rect;
            }
          } else if (isSwtElementInvisible(log)) {
            const el = nextElementsState.find(e => e.id === log.id);
            if (el) {
              el.visible = false;
              el.rect = log.rect;
            }
          } else if (isSwtElementLayoutChange(log) || isSwtElementClick(log)) {
            const el = nextElementsState.find(e => e.id === log.id);
            if (el) {
              el.rect = log.rect;
            }
          }

          const newTimelineEntry: StateTimeLine<SwtLog> = { // Use StateTimeLine<SwtLog> here
            id: nextId,
            pathname: nextPathname,
            url: nextUrl,
            windowInnerWidth: nextWindowInnerWidth,
            windowInnerHeight: nextWindowInnerHeight,
            mouseX: nextMouseX,
            mouseY: nextMouseY,
            windowScrollX: nextWindowScrollX,
            windowScrollY: nextWindowScrollY,
            documentScrollHeight: nextDocumentScrollHeight, // Added
            documentScrollWidth: nextDocumentScrollWidth,   // Added
            swtElements: nextElementsState,
            log: log, // log is SwtLog here
          };

          stateTimelines.push(newTimelineEntry);

          // Update currentState for the next iteration
          currentState = {
            id: newTimelineEntry.id,
            pathname: newTimelineEntry.pathname,
            url: newTimelineEntry.url,
            windowInnerWidth: newTimelineEntry.windowInnerWidth,
            windowInnerHeight: newTimelineEntry.windowInnerHeight,
            mouseX: newTimelineEntry.mouseX,
            mouseY: newTimelineEntry.mouseY,
            windowScrollX: newTimelineEntry.windowScrollX,
            windowScrollY: newTimelineEntry.windowScrollY,
            documentScrollHeight: newTimelineEntry.documentScrollHeight, // Added
            documentScrollWidth: newTimelineEntry.documentScrollWidth,   // Added
            swtElements: newTimelineEntry.swtElements,
          };
        } // End of filter check
        sessionStateTimeline.set(session.id, stateTimelines);
      }
    });
    return sessionStateTimeline;
  }


  export function stateTimelines<T extends SwtLog>(
    sessions: SwtSessionData[],
    filter: (log: SwtLog, session: SwtSessionData) => log is T
  ): StateTimeLine<T>[];
  export function stateTimelines(
    sessions: SwtSessionData[]
  ): StateTimeLine<SwtLog>[];
  export function stateTimelines<T extends SwtLog>(
    sessions: SwtSessionData[],
    filter?: (log: SwtLog, session: SwtSessionData) => log is T
  ): StateTimeLine<T>[] | StateTimeLine<SwtLog>[] {
    const groupedBySession = filter ? stateTimelineGroupBySessionId(sessions, filter) : stateTimelineGroupBySessionId(sessions);

    // Flatten all timelines from the map into a single array
    const allTimelines = Array.from(groupedBySession.values()).flat();

    // Sort the combined array by the date in the log object
    allTimelines.sort((a, b) => new Date(a.log.date).getTime() - new Date(b.log.date).getTime());

    return allTimelines;
  }

  export function groupByPathname<T extends SwtLog>(
    sessions: SwtSessionData[],
    filter: (log: SwtLog, session: SwtSessionData) => log is T
  ): Map<string, T[]>;
  export function groupByPathname(
    sessions: SwtSessionData[]
  ): Map<string, SwtLog[]>;
  export function groupByPathname(
    sessions: SwtSessionData[],
    filter?: (log: SwtLog, session: SwtSessionData) => boolean
  ): Map<string, SwtLog[]> {
    const logMap = new Map<string, SwtLog[]>();
    sessions.forEach(session => {
      let currentPathname = session.start.pathname; // Start with unknown
      // Ensure logs are sorted by date
      const sortedLogs = session.log.slice().sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      sortedLogs.forEach(log => {
        // If the log has a pathname, it's a navigation event. Update the current path.
        if (isChangeUrlLog(log)) {
          currentPathname = log.pathname;
        }

        if (!filter || filter(log, session)) {
          const page = currentPathname; // Use the tracked pathname
          if (!logMap.has(page)) {
            logMap.set(page, []);
          }
          const eventCounts = logMap.get(page)!;
          eventCounts.push(log);
        }
      });
    });
    return logMap;
  }

  export function filterSessionLogs<T extends SwtLog>(
    sessions: SwtSessionData[],
    filter: (log: SwtLog, session: SwtSessionData) => log is T
  ): SwtSessionData<T>[] {
    const filteredSessions: SwtSessionData<T>[] = [];

    sessions.forEach(session => {
      const filteredLogs: T[] = [];
      session.log.forEach(log => {
        if (filter(log, session)) {
          filteredLogs.push(log);
        }
      });

      if (filteredLogs.length > 0) {
        const newSession: SwtSessionData<T> = {
          ...session,
          log: filteredLogs,
        };
        filteredSessions.push(newSession);
      }
    });

    return filteredSessions;
  }

  export function filterFlatSessionLogs<T extends SwtLog>(
    sessions: SwtSessionData[],
    filter: (log: SwtLog, session: SwtSessionData) => log is T
  ): T[] {
    const flatFilteredLogs: T[] = [];

    sessions.forEach(session => {
      session.log.forEach(log => {
        if (filter(log, session)) {
          flatFilteredLogs.push(log);
        }
      });
    });

    return flatFilteredLogs;
  }
}