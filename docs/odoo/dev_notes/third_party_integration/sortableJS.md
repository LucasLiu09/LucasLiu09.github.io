---
title: SortableJS
description: SortableJS(用于可重新排序的拖放列表的 JavaScript 库)
sidebar_label: SortableJS
keyword:
    - odoo
    - odoo development
tags: [odoo]
last_update:
  date: 2026/02/02
  author: Lucas
---

# SortableJS 基础使用指南

:::tip[备注]
本文面向“第一次上手 SortableJS”的场景，覆盖：安装/引入、创建实例、常用配置、事件、方法、持久化（store）、常见问题与最佳实践。

- 项目仓库：`https://github.com/SortableJS/Sortable`
- Demo：`http://sortablejs.github.io/Sortable/`

:::

---

## 1. 什么是 SortableJS

SortableJS 是一个用于**列表拖拽排序**的轻量 JS 库，基于原生 HTML5 Drag & Drop，支持：

- **同一列表内排序**（reorder）
- **列表间拖拽**（group）
- **动画/占位样式**（animation/ghostClass 等）
- **触摸设备**（移动端）
- **插件**（如 AutoScroll、MultiDrag、Swap 等，取决于你引入的构建版本）

---

## 2. 安装与引入

### 2.1 NPM 安装（推荐）

```bash
npm i sortablejs
```

ESM 引入示例：

```js
import Sortable from "sortablejs";
// 或更细的构建版本（取决于你的构建/插件需求）
// import Sortable from "sortablejs/modular/sortable.core.esm.js";
```

### 2.2 CDN 引入（快速验证）

```html
<script src="https://cdn.jsdelivr.net/npm/sortablejs@latest/Sortable.min.js"></script>
```

引入后会得到全局变量 `Sortable`。

---

## 3. 最小可用示例（创建一个可排序列表）

HTML：

```html
<ul id="items">
  <li class="item">A</li>
  <li class="item">B</li>
  <li class="item">C</li>
</ul>
```

JS：

```js
const el = document.getElementById("items");
Sortable.create(el, {
  animation: 150,
  draggable: ".item",
});
```

---

## 4. 常用配置项（Options）

下面是日常最常用的一组配置（不追求覆盖全部）：

- **`animation`**：拖拽移动时的动画时长（ms），如 `100/150`
- **`ghostClass`**：拖拽占位（ghost）元素的 class
- **`chosenClass`**：被选中（开始拖拽前）元素的 class
- **`dragClass`**：正在拖拽中的元素 class
- **`draggable`**：可拖拽 item 的选择器（如 `.item`），强烈建议显式设置
- **`handle`**：拖拽把手选择器（如 `.my-handle`），避免“点哪里都能拖”影响点击交互
- **`filter`**：禁止触发拖拽的元素选择器（如 `.no-drag, input, a`）
- **`preventOnFilter`**：filter 命中时是否 `preventDefault()`（默认 `true`）
- **`group`**：跨列表拖拽（同名 group 才能互拖），可用字符串或对象
- **`disabled`**：禁用排序
- **`delay` / `delayOnTouchOnly`**：延迟触发拖拽（移动端防误触常用）
- **`forceFallback`**：强制使用 fallback（统一桌面/移动端体验时可能会用）

示例：

```js
Sortable.create(el, {
  animation: 120,
  draggable: ".item",
  handle: ".drag-handle",
  filter: "input, a, button",
  ghostClass: "sortable-ghost",
  chosenClass: "sortable-chosen",
});
```

---

## 5. 事件（Events）：在拖拽结束时更新数据

SortableJS 的核心是 DOM 排序；你的业务一般还需要“把新顺序写回数据模型”。最常用事件：

- **`onEnd(evt)`**：拖拽结束（最常用）
- **`onUpdate(evt)`**：同列表内顺序变化
- **`onAdd(evt)`**：从其他列表拖入
- **`onRemove(evt)`**：拖出到其他列表
- **`onChoose/onStart/onUnchoose`**：拖拽生命周期

`evt` 里常用字段：

- `evt.oldIndex`：旧索引（在原列表中的位置）
- `evt.newIndex`：新索引（在目标列表中的位置）
- `evt.from` / `evt.to`：源列表/目标列表 DOM
- `evt.item`：被拖拽的 DOM 元素

典型“数组重排”逻辑（同列表内）：

```js
function arrayMove(arr, from, to) {
  arr.splice(to, 0, arr.splice(from, 1)[0]);
  return arr;
}

Sortable.create(el, {
  onEnd(evt) {
    arrayMove(data, evt.oldIndex, evt.newIndex);
    // TODO: 触发渲染或提交后端
  },
});
```

---

## 6. 方法（Methods）

常用方法：

- **`Sortable.get(el)`**：获取某个 DOM 上绑定的 Sortable 实例
- **`sortable.option(name, value?)`**：读/写配置
- **`sortable.toArray()`**：按 `data-id`（或 `dataIdAttr`）导出顺序数组
- **`sortable.sort(order, useAnimation?)`**：按给定顺序重排 DOM
- **`sortable.destroy()`**：销毁实例

示例：使用 `data-id` 持久化顺序：

```html
<ul id="items">
  <li class="item" data-id="a">A</li>
  <li class="item" data-id="b">B</li>
  <li class="item" data-id="c">C</li>
</ul>
```

```js
const sortable = Sortable.create(el, { dataIdAttr: "data-id" });
const order = sortable.toArray(); // ["a","b","c"]
sortable.sort(order.reverse(), true);
```

---

## 7. 顺序持久化（Store）

SortableJS 提供 `store` 钩子帮助保存/恢复排序（示例常见于 localStorage）：

```js
Sortable.create(el, {
  dataIdAttr: "data-id",
  store: {
    get(sortable) {
      const order = localStorage.getItem("my_sort_order");
      return order ? order.split("|") : [];
    },
    set(sortable) {
      const order = sortable.toArray();
      localStorage.setItem("my_sort_order", order.join("|"));
    },
  },
});
```

注意：`store` 只处理“顺序”，不处理你的业务数据一致性；如果你的列表渲染由框架驱动（React/Vue/Owl），仍然建议在事件里更新数据源，以避免下一次重渲染把 DOM 顺序覆盖回去。

---

## 8. 常见问题与最佳实践

### 8.1 “点击/勾选也会触发拖拽”

优先用：

- **`handle`**：只允许拖拽把手区域
- **`filter`**：禁用 input/button/a 等

### 8.2 框架渲染的列表，DOM 顺序会被覆盖

正确做法：在 `onEnd/onUpdate` 里把新顺序写回数据源（state/store），让框架用新顺序重新渲染。

### 8.3 需要跨列表拖拽

两边设置相同 `group`：

```js
Sortable.create(listA, { group: "shared" });
Sortable.create(listB, { group: "shared" });
```

更复杂的“可拉取/可放入/克隆”行为用对象形式（详见仓库 README）。

### 8.4 样式建议

通常你至少需要给 ghost/chosen 设置一个明显的样式，例如：

```css
.sortable-ghost { opacity: 0.35; }
.sortable-chosen { background: #f5f7ff; }
```

---

## 9. 进一步阅读

- SortableJS README（选项、事件、插件更完整）：`https://github.com/SortableJS/Sortable`

