---
title: 权限体系详解(Odoo 16)
description: 权限体系详解(Odoo 16)
sidebar_label: 权限体系详解(Odoo 16)
keyword:
    - odoo
    - odoo development
tags: [odoo]
last_update:
  date: 2026/2/2
  author: Lucas
---

# Odoo 16 权限体系详解：`res.groups`、`ir.model.access` 与 `ir.rule`

:::info
面向“要写对权限、能解释清楚为什么”的开发者说明文档。
:::

本文把 Odoo 中最核心的三块权限机制讲透：

- **权限组**：`res.groups`（用户属于哪些组、组之间如何继承）
- **模型访问权限**：`ir.model.access`（某个组对某个模型的 CRUD 是否有“入场券”）
- **记录规则**：`ir.rule`（在已拥有模型权限前提下，进一步限制“能看/能改哪些记录”）

> 结论先行：**一次业务访问是否被允许 =（模型级 CRUD 允许）AND（记录级规则允许）**。  
> 其中，`res.groups` 是“把用户归类”的载体；`ir.model.access` 是“模型级门禁”；`ir.rule` 是“记录级栅栏”。
> **能不能做 = access 允许**；**能对哪些记录做 = rule 允许**；**groups 决定你命中哪些 access/rule**。

---

## 1. `res.groups`（权限组）详解

### 1.1 它解决什么问题

Odoo 的安全配置不是“逐个用户”定义，而是以**组**为单位定义，再把用户加入组：

- 组用来表达一个角色/权限集合：如“销售用户”、“销售经理”、“仓库用户”、“自定义模块-审批人”
- 访问权限（`ir.model.access`）与记录规则（`ir.rule`）通常都**绑定组**生效
- 菜单、动作、视图/字段也常用 `groups="..."` 做 UI 层的可见性控制（注意：**UI 隐藏 ≠ 安全**）

### 1.2 关键字段与常见用法（开发视角）

`res.groups` 常用字段（非完整）：

- **`name`**：组名称
- **`category_id`**：组分类（影响设置界面展示）
- **`users`**：组成员（Many2many 到 `res.users`）
- **`implied_ids`**：**组继承**（一个组隐含包含另一些组）
- **`share`**：是否为“共享用户/门户类用户”相关（影响用户类型与一些默认行为；不要把内部用户的权限组随意标为 share）

#### 组继承（`implied_ids`）非常关键

`implied_ids` 代表“加入本组就自动拥有被 implied 的组”。用于构建清晰的权限层级：

- “经理组” implied “用户组”
- “高级权限组” implied “基础权限组”

这样做的好处：

- 你只需要在“基础组”上配置通用权限；“高级组”继承即可
- 避免同一个用户需要手工勾一堆相关组，减少配置错误

### 1.3 `groups` 在 UI 与业务中的角色

你会在很多地方看到 `groups="module.group_x"`：

- **菜单/动作/视图元素可见性**：如 `<menuitem groups="..."/>`、`<button groups="..."/>`
- **字段级可见性**：如 `groups="..."` 限制某些字段仅某些组能看到/编辑（仍需后端权限配合）
- **记录规则与访问权限的归属**：`ir.rule.groups`、`ir.model.access.group_id`

> 重要提醒：UI 上的 `groups` 只是“前端/视图层过滤”，并不能替代 `ir.model.access` 与 `ir.rule`。  
> 任何敏感数据/操作都必须在 **后端权限** 层保证。

---

## 2. `ir.model.access`（模型访问权限）详解

### 2.1 它解决什么问题

`ir.model.access` 定义：**某个组对某个模型**是否拥有以下权限：

- `perm_read`：读（search/read）
- `perm_write`：写（write）
- `perm_create`：创建（create）
- `perm_unlink`：删除（unlink）

它是所有访问控制的第一道门槛：如果模型级权限不允许，后续记录规则再“放行”也没用。

### 2.2 常用字段

- **`name`**：描述
- **`model_id`**：模型（`ir.model`）
- **`group_id`**：所属组（为空表示“对所有用户”适用——包括公共/门户用户所使用的用户身份也会受到影响）
- **`perm_read/perm_write/perm_create/perm_unlink`**：CRUD 许可

### 2.3 “合并逻辑”：同一模型的多条 access 规则如何算

对同一模型、同一用户而言：

- 系统会找出**所有适用于该用户组**（以及 `group_id` 为空的“全局”）的 `ir.model.access`
- 对每个操作（读/写/建/删），采取**“OR（或）”**逻辑：
  - 只要存在任意一条 access 记录把该 `perm_*` 设为 True，则模型级该操作就视为允许
  - 反之（完全没有允许），则拒绝

这意味着：

- “给用户加一个更高权限组”可能会让他突然获得 CRUD（因为多了一条允许的 access）
- 反过来，“想用一条规则把某组的权限禁掉”通常做不到（因为 OR 合并会被其他允许规则抵消）
  - Odoo 安全模型的惯例是：**用允许规则叠加**，而不是用“显式拒绝”覆盖

---

## 3. `ir.rule`（记录规则 / 记录访问规则）详解

### 3.1 它解决什么问题

在已经通过 `ir.model.access` 的前提下，`ir.rule` 用来限制：

- **能访问哪些记录**（基于域 `domain_force`）
- 并且可以按操作分别控制（读/写/建/删）

典型场景：

- 只能看到“自己创建/负责”的记录
- 只能看到“自己所在公司/部门”的记录
- 门户用户只能看到“自己相关”的订单/工单

### 3.2 常用字段（开发最常用那部分）

- **`name`**：规则名
- **`model_id`**：应用在哪个模型
- **`domain_force`**：强制域（字符串形式的 domain，会在运行时基于用户上下文求值）
- **`groups`**：适用哪些组（Many2many）
- **`global`**：是否为全局规则（**Odoo 中是计算字段：`global = not groups`**）
- **`perm_read/perm_write/perm_create/perm_unlink`**：该规则对哪些操作生效
- **`active`**：是否启用

#### `global` 与 `groups` 的真实含义

在 Odoo（`base/models/ir_rule.py`）里：

- `global` 是一个 **compute + store** 字段，计算逻辑就是：
  - **规则没有配置任何 `groups` ⇒ 该规则就是全局规则（`global=True`）**
  - **规则一旦配置了 `groups` ⇒ 就不再是全局规则（`global=False`）**

因此在 Odoo 中，你可以把记录规则理解为两类（互斥）：

- **全局规则（global rule）**：`groups` 为空  
  - 对“所有普通用户”都生效（超级用户 `sudo()` / `env.su` 会跳过规则）
  - 特点：只会“收紧”可访问集合，很难被“更高权限组”抵消
- **组规则（group rule / local rule）**：`groups` 非空  
  - 仅当用户属于这些组（含 implied 继承来的组）时才生效

#### `domain_force` 写法要点

- 本质是一个 domain 表达式（列表），但以字符串存储
- 常用变量：
  - `user`：当前用户记录（`res.users`）
  - `uid`：当前用户 ID
  - `company_id` / `company_ids`（取决于上下文/实现）
  - `context`：上下文字典
  - `time` / `datetime` 等（按 Odoo 安全域可用变量范围）

示例：只能访问自己创建的记录：

```xml
<record id="rule_my_doc_own" model="ir.rule">
    <field name="name">My Doc: only own</field>
    <field name="model_id" ref="model_my_doc"/>
    <field name="domain_force">[('create_uid', '=', user.id)]</field>
    <field name="groups" eval="[(4, ref('my_module.group_my_doc_user'))]"/>
    <field name="perm_read" eval="1"/>
    <field name="perm_write" eval="1"/>
    <field name="perm_create" eval="1"/>
    <field name="perm_unlink" eval="0"/>
</record>
```

### 3.3 “合并逻辑”：多条记录规则如何共同作用

对同一模型、同一用户、同一操作（例如 read）：

- 系统会先收集**该模型 + 该操作**下适用于当前用户的规则：
  - **全局规则**：`global=True`（也就是 `groups` 为空）
  - **组规则**：`groups` 与用户组有交集
- 然后按 Odoo 16 源码的方式合并成最终域（关键点在于：**全局规则 AND，组规则 OR**）：

整体公式可以记成：

- **最终 domain** \(=\) `AND(全局规则 domains)` **AND** `OR(命中的组规则 domains)`  
- 如果没有任何组规则命中，则：**最终 domain** = `AND(全局规则 domains)`

这带来一个非常重要的安全结论：

- **全局规则一定会叠加收紧（AND），几乎无法靠“再加一个更高权限组”来放开**
- **组规则在同一用户命中多条时是 OR**：只要满足其中任意一条组规则的 domain，就能通过组规则这一段

因此：

- **全局规则越多越严**：访问范围通常越小（`AND` 叠加，交集越来越窄）
- **组规则越多可能越松（同一用户命中多条）**：访问范围可能越大（`OR` 叠加，并集越来越宽）
- 一个“不小心写得太严”的**全局规则**很容易把所有人都锁死（包括经理/管理员）

所以建议以下面建议来定义规则：

- **全局规则**：只放“所有人都必须遵守”的底线（例如多公司隔离）
- **限制性规则（如只能看自己的）**：优先做成**绑定用户组的组规则**，不要写成全局
- **经理/管理员放开**：用一条绑定经理组的组规则（常用 `[(1,'=',1)]`）来放宽 `OR(组规则)`


#### 最常见的大坑：把“用户只能看自己的”写成全局规则

如果你把“只能看自己的”规则写成 **groups 为空**（也就是 global）：

- 该规则会 AND 到所有人身上
- 即使你再给“经理组”写一个 `[(1,'=',1)]` 的放开规则，也只能作为“组规则 OR”的一部分，**无法抵消全局规则的 AND 收紧**

正确做法通常是：

- “只能看自己的”：写成 **用户组规则**（绑定用户组）
- “经理看全部”：写成 **经理组规则**（绑定经理组），让经理同时命中两条组规则，通过 OR 放大范围

### 3.4 记录规则对不同操作的大致影响

- **read**：把你能看见的记录限制在**记录规则最终合并后的 domain** 内（`search`、`read`、many2one 下拉候选等都会受影响）
- **write/unlink**：不仅“看见”受限，尝试修改/删除不在允许集合内的记录会抛 `AccessError`
- **create**：通常表现为创建后对记录的后续访问/校验受限（实践中经常需要同时配置 create + read 规则，否则“能创建但创建后看不到”）

> 实务经验：对某个组允许 `perm_create=1` 时，通常也要确保该组在 read 规则上能看到“自己创建的记录”，否则用户会体验成“点保存成功但列表找不到”。

---

## 4. 三者的关系与执行顺序（最重要）

### 4.1 一次访问的安全链路（概念模型）

以用户在界面/接口中对模型 `my.doc` 执行一次操作为例：

1. **模型级检查（`ir.model.access`）**  
   - 若该用户对 `my.doc` 的该操作没有 CRUD 权限 → 直接拒绝（`AccessError`）
2. **记录级检查（`ir.rule`）**  
   - 若该操作涉及具体记录集合，则必须满足**记录规则最终合并后的 domain**（Odoo 16：全局规则 AND + 组规则 OR）  
   - 否则拒绝（`AccessError`）
3. **业务逻辑层面的额外限制**  
   - 如 `@api.constrains`、Python 代码里的显式校验、工作流状态机等  
   - 这些不是 Odoo 安全框架的三件套，但往往是“最后一道防线”

用一句话总结：

- **`res.groups` 决定“你是谁（属于哪些角色）”**
- **`ir.model.access` 决定“你能不能碰这个模型（CRUD）”**
- **`ir.rule` 决定“你能碰哪些记录（最终合并 domain 过滤后）”**

### 4.2 一个常见误区：只配了组和菜单就以为安全了

- `res.groups` + 菜单 `groups` 只能“让入口看起来不见了”
- 真正的安全必须落到：
  - `ir.model.access`：没有它，后端会直接拒绝或（更糟）被你误配为全局允许
  - `ir.rule`：没有它，用户可能能看见不该看的其他人的记录

### 4.3 `sudo()` / 超级用户对三者的影响

在 Odoo 中，`sudo()`（以超级用户权限执行）通常会：

- 绕过模型访问权限（`ir.model.access`）
- 绕过记录规则（`ir.rule`）

因此：

- **业务代码里使用 `sudo()` 要极其谨慎**：它常被用于系统内部维护、跨用户计算、定时任务等
- 面向最终用户的入口（controller、RPC、button 方法）不应无条件 sudo，否则你的安全配置形同虚设

---

## 5. 使用指南（可直接落地的做法）

下面给一套“新模型从 0 到可用权限”的标准流程与模板，按这个做基本不会翻车。

### 5.1 推荐目录结构

```
my_module/
  security/
    groups.xml
    ir.model.access.csv
    rules.xml
  models/
  views/
  __manifest__.py
```

并在 `__manifest__.py` 中加载：

```python
'data': [
    'security/groups.xml',
    'security/ir.model.access.csv',
    'security/rules.xml',
    # ... views 等
],
```

### 5.2 先定义组：`security/groups.xml`

```xml
<odoo>
  <data noupdate="1">

    <record id="group_my_doc_user" model="res.groups">
      <field name="name">My Doc / 用户</field>
      <field name="category_id" ref="base.module_category_hidden"/>
    </record>

    <record id="group_my_doc_manager" model="res.groups">
      <field name="name">My Doc / 管理员</field>
      <field name="category_id" ref="base.module_category_hidden"/>
      <field name="implied_ids" eval="[(4, ref('my_module.group_my_doc_user'))]"/>
    </record>

  </data>
</odoo>
```

要点：

- 把组放在同一个 category 下，便于设置界面展示（示例用了 hidden，你也可以用自建 category）
- 用 `implied_ids` 建立继承：管理员组包含用户组

### 5.3 再给模型 CRUD 入场券：`security/ir.model.access.csv`

```csv
id,name,model_id:id,group_id:id,perm_read,perm_write,perm_create,perm_unlink
access_my_doc_user,my.doc user,model_my_doc,my_module.group_my_doc_user,1,1,1,0
access_my_doc_manager,my.doc manager,model_my_doc,my_module.group_my_doc_manager,1,1,1,1
```

要点：

- 不要轻易把 `group_id` 留空（否则可能把权限开放给所有用户身份，包括公共/门户）
- 权限设计建议：先让“用户组”具备必要 CRUD，再让“管理员组”增量提升（删权限等）

### 5.4 最后用记录规则收口范围：`security/rules.xml`

#### 模板 A：用户只能看/改自己的；管理员看全部

```xml
<odoo>
  <data noupdate="1">

    <!-- 用户：只能访问自己创建的记录 -->
    <record id="rule_my_doc_user_own" model="ir.rule">
      <field name="name">my.doc: user only own</field>
      <field name="model_id" ref="model_my_doc"/>
      <field name="domain_force">[('create_uid', '=', user.id)]</field>
      <field name="groups" eval="[(4, ref('my_module.group_my_doc_user'))]"/>
      <field name="perm_read" eval="1"/>
      <field name="perm_write" eval="1"/>
      <field name="perm_create" eval="1"/>
      <field name="perm_unlink" eval="0"/>
    </record>

    <!-- 管理员：全量访问（常见做法是 domain= [(1,'=',1)]） -->
    <record id="rule_my_doc_manager_all" model="ir.rule">
      <field name="name">my.doc: manager all</field>
      <field name="model_id" ref="model_my_doc"/>
      <field name="domain_force">[(1, '=', 1)]</field>
      <field name="groups" eval="[(4, ref('my_module.group_my_doc_manager'))]"/>
      <field name="perm_read" eval="1"/>
      <field name="perm_write" eval="1"/>
      <field name="perm_create" eval="1"/>
      <field name="perm_unlink" eval="1"/>
    </record>

  </data>
</odoo>
```

为什么要给管理员写“全量规则”：

- 因为管理员通常 implied 了用户组，会命中用户组的“只能 own”**组规则**；如果你不给管理员额外提供一条更宽的组规则，那么 `OR(组规则)` 里只有“只能 own”，管理员自然也只能看 own
- 给管理员一个 `[(1,'=',1)]` 的规则，本质是让 `OR(组规则)` 里出现一条“永真条件”，从而把可见范围放大到全量

同时请务必确保：

- “只能 own”那条规则是**绑定用户组的组规则**（不要让它变成 global），否则它会以 AND 的方式锁死所有人

> 经验法则：**只要一个高权限组 implied 了低权限组，就要检查低权限组的记录规则是否会误伤高权限组**。

### 5.5 新模型权限配置检查清单

- **组**：
  - 是否存在“基础用户组”和“管理员组”
  - 管理员组是否 implied 基础组（如需要层级）
- **模型权限**（`ir.model.access`）：
  - 基础组是否具备必要的 read/write/create（通常至少 read）
  - 是否误配了 `group_id` 为空导致全局开放
- **记录规则**（`ir.rule`）：
  - 基础组是否能看到自己应看到的记录（尤其是 create 后是否还能 read 到）
  - 管理员是否被基础规则误伤（通常是：缺少“经理放开”的组规则，或把限制性规则误做成 global）
  - 是否存在过于严格的全局规则（Odoo 16：**`groups` 为空即为全局规则**，会对所有普通用户 AND 收紧）
- **UI**（可选但常配）：
  - 菜单/按钮/字段 `groups` 是否与后端权限一致（避免“点得见但点不了”或“点不见但其实能调用接口”）

### 5.6 排错指南

当你遇到 `AccessError` 或“数据怎么搜不到”时，按这个顺序排：

- **先看模型权限（`ir.model.access`）**：
  - 用户是否属于期望的组
  - access.csv 是否加载（模块升级后是否生效）
  - 同模型是否有其他 access 规则影响（OR 合并）
- **再看记录规则（`ir.rule`）**：
  - 规则 domain 是否写错（变量、字段名、公司字段、M2M 写法等）
  - 规则是否被意外命中（groups 为空、global 生效）
  - 管理员是否被误收紧（常见原因：限制性规则误做成 global；或缺少“经理放开”的组规则，导致 `OR(组规则)` 不够宽）
- **最后看代码是否用了 `sudo()` 或 `with_user()` 改变了上下文**

---

## 6. 你应该怎么选

何时用组、何时用 access、何时用 rule

- **只需要“谁能用这个功能/菜单”**：用 `res.groups` + UI `groups`（但仍建议配最小 access）
- **只需要“谁能对模型做 CRUD”**：用 `ir.model.access`（并按组区分）
- **需要限制“同一模型中哪些记录可见/可改”**：必须用 `ir.rule`
- **复杂业务条件（状态机/审批流）**：
  - 记录规则负责“静态边界”（例如只能看自己/自己公司）
  - 业务代码负责“动态边界”（例如仅在 state=done 前可写）

---

## 7. 总结

- **`res.groups`**：把用户归到角色；通过 `implied_ids` 构建权限层级
- **`ir.model.access`**：模型级 CRUD 入场券；对适用规则做 OR 合并
- **`ir.rule`**：记录级访问边界；**全局规则 AND 叠加收紧 + 组规则 OR 合并放行**
- **执行顺序**：先 access 后 rule；任何一环不通过都会拒绝

