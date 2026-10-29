---
title: Odoo 18 到 Odoo 20 开发迁移
description: 对照 18.0 与 20.0 源码，说明 OWL、模型公共方法和前端视图 template 的差异，以及自定义模块的改法
sidebar_label: Odoo 18 到 20 开发迁移
keyword:
  - odoo
  - odoo18
  - odoo20
  - owl
  - orm
tags:
    - odoo
    - odoo development
last_update:
  date: 2026/10/29
  author: Lucas
---

# Odoo 18 到 Odoo 20 开发迁移

> 文档由 AI 生成

Odoo 20.0 的 Web Client 跑在 Owl 3 上，ORM 公共方法、权限模型和视图 template 的写法都已经换过。自定义模块从 18.0 直接改到 20.0 时，18.0 里仍能用的废弃 API 会在 19 或 20 上导入失败或绑错参数。20.0 自带的 Owl 兼容层只补门户、环境和旧版 `useEffect` 语义，`useState`、`useRef` 和 `static props` 仍要改。

本文对照的是 2026-10-29 拉取的 `18.0` 与 `20.0` 分支。20.0 里的 Owl 构建版本是 `3.0.0-alpha.50`（包内日期 2026-10-19），钩子名单还可能再变。

## 迁移Skill

[skill-odoo18-to-odoo20-upgrade.zip](./odoo18-to-odoo20-upgrade.zip)

## 定位

| 项 | Odoo 18.0 | Odoo 20.0 |
| :--- | :--- | :--- |
| 版本常量 | `odoo/release.py` 的 `version_info = (18, 0, 0, FINAL, 0, '')` | 同文件 `version_info = (20, 0, 0, FINAL, 0, '')` |
| Python | `setup.py` 的 `python_requires='>=3.10'` | `odoo/release.py`：`MIN_PY_VERSION = (3, 12)`，`MAX_PY_VERSION = (3, 14)` |
| PostgreSQL | `release.py` 未写最低版本 | `MIN_PG_VERSION = 16` |
| OWL | `addons/web/static/lib/owl/owl.js`，`version = "2.8.4"` | 同路径，`version = "3.0.0-alpha.50"` |
| OWL 入口 | `odoo.define("@odoo/owl")` 直接返回全局 `owl` | 同一模块依赖 `@web/owl2/utils` 后再返回 `owl` |
| ORM 事实来源 | `odoo/models.py`、`odoo/fields.py`、`odoo/api.py` | `odoo/orm/`；`odoo/models`、`odoo/fields`、`odoo/api` 是再导出包 |
| 视图 | `addons/web/static/src/views/` 含 form、list、kanban 等 | 同目录，另有 `views/card/` |
| 代码改写 | 无 20.0 这套脚本 | `odoo/upgrade_code/`，入口 `odoo-bin upgrade_code` |

`from odoo import api, fields, models` 在 20.0 仍然成立。`odoo/models/__init__.py` 从 `odoo.orm.models` 导出 `Model`、`TransientModel` 和 `get_public_method`。旧的单文件 `odoo/models.py` 在 20.0 上不存在。

## 机制

18.0 到 20.0 中间隔着 19.0，以及 Online 上的 18.1–19.4。这些中间版本里标成废弃的方法，到 20.0 多数已经删掉，调用会在导入或第一次执行时失败。

后端把实现拆进 `odoo/orm/`，开发者仍从 `odoo.models`、`odoo.fields`、`odoo.api` 导入。权限从「`ir.model.access` 管模型、`ir.rule` 管记录」收成一条 `ir.access`，每条记录带一个 `operation` 和一个可选 `domain`。

前端把 Owl 2.8 换成 Owl 3。核心视图 template 已经按 Owl 3 写：表达式带 `this.`，`t-ref` 指向 signal。`addons/web/static/src/owl2/owl3_compatibility_layer.js` 是临时桥，文件头写明要逐步拆掉。它在 `Component` 构造函数里拒绝 `static props` / `static defaultProps`，并补上 `useLayoutEffect`、`useEnv`、`useSubEnv`、`onWillRender` 和 `t-custom-portal`。

## 组成

| 对象 | 18.0 位置 | 20.0 位置 | 职责 |
| :--- | :--- | :--- | :--- |
| `BaseModel` | `odoo/models.py` | `odoo/orm/models.py`，经 `odoo.models` 导出 | 记录集与公共 ORM 方法 |
| `get_public_method` | `odoo/service/model.py` | `odoo/orm/models.py` | RPC 只允许它返回的方法 |
| `call_kw` | `odoo/api.py` | `odoo/service/model.py` | 执行 RPC，并把 recordset 结果收成 id |
| `@api.private` | `odoo/api.py` | `odoo/orm/decorators.py` | 标记不能远程调用的公开方法 |
| `Domain` | 18.0 仍用 `odoo.osv.expression` | `odoo.orm.domains.Domain`，由 `odoo.fields` 导出 | 组合搜索域 |
| `ir.access` | 不存在；用 `ir.model.access` 与 `ir.rule` | `odoo/addons/base/models/ir_access.py` | 模型权限和记录规则 |
| Owl `Component` | Owl 2.8.4 | Owl 3，再被兼容层子类替换 | 组件实例、`this.props`、`this.env` |
| `Card` / `CardArchParser` | 无独立 card 视图；kanban 自己解析 `card` 或 `kanban-box` | `addons/web/static/src/views/card/` | kanban 与 card 共用的 arch |
| `owl3-migration` | 无 | `odoo/upgrade_code/owl3-migration.py` | 改写自定义 JS/XML |

## OWL

20.0 的 `@odoo/owl` 导出里有 `Component`、`App`、`Plugin`、`useEffect`、`useProps`、`usePlugin`、`providePlugins`、`proxy`、`signal`、`computed`、`effect`、`useListener`、`onWillUpdateProps`、`onMounted`、`onPatched`、`onWillPatch`。Owl 3 的 `Component` 仍执行 `this.props = props`。

同一份包里没有 `useState`、`useRef`、`useExternalListener`。`reactive` 只出现在类型检查函数名里，不是 Owl 2 的 `reactive()`。`@web/owl2/utils.js` 当前只再导出四样：`render`、`onWillRender`、`useLayoutEffect`、`useEnv`、`useSubEnv`。脚本若把 `useRef` 改成从 `@web/owl2/utils` 导入，对这份 20.0 树是对不上的。

### 兼容层实际补上的行为

`owl3_compatibility_layer.js` 的文件头要求先做两件事，再加载该文件：

- template 里 `t-portal` 改为 `t-custom-portal`，`t-model` 改为 `t-custom-model`
- `useEffect` 改为 `useLayoutEffect`

构造函数在发现 `static props` 或 `static defaultProps` 时直接抛错，并提示改成 `props = useProps(...)`。兼容层注册的自定义指令只有 portal（对应 template 里的 `t-custom-portal`）。`useLayoutEffect(effect, computeDependencies)` 按 Owl 2 的依赖数组比较后再跑 effect。

Owl 3 自己的 `useEffect` 只接收一个函数：

```javascript
function useEffect(fn) {
    onWillDestroy(effect(fn));
}
```

第二个参数会被 JavaScript 丢掉。依赖数组里的普通值不再触发重跑，effect 只跟踪函数体内读到的 signal。

Owl 3 的 `t-model` 要求表达式求值结果是带 `set` 的函数，也就是 `signal`。`useState` 出来的普通属性会触发 `Invalid t-model expression`。

### 核心组件的写法

`addons/web/static/src/views/card/card.js` 是 20.0 核心组件的参照：

```javascript
import { Component, signal, t, useProps, xml } from "@odoo/owl";

export class Card extends Component {
    static template = xml`
        <div class="o_card" t-att-class="this.props.className" t-ref="this.rootRef">
            ...
        </div>`;
    props = useProps({
        card: t.any(),
        resModel: t.any(),
        resId: t.any().optional(),
        className: t.any().optional(),
    });
    rootRef = signal.ref();
}
```

template 里的组件属性、方法和 props 都带 `this.`。`t-ref` 的值是 signal 表达式 `this.rootRef`，读取 DOM 用 `this.rootRef()`，不再用 `useRef("root").el`。

### `owl3-migration` 会改什么

`odoo/upgrade_code/owl3-migration.py` 的 `upgrade()` 按这个顺序改文件：

1. `useEffect` → `useLayoutEffect`，导入改为 `@web/owl2/utils`
2. `onWillRender`、`onRendered`、`useComponent`、`useEnv`、`useSubEnv`、`useChildSubEnv`、`useRef`、`useExternalListener` 的导入改到 `@web/owl2/utils`
3. `useState` / 单参数 `reactive` → `proxy`
4. `t-portal` → `t-custom-portal`，`t-esc` → `t-out`，`t-ref` → `t-custom-ref`，`t-model` → `t-custom-model`
5. 给组件 template 里来自组件的自由变量加上 `this.`
6. `t-slot` → `t-call-slot`；子节点 `t-set` 收成 `t-call` 的参数
7. 映射表里的 `useService("...")` → `usePlugin(PluginClass)`

映射表里有 `action`、`notification`、`ui`、`hotkey`、`overlay`、`effect`、`bus_service` 等。没列进去的服务名，脚本不会动。

`@web/owl2/utils.js` 并没有导出 `useRef`、`onRendered`、`useComponent`。脚本改完导入后，这些符号在当前 20.0 树上仍然解析失败。`t-custom-ref` 和 `t-custom-model` 也没有在兼容层里注册。自定义组件应改成 `card.js` 那种 signal，而不是停在脚本改出来的 `t-custom-*` 上。

## 后端模型与公共方法

### RPC 与 `get_public_method`

18.0 的 `odoo/service/model.py` 已经规定：以下划线开头、标了 `@api.private`，或落在 `_UNSAFE_ATTRIBUTES` 里的方法，RPC 调用抛 `AccessError`。20.0 把同一函数放到 `odoo/orm/models.py`，`call_kw` 只调用它的返回值。

20.0 的 `call_kw` 在方法返回 `BaseModel` 时改成 `ids`（`create` 在传入单个 dict 时返回一个 id）。18.0 的 `@api.returns` 在 `odoo/api.py` 里还在；20.0 的 `odoo/orm/decorators.py` 没有 `returns`。远程调用方拿到的是 id 列表。

`@api.model` 套在 `create` 上时，20.0 的装饰器把它转成 `model_create_multi`。`create` 既可以收一个 dict，也可以收 dict 列表。

### 权限

18.0 同时有新方法和旧方法。旧方法打废弃警告后转调新方法：

| 18.0 仍可用 | 20.0 |
| :--- | :--- |
| `check_access(operation)` | 仍在，内部走 `ir.access` |
| `has_access(operation)` | 仍在，标了 `@typing.final` |
| `_filtered_access(operation)` | 仍在 |
| `check_access_rights` / `check_access_rule` | 方法已删除 |
| `_filter_access_rules` / `_filter_access_rules_python` | 方法已删除 |

20.0 的 `check_access` 在失败时用 `_access_domain(operation)` 组错误信息。域里可以使用运算符 `access`，用来引用另一模型的权限。空 recordset 上 `records.browse().check_access('read')` 仍然表示「这个用户对模型有没有起码的读权限」。

权限数据模型换成 `ir.access`。`group_id` 有值是 permission，空 group 是 restriction。`operation` 是 `crud` 的子集，例如 `cru`、`r`、`rd`。

```csv
id,name,model_id:id,group_id:id,perm_read,perm_write,perm_create,perm_unlink
access_my_model_user,my.model user,model_my_model,base.group_user,1,1,1,0
```

```csv
id,name,model_id,group_id/id,operation,domain
access_my_model_user,my.model user,my.model,base.group_user,cru,
```

`security/ir.model.access.csv` 不再被 20.0 当作权限事实来源。改写脚本是 `odoo/upgrade_code/19.4-00-ir-access.py`，输出要按角色再看一遍 domain。

用户、视图、菜单上的 `groups_id` 在 19 起改为 `group_ids`，20.0 的视图 RNG 里没有 `groups_id`。`res.groups` 不再用 `category_id`，分类挂在 `res.groups.privilege` 上，组本身写 `privilege_id`。

### `read_group`

18.0 的公开方法签名是：

```python
def read_group(self, domain, fields, groupby, offset=0, limit=None, orderby=False, lazy=True)
```

返回值是 dict 列表，里面有分组字段、`__domain`、`__context`。

20.0 的公开 `read_group` 与 `_read_group` 对齐，第二个位置参数是 `groupby`，不再是字段列表：

```python
def read_group(self, domain, groupby=(), aggregates=(), having=(), offset=0, limit=None, order=None) -> list[tuple]
```

返回扁平元组 `(分组值..., 聚合值...)`。关联字段在分组位置上变成 id，在聚合位置上变成 id 列表。`lazy` 参数没有了。

后端统计用 `_read_group`，得到的关联字段是 recordset。给界面用的格式化结果在 `addons/web/models/models.py` 的 `formatted_read_group`，返回 `list[dict]`。列表和看板的分组加载走 `web_read_group`。

旧调用 `read_group(domain, ['amount_total:sum'], ['partner_id'], lazy=False)` 会把聚合说明绑到 `groupby` 上。

### 搜索、域、约束

| 主题 | 18.0 | 20.0 |
| :--- | :--- | :--- |
| `name_search` | `name='', args=None, operator='ilike', limit=100`，内部用 `expression.AND` | 参数名是 `domain`；`Domain('display_name', operator, name) & Domain(domain or Domain.TRUE)` |
| 域组合 | `from odoo.osv import expression` | `odoo/osv/expression.py` 返回 404。`from odoo.fields import Domain`，用 `&`、`\|`、`~` |
| `group_operator` | `odoo/fields.py` 警告后改写成 `aggregator` | `odoo/orm/fields.py` 中已无这个参数，字段退回默认聚合 |
| `_sql_constraints` | 类属性列表 | 不再生效。改成 `_name_uniq = models.Constraint('UNIQUE(name)', "...")`，索引用 `models.Index` |
| `_check_recursion` | 无环时返回真，并警告改用 `_has_cycle` | 方法已删除。`_has_cycle()` 在有环时返回 `True` |
| `toggle_active` | 仍在 | 已删除。归档走 `action_archive` / `action_unarchive` |
| `concat` / `union` | `concat(self, *args)` | `concat(self, it=(), /, *args)`，第一个位置参数可以是可迭代对象 |
| `_table_query` | 模型上存在 | `odoo/orm/models.py` 中已无此属性 |
| 时区 | 常用 `pytz` | `Environment.tz` 返回 `zoneinfo.ZoneInfo`，缺省 `datetime.UTC`。`pytz` 不再是依赖 |
| 系统参数 | `get_param` / `set_param` 返回字符串 | `get_bool`、`get_int`、`get_float`、`get_str` 与对应的 `set_*`。类名是 `IrConfig_Parameter`，`_name` 仍是 `ir.config_parameter` |

`name_search` 的覆盖若仍写成 `args`，关键字调用 `domain=` 会得到 `TypeError`。

计算字段的 search 方法在 19 起收到的等值运算符是 `in` / `not in`，值是集合。`('flag', '=', True)` 到达 `_search_*` 时是 `operator == 'in'` 且 `value == {True}`。返回 `Domain` 或旧的域列表都可以。

`_cr`、`_uid`、`_context` 在 19 起打废弃警告。20.0 应写 `self.env.cr`、`self.env.uid`、`self.env.context`。

控制器 `@http.route(..., type="json")` 由 `odoo/upgrade_code/18.1-02-route-jsonrpc.py` 改成 `type="jsonrpc"`。脚本只处理路径里带 `controllers` 的 Python 文件。

### Binary

`odoo/orm/fields_binary.py` 里 `Binary` 的缓存类型是 `BinaryValue`。

- 记录上读到的是 `BinaryValue`（空值是 `EMPTY_BINARY`），不是 base64 字符串。字节在 `.content`，另有 `.filename`、`.size`、`.mimetype`。
- `convert_to_read` 给 RPC 的是 dict：`content`（base64）、`size`，有文件名时再加 `filename`。
- 写入时，`str` 按 base64 解码；`dict` 要有 `content`，可以带 `filename`；除字段名 `raw` 以外，直接写 `bytes` 会 `TypeError`。
- 存在 `ir.attachment` 上的二进制，`create` / `write` 写的是 `raw`。

`ir.attachment` 上继续使用 `datas` 的代码要改成 `raw`，并按 `BinaryValue` 处理读到的值。

## 前端视图与 template

### 视图种类

18.0 的 `addons/web/static/src/views/` 有 calendar、fields、form、graph、kanban、list、pivot。20.0 增加 `card/`，以及 `action_helper.js`。kanban 的 arch 解析改为调用 `CardArchParser`。

`CardArchParser` 要求存在 `t-name="card"`。没有这个 template 就抛 `Missing 'card' template.`。many2many 在 card 里默认补上 widget `many2many_tags`。

18.0 的 `kanban_arch_parser.js` 在只有 `t-name="kanban-box"` 时打控制台警告，然后继续用旧 template。20.0 不再走这条分支。

```xml
<templates>
    <t t-name="kanban-box">
        <div class="oe_kanban_global_click">
            <strong><field name="name"/></strong>
        </div>
    </t>
</templates>
```

```xml
<templates>
    <t t-name="card" class="oe_kanban_global_click">
        <field name="name" class="fw-bold"/>
    </t>
</templates>
```

card 内部的字段是直接子节点。颜色用 `<field name="color" widget="kanban_color_picker"/>`。`selection_badge` 的字段文件在 20.0 上是 404；selection 用 `badges_selection`，many2one 用 `badges_many2one`。

### OWL template

`web.ListRenderer` 的 template 把渲染上下文从「自由变量」改成「组件上的 `this`」。

18.0：

```xml
<t t-name="web.ListRenderer">
    <t t-set="_canSelectRecord" t-value="canSelectRecord"/>
    <div class="o_list_renderer o_renderer table-responsive" t-ref="root">
        <t t-if="showNoContentHelper" t-call="web.ActionHelper">
            <t t-set="noContentHelp" t-value="props.noContentHelp"/>
        </t>
    </div>
</t>
```

20.0：

```xml
<t t-name="web.ListRenderer">
    <t t-set="_canSelectRecord" t-value="this.canSelectRecord"/>
    <div class="o_list_renderer o_renderer table-responsive" t-ref="this.rootRef">
        <t t-if="this.showNoContentHelper">
            <ActionHelper noContentHelp="this.props.noContentHelp"/>
        </t>
    </div>
</t>
```

继承 `web.ListRenderer`、`web.FormRenderer` 或其他 OWL template 的 xpath，新增表达式也要带 `this.`。`t-esc` 在 20.0 的 list renderer 里已经没有，输出用 `t-out`。`t-call` 包一层 `t-set` 传参的写法，由 `odoo/upgrade_code/19.1-00-t-call.py` 收成 `t-call` 的属性；Owl 3 里 `t-call` 的函数体是惰性求值的。

`t-ref="root"` 这种字符串 ref 对应 Owl 2 的 `useRef`。20.0 核心 template 写的是 `t-ref="this.rootRef"`。

### 搜索视图与图标

20.0 的 `common.rng` 里，`<group>` 的属性是 colspan、name、invisible 等，没有 `string`，也没有 `expand`。搜索视图里的 `<group string="Group By" expand="0">` 过不了 RNG。

`odoo/upgrade_code/20.0-00-search-date-filters.py` 删除 date 过滤器上的 `start_month`、`end_month`、`start_year`、`end_year`。20.0 的 `common.rng` 里已经没有 `start_month`。模块 XML 里留下这些属性，安装时校验失败。

Font Awesome 的 `fa fa-*` 和旧的 `oi-*` 图标类不再由原来的 SCSS 兜底。`odoo/upgrade_code/19.5-00-material-symbols-icons.py` 把 `<i class="fa fa-user"/>` 改成 `<i class="oi" data-icon="person"/>`。动态拼出来的 class，以及存在数据库里的图标名，脚本覆盖不到。

## 调用链

自定义模块进 20.0 的机械改写走 `upgrade_code`：

1. 在 20.0 的源码树上执行 `odoo-bin upgrade_code --addons-path=<自定义模块> --from 18.0 --dry-run`，先看 diff。
2. 去掉 `--dry-run` 再跑。`--from 18.0` 会带上该版本之后的脚本，其中包括 `_sql_constraints`、`type="jsonrpc"`、`ir.access`、Material Symbols、搜索视图日期属性。
3. `owl3-migration` 没有版本前缀，`--from` 不会自动选中它。需要再执行一次 `odoo-bin upgrade_code --addons-path=<自定义模块> --script owl3-migration`。
4. 人工改脚本碰不到或会改错的部分：`static props`、`useRef` / `t-ref`、`t-model` 与 signal、`read_group` 的参数顺序、`BinaryValue`、`get_param`、kanban 的 `card` template。

脚本自己的说明是尽力改写。`19.1-00-t-call.py` 带有 `# test: false`，改动面大，diff 要逐个看。

## 场景

### 自定义 OWL 字段

18.0 字段组件通常是 `static props = {...}`，`setup()` 里 `useState`，template 写 `t-ref="input"` 和 `t-esc="value"`。放到 20.0 上，兼容层会在构造时因 `static props` 抛错；即便先删掉静态 props，`import { useState } from "@odoo/owl"` 也会因为导出名不存在而失败。

改成 `props = useProps({...})`，状态用 `proxy` 或 `signal`，DOM 引用用 `signal.ref()`，template 写成 `t-ref="this.inputRef"`、`t-out="this.value"`。输入框双向绑定用 `t-model="this.text"`，且 `this.text` 必须是 `signal`。

### 统计按钮调用 `read_group`

18.0 里 `self.env['sale.order'].read_group(domain, ['amount_total:sum'], ['partner_id'])` 得到 dict。20.0 上同一行会把 `['amount_total:sum']` 当成 groupby。后端改成：

```python
for partner, total in self.env['sale.order']._read_group(
    domain, ['partner_id'], ['amount_total:sum']
):
    ...
```

`partner` 在 `_read_group` 里是 recordset。若调用方要 18.0 那种 dict，改用 `formatted_read_group`。

### 看板 arch

只把 `<kanban>` 根节点留着、内部仍是 `t-name="kanban-box"` 的视图，在 18.0 能打开并在控制台看到废弃警告。20.0 的 kanban 解析进入 `CardArchParser` 后抛 `Missing 'card' template.`，视图无法加载。

## 升级步骤

1. 把运行环境升到 Python 3.12–3.14、PostgreSQL 16。去掉业务代码里的 `pytz`，时间转换改为 `dt.replace(tzinfo=UTC).astimezone(self.env.tz)`。
2. 在 20.0 代码树上对自定义 addons 跑 `upgrade_code --from 18.0`，再单独跑 `--script owl3-migration`。提交前看完整 diff。
3. 搜 `static props`、`static defaultProps`、`useState`、`useRef`、`useExternalListener`、`from "@odoo/owl"`。`static props` 改成 `props = useProps`。`useState` 改成 `proxy`。`useRef` 改成 `signal.ref()`，template 使用 `t-ref="this.xxx"`。
4. 搜 `t-esc`、`t-portal`、`t-model`、`t-ref`。输出改 `t-out`。`t-model` 的表达式改成 signal。组件 template 里对 props、state、方法的引用加上 `this.`。
5. 仍要 patch `action`、`notification`、`ui` 等服务时，对照 `owl3-migration.py` 里的 `SERVICES_MAPPING`，改为对应的 `usePlugin`。映射表以外的 `useService` 保持原调用，并在 20.0 上打开界面确认服务还在 registry 里。
6. 模型方法：删除 `@api.returns`；`name_search(..., args=` 改为 `domain=`；`check_access_rights` / `check_access_rule` / `_filter_access_rules` 改为 `check_access`、`has_access`、`_filtered_access`；`_check_recursion` 改为 `if self._has_cycle()`；`toggle_active` 的覆盖改到 `action_archive`。
7. `read_group` 的覆盖和调用改为 `_read_group(domain, groupby, aggregates)` 或 `formatted_read_group`。不要保留 `lazy`。
8. `from odoo.osv import expression` 改为 `from odoo.fields import Domain`。`group_operator=` 改为 `aggregator=`。`_sql_constraints` 改为 `models.Constraint` / `models.Index`。
9. `get_param` / `set_param` 改为 `get_str`、`get_bool`、`get_int`、`get_float` 和对应的 `set_*`。二进制字段按 `BinaryValue` 读写，附件字段用 `raw`。
10. 安全文件改为 `security/ir.access.csv`。`groups_id` 改为 `group_ids`。`res.groups` 的 `category_id` 改为先建 `res.groups.privilege`，再写 `privilege_id`。用每个组的真实用户测读、写、创建、删除，不要只测管理员。
11. 看板 template 改为 `t-name="card"`。`selection_badge` 按字段类型改为 `badges_selection` 或 `badges_many2one`。搜索视图去掉 `<group>` 上的 `string` 和 `expand`，以及 date 过滤器上的 `start_month`、`end_month`、`start_year`、`end_year`。
12. 跑图标脚本，再全局搜 `fa fa-` 和拼出来的图标 class。继承 OWL 视图的 xpath 补上 `this.`。
13. 控制器 `type="json"` 改为 `type="jsonrpc"`。外部 XML-RPC / JSON-RPC 若依赖 `read_group` 的 dict、`@api.returns` 的 recordset，或二进制字段的纯 base64 字符串，要按新的元组、id 列表和 `{content, size, filename}` 改。
14. 测试不要依赖默认 demo 数据。`BaseCommon` 在 20.0 默认以普通内部用户运行，需要管理员时设置 `_test_user_groups = None`，或写上测试需要的组。

## 边界

- **注意** Owl 包版本是 `3.0.0-alpha.50`。本文记录的是这份构建的导出名单；后续 20.0 提交可能继续删钩子。升级前重新打开 `addons/web/static/lib/owl/owl.js` 里的 `version`。
- **注意** `owl3-migration` 会把 `useRef` 和 `onRendered` 的导入指到 `@web/owl2/utils`，而该文件当前没有这些导出。脚本跑完后模块加载失败时，按 `signal.ref()` 和 `onMounted` / `effect` 手改。
- **注意** 兼容层没有注册 `t-custom-model` 和 `t-custom-ref`。脚本改名之后，输入框和 DOM 引用要以 `card.js` 的 signal 写法再核对一次。
- **警告** `read_group` 的参数位置变了，旧的位置参数不会抛 `TypeError`，会算错分组。
- **警告** `group_operator` 在 20.0 是未知字段参数，启动警告之后字段使用默认聚合，报表数字会变。
- **警告** `_sql_constraints` 被忽略时只打日志，数据库里不会建约束。
- **警告** `has_access` 在 20.0 是 `@typing.final`，子类不能再覆盖它。收紧权限要覆盖 `_check_access` 或改 `ir.access` 的 domain。
- **警告** 图标脚本和 `t-call` 脚本是尽力改写。动态 class、存在数据库里的 arch、以及 `# test: false` 的脚本结果都要人工看。

## 对照

| 维度 | Odoo 18.0 | Odoo 20.0 |
| :--- | :--- | :--- |
| OWL | 2.8.4；`useState`、`useRef`、`static props`、字符串 `t-ref` | 3.0.0-alpha.50；`proxy` / `signal` / `useProps`；template 使用 `this.` |
| 兼容层 | 无 | `owl3_compatibility_layer.js`，只补 portal、env、`useLayoutEffect`、`onWillRender` |
| RPC 结果 | `@api.returns` 决定 recordset 如何序列化 | `call_kw` 把 `BaseModel` 收成 id |
| 权限检查 | `check_access` 已存在，旧方法警告后转发 | 只剩 `check_access` / `has_access` / `_filtered_access` |
| 权限数据 | `ir.model.access` + `ir.rule` | `ir.access` 的 `operation` + `domain` |
| 分组 | `read_group(domain, fields, groupby, ..., lazy)` 返回 dict | `read_group(domain, groupby, aggregates)` 返回 tuple；界面用 `formatted_read_group` |
| 域 | `odoo.osv.expression` | `odoo.fields.Domain` |
| 二进制 | base64 字符串贯穿读写 | Python 侧 `BinaryValue`；`read` 的 RPC 是 `{content, size, filename}` |
| 看板 | `kanban-box` 警告后仍渲染 | 必须有 `t-name="card"`，否则抛错 |
| 列表 template | `t-ref="root"`，`t-esc`，`t-call` 传 `t-set` | `t-ref="this.rootRef"`，`t-out`，空状态用 `ActionHelper` 组件 |
| 图标 | `fa` / `oi` class | Material Symbols：`class="oi" data-icon="..."` |

## 参考阅读

- `odoo/release.py`：20.0 的 Python 与 PostgreSQL 下限
- `addons/web/static/src/owl2/owl3_compatibility_layer.js`：兼容层实际打过哪些补丁
- `addons/web/static/src/owl2/utils.js`：兼容层对外再导出的符号
- `odoo/upgrade_code/owl3-migration.py`：OWL 改写脚本的步骤和 `SERVICES_MAPPING`
- `odoo/orm/models.py`：`read_group`、`_read_group`、`check_access`、`_has_cycle`、`action_archive`
- `odoo/service/model.py`：20.0 的 `call_kw`
- `odoo/addons/base/models/ir_access.py`：`operation` 与 permission / restriction
- `odoo/orm/fields_binary.py`：`Binary.convert_to_read` 与 `convert_to_cache`
- `odoo/addons/base/models/ir_config_parameter.py`：`get_str` / `set_str` 等
- `addons/web/static/src/views/card/card.js`：Owl 3 组件、`useProps` 和 `signal.ref`
- `addons/web/static/src/views/list/list_renderer.xml`：视图 template 的 `this.`
- `addons/web/models/models.py`：`formatted_read_group`、`web_read_group`
- [ORM changelog](https://www.odoo.com/documentation/20.0/developer/reference/backend/orm/changelog.html)：18.0 之后各版 ORM 变更的官方条目
- [Owl 2 到 Owl 3 迁移草稿](https://odoo.github.io/owl/documentation/v3/owl/migration_owl2_to_owl3.html)：上游草稿；以 20.0 包内导出和兼容层为准，草稿里已删除的 `onWillUpdateProps` 在 `3.0.0-alpha.50` 中仍有导出
