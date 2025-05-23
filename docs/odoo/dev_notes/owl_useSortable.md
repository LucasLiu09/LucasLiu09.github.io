---
title: 元素可拖拽 - useSortable
description: 将元素设置为可拖拽
sidebar_label: 元素可拖拽 - useSortable
keyword:
    - odoo
    - odoo development
tags: [odoo]
last_update:
  date: 2025/5/23
  author: Lucas
---

# 元素可拖拽 - useSortable

:::info[Note]
通过`useSortable`，可以将元素设置为可拖拽。

--version: 16
:::

## import

```javascript
import { useSortable } from "@web/core/utils/sortable";
```

## 使用示例及解析

以Odoo原生的`export_data_dialog`为例，说明如何使用`useSortable`。

`export_data_dialog`的模板代码如下(仅截取相关片段)：
```xml title="addons/web/static/src/views/view_dialogs/export_data_dialog.xml"
<div class="o_right_field_panel h-100 px-2 overflow-auto border">
    <ul class="o_fields_list list-unstyled" t-ref="draggable">
        <t t-foreach="state.exportList" t-as="field" t-key="field.id">
            <li t-attf-class="o_export_field {{ state.isSmall ? '' : 'o_export_field_sortable' }}" t-att-data-field_id="field.id">
                <span t-if="!state.isSmall" class="fa fa-sort o_sort_field mx-1" t-attf-style="opacity:{{ state.exportList.length === 1 ? 0 : 1 }}" />
                <span t-esc="isDebug and field.id ? `${field.string} (${field.id})` : field.string" />
                <span class="fa fa-trash m-1 pe-2 float-end o_remove_field cursor-pointer" t-att-title="removeFieldText" t-on-click.stop="() => this.onRemoveItemExportList(field.id)" />
            </li>
        </t>
    </ul>
</div>
```

`export_data_dialog`的JavaScript代码如下(仅截取相关片段)：
```javascript title="addons/web/static/src/views/view_dialogs/export_data_dialog.js"
export class ExportDataDialog extends Component {
    setup(){
        this.draggableRef = useRef("draggable");
        
        this.state = useState({
            exportList: [],
            isCompatible: false,
            isEditingTemplate: false,
            search: [],
            selectedFormat: 0,
            templateId: null,
            isSmall: this.env.isSmall,
            disabled: false,
        });
        
        useSortable({
            // Params
            ref: this.draggableRef,
            elements: ".o_export_field",
            enable: !this.state.isSmall,
            cursor: "grabbing",
            // Hooks
            onDrop: async ({ element, previous, next }) => {
                const indexes = [element, previous, next].map(
                    (e) =>
                        e &&
                        Object.values(this.state.exportList).findIndex(
                            ({ id }) => id === e.dataset.field_id
                        )
                );
                let target;
                if (indexes[0] < indexes[1]) {
                    target = previous ? indexes[1] : 0;
                } else {
                    target = next ? indexes[2] : this.state.exportList.length - 1;
                }
                this.onDraggingEnd(indexes[0], target);
            },
        });
    }
    
    onDraggingEnd(item, target) {
        this.state.exportList.splice(target, 0, this.state.exportList.splice(item, 1)[0]);
    }
}
```

1. `ref`: 在template中，对需要使用拖拽功能的根元素上添加`t-ref`属性，并传入`useSortable`的`ref`参数。
2. `elements`: 指定class包含o_export_field的element作为可以拖拽的元素。
3. `enable`: 设置在小屏幕时，禁用拖拽功能。
4. `cursor`: 设置拖拽过程中光标的样式。
5. `onDrop`: 当拖拽释放时，更新this.state.exportList的顺序。 
   1. 通过`Object.values(this.state.exportList)`获取this.state.exportList中的所有元素，并使用`findIndex`方法获取当前元素在this.state.exportList中的索引。
   2. 根据当前元素与相邻元素的位置关系，决定目标位置 target。
   3. 通过`this.state.exportList.splice(target, 0, this.state.exportList.splice(item, 1)[0])`将当前元素移动到目标位置。

(代码中出现的`e.dataset.field_id`，是模板中`t-att-data-field_id`属性的值)

## 解析

`useSortable`实际是解构默认值实现参数可选化的工具函数，其实际调用了`makeDraggableHook`函数。

```javascript
import { makeDraggableHook } from "@web/core/utils/draggable_hook_builder";
```

### useSortable参数(SortableParams)

```javascript
/**
 * @typedef SortableParams
 *
 * 必填参数
 *
 * @property {{ el: HTMLElement | null }} ref 引用对象(通常用useRef对象)
 * @property {string} elements 定义可排序元素的选择器
 *
 * 可选参数
 *
 * @property {boolean | () => boolean} [enable] 是否启用排序系统
 * @property {string | () => string} [groups] 定义可排序元素的父级分组。
 *  这允许添加`onGroupEnter`和`onGroupLeave`回调，用于在拖拽过程中操作分组元素。
 * @property {string | () => string} [handle] 额外的选择器，用于指定必须通过拖拽元素的特定部分来启动拖拽序列
 * @property {string | () => string} [ignore] 目标选择器，用于指定哪些元素必须触发拖拽
 * @property {boolean | () => boolean} [connectGroups] 元素是否可以在不同的父级分组之间拖拽。
 *  注意：需要设置`groups`参数才能生效
 * @property {string | () => string} [cursor] 拖拽过程中光标的样式
 *
 * 事件处理器（也是可选的）
 *
 * @property {({ element: HTMLElement, group: HTMLElement | null }) => any} [onDragStart]
 *  当拖拽序列开始时调用
 * @property {({ element: HTMLElement }) => any} [onElementEnter] 当光标进入另一个可排序元素时调用
 * @property {({ element: HTMLElement }) => any} [onElementLeave] 当光标离开另一个可排序元素时调用
 * @property {({ group: HTMLElement }) => any} [onGroupEnter] （如果指定了`groups`参数）：
 *  当光标进入另一个分组元素时调用
 * @property {({ group: HTMLElement }) => any} [onGroupLeave] （如果指定了`groups`参数）：
 *  当光标离开另一个分组元素时调用
 * @property {({ element: HTMLElement group: HTMLElement | null }) => any} [onDragEnd]
 *  当拖拽序列结束时调用（无论何种原因）
 * @property {(params: DropParams) => any} [onDrop] 当拖拽序列以鼠标释放动作结束，
 *  且被拖拽元素已被移动到其他位置时调用。回调函数将接收一个包含拖拽元素新位置相关信息的对象
 *  （参见DropParams）。
 */

/**
 * @typedef DropParams
 * @property {HTMLElement} element 被拖拽的元素
 * @property {HTMLElement | null} group 当前所属分组
 * @property {HTMLElement | null} previous 拖拽释放时的前一个相邻元素
 * @property {HTMLElement | null} next 拖拽释放时的后一个相邻元素
 * @property {HTMLElement | null} parent 拖拽释放时的父级元素
 */

/**
 * @typedef SortableState
 * @property {boolean} dragging 是否正在拖拽
 */

/** @type {(params: SortableParams) => SortableState} */
```

### makeDraggableHook参数(hookParams)

```javascript
/**
 * @param {DraggableBuilderParams} hookParams
 * @returns {(params: Record<any, any>) => { dragging: boolean }}
 */
export function makeDraggableHook(hookParams = {}) {
    // ...
}
```

```javascript
/**
 * @typedef DraggableBuilderParams
 *
 * Hook 参数
 * @property {string} [name="useAnonymousDraggable"] 名称（默认为 "useAnonymousDraggable"）
 * @property {EdgeScrollingOptions} [edgeScrolling] 边缘滚动选项
 * @property {Record<string, string[]>} [acceptedParams] 可接受的参数列表（键值对形式）
 * @property {Record<string, any>} [defaultParams] 默认参数（键值对形式）
 *
 * 构建处理器
 * @property {(params: DraggableBuilderHookParams) => any} onComputeParams 计算参数时的回调
 *
 * 运行时处理器
 * @property {(params: DraggableBuilderHookParams) => any} onWillStartDrag 即将开始拖拽时的回调
 * @property {(params: DraggableBuilderHookParams) => any} onDragStart 拖拽开始时的回调
 * @property {(params: DraggableBuilderHookParams) => any} onDrag 拖拽过程中的回调
 * @property {(params: DraggableBuilderHookParams) => any} onDragEnd 拖拽结束时的回调
 * @property {(params: DraggableBuilderHookParams) => any} onDrop 拖拽释放时的回调
 * @property {(params: DraggableBuilderHookParams) => any} onCleanup 清理时的回调
 */
```