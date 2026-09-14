---
title: Odoo 16 base_automation 与 crud_hook 对比
sidebar_label: 挂钩层选择
description: 对比官方自动化与项目 CRUD Hook，并给出二次开发该挂哪一层的判断。
tags:
    - odoo
    - odoo development
---

# base_automation 与 crud_hook：该挂哪一层

:::info[说明]
对照 `addons/base_automation` 与 `/crud_hook`。机制细节见 [base_automation 源码解析](./Odoo16_base_automation_analysis.md) 与 `/crud_hook/README.md`。本文只回答：两者差在哪、二次开发挂哪一层。
:::

## 总览

两条线都用 `_register_hook` + `_patch_method` 拦 ORM，但解决的不是同一类问题。


|       | `base.automation`      | `crud.hook.rule`              |
| ----- | ---------------------- | ----------------------------- |
| 角色    | **业务规则引擎**             | **集成 / 审计管道**                 |
| 动作从哪来 | 委托 `ir.actions.server` | 自建 `handlers/` 注册表            |
| 典型用途  | 改负责人、发信、建活动、到期提醒       | 审计快照、Oracle 同步、HTTP、旁路 Python |
| 谁在维护  | 功能顾问可配                 | 技术配置 + 开发加 handler            |


一句话：自动化回答「业务状态变了该做什么」；CRUD Hook 回答「这次写入要记下来、同步出去、还是旁路处理」。

---



## 对象对照


| 概念   | base_automation                                                              | crud_hook                                      |
| ---- | ---------------------------------------------------------------------------- | ---------------------------------------------- |
| 规则   | `base.automation`，一模型可多条                                                     | `crud.hook.rule`，**一模型一条**（`unique(model_id)`） |
| 动作   | 一条规则 = 一个 server action                                                      | 一条规则 = 多个 handler，按 `sequence`                 |
| 生效   | `active=True` 即挂钩                                                            | 必须 **订阅** 才 `_patch_method`                    |
| 挂钩方法 | `create` / `write` / `unlink` / `_compute_field_value` / `_onchange_methods` | 仅 `create` / `write` / `unlink`                |
| 拆钩   | `delattr` 清掉类属性                                                              | `_revert_method` + `_crud_hook_*` 标记           |
| 异步   | 无（`on_time` 只是 cron 扫描）                                                      | `inline` / `queue_job`；cron 只扫残留 `pending`     |


`crud_hook` 源码注释写明：`setup_models` / `base.automation` 会先拆 hook。它必须连标记一起清，否则 registry 重建后无法重挂。两边**已经按共存来写**，不要再叠第三套同方法 patch。

---



## 机制对比（只看会踩坑的）



### 触发面


| 能力                      | automation                      | crud_hook              |
| ----------------------- | ------------------------------- | ---------------------- |
| create / write / unlink | 有                               | 有                      |
| stored 计算字段重算           | 有（patch `_compute_field_value`） | **无**                  |
| 表单 onchange             | 有（仅 code）                       | 无                      |
| 定时                      | 有（`on_time`）                    | 无（cron 只补跑异步事件）        |
| 状态机「从 A 到 B」            | `filter_pre` + `filter_domain`  | 只有事后 `filter_domain`   |
| 监视字段                    | `trigger_field_ids`             | 无；write 一律派发（审计再 diff） |
| 排除用户                    | 无                               | `users_to_exclude_ids` |


改关联模型导致本模型 stored 字段重算：自动化能接到，CRUD Hook **接不到**。要审计这类变化，不能只订本模型的 write。

### 过滤与快照

- 自动化：pre 在 `write.origin` **之前**，post 在之后；`old_values` 只 `read(本次写入字段)`。
- CRUD Hook：Domain 在 ORM 调用**之后**（unlink 在之前）；需要快照的 handler 会 `read` 全部可存字段。create 从 cache `convert_to_read`，避免未 flush 的 stored compute 读空。

要「open → done 才跑」：只能用自动化。CRUD Hook 的 Domain 表达不了「写之前是什么」。

### 权限


|     | automation                   | crud_hook                                    |
| --- | ---------------------------- | -------------------------------------------- |
| 搜规则 | `sudo()`                     | `sudo()`                                     |
| 跑动作 | `action_server.sudo().run()` | 审计 / Oracle / HTTP：sudo；**Python 用触发用户 env** |
| 配置权 | `base.group_system`          | Manager 配规则；User 只读；`group_ids` 控制单据动作菜单     |


自动化里写的 `code` 默认超级用户，record rule / 公司隔离不生效。CRUD Hook 的 Python 相反：默认走当前用户 ACL，要跨权自己 `sudo()`。

### 防重入


|     | automation                     | crud_hook                                                        |
| --- | ------------------------------ | ---------------------------------------------------------------- |
| 键   | `__action_done[规则] += records` | `crud_hook_disabled` / `crud_hook_active` / `crud_hook_creating` |
| 粒度  | **按规则**：A 的 write 仍可触发规则 B     | **按记录**：同记录嵌套 write 默认静默；**其它模型不静默**                             |
| 开关  | 无                              | `silence_nested`，改完立即生效                                          |


自动化动作里 `records.write(...)` 不会再次触发**同一条**规则，但会触发同模型其它自动化，也会进 CRUD Hook（除非被静默）。

CRUD Hook handler 写回业务记录时，dispatch 已带 `crud_hook_disabled`，不会再进包装。表体 create 仍会派发——这是有意的。

### 失败语义

- 自动化：同步；异常冒泡（前端可禁用规则）。`on_time` 只打日志，且 `last_run` 照样推进，**失败不重试**。
- CRUD Hook：`raise` 回滚用户保存；`log` 记 `fail` 事件后继续。HTTP 默认异步，5xx 交给 `queue_job`。`oracle_sync` **强制 inline**（`set_sync_log` 要读还在的记录）。

---



## 同模型双挂时的调用顺序

两边都是「先/后包一层，再调 `.origin`」。后 `_register_hook` 的在外。

```
外层 wrapper          # 后挂的那套
  └─ 内层 wrapper     # 先挂的那套
       └─ 真正的 create/write/unlink
```

`create` / `write` 都是 origin **之后**再跑自己的逻辑（unlink 相反，两边都在删除前派发）。因此：

1. 内层的 `_process` / `_dispatch` 先跑。
2. 自动化 `_process` 里的 `write` 会再进 CRUD Hook 的 write 包装。
3. 若 CRUD Hook 开了 `silence_nested`，且这次 write 发生在**同一模型 create 过程中**，会被折进 create 快照，不再单独派发。

`base.automation._unregister_hook` 用 `delattr`，会把该类上的 `create`/`write`/`unlink` **整段剥掉**（包括 CRUD Hook 那层）。随后两边各自 `_register_hook` 再挂回去。这就是 CRUD Hook 必须清 `_crud_hook_`* 标记的原因。

不要在同一模型上再写第三套 `_patch_method('write', ...)`。hook 顺序、`delattr`、标记对不齐时，只会丢事件或套娃。

---



## 二次开发：挂哪一层

按「变的是什么」选，不要按「哪里已经有 hook」选。

```
这笔逻辑是模型自己的不变式？          →  _inherit 模型方法 / compute / constraint
     │ 否
顾问要配、会改、属于业务流程？        →  base.automation
     │ 否
要审计 / Oracle / HTTP / 可重试外发？ →  crud_hook（已有 handler 直接配）
     │ 否
同一类集成会复用到多个模型？          →  新 CRUD Hook handler（@register）
     │ 否
只要给自动化多一种动作类型？          →  inherit ir.actions.server + _run_action_<state>
     │ 否
只拦一次写入、逻辑单模型且要进版本库？ →  该模型 _inherit create/write（最后手段）
```



### 1. `_inherit` 模型（不变式）

挂这里：约束、默认值、计算字段、状态机硬规则、和 Oracle 字段映射强绑定的赋值。

不挂这里：顾问下周可能改的「谁负责 / 发哪封信」、审计、外系统。

`_inherit` 写在 MRO 里，升级才变，admin 关不掉。这是优点也是成本。

### 2. `base.automation`（业务流程）

挂这里：

- 创建后按 Domain 改字段、改负责人。
- 「从 open 到 done」才发信、建活动。
- 只监视某几个字段。
- 表单改字段时带出默认值（`on_change` + code）。
- 到期提醒（接受最多延迟一个 cron 间隔，且**不补跑**）。

不要挂这里：

- 审计、HTTP、长时间外发（和保存同事务，失败整单回滚）。
- 依赖 stored 计算字段「间接变了」却只配了 `on_write` 而不理解 `_compute_field_value`。
- 需要按当前用户 ACL 跑的代码（它是 sudo）。

扩自动化的动作类型：给 `ir.actions.server` 加 `_run_action_<state>`（`mail` 的 `mail_post` 就是这样来的）。不要复制一套 `_register_hook`。

### 3. `crud.hook.rule` 配现有 handler（集成管道）

挂这里：


| 需求                          | handler       | 模式          |
| --------------------------- | ------------- | ----------- |
| 谁在何时改了哪些字段                  | `audit_log`   | inline      |
| 复用 `sync.base.set_sync_log` | `oracle_sync` | 强制 inline   |
| 通知外系统，不能挡保存                 | `http`        | async       |
| 单模型旁路脚本                     | `python`      | inline，当前用户 |


约束：一模型一条已订阅规则。多个需求做成多个 handler，不要再开第二条规则。

不要挂这里：状态机业务、定时、onchange、跨模型计算字段触发。

### 4. 新 CRUD Hook handler（可插拔扩展）

当「又一种外发/记账」会在多个模型上重复出现时，在 `handlers/` 加模块：

```python
@register("my_handler", _("My Handler"))
class MyHandler(CrudHookHandler):
    default_run_mode = "async"   # 或 inline
    needs_old_values = False     # True 才拍新旧快照
    force_inline = False         # unlink 后还要读记录则 True
```

并在 `handlers/__init__.py` import。Hook 层只认 `HANDLERS[code]`。

判断：

- 要快照 → `needs_old_values = True`（有成本：write/unlink 多一次 `read`）。
- 记录删了就做不了 → `force_inline = True`（`oracle_sync` 的理由）。
- 外网 / 慢 IO → 默认 async，`on_error=log`。

不要在 handler 里再 `_patch_method`。

### 5. 最后手段：业务模型上自己 override `create`/`write`

仅当逻辑必须进该模块版本库、不能做成可关规则、且该模型**没有**（或不该有）CRUD Hook 订阅时。实现时：

- 调 `super()`，不要 `_patch_method`。
- 需要跳过 Hook 时显式 `with_context(crud_hook_disabled=True)`。
- 不要假设自己排在 automation / crud_hook 之前或之后。

---



## 决策速查


| 需求                    | 挂哪                                       |
| --------------------- | ---------------------------------------- |
| 单据从 A 到 B 发邮件 / 建活动   | `base.automation`（pre + post + `mail_*`） |
| 创建后按条件改字段             | `base.automation` `on_create`            |
| 表单改字段带出值              | `base.automation` `on_change`            |
| N 天后提醒                | `base.automation` `on_time`（接受漏窗）        |
| 字段级审计 + 操作者 + HTTP 请求 | `crud_hook` `audit_log`                  |
| 写入同步 Oracle           | `crud_hook` `oracle_sync`                |
| 保存后通知外部 API           | `crud_hook` `http` async                 |
| 多模型重复的同一种外发           | 新 `@register` handler                    |
| 给所有自动化多一种动作           | `ir.actions.server._run_action_*`        |
| 模型永不变更的校验 / 计算        | `_inherit` 该模型                           |
| stored 计算字段变了要跑业务规则   | `base.automation`（不要用 crud_hook）         |
| stored 计算字段变了要记审计     | 订**被 write 的源模型**，或接受 Hook 看不到间接重算       |


同时需要「改状态发信」和「记审计 / 同步 Oracle」：两条都配。自动化管流程，Hook 管管道。不要把发信写进 Hook Python，也不要把 Oracle 写进自动化 code。

---



## 不要做的事

1. **再 patch 一次** `create`**/**`write`**/**`unlink`**。** 两套已经叠在 `.origin` 上。第三套只增加 `delattr` 后丢钩的概率。
2. **用自动化当审计。** 没有字段级新旧快照，没有 HTTP 会话，sudo 执行，嵌套 write 语义也不同。
3. **用 Hook Python 当自动化。** 没有 pre Domain、没有 `on_time`/`on_change`、一模型只能一条规则。
4. **在自动化** `code` **里打 HTTP。** 和保存同事务；超时 = 用户保存失败。外发走 Hook `http`。
5. **把** `oracle_sync` **改成 async。** handler 写死 `force_inline`，因为 `set_sync_log` 要在 unlink 前读记录。
6. **靠自动化定时做「必须执行」的任务。** 窗口是 `last_run <= 到期 < now`，漏了不补。关键补数用 `queue_job` 或独立 cron。

---



## 参考阅读


| 文件                                                                                                       | 看什么                            |
| -------------------------------------------------------------------------------------------------------- | ------------------------------ |
| [Odoo16-base_automation-源码解析.md](./Odoo16_base_automation_analysis.md)                                       | 自动化触发、pre/post、`__action_done` |
| `/crud_hook/models/crud_hook_rule.py`                                                           | 订阅、patch、静默嵌套、`_dispatch`      |
| `/crud_hook/handlers/`                                                                          | handler 契约与四种实现                |
| `/crud_hook/README.md`                                                                          | 配置与权限                          |
| [Odoo16_register_hook_and_patch_method-analysis.md](./Odoo16_register_hook_and_patch_method-analysis.md) | hook 时机与可逆性                    |


