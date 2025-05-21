---
title: disable form view - useEffect(Odoo16)
description: disable form view - useEffect(Odoo16)
sidebar_label: disable form view - useEffect(Odoo16)
keyword:
    - odoo
    - odoo development
tags: [odoo]
last_update:
  date: 2025/5/21
  author: Lucas
---

# disable form view - useEffect(Odoo16)

:::info[Note]
修改FormController，根据自定义逻辑禁止Form View编辑。
:::

```javascript title="form_controller.js"
/** @odoo-module */

import { registry } from "@web/core/registry"
import { formView } from "@web/views/form/form_view"
import { FormController } from "@web/views/form/form_controller"
const { useEffect } = owl

class SaleOrderFormController extends FormController {
    setup(){
        console.log("Sale order form inherited!")
        //this.props.preventEdit = true
        super.setup()

        useEffect(()=>{
            //console.log(this.model.root.data.state)
            this.disableForm()
        }, ()=>[this.model.root.data.state])
        
        // Notebook切换页签时调用，以禁用新页签的内容
        this.onNotebookPageChange = (notebookId, page) => {
            this.disableForm()
        };
    }
    
    get cancelled(){
        return this.model.root.data.state === 'cancel';
    }
    
    // 对字段、input标签添加属性以禁用编辑
    disableForm(){
        const inputElements = document.querySelectorAll(".o_form_sheet input")
        const fieldWidgets = document.querySelectorAll(".o_form_sheet .o_field_widget")

        const cancelled = this.cancelled

        if (cancelled){
            if (inputElements) inputElements.forEach(e => e.setAttribute("disabled", 1))
            if (fieldWidgets) fieldWidgets.forEach(e => e.classList.add("pe-none"))
            this.canEdit = false
        } else {
            if (inputElements) inputElements.forEach(e => e.removeAttribute("disabled"))
            if (fieldWidgets) fieldWidgets.forEach(e => e.classList.remove("pe-none"))
            this.canEdit = true
        }
    }

    async beforeLeave() {
        if (this.cancelled) return
        super.beforeLeave()
    }

    async beforeUnload(ev) {
        if (this.cancelled) return
        super.beforeUnload(ev)
    }
}

const saleOrderFormView = {
    ...formView,
    Controller: SaleOrderFormController,
}

registry.category("views").add("sale_order_form_disable", saleOrderFormView)
```

:::warning[TODO]
考虑以下方式处理：
- 在FormController通过update this.model.root.mode的值来控制是否可编辑。
- 在FormRenderer通过update this.props.record.mode的值来控制是否可编辑。
:::