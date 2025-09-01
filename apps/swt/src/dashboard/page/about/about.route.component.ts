import { Lifecycle, Sim } from '@dooboostore/simple-boot/decorators/SimDecorator';
import { Component } from '@dooboostore/simple-boot-front/decorators/Component';
import template from './about.route.component.html';
import style from './about.route.component.css';
import { ComponentBase } from '@dooboostore/dom-render/components/ComponentBase';

@Sim({
  scope: Lifecycle.Transient
})
@Component({
  template: template,
  styles: style
})
export class AboutRouteComponent extends ComponentBase {
  name='about'
  // No specific logic needed for this simple info page
}
