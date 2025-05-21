---
title: FormView根据字段值设置Record只读(Odoo16)
description: FormView根据字段值设置Record只读(Odoo16)
sidebar_label: FormView根据字段值设置Record只读(Odoo16)
keyword:
    - odoo
    - odoo development
tags: [odoo]
last_update:
  date: 2025/5/21
  author: Lucas
---

# FormView根据字段值设置Record只读(Odoo16)

:::info[Note]
FormView根据字段值设置Record只读，通过在字段中设置domain值来实现由domain来控制Record是否只读。
:::

**<font style={{color: 'red'}}>以下仅提供思路，并非可直接用于项目。</font>**

根据模型的readonly_domain字段，设置表单的只读属性。

比如：`readonly_domain = fields.Char(string='只读域', default="[('sq_state','!=','draft')]")`，

表示当`sq_state`字段的值不等于"draft"时，表单只读。

注意：需要使用该功能的表单，需要在表单中添加`readonly_domain`字段。

```javascript title="form_controller.js"
/** @odoo-module **/

import { patch } from "@web/core/utils/patch";
import { FormController } from "@web/views/form/form_controller";
import { evalDomain } from "@web/views/utils";
import { onRendered } from "@odoo/owl";

const PatchFormObjectReadonly = {
  setup() {
    this._super(...arguments);
    onRendered(() => {
      if (this.model.root.data.readonly_domain){
        const readonly_domain = this.model.root.data.readonly_domain;
        const domain = evalDomain(readonly_domain, this.model.root.evalContext);
        if (domain) {
          this.model.root.mode = "readonly";
        }else {
          this.model.root.mode = "edit";
        }
      }
      this.env.config.setDisplayName(this.displayName());
    });
  },
};
patch(FormController.prototype, "form_readonly_patch", PatchFormObjectReadonly);
```

```javascript title="form_renderer.js"
/** @odoo-module **/

import { patch } from "@web/core/utils/patch";
import { FormRenderer } from "@web/views/form/form_renderer";
import { evalDomain } from "@web/views/utils";

patch(FormRenderer.prototype, "based_on_state_readonly_form", {
    setup() {
        this._super(...arguments);
        // 如果this.props.record.data包含readonly_domain属性
        // 则根据readonly_domain属性的值，判断是否进入readonly模式
        if (this.props.record.data.readonly_domain) {
            const readonly_domain = this.props.record.data.readonly_domain;
            const domain = evalDomain(readonly_domain, this.props.record.model.root.evalContext);
            if (domain) {
                this.props.record.mode = "readonly";
            }
        }
    },
})
```