import { Component } from '@dooboostore/simple-boot-front/decorators/Component';
import { Lifecycle, Sim } from '@dooboostore/simple-boot/decorators/SimDecorator';
import template from './filter-dialog.component.html';
import style from './filter-dialog.component.css';
import { ComponentBase, attribute } from '@dooboostore/dom-render/components/ComponentBase';

import { Filter, AvailableField, AvailableOperator } from '../../types/filter';

export interface DateFilter {
    from: string;
    to: string;
}

// 부모 컴포넌트로부터 받을 속성들의 타입을 정의합니다.
interface FilterDialogAttribute {
    filters: Filter[];
    dateFilter: DateFilter;
    availableFields: AvailableField[];
    availableOperators: AvailableOperator[];
    apply: (filters: Filter[], dateFilter: DateFilter) => void;
    cancel: () => void;
}

@Sim({ scope: Lifecycle.Transient })
@Component({
    selector: 'filter-dialog',
    template: template,
    styles: style
})
export class FilterDialogComponent extends ComponentBase<FilterDialogAttribute>  {
    // --- Attribute를 통해 부모로부터 값과 콜백 함수를 받습니다. ---
    
    @attribute({ name: 'availableFields' })  public availableFields: AvailableField[] = [];
    @attribute({ name: 'availableOperators' }) public availableOperators: AvailableOperator[] = [];
    @attribute({ name: 'apply' })            private applyCallback!: (filters: Filter[], dateFilter: DateFilter) => void;
    @attribute({ name: 'cancel' })           private cancelCallback!: () => void;

    // --- 컴포넌트 내부에서 사용할 상태 ---
    public localFilters: Filter[] = [];
    public dateFilter: DateFilter = { from: '', to: '' };

    constructor() {
      super();
    }

    @attribute({name: 'filters'})
    filterAttr(data: Filter[]): void {
        this.localFilters = JSON.parse(JSON.stringify(data));
    }

    @attribute({name: 'dateFilter'})
    dateFilterAttr(data: DateFilter): void {
        if (data) {
            this.dateFilter = JSON.parse(JSON.stringify(data));
        }
    }

    addFilter() {
        this.localFilters.push({ field: '', operator: 'eq', value: '' });
    }

    removeFilter(index: number) {
        this.localFilters.splice(index, 1);
    }

    clearDateFilter() {
      // console.log('-clearDateFilterclearDateFilter1', this.dateFilter)
        this.dateFilter.from=  '';
        this.dateFilter.to= '' ;
        // this.dateFilter = { from: '', to: '' };
      // console.log('-clearDateFilterclearDateFilter2', this.dateFilter)
    }

    onClearAll() {
        this.localFilters = [];
        this.dateFilter = { from: '', to: '' };
    }

    onApply() {
        // 'Apply' 버튼 클릭 시, 부모에게서 받은 apply 콜백 함수를 실행합니다.
        if (this.applyCallback) {
            this.applyCallback(this.localFilters, this.dateFilter);
        }
    }

    onCancel() {
        // 'Cancel' 버튼 클릭 시, 부모에게서 받은 cancel 콜백 함수를 실행합니다。
        if (this.cancelCallback) {
            this.cancelCallback();
        }
    }
}