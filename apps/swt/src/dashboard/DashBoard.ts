import 'reflect-metadata';
import { SimFrontOption, UrlType } from '@dooboostore/simple-boot-front/option/SimFrontOption';
import { SimpleBootFront } from '@dooboostore/simple-boot-front/SimpleBootFront';
import { Component } from '@dooboostore/simple-boot-front/decorators/Component';
import { OnInitRender } from '@dooboostore/dom-render/lifecycle/OnInitRender';
import { Router } from '@dooboostore/simple-boot/decorators/route/Router';
import { ComponentRouterBase } from '@dooboostore/simple-boot-front/component/ComponentRouterBase';
import { RawSet } from '@dooboostore/dom-render/rawsets/RawSet';
import { IndexRouterComponent } from './page/index.router.component';

export const dashboard = (selector: string) => {
  const config = new SimFrontOption(window)
    .setRootRouter(IndexRouterComponent)
    .setUrlType(UrlType.path)
    .setSelector(selector);
  const simpleApplication = new SimpleBootFront(config);
  simpleApplication.run();
  simpleApplication.goRouting('/')
};