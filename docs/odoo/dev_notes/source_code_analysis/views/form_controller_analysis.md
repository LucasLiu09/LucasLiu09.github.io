---
id: odoo16-web-form-controller
title: Odoo 16 FormController 源码解析
sidebar_label: FormController
description: Odoo 16 Web 表单视图 FormController（含与 FormRenderer/FormCompiler 协作接口、子视图加载、保存/离开保护、动作菜单与按钮执行链路）源码梳理。
tags:
  - odoo
  - odoo-web
  - odoo-controller
slug: /odoo16/web/form/form-controller
---

# Odoo 16 FormController 源码解析

:::tip
本文由AI生成+人工校正。
:::

## 总览

- **目标文件**：`addons/web/static/src/views/form/form_controller.js`
- **所属体系**：Odoo 16 Web Client（新 OWL 视图体系中的 Form View Controller）
- **核心职责**：
  - 在表单视图初始化阶段为 **x2many 字段按需加载子视图**（list/kanban），把解析结果回填进 `archInfo.activeFields`，以便模型与渲染层正确初始化。
  - 管理表单的 **记录生命周期**：加载、保存、丢弃、创建新纪录、复制、删除、归档/取消归档。
  - 处理 **离开保护**（beforeLeave / beforeUnload）与 **分页器**（pager）以及 **URL 同步**。
  - 在对话框中渲染表单时，提取并重定向 `footer` 到对话框 footer 区域。

> 关键点：这里的“表单模型”并不是 `views/relational_model.js` 那套，而是 `views/basic_relational_model.js`（桥接 legacy `web.BasicModel`）提供的 `RelationalModel/Record`。这会直接影响 `save/urgentSave/askChanges/archive/delete` 的具体实现语义。

---

## 核心对象概览表

| 名称 | 类型 | 位置 | 职责要点 |
| --- | --- | --- | --- |
| `loadSubViews(...)` | function | `form_controller.js` | 遍历 `activeFields`，为 x2many 字段拉取并解析非内联的子视图 arch（list/kanban），写回 `fieldInfo.views[viewType]` 与 `relatedFields` |
| `FormController` | OWL Component | `form_controller.js` | 表单控制器：初始化模型、控制面板按钮、动作菜单、保存/丢弃/创建、分页器、路由同步、离开保护 |
| `FormStatusIndicator` | OWL Component | `views/form/form_status_indicator/*` | 控制面板右侧云朵保存/撤销按钮，以及“无法保存”提示（依赖 record 的 isDirty/isValid/isVirtual） |

---

## `FormController` 方法速查表（按“定位源码”视角）

| 方法/属性 | 触发时机/入口 | 逻辑简述 | 与 `FormRenderer`/模板的关系 |
| --- | --- | --- | --- |
| `setup()` | 组件初始化 | 注入 services；创建 `state`；构造 `beforeLoadProm`；初始化 `useModel()`；抽取 dialog footer；注册 `useViewButtons/useSetupView/usePager`；`onWillStart` 先 `loadSubViews()` 后 resolve | 通过 `form_controller.xml` 把 `record/archInfo/回调(enable/disable/setDirty/notebook)` 传给 Renderer |
| `displayName()` | `onRendered` 更新面包屑显示名 | 新记录显示 `New`，否则取 `record.data.display_name` | 影响 `env.config.setDisplayName()`（上层 Layout/面包屑） |
| `onPagerUpdate({offset,resIds})` | pager 翻页 | `askChanges()` 刷新脏态；如 dirty 则先 `save(stayInEdition,useSaveErrorDialog)`；成功后 `model.load({resId})` | 间接导致 `record` 切换，Renderer 重新渲染 |
| `beforeLeave()` | 路由离开前（useSetupView） | dirty 则保存（`noReload:true`）并留在编辑态 | 避免切走导致丢数据 |
| `beforeUnload(ev)` | 浏览器关闭/刷新前 | `urgentSave()`；失败则阻止 unload | 与 Renderer 无直接交互，但影响用户退出体验 |
| `updateURL()` | effect（非 dialog） | `router.pushState({id})` 同步 URL 的记录 id | URL ↔ record 对齐 |
| `getActionMenuItems()` | ActionMenus 渲染 | 组装 Archive/Unarchive/Duplicate/Delete 等 actions（含确认弹窗） | `form_controller.xml` 的 `<ActionMenus items="getActionMenuItems()"/>` |
| `shouldExecuteAction(item)` | ActionMenus 执行动作前 | 需要时先保存（除 `skipSave`） | ActionMenus 会调用该 hook |
| `duplicateRecord()` | ActionMenus/按钮 | `record.duplicate()` | 触发 record 变更与重渲染 |
| `deleteConfirmationDialogProps` | `deleteRecord()` 用 | 构造删除确认框 props；删除后如无 `resId` 则 `historyBack()` | 影响删除后的导航行为 |
| `deleteRecord()` | ActionMenus | 弹出确认框（ConfirmationDialog） | UI 交互在 Controller 层完成 |
| `disableButtons()` / `enableButtons()` | 保存/创建/动作执行期 | 切 `state.isDisabled` | 通过模板传给 Renderer → 再由编译器注入到 `ViewButton.disable/enable` |
| `setFieldAsDirty(dirty)` | 字段 widget 上报 | 维护 `state.fieldIsDirty`（补足 `record.isDirty` 之前的“本地输入脏态”） | 通过模板传给 Renderer → 编译器注入到 `Field.setDirty` |
| `beforeExecuteActionButton(clickParams)` | `useViewButtons` 前置钩子 | 大多数按钮先保存（或走 `props.saveRecord`）；cancel 走 `props.onDiscard` | 决定“按钮动作”是否允许继续执行 |
| `afterExecuteActionButton(clickParams)` | `useViewButtons` 后置钩子 | 预留扩展（当前为空） | 可用于二开埋点/刷新策略 |
| `edit()` | 外部按钮/二开调用 | `record.switchMode("edit")` | 影响 Renderer 的只读/编辑态 class 与字段可编辑性 |
| `create()` | 控制面板 New | dirty 先保存；再 `model.load({resId:null})` 创建新记录；期间禁用按钮 | 新记录会触发 Renderer autofocus（若启用） |
| `saveButtonClicked(params)` | 控制面板云朵/Save | 禁用→保存（可走 `props.saveRecord`）→启用→`props.onSave` | 影响 `FormStatusIndicator`/按钮可用状态 |
| `discard()` | 控制面板 Discard/取消 | 可走 `props.discardRecord`；否则 `record.discard()`；必要时 `historyBack()` | 丢弃后可能返回上一页/关闭对话框历史 |
| `get className()` | 模板渲染时 | 根据 `ui.size/env.inDialog/hasTouch` 组合 class（含 `o_field_highlight` 等） | 直接影响 `web.FormView` 根容器样式与响应式布局 |

## `FormStatusIndicator` 方法速查表（控制面板右侧）

| 方法/属性 | 触发时机/入口 | 逻辑简述 |
| --- | --- | --- |
| `indicatorMode`（getter） | 渲染计算 | 按 `isVirtual/isValid/isDirty/fieldIsDirty` 产出 `dirty/invalid/saved` |
| `displayButtons`（getter） | 渲染计算 | `indicatorMode !== "saved"` 时显示云朵保存/撤销按钮 |
| `save()` / `discard()` | 点击按钮 | 调用从 Controller 传入的 `save/discard` 回调 |

## 关键依赖（按重要度）

| 依赖 | 文件 | 级别 | 与本文件的关系 |
| --- | --- | --- | --- |
| `viewService.loadViews` | `addons/web/static/src/views/view_service.js` | 一级必读 | `loadSubViews()` 通过它调用服务端 `get_views` 拉取子视图描述（arch、fields、relatedModels）并带缓存 |
| `useModel()` | `addons/web/static/src/views/model.js` | 一级必读 | 解释 `beforeLoadProm` 的原因：要先完成子视图加载，再执行 model.load（否则 fieldsInfo 不完整） |
| `RelationalModel/Record`（表单用） | `addons/web/static/src/views/basic_relational_model.js` | 一级必读 | `FormController` 调用的 `root.save/urgentSave/askChanges/archive/delete/duplicate/discard/switchMode` 都在这里实现（桥接 legacy BasicModel） |
| `useViewButtons()` | `addons/web/static/src/views/view_button/view_button_hook.js` | 一级必读 | 统一处理  `<button type="object/action">`  的点击：禁用按钮→可选确认→ `action.doActionButton` → onClose reload |
| `useSetupView()` | `addons/web/static/src/views/view_hook.js` | 一级必读 | `beforeLeave/beforeUnload/getLocalState` 的挂载入口（实际转交给 action hook 体系） |
| `FormArchParser` | `addons/web/static/src/views/form/form_arch_parser.js` | 一级必读 | 生成 `archInfo.activeFields`；`loadSubViews()` 依赖其中的 `FieldComponent/useSubView/modifiers/context/views/viewMode` 等字段 |
| `makeContext()` | `addons/web/static/src/core/context.js` | 二级选读 | 合并（并可 evaluate）多段 context，用于 `loadViews()` 请求子视图 |
| `views registry` | `addons/web/static/src/views/*/*_view.js` | 二级选读 | `loadSubViews()` 用 `viewRegistry.get(viewType).ArchParser` 解析子视图 arch（list/kanban） |

---

## 主流程（初始化到首屏）

### 1) 上游：View 组件如何把 `archInfo` 交给 FormController

`views/form/form_view.js` 注册了 `form` 视图描述，其中 `props()` 会执行：

- `archInfo = new FormArchParser().parse(arch, relatedModels, resModel)`
- 把 `Model/Renderer/Compiler/buttonTemplate/archInfo` 等注入给控制器组件（即 `FormController` 的 `props`）

### 2) `FormController.setup()` 的关键设计：用 `beforeLoadProm` 串联“先子视图、后数据”

本文件里有两段必须严格排序的异步逻辑：

- `onWillStart(async () => { await loadSubViews(...); beforeLoadResolver(); })`
- 同时 `useModel()` 内部也有一个 `onWillStart` 会触发 `model.load(...)`

而 `useModel()`（`views/model.js`）明确写了原因：**无法同步两个 onWillStart 的顺序**，因此提供 `params.beforeLoadProm`：

- `useModel()` 在加载数据前会 `await params.beforeLoadProm`
- `FormController` 在子视图准备完后 `resolve()` 这个 promise

这保证了：**x2many 子视图的 fieldsInfo/activeFields 先就绪**，再创建/加载根 record（避免渲染/字段信息缺失）。

---

## `loadSubViews()` 详解（x2many 子视图加载器）

### 输入与输出

- **输入**：
  - `activeFields`：来自 `FormArchParser`，按字段名组织的“激活字段描述”（含 `FieldComponent/modifiers/context/views/viewMode` 等）
  - `fields`：模型 fields（`fields_get`）结果
  - `context/resModel`：主表单上下文与模型
  - `viewService/userService/isSmall`：用于拉取视图与拼接上下文、移动端选择 viewType
- **输出（副作用）**：直接 **修改** `activeFields[fieldName]` 对象：
  - 标准化并设置 `fieldInfo.viewMode`
  - 填充 `fieldInfo.views[viewType]`（解析后的 archInfo）
  - 填充 `fieldInfo.relatedFields`

### 过滤规则（只处理“需要子视图”的 x2many）

对每个 `fieldName`：

1. `isX2Many(fields[fieldName])` 不是 one2many/many2many → 跳过
2. `fieldInfo.modifiers.invisible === true`（永远不可见）→ 不拉子视图
3. `!fieldInfo.FieldComponent.useSubView` → 该字段组件不需要子视图（例如某些 widget）→ 跳过
4. 已有 `fieldInfo.views[viewType]` → 说明子视图内联在 form arch 中 → 跳过

### viewType 决策逻辑（tree→list，移动端倾向 kanban）

- 默认 `fieldInfo.viewMode || "list,kanban"`
- 把 `"tree"` 替换成 `"list"`（统一命名）
- 如果包含逗号（即候选有多个），则：
  - 小屏：选 `"kanban"`
  - 非小屏：选 `"list"`
- 最终写回 `fieldInfo.viewMode = viewType`

### context 处理：把 `*_view_ref` 从 field context 拆出来

这里有一个非常“工程化”的处理：

- 从 `fieldInfo.context`（常为字符串表达式）用正则提取形如：
  - `'tree_view_ref': 'module.view_id'`
  - `'kanban_view_ref': 'module.view_id'`
  - `'form_view_ref': 'module.view_id'`
- 目的：让 `get_views` 能拿到与 view_ref 匹配的视图

然后再做两件事：

- **从通用 context 中过滤掉** `*_view_ref`（避免影响主视图/其它层）
- 强行注入 `refinedContext.base_model_name = resModel`
  - 注释解释：防止通用 context 的访问权限限制（如 `create: 0`）“泄漏”到子视图

最后请求子视图：

- `viewService.loadViews({ resModel: comodel, views: [[false, viewType]], context: makeContext([fieldContext, user.context, refinedContext]) })`

并解析 arch：

- `const { ArchParser } = registry.category("views").get(viewType)`
- `new ArchParser().parse(views[viewType].arch, relatedModels, comodel)`
- 写回 `fieldInfo.views[viewType] = { ...archInfo, fields: comodelFields }`

> 这一步把“子视图的解析结果”塞回 form 的字段描述里，供 `basic_relational_model` 把 activeFields 映射为 legacy `fieldsInfo` 时使用。

---

## `FormController` 行为详解

### 1) 服务与状态

- 服务：
  - `dialog`：弹确认框（删除/归档）
  - `router`：`pushState({id})` 同步 URL
  - `user`：提供 `user.context`
  - `view`：`viewService.loadViews` 用于子视图
  - `ui`：监听 resize 触发重渲染，读 `ui.size`
- 本地状态（`useState`）：
  - `isDisabled`：保存/创建等长操作期间禁用按钮
  - `fieldIsDirty`：renderer 可通过 `setFieldAsDirty()` 标记“字段层面的脏”（配合状态指示器）

### 2) canCreate/canEdit 与初始 mode

- 来自 `archInfo.activeActions`（由 `getActiveActions()` 解析 form 根节点属性 `create/edit/...`）
- 结合 `preventCreate/preventEdit` props
- 如果不能 edit，则强制 `mode = "readonly"`

### 3) 模型初始化：`useModel(this.props.Model, ...)`

关键入参（节选）：

- `resModel/resId/resIds/fields/activeFields`
- `viewMode: "form"`, `rootType: "record"`
- `beforeLoadProm`：用于等待 `loadSubViews` 完成（见上文）
- `ignoreUseSampleModel: true`：表单视图不启用 sample data

在 form 视图注册中（`views/form/form_view.js`），`Model` 指向：

- `views/basic_relational_model.js` 的 `RelationalModel`（桥接 legacy `web.BasicModel`）

因此 `this.model.root` 是 `basic_relational_model.Record`，其 `save/urgentSave/askChanges/...` 语义请见下节。

### 4) 对话框 footer 迁移（非常实用的细节）

当 form 在对话框中渲染时，需要把不是子视图内部的 `<footer>` 移到底部按钮区域：

- 选取：`footer:not(field footer)`
  - 避免误抓 x2many 子视图内部的 footer
- 构造 `footerArchInfo`：
  - 复制 `archInfo`，但把 `xmlDoc` 变成新建的 `<t>`
  - 把抓到的 footers append 到新的 `xmlDoc`
- 同时把原 `archInfo.xmlDoc`/`archInfo.arch` 更新为“移除 footer 后”的版本

模板 `form_controller.xml` 中在 `env.inDialog` 且有 `footerArchInfo` 时，会让 `Renderer` 只渲 footer arch 到对话框 footer 槽位。

### 5) 与 `FormRenderer` 的接口（由 `form_controller.xml` 绑定）

`FormController` 本身并不直接操作 DOM 来渲染表单内容，而是通过模板把“根记录 + archInfo + 一组回调”交给 `FormRenderer`。关键绑定点在 `form_controller.xml` 的两处 `t-component="props.Renderer"`：

- **主表单渲染**（永远渲染）：
  - `record="model.root"`：Renderer 渲染与编辑的唯一事实来源（Record）
  - `archInfo="archInfo"`：包含 `xmlDoc/fieldNodes/activeFields/...` 的解析结果
  - `Compiler="props.Compiler"`：默认是 `FormCompiler`（负责把 arch 编译成 OWL 模板）
  - `setFieldAsDirty.bind="setFieldAsDirty"`：给字段组件“上报本地脏态”的通道（见下文）
  - `enableViewButtons.bind="enableButtons"` / `disableViewButtons.bind="disableButtons"`：给视图按钮点击管线一个“全局禁用/启用”的钩子（配合 `useViewButtons`）
  - `onNotebookPageChange.bind="onNotebookPageChange"` + `activeNotebookPages="props.state and props.state.activeNotebookPages"`：用于 notebook 页签状态持久化（离开/返回恢复）

- **对话框 footer 渲染**（仅 `env.inDialog && footerArchInfo`）：
  - 只传 `record/Compiler/archInfo(footerArchInfo)/enable/disable`，因为 footer 中主要是按钮，不需要 notebook/dirty 相关回调。

这些回调并不是 `FormRenderer` 直接调用，而是 **`FormCompiler` 在编译 arch 时把它们“注入到子组件 props”**：

- `FormCompiler.compileField()`：为每个 `<Field/>` 注入 `setDirty`（实际写法是 `setDirty.alike="props.setFieldAsDirty"`）
  - `Field` 组件会把 `setDirty` 继续下发给具体字段 widget，widget 在“输入但未保存/未提交”时可以调用它，最终让 `FormController.state.fieldIsDirty` 变化，从而影响 `FormStatusIndicator` 的显示逻辑。
- `FormCompiler.compileButton()`：为每个 `<ViewButton/>` 注入 `disable="props.disableViewButtons"` 与 `enable="props.enableViewButtons"`
  - `ViewButton.onClick()` 会把这两个回调作为 `disableAction/enableAction` 传给 `env.onClickViewButton(...)`（由 `useViewButtons()` 提供），从而在动作执行期间同步禁用/启用控制面板相关按钮。
- `FormCompiler.compileNotebook()`：把 `defaultPage/onPageUpdate` 绑定到 `props.activeNotebookPages` 与 `props.onNotebookPageChange`，让 controller 能在 `getLocalState()` 中保存、下次恢复页签。

### 5) View Buttons（表单 header/footer 内按钮的点击管线）

`useViewButtons(this.model, rootRef, { beforeExecuteAction, afterExecuteAction })` 会在子环境注入 `onClickViewButton()`：

- 先禁用按钮（DOM 层面）
- 可选弹确认框（`clickParams.confirm`）
- 组装 `doActionButton` 所需上下文（resModel/resId/resIds/context/buttonContext/onClose reload）
- 执行 `action.doActionButton(...)`

`FormController.beforeExecuteActionButton(clickParams)` 负责在点击前做“保存/丢弃”决策：

- 非 cancel：
  - `special==="save"` 且传了 `props.saveRecord` → 走自定义保存
  - 否则 `record.save({ stayInEdition: true })`
  - 保存成功后可触发 `props.onSave(record, clickParams)`
- cancel：
  - 若有 `props.onDiscard` 则调用（注意：这里不自动 discard record）

### 6) 离开保护与本地状态保存

`useSetupView()` 注入：

- **beforeLeave**：如果 `root.isDirty`，则 `root.save({ noReload: true, stayInEdition: true, useSaveErrorDialog: true })`
- **beforeUnload**：调用 `root.urgentSave()`，失败则阻止关闭标签页
- **getLocalState**：保存 notebook 当前页与 `resId`（用于返回时恢复）

### 7) Pager（单记录翻页）

`usePager()` 只在 `root.isVirtual === false` 时启用：

- `offset = resIds.indexOf(root.resId)`
- `total = resIds.length`
- `onUpdate({offset})` → `onPagerUpdate({ offset, resIds })`

`onPagerUpdate()` 的策略：

- `await root.askChanges()` 确保 dirty 状态准确
- 若 dirty：尝试 `root.save({ stayInEdition: true, useSaveErrorDialog: true })`
- 保存成功才 `model.load({ resId: resIds[offset] })`

### 8) ActionMenus（归档/复制/删除）

`getActionMenuItems()` 会构造 `other` 菜单项：

- **Archive/Unarchive**：
  - 仅当 `archiveEnabled` 为真（要求视图里包含 `active` 或 `x_active` 且字段非 readonly）
  - `root.isActive` 决定显示 archive 还是 unarchive
  - archive 需要 `ConfirmationDialog`
- **Duplicate**：`root.duplicate()`
- **Delete**：`root.delete()`（删除后若没 resId，会 `historyBack()`）

并通过模板把这些 items 交给 `ActionMenus` 组件渲染。

---

## 与 `basic_relational_model.js` 的对接点（必须理解）

`FormController` 使用的 `this.model.root`（Record）关键方法语义（摘自 `views/basic_relational_model.js`）：

- **`askChanges()`**：
  - 触发 `env.bus` 事件 `"RELATIONAL_MODEL:NEED_LOCAL_CHANGES"` 收集字段组件的本地变更（例如当前 focus 的输入框尚未 commit）
  - 等待内部 `_updatePromise`，确保更新批次完成
- **`save(options)`**：
  - `checkValidity()` 失败会通过 notification 展示无效字段列表，并返回 `false`
  - 调用 legacy `BasicModel.save(handle, { reload, savePoint, viewType })`
  - `useSaveErrorDialog` 为真时：服务端异常会挂上 `onDiscard/onStayHere` 供上层对话框决策
- **`urgentSave()`（beforeUnload 专用）**：
  - 设置 `__bm__.bypassMutex = true`，尽量避免 mutex 等待
  - 使用 `sendBeacon` 提交（`__bm__.useSendBeacon = true`），当 payload 太大时会提示用户手动点云朵保存
  - 返回 boolean：是否成功完成“紧急保存”
- **`archive/unarchive/duplicate/delete/discard/switchMode`**：
  - 全部桥接到 legacy BasicModel 的对应能力，并在完成后 `__syncData()` + `model.notify()`

因此，`FormController` 的很多“看似简单”的调用（如 `root.save()`）背后其实包含：

- 字段组件本地状态提交
- onchange/notifyChanges 的批处理与 mutex
- legacy 数据点同步（`__syncData`）

---

## 典型调用链/时序

### 初次打开表单

1. `View` 组件加载 form arch → `FormArchParser.parse()` 得到 `archInfo.activeFields`
2. `FormController.setup()` 创建 `beforeLoadProm`
3. `FormController.onWillStart()` 调 `loadSubViews()` 拉 x2many 子视图并写回 activeFields
4. `beforeLoadResolver()` 解除 promise
5. `useModel().onWillStart()` 等到 promise 后执行 `model.load()` 创建并加载 `root` record
6. renderer 首次渲染

### 点击保存（控制面板云朵 / footer Save）

1. `FormStatusIndicator.save()` → `FormController.saveButtonClicked()`
2. `root.save()`（或 `props.saveRecord`）
3. 成功后触发 `props.onSave`（可选）

### 翻页（pager）

1. `onPagerUpdate()` → `root.askChanges()` 刷新 dirty 状态
2. dirty 则先 `root.save({ stayInEdition: true, useSaveErrorDialog: true })`
3. `model.load({ resId: nextId })`

### 关闭标签页/刷新（beforeunload）

1. `FormController.beforeUnload(ev)` → `root.urgentSave()`
2. 返回 false → `ev.preventDefault()` + `ev.returnValue="Unsaved changes"`

---

## 扩展点与踩坑

- **`*_view_ref` 的提取很脆弱**：`loadSubViews()` 用正则从 `fieldInfo.context` 字符串里抓 `'xxx_view_ref': '...'`，若你在自定义 widget/context 里改成双引号、表达式拼接、或更复杂结构，可能抓不到，从而加载到“非预期子视图”。
- **`activeFields` 会被原地修改**：`fieldInfo.viewMode/views/relatedFields` 都是写回到 `archInfo.activeFields`；如果你在别处缓存/复用 `archInfo`，要意识到其会在启动阶段被 mutate。
- **必须遵守“先子视图再 load 数据”的约束**：`basic_relational_model.RelationalModel.load()` 首次会把 activeFields 映射成 legacy `fieldsInfo`；若子视图未准备好，x2many 的 fieldsInfo 会缺失，表现为子列表字段缺、widget 异常或数据点创建失败。
- **对话框 footer 抽取选择器**：`footer:not(field footer)` 这个选择器的语义决定了哪些 footer 会被抽走；如果你在 x2many 子视图里使用了特殊 DOM 结构，可能误伤或漏选，需要注意结构是否满足该选择器。
- **`urgentSave` 的“太大无法 beacon”路径**：当自动保存失败时会提示用户点击云朵按钮手动保存；二开时不要假设 beforeunload 一定能成功落盘。
- **删除后导航**：`deleteConfirmationDialogProps.confirm()` 里在删除完成后，如果 `!root.resId` 会 `historyBack()`；在自定义流程（比如删除后仍留在空表单）时需要覆盖此行为。

---

## 参考阅读（建议继续深挖的文件）

- `addons/web/static/src/views/form/form_controller.js`（本文）
- `addons/web/static/src/views/form/form_controller.xml`（模板：Layout slots、ActionMenus、FormStatusIndicator、dialog footer renderer）
- `addons/web/static/src/views/form/form_arch_parser.js`（`activeFields` 的来源与结构）
- `addons/web/static/src/views/view_service.js`（`get_views` 缓存与返回结构）
- `addons/web/static/src/views/model.js`（`beforeLoadProm` 的同步设计）
- `addons/web/static/src/views/basic_relational_model.js`（表单 Record 的真实 save/urgentSave 语义）
- `addons/web/static/src/views/view_button/view_button_hook.js`（按钮点击管线与 `doActionButton` 组参）
- `addons/web/static/src/views/list/list_view.js`、`addons/web/static/src/views/kanban/kanban_view.js`（子视图 `ArchParser` 的来源）

