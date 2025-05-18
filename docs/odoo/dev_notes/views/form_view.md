---
title: Form View
description: Form View
sidebar_label: Form
keywords:
- odoo
- odoo development
tags: [odoo]
last_update:
  date: 2025/5/18
  author: Lucas
---
# Form View

## FormView打开时自动聚焦于Field

在FormView中，在需要自动聚焦的字段标签内设置`default_foucs="1"`.

<details>
  <summary>查看源码</summary>

![default_foucs source code](../_images/form_view_1.png "source code")

```javascript title="addons\web\static\src\views\form\form_arch_parser.js"
/** @odoo-module **/

import { addFieldDependencies, archParseBoolean, getActiveActions } from "@web/views/utils";
import { Field } from "@web/views/fields/field";
import { XMLParser } from "@web/core/utils/xml";
import { Widget } from "@web/views/widgets/widget";

export class FormArchParser extends XMLParser {
    parse(arch, models, modelName) {
        const xmlDoc = this.parseXML(arch);
        const jsClass = xmlDoc.getAttribute("js_class");
        const disableAutofocus = archParseBoolean(xmlDoc.getAttribute("disable_autofocus") || "");
        const activeActions = getActiveActions(xmlDoc);
        const fieldNodes = {};
        const fieldNextIds = {};
        let autofocusFieldId = null;
        const activeFields = {};
        this.visitXML(xmlDoc, (node) => {
            if (node.tagName === "field") {
                const fieldInfo = Field.parseFieldNode(node, models, modelName, "form", jsClass);
                let fieldId = fieldInfo.name;
                if (fieldInfo.name in fieldNextIds) {
                    fieldId = `${fieldInfo.name}_${fieldNextIds[fieldInfo.name]++}`;
                } else {
                    fieldNextIds[fieldInfo.name] = 1;
                }
                fieldNodes[fieldId] = fieldInfo;
                node.setAttribute("field_id", fieldId);
                if (archParseBoolean(node.getAttribute("default_focus") || "")) {
                    autofocusFieldId = fieldId;
                }
                addFieldDependencies(
                    activeFields,
                    models[modelName],
                    fieldInfo.FieldComponent.fieldDependencies
                );
                return false;
            } else if (node.tagName === "div" && node.classList.contains("oe_chatter")) {
                // remove this when chatter fields are declared as attributes on the root node
                return false;
            } else if (node.tagName === "widget") {
                const { WidgetComponent } = Widget.parseWidgetNode(node);
                addFieldDependencies(
                    activeFields,
                    models[modelName],
                    WidgetComponent.fieldDependencies
                );
            }
        });
        // TODO: generate activeFields for the model based on fieldNodes (merge duplicated fields)
        for (const fieldNode of Object.values(fieldNodes)) {
            const fieldName = fieldNode.name;
            if (activeFields[fieldName]) {
                const { alwaysInvisible } = fieldNode;
                activeFields[fieldName] = {
                    ...fieldNode,
                    // a field can only be considered to be always invisible
                    // if all its nodes are always invisible
                    alwaysInvisible: activeFields[fieldName].alwaysInvisible && alwaysInvisible,
                };
            } else {
                activeFields[fieldName] = fieldNode;
            }
            // const { onChange, modifiers } = fieldNode;
            // let readonly = modifiers.readonly || [];
            // let required = modifiers.required || [];
            // if (activeFields[fieldNode.name]) {
            //     activeFields[fieldNode.name].readonly = Domain.combine([activeFields[fieldNode.name].readonly, readonly], "|");
            //     activeFields[fieldNode.name].required = Domain.combine([activeFields[fieldNode.name].required, required], "|");
            //     activeFields[fieldNode.name].onChange = activeFields[fieldNode.name].onChange || onChange;
            // } else {
            //     activeFields[fieldNode.name] = { readonly, required, onChange };
            // }
        }
        return {
            arch,
            activeActions,
            activeFields,
            autofocusFieldId,
            disableAutofocus,
            fieldNodes,
            xmlDoc,
            __rawArch: arch,
        };
    }
}

```

</details>

## Form View中的x2many明细行禁止打开详情页

在v16版本及后续版本，可以直接在x2many field的子视图`<tree>`标签内设置属性`no_open="1"`.

旧版本需要自行修改ListRenderer, 通常可以按以下方式处理：

```javascript
var ListRenderer = require('web.ListRenderer');
ListRenderer.include({
	_onRowClicked: function () {
		var context = this.state.context;
		if(!context["disable_open"]){
			self._super.apply(self, arguments);
		}
	}
})
```

```xml
<field name="" context="{'disable_open': True}">
	<tree></tree>
</field>
```
