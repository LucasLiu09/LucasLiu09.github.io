---
title: 文件预览 - fileViewer(Odoo17、18)
description: fileViewer(Odoo17、18)
sidebar_label: 文件预览 - fileViewer(Odoo17、18)
keyword:
    - odoo
    - odoo development
tags: [odoo]
last_update:
  date: 2026/3/30
  author: Lucas
---

# 文件预览 - fileViewer(Odoo17、18)

:::info[Note]
Odoo17、18 原生组件`FileViewer`，支持预览图片、视频、音频、pdf、txt等文件。
:::

系统自带的场景为oe_chatter侧栏中的附件(`Component:AttachmentList`)，可单击预览。

Hook: `useFileViewer`

可以通过调用`useFileViewer().open()`使用`FileViewer`组件进行文件预览。

```javascript
import { useFileViewer } from "@web/core/file_viewer/file_viewer_hook";
import { FileModel } from "@web/core/file_viewer/file_model";

// 方式一：
// FileViewer通常结合FileModel使用。
// FileViewer.props.files期望的一些元素在FileModel中均有定义。

// 方式二：
// 也可以通过service：mail.store; 例如：addons\product\static\src\js\product_document_kanban\product_document_kanban_record.js
// 但是这个方式必须depends mail模块。
this.store = useService("mail.store");
this.store.Attachment.insert({
    id: f.id,
    filename: f.name,
    name: this.props.name,
    mimetype: f.mimetype,
})
```

:::tip[用法示例]
[GitHub - many2many_binary_field_preview](https://github.com/LucasLiu09/many2many_binary_field_preview/tree/main)
[GitHub - many2many_binary_field_preview_patch_v18](https://github.com/LucasLiu09/odoo18-custom-addons/blob/main/files_preview/static/src/many2many_binary_preview_patch/many2many_binary_preview_patch.js)
:::

**源码**

```javascript title="file_viewer_hook.js"
/* @odoo-module */

import { onWillDestroy } from "@odoo/owl";
import { registry } from "@web/core/registry";
import { FileViewer } from "./file_viewer";

let id = 1;

export function useFileViewer() {
    const fileViewerId = `web.file_viewer${id++}`;
    /**
     * @param {import("@web/core/file_viewer/file_viewer").FileViewer.props.files[]} file
     * @param {import("@web/core/file_viewer/file_viewer").FileViewer.props.files} files
     */
    function open(file, files = [file]) {
        if (!file.isViewable) {
            return;
        }
        if (files.length > 0) {
            const viewableFiles = files.filter((file) => file.isViewable);
            const index = viewableFiles.indexOf(file);
            registry.category("main_components").add(fileViewerId, {
                Component: FileViewer,
                props: { files: viewableFiles, startIndex: index, close },
            });
        }
    }

    function close() {
        registry.category("main_components").remove(fileViewerId);
    }
    onWillDestroy(close);
    return { open, close };
}

```
