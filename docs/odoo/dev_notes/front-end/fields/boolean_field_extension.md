---
title: Boolean Field 扩展
description: Boolean Field 扩展
sidebar_label: Boolean Field 扩展
keyword:
  - odoo
  - odoo development
tags:
  - odoo
last_update:
  date: 2025/12/1
  author: Lucas
---
# Boolean Field

:::info[Note]
对Boolean字段进行一些功能扩展

- 只读时显示为文本
:::

## 只读时显示为文本

通过在`field`标签内设置`options`属性，通过指定的`display_str` key传入一个列表(仅使用到前两个元素)。

```javascript title="boolean_display_str.js"
/** @odoo-module **/
import { registry } from "@web/core/registry"
import { BooleanField } from "@web/views/fields/boolean/boolean_field"
import { formatChar } from "@web/views/fields/formatters"

/*
支持将boolean字段只读状态下显示为指定的字符。
使用说明：
在xml中的Field标签添加widget="boolean_display_str"，
设置options="{'display_str': ['string1', 'string2']}"
field的数据为真是显示列表第一个字符，否则显示第二个字符。
未设置options时默认： ["True", "False"]
e.g.
<field name="authorize" widget="boolean_display_str" options="{'display_str': ['已核准', '未核准']}"/>
 */

export class BooleanFieldDisplayStr extends BooleanField{

    get display_str(){
        return this.props.display_str
    }

    get formattedValue(){
        const value = this.props.value === true ? this.display_str[0] : this.display_str[1]
        return formatChar(value);
    }
}

BooleanFieldDisplayStr.template = "BooleanFieldDisplayStr"
BooleanFieldDisplayStr.props = {
    ...BooleanField.props,
    display_str: { type: Array, optional: true }
}
BooleanFieldDisplayStr.defaultProps = {
    display_str: ["True", "False"]
}
BooleanFieldDisplayStr.extractProps = ({ attrs }) => {
    return {
        display_str: attrs.options.display_str,
    }
}

registry.category("fields").add("boolean_display_str", BooleanFieldDisplayStr)
```


```xml title="boolean_display_str.xml"
<?xml version="1.0" encoding="UTF-8" ?>
<templates xml:space="preserve">

    <t t-name="BooleanFieldDisplayStr" owl="1">
        <t t-if="isReadonly">
            <span t-esc="formattedValue" />
        </t>
        <t t-else="">
            <CheckBox id="props.id" value="props.value or false" className="'d-inline-block'" disabled="isReadonly" onChange.bind="onChange" />
        </t>
    </t>

</templates>
```