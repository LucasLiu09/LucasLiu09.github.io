---
title: Odoo 16 base_automation 源码解析
sidebar_label: base_automation
description: 从资深开发视角梳理 Automated Action 的触发层、hook 补丁、预/后置 Domain 与定时窗口。
keyword:
    - odoo
    - odoo development
tags: [odoo]
---

# Odoo 16 base_automation 源码解析

:::info[说明]
模块路径：`addons/base_automation`。本文只讲机制与踩坑，不逐行复述字段 compute。
:::

## 总览

`base_automation` 不是“又写一套动作引擎”。它只做两件事：

1. **触发层**：按规则在目标模型的 `create` / `write` / `unlink` / `_compute_field_value` / onchange 上挂钩。
2. **执行层**：把记录交给已有的 `ir.actions.server.run()`。

`base.automation` 通过 `action_server_id` 的 `delegate=True`（即 `_inherits`）把服务端动作字段（`state`、`code`、`model_id`、`fields_lines`…）直接暴露到自动化规则上。表单也是继承 `base.view_server_action_form`，再叠触发条件。

```
业务 CRUD / 计算字段 / 表单 onchange / cron
        │
        ▼
  monkey-patch / _onchange_methods / ir.cron
        │
        ▼
  filter_pre → write → filter_post → _process
        │
        ▼
  ir.actions.server.sudo().run()
```

依赖：`base`、`resource`（工作日历）、`mail`（发信 / 关注者 / 活动）。配置权限只有 `base.group_system`。

---

## 类 / 对象概览

| 对象 | 路径 | 职责 |
| --- | --- | --- |
| `BaseAutomation` | `models/base_automation.py` | 规则模型；装/拆 hook；过滤；防递归；定时扫描 |
| `ServerAction` 扩展 | `models/ir_actions_server.py` | `usage` 增加 `base_automation` |
| `ir.cron` | `data/base_automation_data.xml` | `model._check(True)`，默认关、4 小时一次 |
| `BaseAutomationErrorDialog` | `static/src/js/base_automation_error_dialog.js` | 崩溃时禁用/编辑规则 |
| `ir.actions.server` | `odoo/addons/base/models/ir_actions.py` | **动作事实来源**：`run()` / `_run_action_*` |
| `mail` 的 server action | `addons/mail/models/ir_actions_server.py` | `mail_post` / `followers` / `next_activity` |

`base.automation` 自己几乎不“做业务”，只决定**何时、对哪些记录**调用 server action。

---

## 关键依赖

| 依赖 | 级别 | 为什么必须看 |
| --- | --- | --- |
| `ir.actions.server.run()` | 一级 | 真正执行 code / write / create / multi / 邮件 |
| `_patch_method` / `_register_hook` | 一级 | 挂钩手段与时机；详见 [hook 文档](./Odoo16_register_hook_and_patch_method-analysis.md) |
| `Registry.setup_models()` | 一级 | `ready` 后先 `_unregister_hook` 再重建再 `_register_hook` |
| `filtered_domain` + `sudo()` | 一级 | Domain 以超级用户评估，再把 recordset 还原到原 env |
| `resource.calendar.plan_days` | 二级 | 仅 `on_time` + 延迟单位为 `day` 时按工作日算 |
| `error_dialogs` registry | 二级 | `exception_class='base_automation'` 映射到专用对话框 |

---

## 数据模型要点

规则字段分两层：

- **触发**：`trigger`、`filter_pre_domain`、`filter_domain`、`trigger_field_ids`、`on_change_field_ids`、`trg_date_*`
- **动作**：全部来自 `ir.actions.server`（`delegate=True`）

`create()` 会强制 `usage='base_automation'`。写关键字段会刷新 cron / registry：

| 变更字段 | 后果 |
| --- | --- |
| `CRITICAL_FIELDS`：`model_id` / `active` / `trigger` / `on_change_field_ids` | 重装 hook + 调 cron |
| `RANGE_FIELDS`：`trg_date_range` / `trg_date_range_type` | 只调 cron 频率 |
| 删除规则 | 两者都做 |

`import_file` 上下文会跳过 `_update_registry()`，避免导入时反复 patch。

约束：

- `on_change` **只能** `state='code'`（要走 onchange 协议返回 `value` / `domain` / `warning`）。
- `on_unlink` **不能** `mail_post` / `followers` / `next_activity`（记录马上没了）。

---

## 六种 Trigger

| Trigger | 挂钩点 | 时机 | Domain |
| --- | --- | --- | --- |
| `on_create` | `create` | 插入之后 | 仅 `filter_domain` |
| `on_write` | `write` + `_compute_field_value` | 更新前后 | 先 `filter_pre`，再对这批记录做 `filter_domain` |
| `on_create_or_write` | 上面两个都挂 | 同上 | 创建无 pre；更新有 pre |
| `on_unlink` | `unlink` | **删除之前** | 仅 `filter_domain` |
| `on_change` | `_onchange_methods[field]` | 表单改字段，**不落库** | 无 Domain 过滤 |
| `on_time` | 不 patch，靠 cron | `last_run <= 到期时刻 < now` | 用 `filter_domain` 先 `search` |

`on_write` 同时 patch `_compute_field_value`，因为 **stored 计算字段不走 `write()`**。官方测试：改 `partner.employee` 会重算 lead 的 stored 字段并触发规则。

每个模型每种方法只 patch 一次（`patched_models` 去重）。同一模型多条规则共享一个包装函数，函数内部再 `_get_actions()`。

---

## 预 / 后置 Domain（最容易用错）

这是状态机规则的核心，不是“写后满足条件就跑”。

`on_write` 实际顺序：

1. `pre[action] = action._filter_pre(records)` —— 写**之前**满足 `filter_pre_domain` 的记录。
2. `records.read(vals 的字段)` 做成 `old_values`。
3. 调原始 `write`。
4. 只对 `pre[action]` 做 `_filter_post`（`filter_domain`）。
5. `_process`。

官方语义（`test_base_automation`）：

- 规则：pre=`state=open`，post=`state=done`。
- `open → pending → done`：**不触发**（从 pending 写到 done 时，pre 已不成立）。
- `open → done`：**触发**。
- 新建 `state=open`：**不触发**这条 write 规则（create 不看 pre）。

空 Domain 与 `'[]'` 不同：`False` 跳过过滤；`'[]'` 仍会 `safe_eval` + `filtered_domain`，并在 write 路径上多一次 `read()`。官方 `test_inversion` 专门防这种副作用搅乱 stored 计算字段。

Domain 一律 `sudo()` 评估，再 `with_env(records.env)` 还原。这样 portal 用户触发规则时，Domain 里碰到他读不了的关联模型也不会炸（`test_30_modelwithoutaccess`）。

---

## `_process` 与防递归

```
_process(records)
  ├─ 用 context['__action_done'][self] 去掉已处理记录
  ├─ 把本次记录记入 __action_done（先记账，再执行）
  ├─ 若模型有 date_action_last，先 write 当前时间
  └─ 对每条记录：_check_trigger_fields → action_server.sudo().run()
```

`__action_done` 是 **action 记录 → 已处理 recordset**。同一条规则在同一次调用栈里不会对同一记录再跑。规则 A 改字段触发规则 B 可以；A 再触发 A 不行。这是避免 `write` 动作死循环的硬保险。

`_get_actions()` 若发现没有 `__action_done`，会先 `with_context(__action_done={})`。所以入口必须经过 `_get_actions` 或 `_check`。

`trigger_field_ids`：

- 空：任何写入都算触发。
- 有值：用 `old_values`（`read()` 格式）和当前值做 `convert_to_cache` 比较。
- `create` 没有 `old_values`：一律视为触发。
- 同一值再写一次：不触发（`test_21_trigger_fields`）。

Server action 的 context：

```python
active_model / active_id / active_ids / domain_post
# write 路径还有 old_values
```

Python 代码里常用 `env.context['old_values'][record.id]` 判断“到底改了哪个字段”。

执行是 `action_server.sudo().run()`。规则用 sudo 搜出来，再 `with_env` 回当前用户；真正跑动作又升回超级用户。因此：

- 普通用户**不必**能读 `base.automation`。
- 动作里的 `write` 也不受当前用户 ACL 限制。
- `ir.actions.server.run()` 内部的权限检查在 sudo 下基本形同虚设。

---

## 典型调用链

### 1. 进程启动 / registry 重建

```
load_modules STEP 9
  或 Registry.setup_models()（ready=True）
    → 每个模型 _register_hook()
      → BaseAutomation._register_hook()
        → 按 trigger patch 目标模型
```

规则增删改关键字段：

```
write/create/unlink
  → _unregister_hook()   # delattr 掉 create/write/unlink/_compute_field_value/_onchange_methods
  → _register_hook()     # 按当前库里的规则重挂
  → registry_invalidated = True   # 其他 worker 整库重载
```

`_unregister_hook` **不用** `_revert_method`，而是 `delattr`。原因：同名方法可能叠多层 patch；`_onchange_methods` 是 property 记忆化结果，删掉才能回到 `BaseModel` 的 property，下次访问按 `@api.onchange` 重建。

### 2. 更新触发（最完整）

```
records.write(vals)
  → patched write
    → _get_actions(['on_write', 'on_create_or_write'])
    → _filter_pre
    → read(vals.keys()) → old_values
    → write.origin(...)
    → _filter_post(pre 命中的记录)
    → _process → ir.actions.server.run()
```

若本次 write 导致 stored 计算字段落库，还会再走一遍 patched `_compute_field_value`（old_values 是那批 stored 字段）。

### 3. 删除

```
records.unlink()
  → _process(_filter_post(records))   # 记录还在
  → unlink.origin(...)
```

### 4. 表单 onchange

```
FormController.onchange
  → Model._onchange_methods[field]
  → base_automation_onchange
    → server_action.with_context(onchange_self=self).run()
    → 把返回的 value 写进缓存记录（不 write 数据库）
```

`onchange_self` 是 NewId 缓存记录。`object_write` 类型的 server action 看到这个 context 会改缓存而不是 `browse(active_id).write()`。

### 5. 定时

```
ir.cron → BaseAutomation._check(automatic=True)
  → 每条 on_time 规则：
      search(filter_domain)
      对每条记录算 action_dt = trg_date + delay（或日历工作日）
      若 last_run <= action_dt < now：_process
      写 last_run = now
      commit()   # 一条规则一批，失败不回滚前面的规则
```

cron 间隔：

```
delay_minutes = trg_date_range * DATE_RANGE_FACTOR[type]
interval = min(max(1, delay // 10), 240)   # 最少 1 分钟，最多 4 小时，取最小延迟的 10%
```

界面上的 `least_delay_msg` 就是在说：到期后最多再等这么多分钟才会被扫到。

---

## 错误对话框

`_process` / onchange 捕获异常后调用 `_add_postmortem_action`：

```python
e.context['exception_class'] = 'base_automation'
e.context['base_automation'] = {'id': self.id, 'name': self.name}
```

前端 `rpcErrorHandler` 读 `data.context.exception_class`，从 `error_dialogs` 取出 `BaseAutomationErrorDialog`。管理员可禁用规则或弹出表单编辑；普通用户只看到提示。

定时路径 `_check` **不走这套**：异常只打日志，cron 继续，`last_run` 照样推进。

---

## 扩展点与踩坑

**1. 定时窗口不会补跑。**  
条件是 `last_run <= action_dt < now`。cron 挂了、worker 忙、或某条记录在窗口内失败，`last_run` 仍会被写成 `now`，这条记录**不会重试**，除非触发日期再次落入新窗口。负延迟（提前提醒）同样受这个窗口约束。

**2. `on_time` 是全表 search + 逐条算时间。**  
`filter_domain` 只缩小候选，到期判断在 Python 里。记录多、规则多时，cron 会扫全模型。`_check` 的 `use_new_cursor` 参数存在但未使用。

**3. 规则在目标模型上是进程级 monkey-patch。**  
不要对同一方法再自己 `_patch_method` 而不处理 `.origin`。改规则后当前进程立刻重挂，其他 worker 靠 `registry_invalidated`。测试里改完规则要意识到 hook 已变。

**4. 动作以超级用户跑。**  
权限、record rule、公司隔离在动作内部默认不生效。要按公司/用户限制，必须自己写在 `code` 或 Domain 里。

**5. `__action_done` 按规则去重，不按“业务意图”去重。**  
一条规则里 `records.write(...)` 不会再次触发**同一条**规则，但会触发其他 `on_write`。多规则互相 write 仍可能链式爆炸。

**6. `date_action_last` 是可选约定。**  
`_process` 发现模型有这个字段就更新。CRM lead 和测试模型有；普通模型没有。若把 `trg_date_id` 指到它，可做成“上次执行后再延迟一次”，空值时回退 `create_date`。

**7. `on_change` 不是 `on_write`。**  
只影响当前表单缓存。用户不保存，数据库不变。不能用来做审计或发信。

**8. 递归 stored 字段 + Domain。**  
`filter_domain` 用 `filtered_domain`，仍可能在重算过程中 flush。官方 `test_recursion`：父任务删除导致子任务 `project_id` 重算时，曾把递归深度打到爆。复杂递归计算模型上慎挂 Domain。

**9. 不要在 `_inherit` 里“再实现一遍自动化”。**  
扩展动作类型应给 `ir.actions.server` 加 `_run_action_<state>`；扩展触发应考虑 hook 的可逆性（`delattr` / `_onchange_methods` 重建）。和项目 `crud_hook` 怎么分工、二次开发挂哪一层，见 [对比文档](./Odoo16_base_automation_crud_hook_diff.md)。

---

## 参考阅读

| 文件 | 看什么 |
| --- | --- |
| `addons/base_automation/models/base_automation.py` | `_register_hook`、`_process`、`_check` |
| `odoo/addons/base/models/ir_actions.py` | `IrActionsServer.run`、`_get_eval_context`、`_run_action_*` |
| `odoo/models.py` | `_patch_method`、`_onchange_methods` |
| `odoo/modules/registry.py` `setup_models()` | hook 的先拆后装 |
| `addons/test_base_automation/tests/test_flow.py` | 预/后置 Domain、计算字段、trigger fields、递归 |
| [Odoo16_register_hook_and_patch_method-analysis.md](./Odoo16_register_hook_and_patch_method-analysis.md) | patch 可逆性与多 worker |
| [Odoo16-base_automation-与-crud_hook-对比.md](./Odoo16_base_automation_crud_hook_diff.md) | 与 CRUD Hook 分工、挂钩层选择 |
