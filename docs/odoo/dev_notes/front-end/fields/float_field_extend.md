---
title: Float Field扩展
description: Float Field扩展
sidebar_label: Float Field扩展
keyword:
  - odoo
  - odoo development
tags: [ odoo ]
last_update:
  date: 2025/5/28
  author: Lucas
---

# Float Field扩展

:::info[Note]
Float Field扩展:
- 是否显示0
- 是否格式化（千分位、小数位保留）
- 必填是检查是否非0

:::

## 数据显示及必填检查

```javascript title="float_field_extend.js"
/** @odoo-module **/

import { registry } from "@web/core/registry";
import { standardFieldProps } from "@web/views/fields/standard_field_props";
import { archParseBoolean } from "@web/views/utils";
import { FloatField } from "@web/views/fields/float/float_field";
import { formatFloat } from "@web/views/fields/formatters";

/**
 * Usage:
 * widget="float_format" options="{'need_format': '1', 'show_zero': 'false'}"
 * need_format: 是否格式化数字（千分符、小数位保留）
 * show_zero: 是否显示0
 */

export class FloatFieldFormat extends FloatField {

    get formattedValue() {
        if (this.props.inputType === "number" && !this.props.readonly && this.props.value) {
            return this.props.value === 0 && !this.props.showZero ? '' : this.props.value;
        }
        // 0
        // format
        if(this.props.value === 0){
            return !this.props.showZero ? '' : this.props.needFormat ? formatFloat(this.props.value, {digits: this.props.digits}) : this.props.value;
        }else{
            return this.props.needFormat ? formatFloat(this.props.value, {digits: this.props.digits}) : this.props.value;
        }
    }
}

// 处理必填时验证数据非0
FloatFieldFormat.isSet = (value) => value !== 0;
FloatFieldFormat.props = {
    ...standardFieldProps,
    inputType: { type: String, optional: true },
    step: { type: Number, optional: true },
    digits: { type: Array, optional: true },
    placeholder: { type: String, optional: true },
    // new
    needFormat: { type: Boolean, optional: true },
    showZero: { type: Boolean, optional: true },
}

FloatFieldFormat.defaultProps = {
    inputType: "text",
};

FloatFieldFormat.extractProps = ({ attrs, field }) => {
    // Sadly, digits param was available as an option and an attr.
    // The option version could be removed with some xml refactoring.
    let digits;
    if (attrs.digits) {
        digits = JSON.parse(attrs.digits);
    } else if (attrs.options.digits) {
        digits = attrs.options.digits;
    } else if (Array.isArray(field.digits)) {
        digits = field.digits;
    }
    const need_format = archParseBoolean(attrs.options.need_format, true)
    const show_zero = archParseBoolean(attrs.options.show_zero, true)
    return {
        inputType: attrs.options.type,
        step: attrs.options.step,
        digits,
        placeholder: attrs.placeholder,
        needFormat: need_format,
        showZero: show_zero,
    };
};

registry.category("fields").add('float_format', FloatFieldFormat);
```
