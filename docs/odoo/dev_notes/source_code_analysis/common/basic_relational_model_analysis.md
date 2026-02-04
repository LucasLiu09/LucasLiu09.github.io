---
title: basic_relational_model解析(Odoo16)
description: basic_relational_model解析(Odoo16)
sidebar_label: basic_relational_model解析(Odoo16)
keyword:
    - odoo
    - odoo development
tags: [odoo]
last_update:
  date: 2026/02/04
  author: Lucas
---

# basic_relational_model.js 源码解析

> 目标文件：`odoo-16.0/addons/web/static/src/views/basic_relational_model.js`  
> 解析范围：该文件内全部类 + 关键依赖（沿 `import` 深读到源码层）  
> 适用场景：理解 Odoo 16 OWL 新视图层如何“复用/适配” legacy `web.BasicModel`，以及表单与 x2many 的数据/校验/保存/并发链路。

---

## 1. 总览

:::info[备注]
本文由AI生成+人工校正。
:::

Odoo 16 的 Web 端处于新旧体系共存阶段：

- **新体系（@web/**）**：OWL 组件 + 新 `Model` 基类（`@web/views/model`），服务通过依赖注入（action/dialog/notification/orm 等）。
- **旧体系（legacy web.***）**：以 `web.BasicModel` 为核心的数据层，负责与后端 ORM RPC 交互、onchange、x2many commands、域/上下文计算、并发串行化（mutex）等。

`basic_relational_model.js` 的定位就是：

- 提供一个 **RelationalModel（新 Model）**，内部继续使用 legacy 的 `web.BasicModel` 来管理数据与 RPC；
- 将 legacy BasicModel 的 datapoint（本地数据点）封装为新体系可直接消费的对象：  
  - **Record**：单条记录（表单、列表行）  
  - **StaticList**：x2many 的静态列表（one2many/many2many 的子列表 datapoint）
- 提供 **数据格式映射**（moment ↔ luxon、legacy m2o/reference 结构 ↔ OWL 组件期望结构），以及 **校验/保存/丢弃/重排** 等上层 API。

一句话：**它是“新视图层 <-> legacy BasicModel”的适配层**。

| 类 | 角色/粒度 | 主要职责 | 关键点/典型方法 |
| --- | --- | --- | --- |
| `DataPoint` | 抽象基类（datapoint 包装） | 统一从 legacy `handle` 或 `load params` 构造 datapoint；提供 lazy `context` 与 `evalContext` | `context` 懒计算；`evalContext` 复用 BasicModel `_getLazyEvalContext`；`fieldNames` |
| `Record` | 单记录（form / list 行） | 同步 legacy datapoint → OWL 友好数据形态；提供校验、更新、保存、丢弃、模式切换等上层 API | `__syncData()` 类型映射；`update()` 批处理 + onchange；`checkValidity()`；`save()/discard()/urgentSave()`；`switchMode()` |
| `StaticList` | x2many 静态列表（o2m/m2m） | 将 x2many list datapoint 封装为 `records: Record[]`；管理单行编辑；对子列表增删改/替换/重排，并通过 `__syncParent` 回写父记录 | `__syncData()`；`add()/addNew()/delete()/replaceWith()`；`applyCommands()`；`resequence()`；`editedRecord` 管控 |
| `RelationalModel` | OWL 视图模型（根入口） | 作为新 `Model` 宿主，内部持有 legacy `web.BasicModel`；负责 root record load、防竞态、以及把 legacy `trigger_up` 事件桥接到新 services | `setup()` 初始化 `__bm__`；`load()` + `KeepLast`；`_trigger_up()`（do_action/warning/rpc/notification）；`duplicateDatapoint()`；`createDataPoint()` |

---

## 2. 关键依赖

### 2.1 `web.BasicModel`

文件：`odoo-16.0/addons/web/static/src/legacy/js/views/basic/basic_model.js`

你在 `basic_relational_model.js` 里看到的绝大多数“真正与服务器交互/维护本地状态”的事情，都在 BasicModel 内完成，例如：

- **并发串行化**：`mutex.exec(...)`；`bypassMutex` 用于绕过 mutex（配合 `urgentSave`）。
- **字段变更入口**：`notifyChanges(record_id, changes, options)`  
  - 所有字段修改最终会走 `_applyChange`，触发 onchange、domain、specialData、关系字段联动等。  
  - 它默认会经 `mutex.exec` 串行化（除非 `bypassMutex = true`）。
- **保存**：`save(recordID, { reload, savePoint, viewType })`  
  - 生成 changes / x2many commands → `create/write` RPC → 可选 reload 或直接合并本地数据。
- **上下文/域计算**：  
  - `dataPoint.getContext(...)` 绑定到 `_getContext(...)`：合并 user_context + record/list context + 字段 context + rawContext + additionalContext，并在需要时 eval。  
  - `dataPoint.getDomain(...)` 绑定到 `_getDomain(...)`：优先 onchange 返回的 `_domains[field]`，其次 fieldsInfo/fields 的 domain，最后 element.domain。
  - `this._getLazyEvalContext(datapoint)`：用 Proxy 懒计算 evalContext（性能关键，避免频繁构造大对象）。

> 结论：**RelationalModel/Record/StaticList 只是在“包装调用” BasicModel；理解行为必须以 BasicModel 的 datapoint 结构为准。**

### 2.2 `Model`

文件：`odoo-16.0/addons/web/static/src/views/model.js`

- `Model` 继承 `EventBus`，核心能力非常薄：  
  - `notify()` 触发 `"update"` 事件 → `useModel` hook 监听并强制渲染（`component.render(true)`）。

RelationalModel 继承它，并用 `notify()` 作为“告诉 UI 更新”的统一出口。

### 2.3 `evalDomain`

文件：`odoo-16.0/addons/web/static/src/views/utils.js`

```js
export function evalDomain(modifier, evalContext) {
  if (modifier && typeof modifier !== "boolean") {
    modifier = new Domain(modifier).contains(evalContext);
  }
  return Boolean(modifier);
}
```

- modifiers 中常见的 `required` / `readonly` / `invisible` 可能是 `boolean` 或 domain 表达式（数组形式）。
- `Record.isReadonly/isRequired/checkValidity` 都依赖它，并使用 **BasicModel 的 lazy evalContext**（见下文）。

### 2.4 `legacy_utils`

文件：`odoo-16.0/addons/web/static/src/views/legacy_utils.js`

关键点：

- `mapWowlValueToLegacy(value, type)`：把 OWL 侧值映射回 legacy BasicModel 期望的结构  
  - `date/datetime`：luxon → serialize → legacy parse → moment  
  - `many2one`：`[id, name]` → `{id, display_name}`  
  - `reference`：`{resModel, resId, displayName}` → `{model, id, display_name}`  
  - x2many：保留 operation（例如 `REPLACE_WITH`）或透传
- `mapActiveFieldsToFieldsInfo(...)`：把 activeFields（WOWL 字段描述）转换成 legacy fieldsInfo 结构，包含：
  - Widget（legacy 字段兼容）、domain/context/modifiers/options/views/limit/orderedBy 等
  - `__WOWL_FIELD_DESCR__`：把 WOWL 字段描述挂回去，供新层读取（`Record.activeFields` 里会用到）。

### 2.5 `mapDoActionOptionAPI`

文件：`odoo-16.0/addons/web/static/src/legacy/backend_utils.js`

RelationalModel 在 `_trigger_up('do_action')` 分支中复用 legacy 行为：

- 将 snake_case options 兼容映射为 camelCase，并把 controllerState 转成 globalState（searchModel/searchPanel/resIds 等）。

### 2.6 `makeContext`

文件：`odoo-16.0/addons/web/static/src/core/context.js`

- 支持 context 片段为对象或字符串表达式（用 `evaluateExpr` 求值）。
- 逐段合并，且“合并后的 context”会参与后续段的求值（注意它的 evaluationContext 会随合并递增）。

### 2.7 `KeepLast`

（只保留最后一次 load 的结果）
文件：`odoo-16.0/addons/web/static/src/core/utils/concurrency.js`

RelationalModel `load()` 用 `KeepLast.add(promise)` 包裹根记录加载，避免并发 load 导致“旧请求后返回覆盖新状态”的经典竞态。

---

## 3. `DataPoint`

（新层 datapoint 的基类）

### 3.1 设计目的

`DataPoint` 统一了两种创建方式：

- **从 legacy handle 创建**：`params.handle` → `this.__bm_handle__`  
  - 通过 `this.model.__bm__.get(handle)` 拿到 legacy datapoint info（fields/model/viewType 等）。
- **从 load params 创建（尚未 load）**：`params.__bm_load_params__`  
  - 保存到 `this.__bm_load_params__`，并从其中取 model/fields/context/viewType 等。

### 3.2 context 懒加载

当从 legacy handle 构建时，`DataPoint` 不会立刻计算 context，而是定义了一个 lazy getter：

- 第一次读取 `this.context` 时，才调用：
  - `this.model.__bm__.localData[this.__bm_handle__].getContext()`
- 然后用 `Object.defineProperty` 把 `context` 替换为普通 value 属性，避免后续重复计算。

为什么重要：

- BasicModel 的 `_getContext` 可能涉及 eval、多段 Context 合并、rawContext 等；  
  在大量 datapoint（尤其 list 行）场景，提前计算会非常浪费。

### 3.3 `evalContext`

`DataPoint.evalContext` 返回：

- `this.model.__bm__._getLazyEvalContext(datapoint)`

这会得到一个 Proxy：

- key 访问时才计算 record 的上下文字典项（包括 parent、x2many commands 等），适合频繁 eval modifiers/domain 的场景。

---

## 4. `Record`

单条记录的包装（含校验、保存、丢弃、模式切换）

`Record extends DataPoint`，是本文件最核心的业务对象。其职责是：

- 把 legacy datapoint 的 `data/_changes/specialData` 同步为新层易用数据；
- 提供上层 API：`load/update/save/discard/duplicate/delete/archive/unarchive/switchMode/checkValidity` 等；
- 管理 UI 相关状态：`mode`、`selected`、`invalidFields` 通知等；
- 处理 x2many 子列表的包装（通过 `StaticList`）。

### 4.1 `setup()`

关键初始化字段：

- `data`: 当前 record 的值（已经做了类型映射）
- `_invalidFields`: 无效字段集合（用于 UI 提示）
- `preloadedData`: 来自 legacy `specialData` 的预加载数据（widget/字段可能用到）
- `mode`: `"readonly"` 或 `"edit"`  
  - 新记录 + form：强制 `edit`  
  - 其余：来自 params/state 或默认 readonly
- `_requiredFields`: 从 `activeFields[field].modifiers.required` 收集出 required 表达式（boolean 或 domain）

### 4.2 `__syncData()`

从 legacy datapoint 同步到新层 `Record.data`

同步过程的核心是“类型映射/适配”：

- `date/datetime`：legacy moment → `.toJSON()` → `deserializeDate/deserializeDateTime`（新层 luxon）
- `one2many/many2many`：
  - legacy 里是一个 list datapoint（id）或已有 list dp
  - 新层把它包装为 `StaticList`，并注入 `__syncParent` 回调（关键：把子表变化写回父 record）
- `many2one`：
  - legacy 里是一个 record datapoint（含 `data.id/display_name`）
  - 新层映射为 `[id, display_name]`（更符合 OWL Field 的通用形式）
- `reference`：映射为 `{resModel,resId,displayName}` 或 `false`
- `char`：空值规整为 `""`
- `html`：规整为 `markup(...)`（OWL 安全文本）
- `specialData`：写入 `preloadedData[fieldName]`

> 你可以把 `__syncData()` 理解为“**把 BasicModel 的内部形态转换成 OWL 视图层直接消费的形态**”。

### 4.3 `update(changes)`

这是最容易读错的函数，因为它同时处理：

- **同一 tick 内的批处理合并**（避免频繁 notifyChanges）
- **urgentSave 模式**（绕过 UI 机制）
- **子表行编辑场景**（当 record 在 x2many list 内时，要通过 `__syncParent` 回写父记录）

#### 4.3.1 批处理

`update()` 的开头会做 batching：

- 如果当前已有 `batchingUpdateProm`，则把 changes 合并进 `batchChanges`，并返回同一个 `_updatePromise`；
- 否则创建一个新的 batch，并在 microtask 后执行一次真正的 notifyChanges。

效果：

- 多个字段组件几乎同时触发 `update()` 时，只会发起一次 legacy `notifyChanges`。

#### 4.3.2 值映射与显示名同步

对每个变更项：

- 使用 `mapWowlValueToLegacy(value, fieldType)` 转回 legacy 结构。
- many2one 特殊处理：若传入 `[id, newName]`，则直接把 legacy m2o datapoint 的 `display_name` 手动改掉（避免 reload 才看到新 name）。
- reference 同理：同步 `display_name`。

#### 4.3.3 主记录 vs x2many 行

判断依据：`parentID` + `viewType === 'list'`

- **如果当前 record 是 x2many list 的行（viewType=list 且有 parentID）**  
  - 找到主表 record 的 x2many 字段名  
  - 组装 operation：`{ operation: "UPDATE", id: this.__bm_handle__, data }`  
  - 调 `__syncParent(operation)`：让父 record 以“x2many 操作命令”的方式接收变更  
  - 这个路径绕开了当前行直接 `notifyChanges`，目的是保持 x2many commands 的一致性

- **否则是普通记录**  
  - 直接 `this.model.__bm__.notifyChanges(handle, data, { viewType })`  
  - 等待返回 changed fieldNames  
  - 清理 invalidFields、同步 x2many editedRecord 的 invalid 状态、`__syncData()`、`notify()`

### 4.4 `checkValidity(urgent)`

必填/类型/x2many 子记录校验

校验策略的关键点：

- `urgent=false` 时先 `askChanges()`：
  - 向 bus 触发 `"RELATIONAL_MODEL:NEED_LOCAL_CHANGES"`，让字段组件把尚未提交到 model 的本地值提交过来
- 对每个 activeField：
  - 若有 required modifiers：
    - 先用 `evalDomain(requiredExpr, this.evalContext)` 判断在当前上下文下是否 required
    - 如果字段 alwaysInvisible 或 required 条件不成立，则从 invalidFields 移除
  - 尝试使用 `FieldComponent.isSet`（如果字段组件提供），更准确判断“是否设置”
  - 按字段 type 特判：
    - `html`: required 且长度 0 → invalid
    - `properties`: label/id 必填
    - `one2many/many2many`: 递归校验 `list.editedRecord`
    - `json`: required 且空对象 → invalid
    - 其他：required 且假值 → invalid（但 numeric/boolean 直接跳过）

并配套：

- `openInvalidFieldsNotification()`：用 notificationService 弹出无效字段列表（danger）
- `setInvalidField/resetFieldValidity()`：同时把 legacy record 标记 dirty（BasicModel `setDirty`），避免用户误认为无变化可丢弃。

### 4.5 `save(options)`

保存流程（按实际执行顺序）：

1. 关闭 urgentSave/invalidFields 的提示
2. `checkValidity()` 不通过 → 打开 invalidFields 通知 → 返回 false
3. 调 legacy `bm.save(handle, { reload, savePoint, viewType })`
4. 成功后：
   - `__syncData(true)` 强制同步（包含 x2many 的刷新）
   - 若 `stayInEdition=false` 且当前在 edit，则 `switchMode('readonly')`
5. 失败：
   - 若 `useSaveErrorDialog=true`，会给异常对象挂 `onDiscard/onStayHere`，由上层弹窗逻辑决定下一步
   - 若当前不是 edit，则会 `load()` 以恢复一致状态

### 4.6 `urgentSave()`

关闭页面前的“尽可能同步保存”

这是与 BasicModel 强耦合的一段逻辑：

- `bm.bypassMutex = true`：后续 `notifyChanges/save` 直接执行，不再排队
- 触发 `"RELATIONAL_MODEL:WILL_SAVE_URGENTLY"`：让字段组件“立刻提交焦点值”
- `__syncData()`：把 controller 层积攒的变更同步到 record
- 若 dirty：
  - `checkValidity(true)`（urgent=true 时不会 `askChanges()`，因为时间窗口极小）
  - `bm.useSendBeacon = true`：BasicModel.save 内部改用 `navigator.sendBeacon`  
    - 成功：尽量在页面卸载时也能发出请求  
    - 失败（payload 太大）：展示 sticky 通知，提示用户手动点云上传按钮保存
- 最后恢复 `bm.bypassMutex=false`

> 这里的取舍是：**在 beforeunload 极短时限内，牺牲部分一致性保障（mutex）来换取保存成功率。**

---

## 5. `StaticList`

x2many 列表 datapoint 的包装

`StaticList extends DataPoint`，代表 one2many/many2many 的子列表。

### 5.1 核心状态

- `records: Record[]`：列表行的 Record 包装
- `editedRecord: Record | null`：当前处于 edit 的那一行（editable x2many 只允许一个）
- `handleField`：重排（resequencing）使用的字段名（例如 sequence / handle）
- `__fieldName__`：该 StaticList 在父 record 上对应的字段名（由 `Record.__syncData` 设置）

### 5.2 `onRecordWillSwitchMode`

当某行要进入 edit：

- 先对 list 自身 savePoint + freezeOrder（保证顺序冻结，避免排序/分页导致的错位）

当从一个 editedRecord 切换到另一个：

- 视情况检查 validity：
  - 明确要求 `checkValidity`
  - 或 editedRecord dirty
  - 或 editedRecord canBeAbandoned（可放弃的新行）
- 若有效：切回 readonly
- 若无效且可以放弃且不是当前行：`abandonRecord(...)`
- 否则拒绝切换（保持原 editedRecord）

### 5.3 `__syncData()`

做法：

- 遍历 legacyListDP.data（里面是行 record datapoint 的 id 列表）
- 对每个 dp：
  - 若已有对应 Record（按 `__bm_handle__` 找）：调用 `record.__syncData()`
  - 否则 new 一个 Record，并注入：
    - `onRecordWillSwitchMode`
    - `mode: readonly`
    - `__syncParent`: 透传到 StaticList 的 `__syncParent`
- 最后设置 `editedRecord = records.find(mode==='edit')`

### 5.4 `__syncParent(operation)`

StaticList 的所有“对列表的结构性修改”最终要通过父 record 的 x2many 字段变更来表达（命令化），例如：

- `DELETE` / `FORGET`
- `ADD` / `ADD_M2M`
- `CREATE`
- `UPDATE`（某行字段变化）
- `MULTI`（批量操作）
- `REPLACE_WITH`（m2m 替换集合）

这些 operation 最终会被父 record 的 `update()` 转成 legacy `notifyChanges(parentHandle, { x2mField: operation })`，由 BasicModel 统一处理为 commands 并触发 onchange。

### 5.5 `resequence(movedId, targetId)`

高层逻辑：

- 先判断是否能重排：
  - 有显式 handleField 或模型字段存在默认 `sequence`
- 列表 viewType=list 时先 savePoint + freezeOrder（同 edit 逻辑）
- 计算移动前后 index 与目标 index
- 判断是否需要 reorderAll（序列值不单调/重复等情况）
- 生成一组 UPDATE operations：  
  - 对除最后一个 operation 之外的所有 UPDATE：`notifyChanges(..., { notifyChange:false })`（避免连环 onchange）
  - 最后一个 UPDATE 正常 notifyChanges（触发一次 onchange）
- finally：若 viewType=list，`setSort(listHandle, handleField)`，确保排序字段一致

这种实现的目的是：**尽量少触发 onchange，同时保证服务端序列字段一致**。

---

## 6. `RelationalModel`

新 Model 对 legacy BasicModel 的“宿主/桥接”

`RelationalModel extends Model`，是 OWL 视图真正持有的 model 实例。

### 6.1 `setup()`

- 注入服务：`action/dialog/notification`（由 `RelationalModel.services` 声明）
- 创建 legacy model：`this.__bm__ = new BasicModel(this, { fields, modelName, useSampleModel:false })`
  - 这里把 **RelationalModel 实例本身**当作 legacy BasicModel 的 env（因此它必须实现 `_trigger_up`，用来承接 legacy trigger_up 事件）
- `__bm_load_params__`：构造 root record 的基础 load 参数（type/modelName/res_id/res_ids/fields/viewType=form）

### 6.2 `load(params)`

用 KeepLast 防竞态，重建 root Record

特性：

- 首次 load 时会计算 `fieldsInfo`：`mapActiveFieldsToFieldsInfo(activeFields, fields, "form", env)`
- 每次 load：
  - 保存旧 root 的 state：`exportState()`（mode/resId/resIds 等）
  - new 一个 `Record`，传入 `__bm_load_params__`（此时还没有 handle）
  - `await keepLast.add(nextRoot.load())`：只接受最后一次 load 的结果
  - `this.root = nextRoot`，并 `notify()`

> 注意：这里不是“复用旧 root record”，而是 **每次 load 都构造一个新 Record 对象**，然后把上一份状态（mode 等）带过去。

### 6.3 `_trigger_up(ev)`

BasicModel 在很多地方会 `trigger_up`（warning、do_action、call_service 等）。RelationalModel 实现 `_trigger_up` 来承接这些事件，并映射到新体系服务：

- `call_service`：
  - `ajax.rpc`：最终调用 `owl.Component.env.session.rpc(...)`  
    - 额外处理：若组件已 destroyed，则返回一个永不 resolve 的 Promise（避免回调落到已销毁组件）
  - `notification`：转发 `notificationService.add(...)`
- `warning`：
  - `dialog`：`dialogService.add(WarningDialog, ...)`
  - 否则：notification warning
- `do_action`：
  - `Context(payload.action.context).eval()`（legacy Context 解析）
  - `mapDoActionOptionAPI(payload.options)`（option 形态映射）
  - `actionService.doAction(action, legacyOptions)`
- `reload`：调用 `this.load()` 并执行 onSuccess 回调

### 6.4 `duplicateDatapoint(record, params)`

在不同 subview 间“补齐字段/fieldsInfo”

这是 RelationalModel 中最“工程化”的函数之一，核心目的是：

当用户从一个 view（比如 x2many list）打开另一个 view（比如 x2many form）时：

- legacy record datapoint 可能已经存在，但：
  - 新 view 所需字段未加载
  - specialData 未取
  - many2one context 不同导致 display_name 可能需要重新 name_get
  - x2many 子视图 fieldsInfo 需要合并（尤其 viewType=default 的情况，避免丢 display_name）

因此它会：

- `bm.mutex.getUnlockedDef()`：等待 pending onchange 完成
- `bm.addFieldsInfo(handle, {...})`：把新 view 的 fieldsInfo 注入 legacy datapoint
- 计算 `fieldNames`：找出需要 reload/default_get 的字段集合（含 specialData/x2many/m2o context 差异）
- new record 时走 `generateDefaultValues`，旧 record 走 `reload(...keepChanges:true)`
- 最后构造一个新的 `Record` 包装返回

并且它还做了一个很“有技巧”的 patch：

- 临时替换传入的 `record.save`：在 save 前先 `record.__syncData()`，确保包装层 data 与 legacy 一致，然后再调用原 save。

> 这段逻辑的本质是：**把 legacy datapoint 当作事实来源，跨 view 扩充其 fieldsInfo/字段数据，最后再包装成新 Record。**

### 6.5 `createDataPoint('record', params)`

x2many/new record 的统一入口

只支持 type=record：

- 通过 `mapActiveFieldsToFieldsInfo` 生成 legacy 需要的 `fieldsInfo`
- 构造 `__bm_load_params__`（type/modelName/fields/viewType=form/fieldsInfo/parentID/context）
- 返回 `new Record(this, params, state)`

与 `addNewRecord(list, params)` 配合：

- 从 list 的 parentID 取 parent record 的上下文（BasicModel `_getContext`），并通过 `makeContext([parentContext, params.context])` 合并
- 设置 `params.__syncParent = () => list.__syncData()`，保证新 record 保存/变更后 list 刷新
- 若 `withParentId=true`，把 `parentID=listHandle` 写入 load params，确保 legacy 侧知道它属于哪个 x2many list

---

## 7. 调用链

### 7.1 表单加载

1. 视图层构造 `RelationalModel`（注入 services）
2. `RelationalModel.load()`：
   - 生成 fieldsInfo（首次）
   - new `Record(__bm_load_params__)`
   - `Record.load()` → legacy `bm.load(...)` / `bm.reload(...)`
   - `Record.__syncData()`：完成数据映射
3. `model.notify()` 触发视图渲染

### 7.2 字段编辑（onchange）

1. 字段组件调用 `record.update({ field: newValue })`
2. update batching 合并多个字段变化
3. 将 WOWL 值映射到 legacy 结构（`mapWowlValueToLegacy`）
4. 调 `bm.notifyChanges(handle, changes, { viewType })`
5. BasicModel `_applyChange`：
   - 写入 `_changes`
   - 触发 onchange RPC（如有）并合并返回值、更新 `_domains`、specialData 等
6. `Record.__syncData()`：把 legacy state 映射回 OWL 消费形态
7. `model.notify()` → 视图更新

### 7.3 保存

1. `record.save({stayInEdition, noReload, savePoint})`
2. `checkValidity()`：
   - askChanges（非 urgent）：确保字段组件提交本地值
   - required/modifiers + FieldComponent.isSet + type 特判
3. `bm.save(handle, {reload: !noReload, savePoint, viewType})`
4. 保存成功：
   - `__syncData(true)` + `switchMode`（若需要）+ `notify`

### 7.4 editable x2many

1. `list.addNew({position, context, mode:'edit'})`
2. list savePoint + freezeOrder（稳定列表顺序）
3. `__syncParent({operation:'CREATE', context:[ctx], position})`
4. 父 record 通过 `notifyChanges` 把 x2many commands 写入 `_changes`
5. list `__syncData()` 刷新 records，拿到新行 record
6. `newRecord.switchMode('edit')` 进入行编辑

---

## 8. 扩展与踩坑

### 8.1 值形态

- **many2one**：新层用 `[id, name]`；legacy 用 `{id, display_name}` + datapoint  
  - `Record.update` 里还会手动同步 `display_name` 到 legacy m2o datapoint
- **date/datetime**：新层 luxon；legacy moment  
  - 通过 `serialize/deserialize` 往返转换
- **html**：新层包装为 `markup`，避免 XSS

### 8.2 context/domain

- `DataPoint.context` 是懒的；不要在不需要时强读它（会触发 BasicModel `_getContext` eval）
- modifiers 判断应使用 `evalDomain(modifier, record.evalContext)`，不要直接 `Boolean(modifier)`

### 8.3 onchange 与保存的并发

- legacy BasicModel 的 `mutex` 是一致性核心；  
  `Record.switchMode('edit')` 会等待 `bm.mutex.getUnlockedDef()`，避免“readonly widget 在后台触发的 save/onchange”干扰进入 edit。
- `urgentSave` 会设置 `bypassMutex=true`：这不是常规流程，只用于页面关闭场景。

### 8.4 x2many 父子同步

- 在 x2many list 行内编辑时，`Record.update` 会走 `__syncParent(operation)`，而不是直接 `notifyChanges` 本行 datapoint
- 因此你若自定义逻辑试图“直接改子 record 并保存”，要确保最终形成父 record 的 x2many commands，否则会出现 UI 与实际 commands 不一致。

---

## 9. 结构速查

- `DataPoint`
  - handle/loadParams 双入口
  - lazy `context`
  - `evalContext` 使用 BasicModel lazy eval
- `Record`
  - `__syncData`：类型适配 + x2many 包装为 StaticList
  - `update`：批处理 + notifyChanges / x2many 父写回
  - `checkValidity`：required/modifiers + type/x2many 递归校验
  - `save/discard/urgentSave/archive/unarchive/duplicate/delete`
- `StaticList`
  - `records/editedRecord`
  - `add/addNew/delete/replaceWith/applyCommands`
  - `resequence`：最小 onchange 策略
- `RelationalModel`
  - services 桥接 + `_trigger_up` 事件兼容
  - `load`：KeepLast 防竞态，重建 root Record
  - `duplicateDatapoint`：跨 subview 补齐字段/fieldsInfo
  - `createDataPoint/addNewRecord/updateRecord`

---

## 10. 延伸阅读

如果你要继续深挖（尤其是“为什么 onchange 会这样表现”），建议按顺序阅读：

1. `legacy/js/views/basic/basic_model.js`：
   - `_applyChange` / `_performOnChange` / `_generateChanges` / `_generateX2ManyCommands`
   - `_makeDataPoint`（datapoint 结构与 getContext/getDomain 绑定）
2. `views/legacy_utils.js`：
   - fieldsInfo 形态与 Widget 选择逻辑（legacy 字段兼容关键）
3. `views/utils.js`：
   - `evalDomain` 与 Domain.contains 的调用方式

