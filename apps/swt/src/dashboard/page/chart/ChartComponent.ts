import { SwtSessionData } from 'apps/swt/src/Swt';

export interface ChartComponent {
  setSessions(sessionIds: string[], sessions: SwtSessionData[]):void;
}

export const isChartComponent = (obj: any): obj is ChartComponent => (
  obj &&
  typeof obj.setSessions === 'function'
);