---
title: 基于 _register_hook 与 _patch_method 的功能扩展
sidebar_label: _register_hook / _patch_method 扩展
description: 说明 Odoo 16 用 registry hook 与方法 patch 能做哪些扩展，并给出可对照的代码示例。
tags:
    - odoo
    - odoo development
---

# 基于 _register_hook 与 _patch_method 的功能扩展

:::info[说明]
本文接 `Odoo16-_register_hook与_patch_method-源码解析.md`，只讨论“能做成什么”和“代码怎么写”。机制细节以那一篇为准。

本文由AI生成+人工校正。
:::

## 总览

`_inherit` 适合“我知道要改哪个模型、行为写死在模块里”。下面这些需求它覆盖不好，才轮到 hook + patch：

1. 要包装的模型名来自**数据库规则**，安装模块时还不知道。
2. 规则增删后要**立刻生效**，不能靠升级模块。
3. 字段集合、onchange 列表要等 **registry 拼完** 才稳定。
4. 只想在**特定 context / 测试**里临时换掉一个方法。

能做成的功能，大致落在六类：

| 类型 | 典型产品 | 主要 API |
| --- | --- | --- |
| 跨模型 AOP（CRUD 前后插入逻辑） | 审计、自动化、同步外发 | `_register_hook` + `_patch_method` |
| 动态 onchange | 设置页模块开关、按规则改表单 | hook 里改 `_onchange_methods` |
| 启动期检查 / 预热 | 弃用告警、语言完整性、预生成资源 | 只重写 `_register_hook` |
| 同步方法改异步 | 把重方法变成 queue job | hook + 按 context 决定是否 `origin` |
| 测试替身 | mock 发信、拦截 unlink | 测试内 patch / revert |
| 运行时重配 | 规则 CRUD 后热更新本进程 | unregister → register → `signal_changes` |

---

## 类 / 模式概览

| 模式 | 做什么 | 必须成对实现的 |
| --- | --- | --- |
| 包装工厂 `make_xxx()` | 每次生成独立闭包，避免 for 循环绑错变量 | `_patch_method` |
| 幂等标记 / 集合 | 防止 hook 重入后叠多层包装 | `_unregister_hook` 里清掉 |
| context 短路 | 避免递归、允许业务临时关闭扩展 | 包装函数开头检查 |
| `.origin(...)` | 调回原方法 | 不要用 `super()` |
| `registry_invalidated` | 通知其他 worker 重载 | 请求结束时走到 `signal_changes()` |

---

## 1. 先看选用条件

```
要不要改任意模型的方法？
    ├─ 否，只改 sale.order → 用 _inherit
    └─ 是
         ├─ 模型列表写死在代码里，且永不改 → 仍可用多个 _inherit，但重复代码多
         └─ 模型列表来自配置表 / 用户订阅
              → _register_hook + _patch_method
```

三条经验：

- **能 inherit 就 inherit**。patch 是运行时状态，难静态分析，也难被下一个模块 `super()`。
- **patch 只包“必须经过 ORM 的入口”**。`create` / `write` / `unlink` / `read` / `_compute_field_value` 是稳定入口；业务按钮方法名各模块不同，不适合当通用扩展点。
- **hook 里读库、做重计算可以，但不要做长时间任务**。STEP 9 在每个 worker 启动时同步执行，卡住等于拖慢启动。

---

## 2. 跨模型 AOP：审计 / 自动化 / 外发

这是 hook + patch 最常见、也最有价值的用法。官方 `base.automation`、社区 `auditlog` 都是这个形状：一张规则表 + 启动时按规则包装目标模型。

### 2.1 最小可运行示例：写操作变更通知

目标：后台可配置“哪些模型的 `write` 要发一条 `ir.logging` 记录”。不改业务模型源码。

```python
# my_change_notify/models/notify_rule.py
from odoo import api, fields, models


class ChangeNotifyRule(models.Model):
    _name = "change.notify.rule"
    _description = "Write notify rule"

    name = fields.Char(required=True)
    model_id = fields.Many2one("ir.model", required=True, ondelete="cascade")
    model_name = fields.Char(related="model_id.model", store=True)
    active = fields.Boolean(default=True)

    def _register_hook(self):
        super()._register_hook()
        self._patch_target_models()

    def _unregister_hook(self):
        for Model in self.env.registry.values():
            if getattr(Model, "_change_notify_patched", False):
                Model._revert_method("write")
                delattr(Model, "_change_notify_patched")
        super()._unregister_hook()

    def _patch_target_models(self):
        patched = set()
        rules = self.sudo().search([("active", "=", True)])
        for rule in rules:
            model_name = rule.model_name
            if not model_name or model_name not in self.env.registry:
                continue
            if model_name in patched:
                continue
            Model = self.env[model_name]
            if getattr(Model, "_change_notify_patched", False):
                continue
            Model._patch_method("write", self._make_write())
            type(Model)._change_notify_patched = True
            patched.add(model_name)

    def _make_write(self):
        def write(self, vals, **kwargs):
            if self.env.context.get("change_notify_disabled"):
                return write.origin(self, vals, **kwargs)
            result = write.origin(self, vals, **kwargs)
            self.env["change.notify.rule"].sudo()._log_write(self, vals)
            return result

        return write

    @api.model
    def _log_write(self, records, vals):
        if not records:
            return
        self.env["ir.logging"].sudo().create({
            "name": "change.notify",
            "type": "server",
            "dbname": self.env.cr.dbname,
            "level": "INFO",
            "message": "%s.write ids=%s vals=%s user=%s"
            % (records._name, records.ids, list(vals), self.env.uid),
            "path": "change.notify.rule",
            "func": "_log_write",
            "line": "0",
        })

    def write(self, vals):
        res = super().write(vals)
        self._reload_patches()
        return res

    @api.model_create_multi
    def create(self, vals_list):
        records = super().create(vals_list)
        self._reload_patches()
        return records

    def unlink(self):
        res = super().unlink()
        self._reload_patches()
        return res

    def _reload_patches(self):
        if not self.env.registry.ready:
            return
        self._unregister_hook()
        self._register_hook()
        self.env.registry.registry_invalidated = True
```

这段代码里有四个扩展点，做同类功能时几乎都会用到：

| 点 | 为什么 |
| --- | --- |
| 规则表决定 patch 谁 | 安装模块时不必写死 `sale.order` |
| `_change_notify_patched` | hook 重入不会叠两层 `write` |
| `_unregister_hook` 里 `_revert_method` + 删标记 | 和 `setup_models` / 规则变更对齐 |
| `change_notify_disabled` | 自己写日志、或业务批量导入时避免递归/噪音 |
| `registry_invalidated` | 多 worker 下其他进程也会重挂 |

### 2.2 包装 `create` 时必须自己加装饰器

```python
def _make_create(self):
    @api.model_create_multi
    def create(self, vals_list, **kwargs):
        records = create.origin(self, vals_list, **kwargs)
        # records 已经是 recordset
        return records
    return create
```

`_patch_method` 不会自动补 `@api.model_create_multi`。漏写时，调用方传 `[{...}, {...}]` 或单条 dict，行为会和原生 `create` 不一致。

### 2.3 自动化：写前 domain + 写后执行

官方 `base.automation` 比审计多两步：**写前过滤**、**读旧值**、**写后按新值再过滤**。扩展“审批通过后自动建活动”“库存变动后通知”时，直接复用这个骨架：

```python
def make_write():
    def write(self, vals, **kw):
        actions = self.env["base.automation"]._get_actions(
            self, ["on_write", "on_create_or_write"]
        )
        if not (actions and self):
            return write.origin(self, vals, **kw)

        records = self.with_env(actions.env).filtered("id")
        pre = {action: action._filter_pre(records) for action in actions}
        old_values = {
            old_vals.pop("id"): old_vals
            for old_vals in (records.read(list(vals)) if vals else [])
        }
        write.origin(self.with_env(actions.env), vals, **kw)
        for action in actions.with_context(old_values=old_values):
            recs, domain_post = action._filter_post_export_domain(pre[action])
            action._process(recs, domain_post=domain_post)
        return True

    return write
```

要点：

- 没有匹配规则时立刻 `origin`，避免空跑开销。
- 旧值必须在 `origin` **之前** `read`，否则已经是新数据。
- 计算字段入库走的是 `_compute_field_value`，不是 `write`。若要覆盖“计算字段变化也触发”，必须像官方一样再 patch `_compute_field_value`。

### 2.4 这类扩展能覆盖 / 覆盖不了什么

能覆盖：

- 用户在界面、RPC、`record.write()`、server action 里对记录的改动
- 同一进程内其他模块的 `super().write()`（它们最终落到 registry 类上的当前 `write`）

覆盖不了：

- `self.env.cr.execute("UPDATE ...")`
- 模块卸载脚本、部分 SQL 导入
- 已经 `with_context(xxx_disabled=True)` 的调用
- 你没 patch 的入口（例如只包了 `write`，业务却只调 `create`）

---

## 3. 动态 onchange：加载完才知道有哪些字段

`@api.onchange('foo')` 在定义类上写死。字段是别的模块后来 `_inherit` 加上的，或者名称按前缀批量生成（`module_sale`、`module_stock`），定义期写不完。

`res.config.settings` 的做法：hook 里按字段名追加。

```python
class ResConfigSettings(models.TransientModel):
    _inherit = "res.config.settings"

    def _register_hook(self):
        super()._register_hook()

        def make_method(field_name):
            def _onchange(self):
                if self[field_name] and self.env.user.company_id.country_id.code != "CN":
                    return {
                        "warning": {
                            "title": "Notice",
                            "message": "Field %s is only recommended for CN." % field_name,
                        }
                    }
            return _onchange

        for name, field in self._fields.items():
            if name.startswith("x_policy_") and name in self._onchange_methods:
                self._onchange_methods[name].append(make_method(name))
```

说明：

- 必须 `super()`，否则设置页原有的 `module_*` 卸载警告会丢。
- `_onchange_methods` 在每次 `_setup_complete` 后会重建，所以这段必须放在 hook，不能放在 `_setup_fields`。
- 追加的函数签名是 `(self)`，返回值和 `@api.onchange` 一样：改 `self.xxx`，或返回 `warning` / `domain`。
- `base.automation` 的 `on_change` 触发器也是往这个字典 `append`，不是 `_patch_method`。表单联动用字典，ORM 写入用 patch，两条线不要混。

---

## 4. 启动期检查、预热、弃用告警

不需要改方法时，hook 只当“registry 已就绪”的回调。

### 4.1 一致性检查

```python
class ResLang(models.Model):
    _inherit = "res.lang"

    def _register_hook(self):
        super()._register_hook()
        if not self.search_count([]):
            _logger.error("No language is active.")
```

这是原生 `res.lang` 的用法：启动时确认至少有启用语言。同类需求：

- 必需的 `ir.config_parameter` 是否存在
- 关键 ir.cron 是否被关掉
- 自定义模型的 XML ID 是否还指向有效记录

### 4.2 扫描 MRO 做弃用告警

原生 `ir.actions.server` 在 hook 里扫所有父类，找出仍叫 `run_action_*` 的 RPC 方法并 `warning`。二次开发可以同样扫自己的旧 API：

```python
def _register_hook(self):
    super()._register_hook()
    for cls in type(self).mro():
        for symbol in vars(cls):
            if symbol == "old_compute_price":
                _logger.warning(
                    "%s.%s still defines old_compute_price, use _compute_price",
                    cls.__module__,
                    cls.__name__,
                )
```

放在 hook 而不是 import 时扫，是因为此时所有 `_inherit` 已经拼进 MRO，不会漏掉后装模块。

### 4.3 预热

测试模块 `test_assetsbundle` 在 hook 里预生成 assets，缩短后续请求。生产里同类做法：把热点 `ir.ui.view` 编进缓存、预加载翻译。注意控制耗时，并判断 `registry.ready` / `updated_modules`，避免每个中间 `setup_models` 都跑一遍（加载阶段 `ready=False`，STEP 9 才会进你的 hook）。

---

## 5. 把同步方法变成可延迟任务

`queue_job` 演示了“同一方法，有时同步、有时丢进队列”：

```python
def _register_hook(self):
    self._patch_method(
        "foo",
        self._patch_job_auto_delay("foo", context_key="auto_delay_foo"),
    )
    return super()._register_hook()
```

包装逻辑（简化）：

```python
def auto_delay_wrapper(self, *args, **kwargs):
    should_delay = self.env.context.get("auto_delay_foo")
    already_in_job = self.env.context.get("job_uuid")
    if already_in_job or not should_delay:
        return auto_delay_wrapper.origin(self, *args, **kwargs)
    delayed = self.with_delay(priority=100)
    return delayed.foo(*args, **kwargs)
```

可推广的模式：

| context / 条件 | 行为 |
| --- | --- |
| 无标记 | 走 `.origin`，完全同步 |
| `auto_delay_foo=True` | 不执行本体，改成 job |
| 已在 job 里 | 必须 `.origin`，否则无限投递 |

这比写两个方法（`foo` + `foo_async`）更适合**侵入已有调用链**：`large_method()` 内部已经调用了 `foo()`，所以只要外层 `with_context` 就能改语义。

---

## 6. 测试里临时替换方法

不经过 hook，测试用例直接 patch，测完 revert。原生邮件、产品测试都这么做。

```python
def test_write_is_blocked(self):
    Product = self.env["product.template"]

    def unlink(self):
        raise AssertionError("unlink should not be called")

    Product._patch_method("unlink", unlink)
    try:
        wizard = self.env["product.variant.merge"].create({...})
        wizard.action_merge()
    finally:
        Product._revert_method("unlink")
```

注意：

- 用 `try/finally`，断言失败也要 revert，否则污染同进程后续用例。
- 包装函数可以不调用 `.origin`，等于把原方法彻底掐掉。
- 这只影响当前 registry；不要在测试里 `registry_invalidated = True`，除非你真的想重载。

---

## 7. 运行时重配：规则变了怎么让 patch 跟着变

只在 STEP 9 挂一次，后台改规则不会生效。完整循环是：

```python
def _reload_patches(self):
    if not self.env.registry.ready:
        return
    if self.env.context.get("import_file"):
        return  # 导入中途不要反复拆装
    self._unregister_hook()
    self._register_hook()
    self.env.registry.registry_invalidated = True
```

`registry_invalidated = True` 本身不重载别人。当前请求成功结束后，`Registry.manage_changes()` / 框架收尾会调 `signal_changes()`，对 `base_registry_signaling` 做 `nextval`。其他 worker 下一次取 registry 时 `check_signaling()` 发现序号变化，执行 `Registry.new()`，再走 STEP 9。

所以：

- **本 worker**：`_reload_patches()` 后立即用新规则。
- **其他 worker**：最多延迟到它们处理下一个请求之前。
- **失败回滚**：`reset_changes()` 会再 `setup_models()`，依赖你的 `_unregister_hook` 能回到干净状态。

---

## 8. 几个完整一点的扩展配方

### 8.1 禁止删除“已过账”记录（可配置模型）

```python
def _make_unlink(self):
    def unlink(self, **kwargs):
        if self.env.context.get("force_unlink"):
            return unlink.origin(self, **kwargs)
        posted = self.filtered(lambda r: "state" in r._fields and r.state == "posted")
        if posted:
            raise UserError(
                "Cannot delete posted records: %s" % posted.mapped("display_name")
            )
        return unlink.origin(self, **kwargs)
    return unlink
```

比在每个模型上 `_inherit` 写一遍 `unlink` 更适合“用户自己勾选要保护的模型”。模块卸载或规则取消时，务必 `_revert_method('unlink')`，否则保护逻辑会留在进程里。

### 8.2 按用户跳过扩展

```python
def write(self, vals, **kwargs):
    rule = self.env["change.notify.rule"].sudo()._rule_for(self._name)
    if self.env.user in rule.users_to_exclude_ids:
        return write.origin(self, vals, **kwargs)
    return write.origin(self, vals, **kwargs)  # 然后再记日志
```

排除名单应在工厂函数里 `mapped()` 一次，或每次从库读。不要在 `_register_hook` 时把 `user_ids` 冻进闭包后永远不更新——用户后来被加进排除名单，不 `_reload_patches` 就不会生效。`auditlog` 把排除用户冻在闭包里，因此改规则后必须重新 subscribe / 重挂。

### 8.3 只记录 vals，还是做前后快照

| 策略 | 实现 | 代价 | 适合 |
| --- | --- | --- | --- |
| Fast | 直接把传入的 `vals` 存下来 | 低 | 只要知道“用户提交了什么” |
| Full | `origin` 前 `read()`，后再 `read()`，做 diff | 高 | 要含计算字段、默认值、间接写入 |

计算字段若 `store=True`，变化可能只走 `_compute_field_value`。Full 审计如果只包 `write`，会漏掉这类更新。

### 8.4 同时包多个方法时的幂等集合

`base.automation` 用 `patched_models[name]` 记录“这个模型的这个方法已经包过”，因为多条规则可能指向同一模型、同一触发器：

```python
patched_models = defaultdict(set)

def patch(model, name, method):
    if model not in patched_models[name]:
        patched_models[name].add(model)
        model._patch_method(name, method)
```

同一 `write` 只包一次，包装函数内部再 `search` 当前所有规则。不要“一条规则一层包装”。

---

## 9. 推荐的模块骨架

```text
my_hook_ext/
  __init__.py
  __manifest__.py          # depends: ["base"] 或 ["base_automation"]
  models/
    __init__.py
    rule.py                # 规则模型：_register_hook / _unregister_hook
  security/
    ir.model.access.csv
  views/
    rule_views.xml
```

规则模型上的最小契约：

```python
class MyRule(models.Model):
    _name = "my.rule"

    def _register_hook(self):
        super()._register_hook()
        # 1. 读当前有效规则
        # 2. 对每个目标模型幂等 _patch_method
        # 3. 需要时改 _onchange_methods

    def _unregister_hook(self):
        # 1. revert 或 delattr 你加过的方法
        # 2. 删除幂等标记
        super()._unregister_hook()

    def create(self, vals_list):
        records = super().create(vals_list)
        self._reload_patches()
        return records
```

清单：

- [ ] `_register_hook` / `_unregister_hook` 都调用 `super()`
- [ ] 包装函数用工厂生成，不在 `for` 里直接 `def`
- [ ] `create` 带 `@api.model_create_multi`
- [ ] 通过 `.origin` 调原方法
- [ ] 有 context 开关防止递归
- [ ] 规则变更会 `_reload_patches` 并 `registry_invalidated = True`
- [ ] 标记和真实方法一起删除
- [ ] 不修改 `addons/` 里的原生模块，只 `_inherit` 自己的模型去挂 hook

---

## 10. 反模式

| 做法 | 后果 |
| --- | --- |
| 在业务模型 `_inherit` 里写死 `def write` 再 `if model in config` | 每个要支持的模型都得 inherit 一次，漏一个就失效 |
| hook 里 `_patch_method` 但不实现 `_unregister_hook` | `setup_models` 或 `base.automation` `delattr` 之后，包装消失且不一定能恢复 |
| 用模块级全局 dict 当“已 patch”而不写在类上 | worker fork / registry 重建后状态错乱 |
| patch `BaseModel.write` 想一次打全球 | 没有这条 API；`BaseModel` 不是 registry 里的业务模型。即使改到某个根类，子模型自己的 `write` 仍优先 |
| hook 里做完 patch 却期望其他进程立刻变 | 没发 signaling，只有当前 worker 变了 |
| 包装函数里再 `self.write(...)` 而不关开关 | 无限递归，直到栈溢出 |
| 把 patch 写在 `post_init_hook(cr, registry)` 只跑一次 | 之后 `setup_models` 会拆掉，不会自动装回 |

---

## 11. 和 `_inherit` 组合时怎么放

可以同时用：

```python
class SaleOrder(models.Model):
    _inherit = "sale.order"

    def write(self, vals):
        # 只服务本模型、编译期就确定的逻辑
        return super().write(vals)


class MyRule(models.Model):
    _name = "my.rule"

    def _register_hook(self):
        super()._register_hook()
        # 服务“任意模型、运行时才知道”的逻辑
        self._patch_target_models()
```

调用顺序（该模型已被 patch 时）：

```
业务 sale.order.write
  → patch 包装
      → origin = inherit 后的 SaleOrder.write
          → super() = 更底层的 write
```

`_inherit` 的 `write` 会成为 `.origin`，不是被跳过。因此：

- 模型专属校验放 inherit。
- 跨模型、可开关的横切逻辑放 hook。
- 不要两边重复记同一件日志。

---

## 参考阅读

| 文件 | 看什么 |
| --- | --- |
| `OdooDocument/Odoo16-_register_hook与_patch_method-源码解析.md` | 时机、类层级、signaling |
| `addons/base_automation/models/base_automation.py` | 官方跨模型 AOP |
| `odoo/addons/base/models/res_config.py` | 动态 onchange |
| `free_plugins/queue_job/models/base.py` `_patch_job_auto_delay` | context 门控的异步化 |
| `addons/test_mail/tests/test_mail_mail.py` | 测试内 patch / revert |
| `free_plugins/auditlog/models/rule.py` | 规则订阅 + Full/Fast 快照（社区实现，对照用） |
