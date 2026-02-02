---
title: preloadedData 预加载机制(Odoo16)
description: preloadedData 预加载机制(Odoo16)
sidebar_label: preloadedData 预加载机制(Odoo16)
keyword:
    - odoo
    - odoo development
tags: [odoo]
last_update:
  date: 2026/02/02
  author: Lucas
---

# preloadedData 预加载机制（Odoo 16 Web）

:::info
原理、触发时机与自定义编写指南

--本文由AI生成+人工校正。
:::

本文面向“我要自定义一个新字段组件（widget/FieldComponent），并希望在渲染前预加载一些数据（options/候选项/映射表/额外字段等）”的场景，基于 Odoo 16 Web 源码做深度解读，并给出可复制的实现模板。

> 结论先行：**preloadedData 本质是“按字段逐个缓存”的异步数据槽位**，由 `Record.loadPreloadedData()` 统一驱动加载，加载条件由 registry 中的规则决定，加载结果放到 `record.preloadedData[fieldName]`，供你的 FieldComponent 直接读取。

---

## 1. 相关源码入口

（你需要读懂的 3 个点）

### 1.1 registry

** `registry.category("preloadedData")` **

registry 本身是一个分组 Map。`preloadedData` 只是其中一个 category。

- 位置：`library/odoo-16.0/addons/web/static/src/core/registry.js`
- 用法：`registry.category("preloadedData").add(key, info)`

### 1.2 Record 的预加载执行器

** `Record.loadPreloadedData()` **

真正“什么时候加载、怎么缓存、如何决定用哪个 key”的逻辑在新模型 `relational_model.js` 的 `Record` 类里：

- 位置：`library/odoo-16.0/addons/web/static/src/views/relational_model.js`
- 关键成员：
  - `this.preloadedData = {}`
  - `this.preloadedDataCaches = {}`
- 关键方法：`async loadPreloadedData()`

其核心流程（精简但保持语义一致）：

1. 遍历 `activeFields`
2. 对每个字段计算一个 **typeKey**：
   - `typeKey = activeField.widget || this.fields[fieldName].type`
3. 若字段不可见则跳过：`this.isInvisible(fieldName)` 为 true 时不加载
4. 若 registry 中存在该 key（`preloadedDataRegistry.contains(typeKey)`），取出 info 并执行：
   - `loadOnTypes`：再次校验“该规则适用于哪些真实字段类型(`fields[name].type`)”
   - 计算缓存 key（domain + extra）：
     - `domainKey = this.getFieldDomain(fieldName).toList(this.evalContext).toString()`
     - `extraKey = info.extraMemoizationKey?.(record, fieldName) ?? null`
     - `key = JSON.stringify([domainKey, extraKey])`
   - 若缓存 key 变化才真正发起 preload：
     - `this.preloadedData[fieldName] = await info.preload(this.model.orm, this, fieldName)`

### 1.3 触发时机

加载与更新后都会跑一遍

同样在 `relational_model.js`：

- **初次加载**：Record `_load()` 结束时调用：
  - 先 `loadRelationalData()`（many2one/reference/x2many 的基础数据）
  - 再 `loadPreloadedData()`（你的预加载）
- **字段 update 后**：Record `_update()` 末尾会 `proms.push(this.loadPreloadedData())`

这意味着：

- 你的预加载逻辑会在 **进入页面** 时跑一遍；
- 当字段变化、onchange 改变 domain/上下文/可见性时，也会被再次驱动刷新（并受缓存 key 控制避免重复 RPC）。

---

## 2. 预加载 registry 规则对象（info）长什么样？

你需要注册一个对象到 `preloadedData` registry。其形状在实践中就是：

```js
registry.category("preloadedData").add("<typeKey>", {
    loadOnTypes: ["many2one" | "many2many" | "selection" | ...],
    preload: async (orm, record, fieldName) => {
        // return any serializable-ish value
    },
    // 可选：影响缓存 key，用于 domainKey 不足以区分的场景
    extraMemoizationKey: (record, fieldName) => any,
});
```

其中三个字段的含义是：

- **`<typeKey>`**：
  - 优先使用字段在 arch 上的 `widget` 名（如 `widget="selection"`）；
  - 否则回退到真实字段类型（如 `many2one`/`many2many`/`selection`…）。
  - 这就是为什么很多字段组件会把 `preloadedData` 的注册 key 设成自己的 widget 名：例如 `selection`、`radio`、`statusbar`、`many2many_checkboxes`。
- **`loadOnTypes`**：
  - 二次过滤：即使 key 命中，也只有当字段真实类型在这个列表里才会 preload。
  - 典型场景：`widget="selection"` 用在 many2one 上（下拉），但同名 widget 也可能被用在别的类型上；这层可以兜底。
- **`preload(orm, record, fieldName)`**：
  - 你的异步加载函数，返回值会直接塞进 `record.preloadedData[fieldName]`。
- **`extraMemoizationKey(record, fieldName)`（可选）**：
  - 用于把“domain 以外也会影响 options 的因素”纳入缓存 key。
  - 典型例子：statusbar 把 `record.data[fieldName]` 放进 key，确保“当前值变化时，预加载把当前值强行包含进 domain 的特殊逻辑”能刷新。

---

## 3. ORM 调用怎么写：context 怎么带？

预加载函数拿到的 `orm` 是 `ORM` service 实例：

- 位置：`library/odoo-16.0/addons/web/static/src/core/orm_service.js`
- `orm.call(model, method, args, kwargs)` 会自动合并 context：
  - `fullContext = {...user.context, ...kwargs.context}`

因此你在 preload 里建议显式传入 `context: record.evalContext`（或 `record.getFieldContext(fieldName)`，视你的需求）：

```js
const context = record.evalContext;
return await orm.call(model, method, args, { context });
```

---

## 4. 现成例子拆解

（从源码反推最佳实践）

### 4.1 `selection`

many2one 以 `<select>` 渲染的 options

- 文件：`views/fields/selection/selection_field.js`
- preload：`name_search("", domain)`
- 注册：
  - key：`"selection"`（widget 名）
  - `loadOnTypes: ["many2one"]`

结果存放：

- `record.preloadedData[fieldName] = [[id, display_name], ...]`

### 4.2 `radio`

many2one 以 radio 渲染，但 preload 返回的是 `name_get`

`radio_field.js` 的 preload 流程更“重”一点：

1. `searchRead(relation, domain, ["id"])`
2. `name_get([ids])`

这说明 **preloadedData 的返回值完全由你的组件约定**，不强制是 name_search 的结构；只要你的组件知道怎么消费即可。

### 4.3 `statusbar`

带 `extraMemoizationKey` 的例子

`statusbar_field.js`：

- preload 会把当前值的 id OR 进 domain，确保当前值即使不在 domain 里也能显示
- 因为它依赖 `record.data[fieldName]`，所以用 `extraMemoizationKey` 把该值纳入缓存 key，避免“domain 字符串没变但当前值变了”导致不刷新。

---

## 5. 如何在自定义组件中“使用” preloadedData？

你的 FieldComponent（OWL 组件）只需要读取：

```js
const data = this.props.record.preloadedData[this.props.name];
```

建议你做容错：

- 首次渲染时 preload 可能还没返回（虽然 load 流程通常会等它，但更新场景仍可能有短暂间隙）
- 字段可能不可见导致根本不加载

所以建议写成：

```js
const data = this.props.record.preloadedData[this.props.name] || [];
```

---

## 6. 如何“编写一个自定义 preloadedData 逻辑”

下面给出一个可直接复用的模板：做一个 widget `my_widget`，用于 many2one 字段，预加载候选项并带上额外字段（例如 color、code），供你的组件渲染更丰富的选项。

### 6.1 FieldComponent（示意）

```js
/** @odoo-module **/
import { Component } from "@odoo/owl";
import { registry } from "@web/core/registry";
import { standardFieldProps } from "../standard_field_props";

export class MyWidgetField extends Component {
    get items() {
        return this.props.record.preloadedData[this.props.name] || [];
    }
}

MyWidgetField.template = "my_module.MyWidgetField";
MyWidgetField.props = { ...standardFieldProps };
MyWidgetField.supportedTypes = ["many2one"];

registry.category("fields").add("my_widget", MyWidgetField);
```

> 关键点：registry 的 key（`"my_widget"`）通常应与你在 XML 里写的 `widget="my_widget"` 对齐。

### 6.2 preloadedData 注册（重点）

```js
/** @odoo-module **/
import { registry } from "@web/core/registry";

export async function preloadMyWidget(orm, record, fieldName) {
    const field = record.fields[fieldName];
    const relation = field.relation;
    const context = record.evalContext;
    const domain = record.getFieldDomain(fieldName).toList(context);

    // 示例：一次 search_read 拿到你需要的字段
    return await orm.searchRead(relation, domain, ["id", "display_name", "code", "color"], {
        context,
        limit: 80,
    });
}

registry.category("preloadedData").add("my_widget", {
    loadOnTypes: ["many2one"],
    preload: preloadMyWidget,
    // 可选：如果你的 preload 依赖 record 的其它字段，但 domain 并不会变化，
    // 用这个把依赖纳入缓存 key。
    extraMemoizationKey: (record, fieldName) => {
        // 示例：依赖公司/当前值/某个控制字段等
        return {
            currentValue: record.data[fieldName],
            companyId: record.evalContext.current_company_id,
        };
    },
});
```

### 6.3 在视图里使用

```xml
<field name="partner_id" widget="my_widget"/>
```

这样 `Record.loadPreloadedData()` 会用 `activeField.widget === "my_widget"` 命中你的规则，并把结果放到 `record.preloadedData.partner_id`。

---

## 7. 常见坑与建议

（来自源码行为的“硬约束”）

### 7.1 你的规则 key 可能永远匹配不到

`typeKey = activeField.widget || field.type`：

- 如果你只注册了 key=`"many2one"`，但视图上写了 `widget="my_widget"`，那 preloadedData 会用 `"my_widget"` 去查 registry（不会落回 `"many2one"`）。
- 反之，如果你希望“无 widget 时也生效”，可以额外再注册一个 key=`"many2one"` 的规则，或要求用户必须写 widget。

### 7.2 字段不可见时不会 preload

`loadPreloadedData()` 会跳过 `isInvisible(fieldName)` 为 true 的字段。

如果你组件渲染依赖预加载数据，但字段经常在 invisible/visible 之间切换，建议：

- 组件读取时做好 `|| []` 容错；
- 如果可见性切换后需要立刻刷新，依赖 `_update()` 触发的 `loadPreloadedData()` 即可（通常会发生）。

### 7.3 缓存 key 只包含 domain 字符串 + extraKey

默认情况下缓存 key 的第一部分是：

- `getFieldDomain(fieldName).toList(evalContext).toString()`

它能覆盖很多“domain 变化 → options 变化”的常规场景，但有几类情况 **domain 字符串不变也必须刷新**，这时你必须用 `extraMemoizationKey`：

- **preload 依赖当前字段值**（例如 statusbar 会把当前值 OR 进 domain）
- **preload 依赖其它控制字段**（比如 `x_type` 改变后你希望 options 换一批，但 domain 没写在 arch 上）
- **preload 依赖上下文但不体现在 domain**（例如 context 中的某个 key 改变，影响 server 端 name_search 的行为/过滤）
- **preload 依赖 limit/order**（你动态调整 limit 或排序策略）

经验法则：

- **凡是会影响 RPC 结果、但不一定影响 domainKey 的因素，都放进 extraMemoizationKey**。

### 7.4 preload 返回值的“形状”要稳定，并由组件自己约定

`record.preloadedData[fieldName]` 是一个“随你存”的槽位，框架不会帮你做结构转换。

因此建议：

- **返回值结构要固定**（数组 / 对象 / Map-like plain object）
- **组件端要只依赖这一种结构**
- **不要返回带循环引用的对象**（会影响调试/序列化，且不利于复用）

对照现成字段：

- `selection` / `badge_selection`：返回 `name_search` 的 pairs（`[[id, name], ...]`）
- `statusbar`：返回 `search_read` 的 records（`[{id, display_name, ...}, ...]`）
- `radio`：返回 `name_get` 的 pairs（`[[id, name], ...]`），并在组件里做一次 map

### 7.5 性能建议

:::tips
把 preloadedData 当作“轻量缓存”，别当成“完整数据源”
:::

`loadPreloadedData()` 会在加载后、以及每次 `_update()` 后都可能触发（虽然有缓存 key），因此：

- **limit 要可控**（例如 40/80/100 这种量级）
- **字段列表尽量少**（只取渲染所需）
- **尽量复用 name_search / name_get / search_read 的通用能力**
- 如果你的候选数据非常大，考虑改为“按输入搜索”（autocomplete）而不是全量 preload。

---

## 8. 与 legacy specialData 的关系

（什么时候需要关心？）

在 Odoo 16 的新模型里，推荐使用本文的 `preloadedData` registry 机制。

但你可能会在源码里看到某些 FieldComponent 还定义了：

- `MyField.legacySpecialData = "_fetchSpecialRelation"`（或 `_fetchSpecialMany2ones` 等）

这属于 **兼容旧 BasicModel 的 specialData 机制**：

- WOWL 的字段描述在 `views/legacy_utils.js` 会把 `FieldComponent.legacySpecialData` 写进 legacy 的 `fieldsInfo.specialData`
- legacy `basic_model.js` 会按这个字符串调用对应的 `_fetchSpecialXXX` 去 RPC
- 在某些兼容桥接模型里，legacy 的 `specialData` 会再映射为 `record.preloadedData[fieldName]`

你是否需要实现它，取决于你的组件是否必须在 legacy 体系中工作：

- **只给 Odoo 16 新 Web（WOWL）用**：通常不需要写 `legacySpecialData`
- **你明确要兼容 legacy view/legacy widget 加载路径**：才考虑对齐已有的 `_fetchSpecialXXX` 能力（多数情况下直接复用 `_fetchSpecialRelation` 已足够）

---

## 9. 自检清单

（写完后用这 6 条快速确认）

- 你在 `registry.category("fields")` 注册的 key，和 XML 的 `widget="..."` 一致
- 你在 `registry.category("preloadedData")` 注册的 key，和上面的 widget key 一致（或你明确注册了字段类型 key）
- `loadOnTypes` 包含该字段的真实类型（例如 many2one / many2many）
- preload 内部用了正确的 domain/context（通常 `record.getFieldDomain(fieldName).toList(record.evalContext)` + `{context: record.evalContext}`）
- 组件端读取 `record.preloadedData[fieldName]` 时有 `|| []/|| {}` 容错
- 若结果受“domain 以外因素”影响，你实现了 `extraMemoizationKey`

---

## 10. 最小可复制模板

（仅保留必要行）

```js
/** @odoo-module **/
import { registry } from "@web/core/registry";

export async function preloadX(orm, record, fieldName) {
    const field = record.fields[fieldName];
    const context = record.evalContext;
    const domain = record.getFieldDomain(fieldName).toList(context);
    return await orm.call(field.relation, "name_search", ["", domain], { context });
}

registry.category("preloadedData").add("my_widget", {
    loadOnTypes: ["many2one"],
    preload: preloadX,
    // extraMemoizationKey: (record, fieldName) => record.data.some_other_field,
});
```


