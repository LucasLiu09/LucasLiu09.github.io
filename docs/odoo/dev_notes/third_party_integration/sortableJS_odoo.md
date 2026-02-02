---
title: SortableJS-Odoo组件开发
description: SortableJS-Odoo组件开发
sidebar_label: SortableJS-Odoo组件开发
keyword:
    - odoo
    - odoo development
tags: [odoo]
last_update:
  date: 2026/02/02
  author: Lucas
---

# SortableJS 在 Odoo 组件开发（OWL）中的集成指南

:::tip[备注]
本文面向 Odoo Web（OWL）组件开发，讲清楚如何把 SortableJS 安全、稳定地集成进组件，实现“列表拖拽排序”，并在拖拽结束后把新顺序同步回 Odoo 的响应式状态（state）或通过回调交给外层处理。

- [SortableJS 仓库](https://github.com/SortableJS/Sortable)

:::

---

## 1. 适用场景

- **组件内排序**：用户拖拽调整某个列表（字段、列、标签、步骤、卡片……）的显示顺序
- **拖拽后写回状态**：拖拽只是交互，最终要把顺序写回数据（state/store/props 回调）
- **可选持久化**：需要将顺序保存到 localStorage 或后端（由外层决定）

不适用/需要额外处理的场景：

- **超长列表（上千行）**：建议先做虚拟滚动/分页，或只对可见区做拖拽
- **复杂嵌套拖拽**：需要更精细的 `group`、`filter`、`onMove` 控制

---

## 2. 集成的关键原则（OWL 视角）

- **只在 DOM 已存在时初始化**：用 `onMounted` 调用 `Sortable.create(...)`
- **初始化前确保库已加载**：用 `onWillStart` 先加载 SortableJS
- **不要只改 DOM**：拖拽结束必须更新你的数据源（state / 父层回调），否则下一次渲染会把 DOM 顺序“覆盖回去”
- **记得销毁实例**：组件卸载时调用 `sortable.destroy()`，避免内存泄漏与重复绑定

---

## 3. 引入 SortableJS 的两种方式

### 3.1 方式 A：通过 Odoo assets 预加载（推荐用于全局/频繁使用）

把 `Sortable.js` 放进模块静态目录并加入 `__manifest__.py` 的 `web.assets_backend`：

```python
# __manifest__.py（示意）
'assets': {
  'web.assets_backend': [
    'my_module/static/lib/Sortable.js',
    'my_module/static/src/js/**/*.js',
    'my_module/static/src/xml/**/*.xml',
  ],
},
```

优点：
- 首次使用不需要额外异步加载
- 多组件复用时更省事

注意：
- 会增加后台 assets 体积（你应评估是否值得）

### 3.2 方式 B：组件内按需动态加载（推荐用于“只在某处用一下”）

使用 `@web/core/assets` 的 `loadJS`：

```js
import { loadJS } from "@web/core/assets";

onWillStart(async () => {
  await loadJS("/my_module/static/lib/Sortable.js");
});
```

优点：
- 只在需要时加载（更轻）

注意：
- 首次打开该组件会有加载延迟

---

## 4. 最小可用示例（可直接拷贝）

### 4.1 组件 JS（OWL）

```js
/** @odoo-module **/

import { loadJS } from "@web/core/assets";

const { Component, useRef, useState, onWillStart, onMounted, onWillUnmount } = owl;

export class SortableList extends Component {
  setup() {
    this.listRef = useRef("listRef");
    this.state = useState({
      items: [...(this.props.items || [])], // 确保是新数组，便于拖拽后重排
    });

    this.sortable = null;

    onWillStart(async () => {
      // 方式 B：按需加载（如果你用 assets 预加载，这段可以删除）
      await loadJS("/my_module/static/lib/Sortable.js");
    });

    onMounted(() => {
      this.sortable = Sortable.create(this.listRef.el, {
        animation: 150,
        ghostClass: "o_sortable_ghost",
        // 建议增强：
        // handle: ".o_drag_handle",
        // filter: "input, button, a, label",
        onEnd: (evt) => {
          const { oldIndex, newIndex } = evt;
          if (oldIndex == null || newIndex == null || oldIndex === newIndex) return;

          // 关键：同步回 state（让渲染跟随新顺序）
          this.state.items.splice(newIndex, 0, this.state.items.splice(oldIndex, 1)[0]);

          // 可选：通知外层（持久化/提交后端/刷新其他区域）
          if (this.props.onReorder) {
            this.props.onReorder([...this.state.items]);
          }
        },
      });
    });

    onWillUnmount(() => {
      if (this.sortable) {
        this.sortable.destroy();
        this.sortable = null;
      }
    });
  }
}

SortableList.template = "my_module.SortableList";
SortableList.props = {
  items: { type: Array, optional: true },
  onReorder: { type: Function, optional: true },
};
```

### 4.2 组件模板 XML（OWL）

```xml
<?xml version="1.0" encoding="UTF-8"?>
<templates xml:space="preserve">
  <t t-name="my_module.SortableList" owl="1">
    <div class="o_sortable_list" t-ref="listRef">
      <t t-foreach="state.items" t-as="it" t-key="it.id || it">
        <div class="o_sortable_item">
          <!-- 可选：拖拽把手 -->
          <!-- <span class="o_drag_handle">⋮⋮</span> -->
          <t t-esc="it.label || it"/>
        </div>
      </t>
    </div>
  </t>
</templates>
```

### 4.3 建议样式（让拖拽体验更清晰）

```css
.o_sortable_ghost {
  opacity: 0.35;
}
.o_sortable_item {
  user-select: none;
}
.o_drag_handle {
  cursor: grab;
  margin-right: 8px;
}
```

---

## 5. 事件与数据同步策略（最重要的一节）

SortableJS 会改变 DOM 顺序，但 **Odoo/OWL 的 UI 最终由 state 驱动**。因此你应遵循：

- **拖拽结束事件（推荐 `onEnd`）里重排数组**
  - `items.splice(newIndex, 0, items.splice(oldIndex, 1)[0])`
- **必要时通过 props 回调把结果交给父层**
  - 父层决定：写 localStorage、RPC 保存、触发其他组件刷新等

如果你只让 Sortable 改 DOM、不改 state：

- 下一次 OWL 重新渲染会把 DOM 按旧 state 重排回去（看起来像“拖完一闪又回去了”）

---

## 6. 交互体验建议（Odoo UI 常见坑）

### 6.1 checkbox / input 点击会误触拖拽

两种常用解法：

- **`handle`**：只有点击把手才能拖拽（最稳）
- **`filter`**：过滤掉 input/button/a/label 等交互元素

```js
Sortable.create(el, {
  handle: ".o_drag_handle",
  // 或
  filter: "input, button, a, label",
});
```

### 6.2 dropdown / dialog 内的拖拽

dropdown 里拖拽经常遇到：

- 点击导致 dropdown 关闭
- 滚动区域与拖拽冲突

经验：

- dropdown item 使用 “不关闭父层” 的模式（例如 `parentClosingMode="'none'"`）
- 把拖拽区域放在一个明确的容器内（`t-ref` 指向容器）

---

## 7. 常见问题与排查清单

- **报错 `Sortable is not defined`**
  - 说明脚本没加载成功：检查 `loadJS` 路径是否正确、assets 是否打包、网络 404

- **拖拽有效但顺序不持久/刷新即丢**
  - 你只更新了 DOM，没有更新 state / 没有持久化逻辑
  - 在 `onEnd` 里更新数组，并在外层回调里保存（localStorage 或后端）

- **同一组件反复打开后越来越卡**
  - 很可能是 Sortable 实例没有销毁，导致事件重复绑定
  - 在 `onWillUnmount` 调用 `sortable.destroy()`

- **拖拽时文本被选中/点击不灵**
  - 使用 `handle` + 为 item 加 `user-select: none;`（或只对把手禁选）

---

## 8. 进一步阅读（SortableJS 官方）

- [README/Options/Events](https://github.com/SortableJS/Sortable)

