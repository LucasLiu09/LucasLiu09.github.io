# Many2OneField 组件分析文档（v2）

## 文件概述
- 文件路径: `addons/web/static/src/views/fields/many2one/many2one_field.js`
- 功能概述: 实现 Odoo 多对一关系字段的交互组件（搜索/选择/快速创建/打开记录/条码扫描）

## 导入模块

| 导入项 | 来源 | 作用 |
|---|---|---|
| browser | @web/core/browser/browser | 浏览器 API 封装（如 `navigator.vibrate`） |
| isMobileOS | @web/core/browser/feature_detection | 检测是否移动端，用于条码按钮显示判断 |
| Dialog | @web/core/dialog/dialog | 通用对话框组件 |
| _lt | @web/core/l10n/translation | 延迟翻译函数（本地化显示名） |
| registry | @web/core/registry | 注册中心，用于注册字段组件 |
| useChildRef, useOwnedDialogs, useService | @web/core/utils/hooks | OWL hooks（服务注入、子节点引用、对话框管理） |
| escape, sprintf | @web/core/utils/strings | 字符串处理、HTML 转义、格式化 |
| Many2XAutocomplete, useOpenMany2XRecord | @web/views/fields/relational_utils | 关系字段公共自动完成组件与打开记录的 Hook |
| BarcodeScanner | @web/webclient/barcode/barcode_scanner | 条码扫描能力（移动端） |
| standardFieldProps | ../standard_field_props | 标准字段通用属性定义 |
| Component, onWillUpdateProps, useState, markup | @odoo/owl | OWL 核心：组件、生命周期、状态、富文本标记 |

## CreateConfirmationDialog 组件

| 成员 | 类型 | 参数 | 返回值 | 作用 |
|---|---|---|---|---|
| 组件类 | class | - | - | 新建确认对话框 |
| title | getter | - | string | 标题：`New: ${props.name}`（延迟翻译） |
| dialogContent | getter | - | markup | 对话框正文："Create <strong>%s</strong> as a new %s?"（HTML，安全转义） |
| onCreate | method | - | Promise<void> | 调用 `props.create()` 后关闭对话框 |
| components | static | - | { Dialog } | 声明子组件 |
| template | static | - | string | 模板：`web.Many2OneField.CreateConfirmationDialog` |

- 预期 props（由调用方传入/服务注入）：
  - `value`: 待创建的名称字符串
  - `name`: 字段显示名（string）
  - `create`: 异步创建函数（调用快速创建）
  - `close`: 由对话框服务注入的关闭函数

## 工具函数

| 名称 | 参数 | 返回值 | 作用 |
|---|---|---|---|
| m2oTupleFromData | data: { id, display_name?, name? } | [id, name] | 从记录数据提取 many2one 标准二元组（优先 `display_name`） |

## Many2OneField 主组件

### setup 初始化

| 名称 | 类型 | 作用 |
|---|---|---|
| orm | service | ORM 服务，调用后端模型方法（如 `name_search`、`read`、`get_formview_action`） |
| action | service | 执行动作，打开界面动作 |
| dialog | service | 对话框服务 |
| notification | service | 通知服务（如显示警告） |
| autocompleteContainerRef | ref | 自动完成容器元素引用，用于控制输入焦点、触发事件 |
| addDialog | hook | 管理当前组件拥有的对话框 |
| focusInput | function | 将焦点设置到自动完成输入框 |
| state.isFloating | state | 是否显示浮动标签（无值时浮动） |
| computeActiveActions(props) | method | 根据 props 计算操作权限：`create`/`createEdit`/`write` |
| openMany2X | hook result | 打开记录（非 to-many）；含回调更新当前字段显示名 |
| update | function | 统一更新入口（接收自动完成返回的数组形式，转为 [id, name]） |
| quickCreate | function | （条件存在）快速创建：将值更新为 `[false, name]` |
| setFloating | function | 设置 `state.isFloating` |
| onWillUpdateProps | lifecycle | nextProps 到来时，刷新浮动状态与操作权限 |

- openMany2X 配置项（传给 `useOpenMany2XRecord`）

| 键 | 值 | 说明 |
|---|---|---|
| resModel | this.relation | 关联模型 |
| activeActions | this.state.activeActions | 动作权限（create/createEdit/write） |
| isToMany | false | many2one 非 to-many |
| onRecordSaved | async (record) => { ... } | 保存后读取 `display_name` 并刷新当前字段值 |
| onClose | () => this.focusInput() | 关闭后回到输入框 |
| fieldString | this.props.string | 字段标签 |

- Many2XAutocompleteProps（传给子组件 `Many2XAutocomplete`）

| 属性 | 值来源 | 说明 |
|---|---|---|
| value | this.displayName | 输入框显示值（首行） |
| id | this.props.id | 字段组件 id |
| placeholder | this.props.placeholder | 占位符 |
| resModel | this.relation | 关联模型 |
| autoSelect | true | 自动选择首条匹配 |
| fieldString | this.props.string | 字段标签 |
| activeActions | this.state.activeActions | 动作权限 |
| update | this.update | 更新回调（把选择结果更新到记录） |
| quickCreate | this.quickCreate | 快速创建（可选） |
| context | this.context | 字段上下文 |
| getDomain | this.getDomain.bind(this) | 动态域函数（返回列表形式） |
| nameCreateField | this.props.nameCreateField | 创建时使用的名称字段 |
| setInputFloats | this.setFloating | 控制浮动状态 |
| autocomplete_container | this.autocompleteContainerRef | 容器引用 |
| kanbanViewId | this.props.kanbanViewId | 可选：kanban 视图 id |

### 计算属性（getters）

| 名称 | 返回值 | 作用 |
|---|---|---|
| relation | string | 关联模型（优先 props.relation，否则从 record.fields[name].relation 取） |
| context | object | 当前字段上下文：`record.getFieldContext(name)` |
| domain | Domain | 当前字段域对象：`record.getFieldDomain(name)` |
| hasExternalButton | boolean | 只读且有值且非浮动时显示外部按钮（打开记录） |
| classFromDecoration | string | 根据 `props.decorations` 返回首个命中的 `text-${name}` 类 |
| displayName | string | 当前值第一行（`value[1].split("\n")[0]`） |
| extraLines | string[] | 当前值除首行外的行（去空白） |
| resId | number/false | 当前值 id：`value && value[0]` |
| value | any | `record.data[name]`（原始存储值） |
| Many2XAutocompleteProps | object | 见上表 |

### 实例方法

| 名称 | 参数 | 返回值 | 作用 |
|---|---|---|---|
| computeActiveActions | props | void | 计算 `create`/`createEdit`/`write` 权限 |
| getDomain | - | any[] | 将 Domain 对象转为列表形式（含 context） |
| openAction | - | Promise<void> | 调用模型 `get_formview_action` 后执行动作打开表单 |
| openDialog | resId | Promise | 使用 `openMany2X` 打开记录对话框 |
| openConfirmationDialog | request: string | Promise | 弹出确认创建对话框；确认后调用 `quickCreate` |
| onClick | ev | void | 只读且可打开时，阻止冒泡并打开动作 |
| onExternalBtnClick | - | void | 根据 `openTarget` 在当前或对话框中打开 |
| onBarcodeBtnClick | - | Promise<void> | 触发扫描；成功后振动，失败提醒重扫 |
| search | barcode: string | Promise<Array<{id,name}>> | 调用 `name_search`（limit=2）返回候选 |
| onBarcodeScanned | barcode: string | Promise<void> | 1 条记录即更新；多条则触发输入与可选移动端事件 |
| hasBarcodeButton | - | boolean | 条件：`props.canScanBarcode && isMobileOS() && supported && !hasExternalButton` |

### 静态属性/配置

| 名称 | 值 | 作用 |
|---|---|---|
| SEARCH_MORE_LIMIT | 320 | 搜索更多的限制值（供外部使用） |
| template | "web.Many2OneField" | 组件模板名称 |
| components | { Many2XAutocomplete } | 使用子组件 |
| props | 见下 | 组件属性定义与校验 |
| defaultProps | 见下 | 默认属性值 |
| displayName | _lt("Many2one") | 字段显示名（本地化） |
| supportedTypes | ["many2one"] | 支持的字段类型 |

### props 定义

| 名称 | 类型 | 可选 | 校验/说明 | 默认值 |
|---|---|---|---|---|
| placeholder | String | 是 | - | - |
| canOpen | Boolean | 是 | - | true |
| canCreate | Boolean | 是 | - | true |
| canWrite | Boolean | 是 | - | true |
| canQuickCreate | Boolean | 是 | - | true |
| canCreateEdit | Boolean | 是 | - | true |
| nameCreateField | String | 是 | 创建名称字段 | "name" |
| searchLimit | Number | 是 | - | 7 |
| relation | String | 是 | 关联模型 | - |
| string | String | 是 | 字段标签 | "" |
| canScanBarcode | Boolean | 是 | - | false |
| openTarget | String | 是 | validate: 只能是 `current` 或 `new` | "current" |
| kanbanViewId | Number/Boolean | 是 | - | - |

### defaultProps

| 名称 | 值 |
|---|---|
| canOpen | true |
| canCreate | true |
| canWrite | true |
| canQuickCreate | true |
| canCreateEdit | true |
| nameCreateField | "name" |
| searchLimit | 7 |
| string | "" |
| canScanBarcode | false |
| openTarget | "current" |

### extractProps 静态方法

输入：`({ attrs, field })`

| 逻辑 | 说明 |
|---|---|
| hasCreatePermission | `attrs.can_create ? JSON.parse(attrs.can_create) : true` |
| hasWritePermission | `attrs.can_write ? JSON.parse(attrs.can_write) : true` |
| noOpen | `Boolean(attrs.options.no_open)` |
| noCreate | `Boolean(attrs.options.no_create)` |
| canCreate | `hasCreatePermission && !noCreate` |
| canWrite | `hasWritePermission` |
| noQuickCreate | `Boolean(attrs.options.no_quick_create)` |
| noCreateEdit | `Boolean(attrs.options.no_create_edit)` |
| canQuickCreate | `canCreate && !noQuickCreate` |
| canCreateEdit | `canCreate && !noCreateEdit` |
| canScanBarcode | `Boolean(attrs.options.can_scan_barcode)` |
| relation | `field.relation` |
| string | `attrs.string || field.string` |
| nameCreateField | `attrs.options.create_name_field` |
| openTarget | `attrs.open_target` |
| kanbanViewId | `attrs.kanban_view_ref ? JSON.parse(attrs.kanban_view_ref) : false` |

返回对象键：`placeholder, canOpen: !noOpen, canCreate, canWrite, canQuickCreate, canCreateEdit, relation, string, nameCreateField, canScanBarcode, openTarget, kanbanViewId`

### 注册

| 类别 | 名称 | 说明 |
|---|---|---|
| fields | "many2one" | 主注册名称（阻止回退到旧部件） |
| fields | "list.many2one" | 列表视图 many2one |
| fields | "kanban.many2one" | 看板视图 many2one |

## 备注与设计要点
- 自动完成、快速创建、对话框、条码扫描整合于同一组件，依赖上下文与域动态计算。
- `onRecordSaved` 确保编辑对话框保存后本字段显示名及时刷新。
- 条码扫描仅在移动端支持且未显示外部按钮时出现，避免 UI 冲突。
- `openTarget` 支持在当前页面或新对话框打开，适配不同布局/对话上下文。 