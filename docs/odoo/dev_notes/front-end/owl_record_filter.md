---
title: 在Qweb中使用m2x选择模型数据(odoo16)
description: 在Qweb中使用m2x选择模型数据(odoo16)
sidebar_label: 在Qweb中使用m2x选择模型数据
keywords:
- odoo
- odoo development
tags: [odoo]
last_update:
  date: 2025/5/19
  author: Lucas
---

# 在Qweb中使用m2x选择模型数据(odoo16)

:::info[Note]
基于原生的`Many2XAutocomplete`组件，实现在OWL中使用`many2one`字段的模型数据选择。
:::

## New Component: RecordFilter

```javascript title="record_filter.js"
/** @odoo-module **/

import {Many2XAutocomplete} from "@web/views/fields/relational_utils";
import {Component, onWillStart, onWillUpdateProps} from "@odoo/owl";
import {useService} from "@web/core/utils/hooks";

export class RecordFilter extends Component {
  setup() {
    this.displayNames = {};
    this.orm = useService("orm");
    onWillStart(async () => {
      if (this.props.type === 'record') {
        await this.preFetchDisplayNames();
      }
    })
  }

  get displayName() {
    return this.props.value ? this.props.value[1].split("\n")[0] : "";
  }

  /**
     * 当type=record时，值发生变更
     * @param record
     * @param params
     */
  updateMany2X(record, params = {}) {
    if (!record) {
      this.props.onValueChanged(this.props.filterName, false);
    } else {
      let {id, name} = record[0];
      if (name) {
        this.displayNames[id] = name;
      } else if (id in this.displayNames) {
        name = this.displayNames[id];
      } else {
        const results = this.fetchMissingDisplayNames(id);
        if (results.length > 0) {
          name = results[0].display_name;
        }
      }
      this.props.onValueChanged(this.props.filterName, [id, name]);
    }
  }


  searchDomain() {
    return this.props.getDomain(this.props.filterName);
  }

  stringify(value) {
    return JSON.stringify(value);
  }

  onSelectionChange(ev) {
    const value = JSON.parse(ev.target.value);
    console.log(value)
    this.props.onValueChanged(this.props.filterName, value);
  }

  // 获取缺失的DisplayName
  async fetchMissingDisplayNames(recordId) {
    const results = await this.orm.read(this.props.resModel, recordId, ["display_name"]);
    for (const {id, display_name} of results) {
      this.displayNames[id] = display_name;
    }
    return results;
  }


  /**
     * 预先获取属于props.domain的数据的DisplayName
     * @returns {Promise<void>}
     */
  async preFetchDisplayNames() {
    const results = await this.orm.searchRead(
      this.props.resModel,
      this.props.getDomain(this.props.filterName),
      ['display_name'],
      {context: this.props.context});
    for (const {id, display_name} of results) {
      this.displayNames[id] = display_name;
    }
  }

}

RecordFilter.template = "RecordFilter";
RecordFilter.components = {Many2XAutocomplete};
RecordFilter.props = {
  filterName: String,
  type: {optional: true, type: String},
  resModel: {optional: true, type: String},
  value: {optional: true, type: [Boolean, String, Array]},
  label: {optional: true, type: String},
  options: {optional: true, type: Array},
  context: {optional: true, type: Object},
  getDomain: Function,
  onValueChanged: Function,
};
RecordFilter.defaultProps = {
  // ...Many2XAutocomplete.defaultProps,
    type: 'record'
}
```

```xml title="record_filter.xml"
<?xml version="1.0" encoding="UTF-8" ?>
<templates xml:spach="preserve">

    <t t-name="RecordFilter" owl="1">
        <div class="o_field_widget o_field_many2one_tags">
            <span class="text-primary fw-bolder" t-esc="props.label"/>
            <div class="o_field_tags d-inline-flex flex-wrap mw-100"
                 t-att-data-id="props.filterName">
                <div t-if="props.type === 'record'" class="o_field_many2many_selection d-inline-flex w-100">
                    <Many2XAutocomplete
                            resModel="props.resModel"
                            fieldString="props.label"
                            value="displayName"
                            autoSelect="true"
                            context="props.context"
                            activeActions="{}"
                            update.bind="updateMany2X"
                            getDomain.bind="searchDomain"
                            isToMany="false"
                    />
                </div>
                <div t-elif="props.type === 'selection'" class="d-inline-flex w-100">
                    <select class="o_input pe-3" t-on-change="onSelectionChange">
                        <t t-foreach="props.options" t-as="option" t-key="option[0]">
                            <option
                                t-att-selected="option[0] === props.value"
                                t-att-value="stringify(option[0])"
                                t-esc="option[1]"
                            />
                        </t>
                    </select>
                </div>
                <t t-else="">
                </t>
            </div>
        </div>

    </t>

</templates>
```

## 在Qweb中使用RecordFilter

```xml
<RecordFilter
        t-props="getFilterProps(filter)"
        t-foreach="filters"
        t-as="filter"
        t-key="filter.id"
/>
```

```javascript

class xxxComponent extends Component{

  setup(){
    this.state = useState({
        filters: [],
        isDisabled: false
    });
    onWillStart(async () => {
        this.setFilters();
        // TODO: default table columns
    });
  }

  setFilters(){
      const filters = [
          {
              filterName: 'report_type',
              filterType: 'selection',
              label: '报表类型',
              options: [
                  ['1', '销售下单统计'],
                  ['2', '销售下单统计(含客户)'],
                  ['3', '客户下单统计'],
              ],
              defaultValue: '1',
          },
          {
              filterName: 'company',
              filterType: 'record',
              resModel: 'res.company',
              label: '公司',
              domain: [['name', 'like', '有限公司']],
          },
          {
              filterName: 'customer',
              filterType: 'record',
              resModel: 'res.partner',
              label: '客户',
              domain: [],
              context: {show_cust_num: true}
          },
          {
              filterName: 'user',
              filterType: 'record',
              resModel: 'res.users',
              label: '用户',
              domain: [],
          },
      ];
      filters.forEach(filter => {
          filter.value = filter.defaultValue || false;
          this.state.filters.push(filter);
      });
  }

  update(filterName, value){
      const f = this.findFilter(filterName);
      if (f){
          f[0].value = value;
          this.notifyChanged(filterName, value);
      }
  }

  searchDomain(filterName){
      const f = this.findFilter(filterName);
      return f ? f[0].domain : [];
  }

  findFilter(filterName){
      return this.state.filters.filter(filter => filter.filterName === filterName)
  }

  get filters(){
      let filterId = 1;
      this.state.filters.forEach(filter => {filter.id = filterId++});
      return this.state.filters;
  }

  getFilterProps(filter){
      const props = {
          filterName: filter.filterName,
          type: filter.filterType,
          resModel: filter.resModel,
          label: filter.label,
          value: filter.value,
          options: filter.options,
          context: filter.context,
          onValueChanged: this.update.bind(this),
          getDomain: this.searchDomain.bind(this),
      }
      return props;
  }
}
```
