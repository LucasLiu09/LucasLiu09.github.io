---
title: Selection Field 扩展
description: Selection Field 扩展
sidebar_label: Selection Field 扩展
keyword:
  - odoo
  - odoo development
tags:
  - odoo
last_update:
  date: 2026/02/05
  author: Lucas
---
# Selection field扩展

:::info[Note]
对Selection字段进行一些功能扩展

- 根据Domain动态隐藏选项
:::

## 根据Domain动态隐藏选项

- **SelectionHideOptions**: [Github](https://github.com/LucasLiu09/odoo-module-lucas/tree/16.0/Non_module/selection_hide_options)

本文说明自定义字段组件 `selection_hide_options`（基于 Odoo 16 Web / OWL），用于 **按 domain 条件动态隐藏 selection 的部分选项**，并用它作为例子讲解 `Dropdown` 的常见用法。

### 组件做什么

- **适用字段类型**：仅支持 `selection`。
- **核心能力**：根据视图里传入的 `options.options_hide` 配置，结合当前 `record.evalContext` 计算 domain；若满足条件，则把配置里 `hide_list` 对应的选项 value 隐藏掉。
- **交互形态**：可编辑态不是 `<select>`，而是 Odoo Core 的 `Dropdown + DropdownItem`，toggler 使用一个只读 `<input>` 来展示当前 label。

### 使用方式

在视图中给 selection 字段指定 widget，并通过 `options` 传入隐藏规则：

```xml
<field name="my_selection"
       widget="selection_hide_options"
       options="{
         'options_hide': [
           {
             'hide_domain': [('type', '=', 'dev')],
             'hide_list': ['bug']
           }
         ]
       }"/>
```

#### `options_hide` 配置结构

`options_hide` 是一个列表，每个元素是一个对象，固定包含两个 key：

- **`hide_domain`**：domain 表达式（数组形式），用于判断“当前记录是否需要隐藏某些选项”。
- **`hide_list`**：要隐藏的选项值列表（即 selection 的 **value**，不是 label）。

当 `options_hide` 中存在多个对象时：

- 组件会对所有 `hide_domain` 为真的对象取出其 `hide_list`
- 最终把这些列表合并并去重，得到本次要隐藏的 option value 集合

#### 注意点（很关键）

- **`hide_list` 的类型要与 selection value 一致**：如果你的 selection value 是字符串（常见），就传字符串；如果是数字，就传数字。类型不一致时，`includes` 判断会失败，导致不会隐藏。
- **domain 的计算上下文**：使用的是 `props.record.evalContext`。也就是说，domain 里引用的字段值、上下文变量，应当能在该 evalContext 中解析到。

### 逻辑解析（JS）

#### 1) props 解析：从 `<field options=...>` 注入到组件

组件通过 `extractProps` 读取 arch 上的 `options_hide`：

- `SelectionFieldHideOptions.extractProps = ({ attrs }) => ({ OptionsHideConditions: attrs.options.options_hide })`

因此在视图上必须保证 `options` 里存在 `options_hide`（至少是空数组），否则 `OptionsHideConditions` 可能为 `undefined`（该 props 是 optional）。

#### 2) 初始化：加载选项、计算隐藏项、设置显示文本

`setup()` 里调用 `this.load(this.props)`，`load(props)` 做三件事：

- `getHideOptions(props)`：根据 domain 计算当前要隐藏哪些值
- `setOptions(props)`：从 `record.fields[name].selection` 取原始 options，并过滤掉 value 为 `false` 或 label 为空字符串的项
- `setString(props.value)`：把当前值映射成人类可读 label，存到 `state.string` 用于显示

组件还用 `useEffect(() => this.setString(val), () => [this.props.value])` 监听 `value` 变化来刷新显示文本。

#### 3) 隐藏规则计算：`getHideOptions`

当 `OptionsHideConditions` 存在且非空：

1. 过滤出 `evalDomain(condition.hide_domain, props.record.evalContext)` 为真的条件项
2. 把命中的 `hide_list` 收集起来并 `flat()`
3. `new Set(...)` 去重，写入 `state.hideOptions`

否则清空 `state.hideOptions`。

对应判断函数：

- `isHide(optionValue) { return this.state.hideOptions.includes(optionValue); }`

#### 4) 为什么要在展开前刷新：`beforeOpen`

组件把 `beforeOpen` 绑定给 `Dropdown`，在下拉展开前重新计算一次隐藏项：

- 用户在表单里可能先改了其它字段（影响 `evalContext`）
- 但下拉未展开时不一定需要实时计算
- 因此选择在“即将打开下拉”这个时机刷新隐藏集，避免显示过期选项

> 备注：源码里 `onWillUpdateProps` 被注释掉了，因此 **隐藏条件变化并不会自动触发重新 load**；当前策略主要依赖 “打开下拉前刷新隐藏列表” 来保证正确性。

### 模板解析（XML）

#### 1) readonly 模式

`props.readonly` 为真时只渲染：

- `<span t-esc="state.string" t-att-raw-value="value" />`

其中 `raw-value` 绑定原始 value，便于调试或被外部脚本读取。

#### 2) 可编辑模式：Dropdown + 输入框 toggler

可编辑态渲染为：

- `Dropdown`：外层容器
  - `beforeOpen.bind="beforeOpen"`：展开前刷新隐藏项
  - `togglerClass="'btn btn-secondary py-0'"`：给 toggler 外层加按钮样式
- `toggler slot`：里面放一个只读 `<input>`，用于展示当前 `state.string`
- `DropdownItem` 列表：
  - 若字段 **不是必填**（`!isRequired`），先渲染一个“清空值”的空项：`onSelected(false)`
  - 遍历 `state.options`，用 `t-if="!isHide(option[0])"` 过滤掉要隐藏的项

### 使用示例：按公司代码隐藏选项

假设 `my_selection` 的 selection 候选中，值为 `'bug'` 的选项在`type`类别为 `dev` 时不可见：

```xml
<field name="type"/>
<field name="my_selection"
       widget="selection_hide_options"
       options="{
         'options_hide': [
           {
             'hide_domain': [('type', '=', 'dev)],
             'hide_list': ['bug']
           }
         ]
       }"/>
```

效果：

- 当 `type` 类别等于 `dev`：下拉里不会出现 value 为 `'bug'` 的那一项
- 否则：该项正常显示

### 用这个组件讲清 `Dropdown` 的用法

Odoo 16 的 `Dropdown`/`DropdownItem` 是一套通用下拉组件（不局限于字段），常见要点如下。

#### 1) `Dropdown` 的三个关键点

- **toggler slot**：你需要提供“触发器”的 DOM（按钮、输入框、图标等）。本组件用只读 `<input>` 作为 toggler，使其看起来像字段输入框。
- **`beforeOpen` 钩子**：适合在下拉展开前准备数据（刷新候选项、重新计算可见性、按需 RPC 等）。本组件在这里重算隐藏规则。
- **样式类**：通过 `togglerClass`（以及 `Dropdown` 的 class）控制外观。本组件把 toggler 包成 `btn btn-secondary py-0`，再在 slot 内放 `o_input` 来贴近表单输入观感。

对应模板骨架（与源码一致的写法）：

```xml
<Dropdown togglerClass="'btn btn-secondary py-0'"
          beforeOpen.bind="beforeOpen">
  <t t-set-slot="toggler">
    <input class="o_input text-start"
           readonly="true"
           type="text"
           t-att-value="state.string"/>
  </t>

  <!-- 下拉内容 -->
  <DropdownItem t-esc="'选项A'" onSelected="() => doSomething('A')" />
  <DropdownItem t-esc="'选项B'" onSelected="() => doSomething('B')" />
</Dropdown>
```

#### 2) `DropdownItem`：用 `onSelected` 承接点击行为

`DropdownItem` 的关键是 `onSelected` 回调：

- 选中某项时执行你传入的函数
- 在字段组件里通常就是调用 `props.update(value)` 写回记录

本组件里：

- 清空项：`onSelected="() => this.onSelected(false)"`
- 普通项：`onSelected="() => this.onSelected(option[0])"`

#### 3) 在下拉里做条件渲染（隐藏/禁用）

这里用 `t-if` 直接不渲染隐藏项：

- `t-if="!isHide(option[0])"`

如果你想做“禁用但仍可见”的效果，一般会改为渲染但加上禁用样式/属性（具体取决于你的交互规范与 `DropdownItem` 支持的 props/slot 约定）。

