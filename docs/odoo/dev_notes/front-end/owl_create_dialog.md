---
title: OWL - Create a new Dialog
description: 创建一个新的Dialog弹窗
sidebar_label: OWL - Create a new Dialog
keyword:
    - odoo
    - odoo development
tags: [odoo]
last_update:
  date: 2025/5/27
  author: Lucas
---

# 创建一个新的Dialog

:::info[Note]
从0开始创建一个新的Dialog弹窗
:::

这里介绍两种方法来创建新的Dialog弹窗：
1. 创建新的组件(内嵌Dialog)
2. 继承Dialog生成新的Dialog

## 创建新的组件(内嵌Dialog)

步骤：
1. 编写组件
2. 编写模板

### 编写组件

1. 编写新的组件
2. 导入Dialog、将Dialog添加到组件的子组件中。

```javascript new_dialog.js
/** @odoo-module **/

import { Dialog } from "@web/core/dialog/dialog";
import { useChildRef } from "@web/core/utils/hooks"
import { Component } from "@odoo/owl";

export class NewDialog extends Component{

    setup(){
        this.modalRef = useChildRef();
    }

}

NewDialog.template = 'NewDialog';
NewDialog.components = { Dialog };
// 设计需要传递的参数
NewDialog.props = {
    close: Function,
    title: {
        validate: (m) => {
            return (
                typeof m === "string" || (typeof m === "object" && typeof m.toString === "function")
            );
        },
        optional: true,
    },
}

```

### 编写模板

```xml title="new_dialog.xml"
<?xml version="1.0" encoding="UTF-8" ?>
<templates xml:space="preserve">

    <t t-name="NewDialog" owl="1">
        <Dialog size="'md'" title="props.title" modalRef="modalRef">
            New Dialog
        </Dialog>
    </t>

</templates>
```

### 使用Dialog

这里通过[自定义界面](/odoo/dev_notes/front-end/owl_custom_page_simple.md)来调用创建的Dialog弹窗。

在NewComponent的组件中添加以下代码：
```xml
<?xml version="1.0" encoding="UTF-8" ?>
<templates xml:space="preserve">

    <t t-name="NewComponent" owl="1">
        <div class="container">
            <div class="row">
                <div>
                    New Component
                </div>
                <!-- 此处添加按钮，点击按钮调用Dialog弹窗 -->
                <div>
                    <button t-on-click="onCallDialog">Click Me</button>
                </div>
                <!-- 此处添加按钮，点击按钮调用Dialog弹窗 -->
            </div>
        </div>
    </t>

</templates>
```

```javascript
import { useOwnedDialogs } from "@web/core/utils/hooks";
import { NewDialog } from "./new_dialog";

export class NewComponent extends Component {
    setup(){
        this.useDialog = useOwnedDialogs();
    }
    onCallDialog(){
        this.useDialog(NewDialog, {
            title: "New Component",
        })
    }
}

```

![1](../_images/owl_create_dialog_1.png)

![2](../_images/owl_create_dialog_2.png)

:::tip[Note]
关于Dialog的解析见[文档](odoo/dev_notes/owl_dialog.mdx)
:::

## 继承Dialog生成新的Dialog

**继承Dialog，通过修改Dialog的模板来修改Dialog的内容。**

### extends Dialog

此处示例在header处添加一个icon。调用方式见**[`使用Dialog`](#使用Dialog)**

```javascript
/** @odoo-module **/

import { Dialog } from "@web/core/dialog/dialog";

export class NewDialogExtends extends Dialog{
    // ...
}


NewDialogExtends.template = "NewDialogExtends";
```

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<templates xml:space="preserve">

    <t t-name="NewDialogExtends.header" t-inherit="web.Dialog.header" t-inherit-mode="primary" owl="1">
        <xpath expr="//h4[contains(concat(' ',normalize-space(@class),' '),' modal-title ')]" position="after">
          <i class="fa fa-home ms-2 text-primary"/>
        </xpath>
    </t>

    <t t-name="NewDialogExtends" owl="1" t-inherit="web.Dialog" t-inherit-mode="primary">
        <xpath expr="//t[@t-slot='header']" position="replace">
            <t t-call="NewDialogExtends.header">
                <t t-set="close" t-value="props.close"/>
                <t t-set="fullscreen" t-value="props.isFullscreen"/>
            </t>
        </xpath>
    </t>

</templates>
```

:::warning[Note]
- `t-inherit-mode="primary"`：基于父模板生成新的模板。
- `t-inherit-mode="extension"`：修改父模板。
:::

### 效果图

![3](../_images/owl_create_dialog_3.png)
