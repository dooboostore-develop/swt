import { Lifecycle, Sim } from '@dooboostore/simple-boot/decorators/SimDecorator';
import { Component } from '@dooboostore/simple-boot-front/decorators/Component';
import template from './index.route.component.html'
import style from './index.route.component.css'
import { ComponentBase } from '@dooboostore/dom-render/components/ComponentBase';
import { OnCreateRender } from '@dooboostore/dom-render/lifecycle/OnCreateRender';
import { SwtSessionData } from 'apps/swt/src/Swt';
@Sim({
  scope: Lifecycle.Transient
})
@Component({
  template: template,
  styles: style
})
export class IndexRouteComponent extends ComponentBase implements OnCreateRender {
  onCreateRender(sessions: SwtSessionData[], selectedSession: string | null): void {
  }

}


// export default {
//
// }