import { Swt } from './Swt';
import { dashboard } from './dashboard/DashBoard';

declare global {
  interface Window {
    swt: Swt | undefined;
  }
}

export enum Mode {
  dashboard = 'dashboard'
}

const swt = document.querySelector('#swt');
// const scriptUrl = import.meta.url;
if (swt instanceof HTMLElement) {
  const scriptUrl = swt.getAttribute('src') || import.meta.url;

  // const globalVariableName = swt.dataset.swtGlobalVariableName || 'swt';
  const isDisabledAutoStart = swt.hasAttribute('data-swt-disabled-auto-start')
  const token = swt.dataset.swtToken;
  const postUrl = swt.dataset.swtPostUrl;
  const postBufferTime = Number(swt.dataset.swtPostBufferTime ?? 0);
  const openDashboardDelay = Number(swt.dataset.swtOpenDashboardDelay ?? 0);
  const targetQuerySelector = (swt.dataset.swtTargetQuerySelector ?? '').split(',').map(it => it.trim())
  const swtElementResizeDebounceTime = Number(swt.dataset.swtElementResizeDebounceTime ?? 100);
  const documentMouseMoveDebounceTime = Number(swt.dataset.documentMouseMoveDebounceTime ?? 100);
  const windowScrollDebounceTime = Number(swt.dataset.windowScrollDebounceTime ?? 100);
  const windowResizeDebounceTime = Number(swt.dataset.windowResizeDebounceTime ?? 100);
  const windowChangeStateDebounceTime = Number(swt.dataset.windowChangeStateDebounceTime ?? 100);
  // console.log('targetQuerySelector:', swt.dataset, targetQuerySelector)
  const mode = swt.dataset.swtMode as Mode | undefined;
  if (mode === Mode.dashboard) {
    const dashboardSelector = swt.dataset.swtDashboardSelector || 'body';
    dashboard(dashboardSelector)
  } else {
const s = new Swt({
      window,
      token,
      postUrl,
      scriptUrl,
      openDashboardDelay,
      postBufferTime,
      targetQuerySelector,
      swtElementResizeDebounceTime,
      documentMouseMoveDebounceTime,
      windowScrollDebounceTime,
      windowResizeDebounceTime,
      windowChangeStateDebounceTime
    });
    window.swt = s;    window.swt = s;
    // (window as any)[globalVariableName] = s;
    if (!isDisabledAutoStart) {
      s.run();
    }
  }
} else {
  console.error('Could not find an element with id \'swt\'. Configuration is required.');
}

export default Swt;