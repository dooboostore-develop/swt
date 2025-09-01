import { Log, SwtSessionData } from '../Swt';

export namespace SwtSessionDataConvertUtils {
  export const groupByPathname = (sessions: SwtSessionData[]) => {
    const logMap = new Map<string, Log[]>();
    sessions.forEach(session => {
      let currentPathname = 'unknown'; // Start with unknown
      // Ensure logs are sorted by date
      const sortedLogs = session.log.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      sortedLogs.forEach(log => {
        // If the log has a pathname, it's a navigation event. Update the current path.
        if ('pathname' in log) {
          currentPathname = log.pathname;
        }

        const page = currentPathname; // Use the tracked pathname
        if (!logMap.has(page)) {
          logMap.set(page, []);
        }
        const eventCounts = logMap.get(page)!;
        eventCounts.push(log);
      });
    });
    return logMap;
  }
}