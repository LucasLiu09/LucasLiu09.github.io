# html拖拽上传文件

拖拽相关事件

拖拽源事件（被拖拽元素）：
- dragstart - 开始拖拽时触发
- drag - 拖拽过程中持续触发
- dragend - 拖拽结束时触发

拖拽目标事件（接收拖拽的元素）：
- dragenter - 拖拽元素进入目标区域时触发
- dragover - 拖拽元素在目标区域上方移动时持续触发
- dragleave - 拖拽元素离开目标区域时触发
- drop - 在目标区域释放拖拽元素时触发

文件拖拽上传的完整生命周期

1. 拖拽进入 (dragenter) - 文件被拖入上传区域
2. 拖拽悬停 (dragover) - 文件在上传区域上方移动
3. 拖拽离开 (dragleave) - 文件离开上传区域
4. 文件放置 (drop) - 文件被释放到上传区域
5. 文件处理 - 通过 event.dataTransfer.files 获取文件列表
6. 文件上传 - 使用 FileReader 或 FormData 处理上传

关键API

- event.dataTransfer.files - 获取拖拽的文件列表
- event.preventDefault() - 阻止默认行为（必需）
- FileReader - 读取文件内容
- FormData - 构建上传数据

preventDefault() 是一个DOM事件方法，用于阻止浏览器对事件的默认行为。

作用

- 阻止事件的默认处理动作
- 不会阻止事件冒泡（需要用 stopPropagation()）
- 必须在事件处理函数中调用

在拖拽上传中的重要性

默认情况下，浏览器对文件拖拽的默认行为是：
- 在新窗口/标签页中打开文件
- 导航到文件URL
- 下载文件

调用 preventDefault() 后：
- 阻止这些默认行为
- 允许自定义处理拖拽的文件
- 使 drop 事件能够正常触发

示例
```
dropZone.addEventListener('dragover', function(e) {
    e.preventDefault(); // 必须调用，否则drop事件不会触发
});

dropZone.addEventListener('drop', function(e) {
    e.preventDefault(); // 阻止浏览器打开文件
    // 现在可以处理 e.dataTransfer.files
});
```
没有 preventDefault()，拖拽上传功能将无法工作，浏览器会执行默认的文件处理行为。

## odoo源码例子

```javascript
/** @odoo-module */

import { useBus, useService } from '@web/core/utils/hooks';

const { useRef, useEffect, useState } = owl;

export const ExpenseDocumentDropZone = {
    setup() {
        this._super();
        this.dragState = useState({
            showDragZone: false,
        });
        this.root = useRef("root");

        useEffect(
            (el) => {
                if (!el) {
                    return;
                }
                const highlight = this.highlight.bind(this);
                const unhighlight = this.unhighlight.bind(this);
                const drop = this.onDrop.bind(this);
                el.addEventListener("dragover", highlight);
                el.addEventListener("dragleave", unhighlight);
                el.addEventListener("drop", drop);
                return () => {
                    el.removeEventListener("dragover", highlight);
                    el.removeEventListener("dragleave", unhighlight);
                    el.removeEventListener("drop", drop);
                };
            },
            () => [document.querySelector('.o_content')]
        );
    },

    highlight(ev) {
        ev.stopPropagation();
        ev.preventDefault();
        this.dragState.showDragZone = true;
    },

    unhighlight(ev) {
        ev.stopPropagation();
        ev.preventDefault();
        this.dragState.showDragZone = false;
    },

    async onDrop(ev) {
        ev.preventDefault();
        await this.env.bus.trigger("change_file_input", {
            files: ev.dataTransfer.files,
        });        
    },
};

export const ExpenseDocumentUpload = {
    setup() {
        this._super();
        this.actionService = useService('action');
        this.notification = useService('notification');
        this.orm = useService('orm');
        this.http = useService('http');
        this.fileInput = useRef('fileInput');
        this.root = useRef("root");

        useBus(this.env.bus, "change_file_input", async (ev) => {
            this.fileInput.el.files = ev.detail.files;
            await this.onChangeFileInput();
        });
    },

    uploadDocument() {
        this.fileInput.el.click();
    },

    async onChangeFileInput() {
        const params = {
            csrf_token: odoo.csrf_token,
            ufile: [...this.fileInput.el.files],
            model: 'hr.expense',
            id: 0,
        };

        const fileData = await this.http.post('/web/binary/upload_attachment', params, "text");
        const attachments = JSON.parse(fileData);
        if (attachments.error) {
            throw new Error(attachments.error);
        }
        this.onUpload(attachments);
    },

    async onUpload(attachments) {
        const attachmentIds = attachments.map((a) => a.id);
        if (!attachmentIds.length) {
            this.notification.add(
                this.env._t('An error occurred during the upload')
            );
            return;
        }

        const action = await this.orm.call('hr.expense', 'create_expense_from_attachments', ["", attachmentIds]);
        this.actionService.doAction(action);
    },
};

```
