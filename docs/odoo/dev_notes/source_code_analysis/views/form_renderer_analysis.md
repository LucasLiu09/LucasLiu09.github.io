---
title: Odoo 16 FormRenderer 源码解析
sidebar_label: FormRenderer
description: Odoo 16 Web 表单视图 FormRenderer（基于 useViewCompiler/FormCompiler 的编译渲染链路，含 Field/ViewButton/Notebook 与 FormController 的回调协作）源码梳理。
tags:
  - odoo
  - odoo-web
slug: /odoo16/web/form/form-renderer
---

# Odoo 16 FormRenderer 源码解析

:::tip
本文由AI生成+人工校正。
:::

## 总览

- **目标文件**：`addons/web/static/src/views/form/form_renderer.js`
- **关联文件（强耦合）**：
  - `addons/web/static/src/views/form/form_compiler.js`（把 form arch 编译成可运行的 OWL 模板，并“注入”与 Controller 协作所需的回调）
  - `addons/web/static/src/views/form/form_controller.xml`（把 `record/archInfo/回调` 绑定给 Renderer）
- **在体系中的角色**：
  - `FormRenderer` 是 **Form View 的渲染层**：它并不“手写 DOM”，而是把 `archInfo.xmlDoc` 当作模板源，交给 `useViewCompiler()` 编译后直接 `t-call` 渲染。
  - 它同时负责一些“运行时体验逻辑”：resize 触发重渲染、自动聚焦、以及在只读态点击内容区域时的“提示进入编辑”的 bounce 引导。

---

## 核心对象概览表

| 名称 | 类型 | 位置 | 职责要点 |
| --- | --- | --- | --- |
| `FormRenderer` | OWL Component | `form_renderer.js` | 编译并渲染 `archInfo.xmlDoc`；提供 `evalDomainFromRecord` 给编译模板使用；处理 resize/autofocus/bounce |
| `FormCompiler` | ViewCompiler 子类 | `form_compiler.js` | 将 form arch 编译为 OWL 组件树（Field/Notebook/ViewButton/...）；并把 Controller 的回调注入到下游组件 props |
| `useViewCompiler()` | hook | `views/view_compiler.js` | 编译缓存：按 `ViewCompiler.name/rawArch` 缓存生成的 OWL 模板，避免重复编译 |

---

## 方法速查表

### FormRenderer

| 方法/属性 | 触发时机/入口 | 逻辑简述 | 与 `FormController` 的关系 |
| --- | --- | --- | --- |
| `setup()` | 组件初始化 | 调 `useViewCompiler(Compiler/FormCompiler, archInfo.arch, {FormRenderer: xmlDoc})` 生成可执行模板；`useSubEnv({model: record.model})`；安装 bounce；监听 resize；处理新建记录 autofocus | 接收 Controller 通过 `form_controller.xml` 传入的 `record/archInfo/Compiler/协作回调` |
| `shouldAutoFocus`（getter） | setup 判断 | `!archInfo.disableAutofocus` | 与 Controller 的“只读态聚焦 primary button”互补 |
| `evalDomainFromRecord(record, expr)` | 编译模板运行时调用 | `evalDomain(expr, record.evalContext)`；供编译器生成的 `t-if`/可见性判断使用 | 让 arch 中的 `modifiers`/domain 依赖 record 评估 |
| `compileParams`（getter） | 传入 `useViewCompiler` | 当前返回 `{}`（为二开编译参数预留） | 若二开需影响编译结果，应考虑缓存粒度（rawArch + compiler 类） |

### FormCompiler

决定“Form 是怎么被编译出来的”

| 方法 | 触发时机/入口 | 逻辑简述 | 与 Controller/Renderer 协作点 |
| --- | --- | --- | --- |
| `setup()` | compiler 初始化 | 注册 form 专属节点编译器（`form/group/header/notebook/sheet/...`）并初始化 label/notebook id 状态 | 决定哪些节点会被替换成组件（Field/Notebook/ViewButton 等） |
| `compile()` | 编译入口 | 调父类编译后，为根节点设置 `t-ref="compiled_view_root"` | Renderer 依此做 autofocus/bounce 与 DOM 定位 |
| `compileButton(el)` | 编译 `<button>/<a type>` | 在父类生成 `ViewButton` 基础上额外注入 `disable/enable` | 注入 `props.disableViewButtons/enableViewButtons` → 连接 `useViewButtons` 管线 |
| `compileField(el)` | 编译 `<field>` | 生成 `<Field .../>` 并处理 label 替换；注入 `setDirty` | 注入 `props.setFieldAsDirty` → 影响 Controller `fieldIsDirty` |
| `compileNotebook(el)` | 编译 `<notebook>` | 生成 `<Notebook/>` 并对每个 `<page>` 生成 slot；绑定 `defaultPage/onPageUpdate`；处理 anchors | `activeNotebookPages/onNotebookPageChange` → Controller 保存/恢复页签 |
| `compileHeader(el)` | 编译 `<header>` | 生成状态栏容器；把按钮收敛进 `<StatusBarButtons/>`（小屏多按钮下拉） | 按钮仍是 `ViewButton`，继续走 `useViewButtons` 执行动作 |
| `compileGroup/compileSheet/compileForm/...` | 编译结构节点 | 把 legacy 结构（group/sheet/form）映射为 `OuterGroup/InnerGroup` 等组件与布局 class | 决定只读/编辑态 class（依赖 `props.record.isInEdition`） |
| `compileWidget(el)` | 编译 `<widget>` | 生成 `<Widget readonly="!props.record.isInEdition"/>` | 只读/编辑态由 record 决定，与 Controller 的 `switchMode` 联动 |

## 关键依赖

| 依赖 | 与本组件关系 | 文件 |
| --- | --- | --- |
| `useViewCompiler` | `FormRenderer.setup()` 用它把 `archInfo.arch+xmlDoc` 编译成 `this.templates`，模板随后用于 `t-call` | `views/view_compiler.js` |
| `FormCompiler` | form 专属编译器：实现 `<form>/<sheet>/<group>/<header>/<notebook>` 等节点的编译与 UI 结构化 | `views/form/form_compiler.js` |
| `Field` | 被编译器生成；`FormCompiler` 注入 `setDirty` 回调后，字段 widget 可上报“本地脏态”给 Controller | `views/fields/field.js` |
| `ViewButton` | 被编译器生成；`FormCompiler` 注入 `disable/enable`，配合 `useViewButtons()` 的动作执行管线 | `views/view_button/view_button.js` |
| `Notebook` | 编译器给它绑定 `defaultPage/onPageUpdate`，实现页签状态持久化 | `core/notebook/notebook` |
| `useBounceButton` | 只读态点击标题/分组区域时触发“catch attention”动效（引导用户进入编辑或关注主要按钮） | `views/view_hook.js` |

---

## `FormRenderer`

编译-渲染流水线

### 1) 输入数据

（由 `FormController` 提供）

`FormRenderer` 的关键 props（来自 `form_controller.xml`）：

- **`record`**：`model.root`（表单正在展示/编辑的 Record）
- **`archInfo`**：`FormArchParser.parse()` 的结果（尤其是 `archInfo.arch` 与 `archInfo.xmlDoc`）
- **`Compiler`（可选）**：默认用 `FormCompiler`（二开可换自定义编译器）
- **协作回调**（由 Controller 传入，编译器会注入到下游组件）：
  - `setFieldAsDirty(dirty)`：字段 widget 上报“字段层面脏态”
  - `enableViewButtons()` / `disableViewButtons()`：动作执行期同步禁用/启用控制器按钮区
  - `onNotebookPageChange(notebookId, page)` / `activeNotebookPages`：页签状态持久化

> 注意：`FormRenderer` 文件本身几乎不直接调用这些回调；它更多是“容器”，真正把回调下发到字段/按钮/notebook 的工作由 `FormCompiler` 完成。

### 2) 编译模板

**`useViewCompiler()`**

在 `setup()` 中：

- 把 `archInfo.xmlDoc` 作为模板源：`templates = { FormRenderer: xmlDoc }`
- 调用：
  - `useViewCompiler(Compiler || FormCompiler, archInfo.arch, templates, this.compileParams)`
- 结果是 `this.templates.FormRenderer` 变成一个 **可执行的 OWL 模板函数**（内部有缓存机制）
- `FormRenderer.template` 固定为：
  - `xml\`<t t-call="{{ templates.FormRenderer }}" />\``

因此渲染过程就是：**运行编译后的模板，并在模板里引用 `props.record/props.archInfo/...`**。

### 3) 编译结果如何拿到 DOM 引用

**`compiled_view_root`**

`FormCompiler.compile()` 会把编译后的根节点设置：

- `compiled.children[0].setAttribute("t-ref", "compiled_view_root")`

这样 `FormRenderer` 就能用 `useRef("compiled_view_root")`：

- 做 autofocus 的 `querySelector`
- 安装 bounce 行为的 “shouldBounce target” 判定

---

## 运行时行为

- resize
- autofocus
- bounce

### resize 重渲染

- `FormRenderer` 用 `useDebounced(this.render, 200)` 生成 `onResize`
- `onMounted()` 时监听 `window.resize`，`onWillUnmount()` 时移除
- 目的：让响应式布局（尤其 sheet/group/notebook）在窗口变化时正确重排

### 自动聚焦（仅在允许时）

- `shouldAutoFocus = !archInfo.disableAutofocus`
- 若开启，会在 effect 中根据 record 是否是新建（`record.isVirtual`）选取焦点元素：
  - 优先 `autofocusFieldId` 指定的字段
  - 否则找 `.o_content .o_field_widget` 内第一个可输入元素（input/textarea/contenteditable）

这与 `FormController` 侧的“只读态聚焦 primary button”是两个层面的体验优化：

- Renderer：偏向新建记录时把光标落到第一个可编辑字段
- Controller：从编辑切回只读且焦点不在内容区时，聚焦主按钮（避免键盘操作丢焦点）

### bounce 引导（只读态点击内容区）

`useBounceButton(ref("compiled_view_root"), shouldBounce)` 的判定：

- 仅当 `!record.isInEdition` 且点击目标位于 `.oe_title` 或 `.o_inner_group` 内
- `useBounceButton` 内部会给 `[data-bounce-button]` 添加/移除 `o_catch_attention`

通常用来引导用户注意某个关键按钮（例如“编辑/保存”类按钮，取决于上层布局放置了哪个 `data-bounce-button`）。

---

## `FormCompiler` 如何把 Renderer/Controller 串起来

### 1) 字段脏态上报

**`Field` ←→ `FormController.state.fieldIsDirty`**

`FormCompiler.compileField()` 注入：

- `field.setAttribute("setDirty.alike", "props.setFieldAsDirty")`

链路含义：

1. 编译后的 `<Field/>` 会拿到 `setDirty` 这个 prop（值是 Controller 的 `setFieldAsDirty`）
2. `Field` 组件会把 `setDirty` 继续传给真正的字段 widget（见 `views/fields/field.js` 的 `fieldComponentProps` 会把 `this.props` 下发）
3. 具体 widget 在“输入但尚未提交/尚未保存”的阶段可调用 `setDirty(true/false)`
4. `FormController` 把这个脏态合并进 `FormStatusIndicator` 的判断：`record.isDirty || fieldIsDirty` 都会显示“需要保存/可丢弃”

这解决的是一个常见 UX 问题：**有些输入状态尚未进入 record 的正式变更集（`record.isDirty`），但用户已经在字段里修改了内容**。

### 2) 视图按钮执行期禁用

**`ViewButton` ←→ `useViewButtons()` ←→ Controller**

`FormCompiler.compileButton()` 覆盖 `ViewCompiler.compileButton()` 的结果，额外注入：

- `disable="props.disableViewButtons"`
- `enable="props.enableViewButtons"`

随后在 `ViewButton.onClick()` 中，这两个回调会作为 `disableAction/enableAction` 交给 `env.onClickViewButton(...)`。

而 `env.onClickViewButton` 正是由 `useViewButtons(this.model, rootRef, ...)` 注入（在 `FormController.setup()` 里调用）。

因此完整链路是：

1. 用户点击由 arch 编译出来的按钮（header/footer 内的 `<button>` / `<a type="action">`）
2. `ViewButton` → `env.onClickViewButton(...)`
3. `useViewButtons`：
  - 先禁用当前视图区域按钮（DOM 禁用）
  - 调用 `disableAction()`（这里指向 Controller 的 `disableButtons()`，更新 `state.isDisabled`）
  - 执行 action / object 方法
  - 最后调用 `enableAction()`（恢复 `state.isDisabled`）

这就是为什么 `form_controller.xml` 里会把 `enableViewButtons/disableViewButtons` 绑定到 Controller：它让“动作执行期 UI 禁用”在 **编译模板生成的按钮** 与 **控制面板按钮/状态指示器** 之间保持一致。

### 3) Notebook 页签状态持久化

**Renderer props ←→ Controller localState**

`FormCompiler.compileNotebook()` 注入：

- `defaultPage="props.record.isNew ? undefined : props.activeNotebookPages[noteBookId]"`
- `onPageUpdate="(page) => this.props.onNotebookPageChange(noteBookId, page)"`

Controller 侧：

- `onNotebookPageChange` 会把 page 写入内部 `activeNotebookPages` map
- `useSetupView.getLocalState()` 会把 `activeNotebookPages` 存进本地状态（并在新建记录时跳过）

结果是：用户切换 notebook 页后，离开/返回表单能回到上次页签。

---

## 二开扩展点与踩坑

- **改 Renderer 不如改 Compiler**：如果你想“在 form arch 编译出来的 Field/Button/Notebook 上挂额外 props / 事件”，优先扩展 `FormCompiler`（注册到 `registry.category("form_compilers")` 或替换 `Compiler`），而不是在 `FormRenderer` 里硬塞逻辑。
- **`useViewCompiler` 的缓存粒度**：缓存 key 是 `ViewCompiler.name/rawArch`。同一段 arch 使用同一个编译器类时会复用模板；如果你依赖“运行时参数影响编译产物”，要意识到可能被缓存吞掉（需要改变 rawArch 或换编译器类名/清缓存）。
- **`evalDomainFromRecord` 是编译模板的基础设施**：编译器生成的 `t-if` 常用 `evalDomainFromRecord(props.record, <domain>)`；如果你替换 Renderer/Compiler，必须保证这个函数在模板上下文里仍可用（通常作为 Renderer 的实例方法即可）。
- **`setDirty` 是 UX 而非数据一致性**：它只影响状态指示器/按钮显示，不等同于 `record.isDirty`（后者来自模型变更集）。二开时不要用 `fieldIsDirty` 作为“能否保存”的唯一依据。

---

## 参考阅读

- `addons/web/static/src/views/form/form_renderer.js`
- `addons/web/static/src/views/form/form_compiler.js`
- `addons/web/static/src/views/view_compiler.js`
- `addons/web/static/src/views/form/form_controller.xml`
- `addons/web/static/src/views/view_button/view_button.js`（按钮点击如何进入 `useViewButtons` 管线）
- `addons/web/static/src/views/fields/field.js`（`setDirty` 如何下发到具体 widget）

