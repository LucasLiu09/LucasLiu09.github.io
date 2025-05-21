---
title: 设置FormController刷新或离开页面不自动保存。(Odoo16)
description: 设置FormController刷新或离开页面不自动保存。(Odoo16)
sidebar_label: 设置FormController刷新或离开页面不自动保存。
keyword:
    - odoo
    - odoo development
tags: [odoo]
last_update:
  date: 2025/5/21
  author: Lucas
---

# 设置FormController刷新或离开页面不自动保存。(Odoo16)

:::info[Note]
在Form视图中，离开页面或页面刷新时，不自动保存单据。
:::


在Odoo16中，由于小版本的差异需要差异化处理，需查看`addons/web/static/src/views/form/form_controller.js`文件，如果以下`useSetupView`的版本为`beforeLeave: () => this.beforeLeave()`,则直接重写this.beforeLeave方法。

否则，在`onRendered`中调用`this.env.__beforeLeave__.remove(this)`。

```javascript
useSetupView({
    rootRef,
    // highlight-next-line
    beforeLeave: () => this.beforeLeave(),
    beforeUnload: (ev) => this.beforeUnload(ev),
    getLocalState: () => {
        // TODO: export the whole model?
        return {
            activeNotebookPages: !this.model.root.isNew && activeNotebookPages,
            resId: this.model.root.resId,
        };
    },
});
```

```javascript title="patch_form_controller.js"
/** @odoo-module **/

import { FormController } from "@web/views/form/form_controller"

import { patch } from "@web/core/utils/patch";

patch(FormController.prototype, "do_not_auto_save", {
  setup() {
    this._super(...arguments);
    
    // highlight-start
    // 旧版本需要在此处调用this.env.__beforeLeave__.remove(this). 
    // Odoo官方更新后可以直接修改beforeLeave()
    onRendered(() => {
        this.env.config.setDisplayName(this.displayName());
        this.env.__beforeLeave__.remove(this)   // 离开页面不保存, 避免直接跳过额外处理的逻辑。
    });
    // highlight-end
  },
    
  // highlight-start
  // 离开页面
  // 注释或删除代码取消save
  async beforeLeave() {
        // if (this.model.root.isDirty) {
        //     return this.model.root.save({
        //         noReload: true,
        //         stayInEdition: true,
        //         useSaveErrorDialog: true,
        //     });
        // }
  },
  // highlight-end
    
  // highlight-start
  // 页面刷新
  // 注释或删除代码取消save
  async beforeUnload(ev) {
        // const isValid = await this.model.root.urgentSave();
        // if (!isValid) {
        //     ev.preventDefault();
        //     ev.returnValue = "Unsaved changes";
        // }
  }
  // highlight-end
    
});

```