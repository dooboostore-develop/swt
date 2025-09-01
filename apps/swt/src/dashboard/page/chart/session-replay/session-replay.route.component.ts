import { Lifecycle, Sim } from '@dooboostore/simple-boot/decorators/SimDecorator';
import { Component } from '@dooboostore/simple-boot-front/decorators/Component';
import template from './session-replay.route.component.html';
import style from './session-replay.route.component.css';
import { ComponentBase, query } from '@dooboostore/dom-render/components/ComponentBase';
import { isSwtElementClick, SwtLog, SwtSessionData } from '../../../../Swt';
import { ChartComponent } from '../ChartComponent';
import { SwtSessionDataConvertUtils } from '../../../../utils/SwtSessionDataConvertUtils';
import { DomRenderNoProxy } from '@dooboostore/dom-render/decorators/DomRenderNoProxy';
import { RawSet } from '@dooboostore/dom-render/rawsets/RawSet';
const isSwtWindowResize = (log: SwtLog): log is (SwtLog & { type: 'window-resize', windowInnerWidth: number, windowInnerHeight: number }) => (log as any).type === 'window-resize';
const isSwtDocumentClick = (log: SwtLog): log is (SwtLog & { type: 'document-click', mouseX: number, mouseY: number, target?: any }) => (log as any).type === 'document-click';
const isSwtDocumentMouseMove = (log: SwtLog): log is (SwtLog & { type: 'document-mousemove', target?: any }) => (log as any).type === 'document-mousemove';

@Sim({
  scope: Lifecycle.Transient
})
@Component({
  selector: 'SessionReplayRouteComponent',
  template: template,
  styles: style
})
export class SessionReplayRouteComponent extends ComponentBase implements ChartComponent {
  private sessionIds?: string[];
  private sessions?: SwtSessionData[];
  private timelines: SwtSessionDataConvertUtils.StateTimeLine[] = [];
  private currentFrameIndex = 0;
  currentSwtElements: { id: string, visible: boolean, rect: DOMRectReadOnly }[] = [];
  @DomRenderNoProxy
  private canvas?: {
    element: HTMLCanvasElement,
    context: CanvasRenderingContext2D | null
  };
  private resizeObserver?: ResizeObserver;

  @query('.log-container textarea')
  private logTextarea?: HTMLTextAreaElement;

  @query('.control-container input[type="range"]')
  private slider?: HTMLInputElement;

  currentUrl = '';
  currentSessionId = '';

  constructor() {
    super();
  }

  setSessions(sessionIds: string[], sessions: SwtSessionData[]): void {
    this.sessions = sessions;
    this.sessionIds = sessionIds;
    this.setupReplay();
  }


  onRenderedCanvas(element: HTMLCanvasElement) {
    this.canvas = {
      element: element,
      context: element.getContext('2d'),
    };

    this.updateCanvasResolution(element);

    this.resizeObserver = new ResizeObserver(() => {
      this.updateCanvasResolution(element);
      this.renderFrame(this.currentFrameIndex);
    });
    this.resizeObserver.observe(element);
  }

  private updateCanvasResolution(canvasElement: HTMLCanvasElement) {
    canvasElement.width = canvasElement.clientWidth;
    canvasElement.height = canvasElement.clientHeight;
  }

  public onDestroy() {
    this.resizeObserver?.disconnect();
  }

  onInitRender(param: any, rawSet: RawSet) {
    super.onInitRender(param, rawSet);
    this.setupReplay();
  }

  private setupReplay() {
    if (!this.sessions || !this.slider) {
      return;
    }

    const targetSessions = (this.sessions ?? []).filter(it => this.sessionIds?.includes(it.id));
    this.timelines = SwtSessionDataConvertUtils.stateTimelines(targetSessions);
    if (this.timelines.length === 0) {
      return;
    }

    this.slider.max = (this.timelines.length - 1).toString();
    this.slider.value = '0';
    this.renderFrame(0);
  }

  onSliderChange(value: string) {
    const index = parseInt(value, 10);
    if (!isNaN(index) && index >= 0 && index < this.timelines.length) {
      this.currentFrameIndex = index;
      this.renderFrame(this.currentFrameIndex);
    }
  }

  private renderFrame(index: number) {
    const state = this.timelines[index];
    if (!this.canvas?.context || !state) {
      return;
    }

    const ctx = this.canvas.context;
    const canvasWidth = this.canvas.element.width;
    const canvasHeight = this.canvas.element.height;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Calculate scale and offset
    const virtualWidth = state.windowInnerWidth || 1; // Avoid division by zero
    const virtualHeight = state.windowInnerHeight || 1;
    const scale = Math.min(canvasWidth / virtualWidth, canvasHeight / virtualHeight) * 0.9;
    const scaledWidth = virtualWidth * scale;
    const scaledHeight = virtualHeight * scale;
    const offsetX = (canvasWidth - scaledWidth) / 2;
    const offsetY = (canvasHeight - scaledHeight) / 2;

    // Draw
    ctx.save(); // Save the state before clipping and translating

    // Draw Virtual Screen border and dimensions (not affected by scroll)
    this.drawVirtualScreen(ctx, state, scale, offsetX, offsetY, canvasWidth, canvasHeight);

    // Set up a clipping region and scroll translation for all subsequent drawings
    ctx.beginPath();
    ctx.rect(offsetX, offsetY, scaledWidth, scaledHeight); // Clipping region is the scaled viewport
    ctx.clip();

    // --- Set up the drawing context for the document content ---
    // 1. Translate to the top-left of the scaled viewport area on the canvas
    ctx.translate(offsetX, offsetY);
    // 2. Scale everything drawn after this
    ctx.scale(scale, scale);
    // 3. Translate to simulate the scroll: shift the document content by the negative scroll amount
    //    This makes the (windowScrollX, windowScrollY) point of the document appear at (0,0) of this translated context.
    ctx.translate(-state.windowScrollX, -state.windowScrollY);

    // These elements are now drawn inside the scrolled and clipped view.
    // Their rects are assumed to be viewport-relative, so we pass the scroll
    // offsets to convert them to document-relative coordinates before drawing.
    state.swtElements.forEach(element => {
      this.drawSwtElement(ctx, element, state.windowScrollX, state.windowScrollY);
    });

    // 클릭되거나 마우스가 위에 있는 요소를 점선으로 표시
    if (isSwtDocumentClick(state.log) && state.log.target) {
      // 클릭된 요소는 붉은색
      this.drawTargetElement(ctx, state.log.target, state.windowScrollX, state.windowScrollY, 'rgba(255, 0, 0, 0.7)');
    } else if (isSwtDocumentMouseMove(state.log) && state.log.target) {
      // 마우스가 위에 있는 요소는 회색
      this.drawTargetElement(ctx, state.log.target, state.windowScrollX, state.windowScrollY, 'rgba(150, 150, 150, 0.7)');
    }

    ctx.restore(); // Restore context to draw things not affected by scroll (like the mouse cursor and click indicator)

    // Draw mouse cursor on top of everything, within the original canvas coordinates
    this.drawMouseCursor(ctx, state, scale, offsetX, offsetY);

    // Draw click indicator on top of everything, within the original canvas coordinates
    this.drawClickIndicator(ctx, state.log, scale, offsetX, offsetY);

    // Update UI
    this.currentUrl = state.url;
    this.currentSessionId = state.id;
    if (this.logTextarea) {
      this.logTextarea.value = JSON.stringify(state.log, null, 2);
    }
    // console.log('-currentSwtElements', state.swtElements);
    this.currentSwtElements = state.swtElements;
  }

  private drawVirtualScreen(ctx: CanvasRenderingContext2D, state: SwtSessionDataConvertUtils.StateTimeLine, scale: number, offsetX: number, offsetY: number, canvasWidth: number, canvasHeight: number) {
    const scaledWidth = state.windowInnerWidth * scale;
    const scaledHeight = state.windowInnerHeight * scale;

    // Draw border
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 1;
    ctx.strokeRect(offsetX, offsetY, scaledWidth, scaledHeight);

    // Draw dimension text (windowInnerWidth, windowInnerHeight)
    ctx.fillStyle = '#aaa';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(`${state.windowInnerWidth}px`, offsetX + scaledWidth / 2, offsetY - 5);
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${state.windowInnerHeight}px`, offsetX - 5, offsetY + scaledHeight / 2);

    // Draw scroll position text (windowScrollX, windowScrollY)
    ctx.fillStyle = '#aaa';
    ctx.font = '10px Arial'; // Slightly smaller font

    const infoTextX = offsetX + scaledWidth + 10;
    ctx.textAlign = 'left';

    // Draw ScrollY at top right
    ctx.textBaseline = 'top';
    ctx.fillText(`ScrollY: ${state.windowScrollY}px`, infoTextX, offsetY);

    // Draw Mouse position at right center
    if (state.mouseX > 0) {
      ctx.textBaseline = 'middle';
      ctx.fillText(`Mouse: (${state.mouseX}, ${state.mouseY})`, infoTextX, offsetY + scaledHeight / 2);
    }

    // Draw ScrollX at bottom right
    ctx.textBaseline = 'bottom';
    ctx.fillText(`ScrollX: ${state.windowScrollX}px`, infoTextX, offsetY + scaledHeight);

    // --- Draw visual scroll indicators (more like scrollbars) ---
    const scrollbarWidth = 8; // Width of the scrollbar

    // Vertical Scrollbar
    const vScrollbarX = offsetX + scaledWidth;
    const vScrollbarY = offsetY;
    const vScrollbarHeight = scaledHeight;

    // Draw vertical scrollbar track
    ctx.fillStyle = 'rgba(200, 200, 200, 0.5)';
    ctx.fillRect(vScrollbarX, vScrollbarY, scrollbarWidth, vScrollbarHeight);

    // Draw vertical scroll thumb
    if (state.documentScrollHeight && state.documentScrollHeight > state.windowInnerHeight) {
      const vThumbHeight = Math.max(
        scrollbarWidth, // Minimum thumb size
        (state.windowInnerHeight / state.documentScrollHeight) * vScrollbarHeight
      );
      const vThumbY = vScrollbarY + (state.windowScrollY / state.documentScrollHeight) * vScrollbarHeight;

      ctx.fillStyle = 'rgba(100, 100, 100, 0.7)';
      ctx.fillRect(
        vScrollbarX,
        Math.max(vScrollbarY, Math.min(vScrollbarY + vScrollbarHeight - vThumbHeight, vThumbY)),
        scrollbarWidth,
        vThumbHeight
      );
    } else {
      // If not scrollable vertically, draw a full-height thumb or no thumb
      ctx.fillStyle = 'rgba(100, 100, 100, 0.7)';
      ctx.fillRect(vScrollbarX, vScrollbarY, scrollbarWidth, vScrollbarHeight);
    }


    // Horizontal Scrollbar
    const hScrollbarX = offsetX;
    const hScrollbarY = offsetY + scaledHeight;
    const hScrollbarWidth = scaledWidth;

    // Draw horizontal scrollbar track
    ctx.fillStyle = 'rgba(200, 200, 200, 0.5)';
    ctx.fillRect(hScrollbarX, hScrollbarY, hScrollbarWidth, scrollbarWidth);

    // Draw horizontal scroll thumb
    if (state.documentScrollWidth && state.documentScrollWidth > state.windowInnerWidth) {
      const hThumbWidth = Math.max(
        scrollbarWidth, // Minimum thumb size
        (state.windowInnerWidth / state.documentScrollWidth) * hScrollbarWidth
      );
      const hThumbX = hScrollbarX + (state.windowScrollX / state.documentScrollWidth) * hScrollbarWidth;

      ctx.fillStyle = 'rgba(100, 100, 100, 0.7)';
      ctx.fillRect(
        Math.max(hScrollbarX, Math.min(hScrollbarX + hScrollbarWidth - hThumbWidth, hThumbX)),
        hScrollbarY,
        hThumbWidth,
        scrollbarWidth
      );
    } else {
      // If not scrollable horizontally, draw a full-width thumb or no thumb
      ctx.fillStyle = 'rgba(100, 100, 100, 0.7)';
      ctx.fillRect(hScrollbarX, hScrollbarY, hScrollbarWidth, scrollbarWidth);
    }
  }

  private drawSwtElement(ctx: CanvasRenderingContext2D, element: { id: string, visible: boolean, rect: DOMRectReadOnly }, windowScrollX: number, windowScrollY: number) {
    // Element's rect is assumed to be viewport-relative.
    // We convert to document-relative coordinates by adding the current scroll offset,
    // because the canvas context is translated to handle scrolling.
    const x = element.rect.left + windowScrollX;
    const y = element.rect.top + windowScrollY;
    const w = element.rect.width;
    const h = element.rect.height;

    ctx.fillStyle = element.visible ? 'rgba(0, 100, 255, 0.3)' : 'rgba(100, 100, 100, 0.2)';
    ctx.fillRect(x, y, w, h);

    ctx.strokeStyle = element.visible ? 'rgba(0, 100, 255, 0.8)' : 'rgba(100, 100, 100, 0.5)';
    ctx.strokeRect(x, y, w, h);

    ctx.fillStyle = '#000';
    ctx.font = '10px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(element.id, x + 2, y + 2);
  }

  private drawTargetElement(ctx: CanvasRenderingContext2D, element: { rect: DOMRectReadOnly }, windowScrollX: number, windowScrollY: number, color: string) {
    const x = element.rect.left + windowScrollX;
    const y = element.rect.top + windowScrollY;
    const w = element.rect.width;
    const h = element.rect.height;

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]); // Dashed line
    ctx.strokeRect(x, y, w, h);
    ctx.setLineDash([]); // Reset line dash
  }

  private drawClickIndicator(ctx: CanvasRenderingContext2D, log: SwtLog, scale: number, offsetX: number, offsetY: number) {
    if (isSwtElementClick(log) || isSwtDocumentClick(log)) {
      const x = offsetX + log.mouseX * scale;
      const y = offsetY + log.mouseY * scale;

      ctx.beginPath();
      ctx.arc(x, y, 8 * scale, 0, 2 * Math.PI); // Increased radius
      ctx.fillStyle = 'rgba(0, 255, 255, 1.0)'; // Bright Cyan, full opacity
      ctx.fill();
      ctx.strokeStyle = 'rgba(0, 150, 150, 1.0)'; // Darker Cyan stroke
      ctx.lineWidth = 2; // Thicker stroke
      ctx.stroke();
    }
  }

  private drawMouseCursor(ctx: CanvasRenderingContext2D, state: SwtSessionDataConvertUtils.StateTimeLine, scale: number, offsetX: number, offsetY: number) {
    const x = offsetX + state.mouseX * scale;
    const y = offsetY + state.mouseY * scale;
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(255, 223, 0, 0.8)'; // Gold color
    ctx.fill();
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }


}
