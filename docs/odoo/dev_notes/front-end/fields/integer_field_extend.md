---
title: Integer Field扩展
description: Integer Field扩展
sidebar_label: Integer Field扩展
keyword:
  - odoo
  - odoo development
tags: [ odoo ]
last_update:
  date: 2025/5/28
  author: Lucas
---

# Integer Field扩展

:::info[Note]
Integer Field扩展:
- 是否显示0
- 是否格式化（千分位）
- 必填是检查是否非0

:::

## 数据显示及必填检查

```javascript title="integer_field_extend.js"
/** @odoo-module **/

import { registry } from "@web/core/registry";
import { archParseBoolean } from "@web/views/utils";
import { standardFieldProps } from "@web/views/fields/standard_field_props";
import { IntegerField } from "@web/views/fields/integer/integer_field";
import { formatInteger } from "@web/views/fields/formatters";

/**
 * Usage:
 * widget="integer_format" options="{'need_format': '1', 'show_zero': 'false'}"
 * need_format: 是否格式化数字（千分符）
 * show_zero: 是否显示0
 */


export class IntegerFieldFormat extends IntegerField {

    get formattedValue() {
        if (!this.props.readonly && this.props.inputType === "number") {
            return this.props.value === 0 && !this.props.showZero ? '' : this.props.value;
        }
        // 0
        // format
        if(this.props.value === 0){
            return !this.props.showZero ? '' : this.props.needFormat ? formatInteger(this.props.value) : this.props.value;
        }else{
            return this.props.needFormat ? formatInteger(this.props.value) : this.props.value;
        }
    }

}

// 处理必填时验证数据非0
IntegerFieldFormat.isSet = (value) => value !== 0;

IntegerFieldFormat.props = {
    ...standardFieldProps,
    inputType: { type: String, optional: true },
    step: { type: Number, optional: true },
    placeholder: { type: String, optional: true },
    // new
    needFormat: { type: Boolean, optional: true },
    showZero: { type: Boolean, optional: true },
};
IntegerFieldFormat.defaultProps = {
    inputType: "text",
};
IntegerFieldFormat.extractProps = ({ attrs }) => {
    const need_format = archParseBoolean(attrs.options.need_format, true)
    const show_zero = archParseBoolean(attrs.options.show_zero, true)
    return {
        inputType: attrs.options.type,
        step: attrs.options.step,
        placeholder: attrs.placeholder,
        needFormat: need_format,
        showZero: show_zero,
    };
};

registry.category("fields").add('integer_format', IntegerFieldFormat);
```
