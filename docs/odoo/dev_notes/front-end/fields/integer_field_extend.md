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
对Integer Field进行功能扩展
- 自定义数据显示及必填检查
- 通过校验控制数值输入的范围
:::

## 数据显示及必填检查

:::info[Note]
Integer Field扩展:
- 是否显示0
- 是否格式化（千分位）
- 必填是检查是否非0

:::

通过分析查找出`addons/web/static/src/views/basic_relational_model.js`以下位置的代码会处理数据的必填校验。
此处可以看出检查必填时是通过`FieldComponent.isSet`这个function处理。所以只需要做出以下修改(若需求为正数，也可通过修改此处实现)：
```javascript
IntegerFieldFormat.isSet = (value) => value !== 0;
```
![check_validity](../../_images/basic_relational_model_check_validity.png)

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

---

## 通过校验控制数值输入的范围

:::info[Note]
通过在xml中的`field`标签内设置属性，来校验数值输入的范围。
:::

```javascript title="integer_validate.js"
/** @odoo-module **/

import { IntegerField } from "@web/views/fields/integer/integer_field";
import { sprintf } from "@web/core/utils/strings";
import { registry } from "@web/core/registry";
import { useInputField } from "@web/views/fields/input_field_hook";
import { useNumpadDecimal } from "@web/views/fields/numpad_decimal_hook";
import { parseInteger } from "@web/views/fields/parsers";
import { useService } from "@web/core/utils/hooks";
import { useRef, useEffect } from "@odoo/owl";

export class IntegerFieldValidate extends IntegerField {
    setup(){
        useInputField({
            getValue: () => this.formattedValue,
            refName: "numpadDecimal",
            parse: (v) => this.parseIntegerValidate(v),
        });
        useNumpadDecimal();
        this.notification = useService("notification");
        this.inputRef = useRef("numpadDecimal");

        const onInput_ = (ev) => {
            if (this.props.record && !this.props.record.isValid) {
                this.props.record._invalidFields.delete(this.props.name);
                this.props.record.model.notify();
            }
        }

        useEffect(
            (inputEl) => {
                if (inputEl) {
                    inputEl.addEventListener("input", onInput_);
                    return () => {
                        inputEl.removeEventListener("input", onInput_);
                    };
                }
            },
        () => [this.inputRef.el]
    );
    }

    getFieldLabel(){
        if (this.props.name in this.props.record.fields){
            return this.props.record.fields[this.props.name].string;
        }else{
            return this.props.name;
        }
    }

    parseIntegerValidate(v){
        let message = '';
        const parsed = parseInteger(v);
        const fieldLabel = this.getFieldLabel();
        if (this.props.gt !== undefined && parsed <= this.props.gt){
            message = sprintf(this.env._t("The value of %s must be greater than %s."), fieldLabel, this.props.gt);
            this.notification.add(message, {title: this.env._t("Invalid fields"), type: 'danger'});
            throw new Error(message);
        }
        if (this.props.gte !== undefined && parsed < this.props.gte){
            message = sprintf(this.env._t("The value of %s must be greater than or equal to %s."), fieldLabel, this.props.gte);
            this.notification.add(message, {title: this.env._t("Invalid fields"), type: 'danger'});
            throw new Error(message);
        }
        if (this.props.lt !== undefined && parsed >= this.props.lt){
            message = sprintf(this.env._t("The value of %s must be less than %s."), fieldLabel, this.props.lt);
            this.notification.add(message, {title: this.env._t("Invalid fields"), type: 'danger'});
            throw new Error(message);
        }
        if (this.props.lte !== undefined && parsed > this.props.lte){
            message = sprintf(this.env._t("The value of %s must be less than or equal to %s."), fieldLabel, this.props.lte);
            this.notification.add(message, {title: this.env._t("Invalid fields"), type: 'danger'});
            throw new Error(message);
        }
        return parsed;
    }
}

IntegerFieldValidate.props = {
    ...IntegerField.props,
    gt: { type: Number, optional: true },
    gte: { type: Number, optional: true },
    lt: { type: Number, optional: true },
    lte: { type: Number, optional: true },
}

IntegerFieldValidate.extractProps = ({ attrs }) => {
    return {
        inputType: attrs.options.type,
        step: attrs.options.step,
        placeholder: attrs.placeholder,
        gt: attrs.options.gt,
        gte: attrs.options.gte,
        lt: attrs.options.lt,
        lte: attrs.options.lte,
    };
};

registry.category("fields").add("integer_validate", IntegerFieldValidate);
```
