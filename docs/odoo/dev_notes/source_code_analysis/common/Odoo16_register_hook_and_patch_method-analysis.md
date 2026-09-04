---
title: Odoo 16 _register_hook 与 _patch_method 源码解析
sidebar_label: _register_hook / _patch_method
description: Odoo 16 原生 registry hook 与方法 monkey-patch 的机制、调用时机、类层级和可逆性。
tags:
    - odoo
    - odoo development
---

# Odoo 16 _register_hook 与 _patch_method 源码解析

:::info[说明]
Odoo 16 原生 `_register_hook`、`_unregister_hook`、`_patch_method`、`_revert_method` 源码解析。

本文由AI生成+人工校正。
:::

## 总览

这四个 API 都定义在 `odoo/models.py` 的 `BaseModel` 上，解决的是同一类问题：**registry 已经组装完成后，再对“当前进程里的模型类”做运行时改造**。

| 方法 | 角色 | 何时发生 |
| --- | --- | --- |
| `_register_hook` | 安装钩子：启动后、或 registry 重建后，对模型做一次性/可重复的运行时初始化 | 模块加载 STEP 9；以及 `registry.ready` 后的 `setup_models()` |
| `_unregister_hook` | 拆掉 `_register_hook` 做过的事，给下一次重建腾位置 | `setup_models()` 在 `ready=True` 时先于重建调用 |
| `_patch_method` | 把某个模型类上的方法替换成包装函数，原方法挂到 `.origin` | 通常在 `_register_hook` 里调用 |
| `_revert_method` | 按 `.origin` 剥掉最外一层包装 | 通常在 `_unregister_hook` 或业务“取消订阅”时调用 |

它们和 `_inherit` 不是一条路：

- **`_inherit`**：模块加载时把定义类拼进 MRO，行为写死在源码里，升级模块才变。
- **hook + patch**：registry 类已经存在之后，按**数据库配置、环境、测试需要**动态改方法。改的是**当前 worker 进程**里的类对象，不是 `.py` 源文件。

官方注释把 `_register_hook` 说成 “stuff to do right after the registry is built”，把 `_patch_method` 说成 “Monkey-patch a method for all instances of this model”。前者是时机，后者是手段。

---

## 类 / 对象概览

| 对象 | 路径 | 职责 | 关键点 |
| --- | --- | --- | --- |
| `BaseModel` | `odoo/models.py` | 定义四个空/工具方法 | hook 默认空实现；patch 是 `@classmethod` |
| `Registry` | `odoo/modules/registry.py` | 每个数据库一份模型类映射 | `setup_models()` 负责 unregister → 重建 → register |
| `load_modules()` | `odoo/modules/loading.py` | 装模块、建 registry | STEP 9 **恰好一次**对所有模型调用 `_register_hook` |
| `Environment` | `odoo/api.py` | `env[name]` 得到空 recordset | `env.values()` 遍历所有模型的空 recordset |
| `api.propagate` | `odoo/api.py` | 把 origin 的部分装饰器属性拷到新方法 | Odoo 16 只继承 `_returns` |
| `base.automation` | `addons/base_automation/models/base_automation.py` | 官方最大使用方 | hook 里按规则 patch `create`/`write`/`unlink`/`_compute_field_value` |
| `res.config.settings` | `odoo/addons/base/models/res_config.py` | 动态挂 onchange | hook 里往 `_onchange_methods` 追加 lambda |
| `res.users` / `ir.actions.server` / `res.lang` | `odoo/addons/base/models/` | 启动检查、弃用告警 | 只利用 hook 时机，不 patch |

---

## 关键依赖

### 一级必读

| 依赖 | 为什么必须看 |
| --- | --- |
| `Registry.setup_models()` | 解释 hook 为什么会“先拆后装”，以及为什么加载过程中的多次 `setup_models()` **不会**跑 hook |
| `Registry.new()` / `ready` | `ready=False` 期间只建模型，不装 hook；`ready=True` 之后重建才成对调用 |
| `load_modules()` STEP 9 | 进程生命周期里 hook 的第一次、也是加载阶段唯一一次统一安装 |
| `BaseModel._build_model()` | patch 改的是 **registry 类**，不是模块里的定义类 |
| `_setup_complete()` → `_init_constraints_onchanges()` | 每次重建都会把 `_onchange_methods` 重置成 property，动态 onchange 必须在 hook 里重挂 |
| `api.propagate` | 说明 `_patch_method` **不会**自动复制 `@api.model` / `@api.model_create_multi` |
| `base.automation._register_hook` / `_unregister_hook` | 官方完整范本：闭包工厂、幂等 patch、`delattr` 清栈、`signal_changes` |

### 二级选读

| 依赖 | 作用 |
| --- | --- |
| `Registry.signal_changes()` / `check_signaling()` | 多 worker 同步：本进程 patch 完后，别的进程靠数据库 sequence 整库重载 |
| `ir.model` / `ir.model.fields` 的 create/write | 运行时加自定义模型/字段会触发 `setup_models()`，从而重跑 hook |
| `Environment.__getitem__` | hook 收到的 `self` 是空 recordset，`uid` 是超级用户 |

---

## 1. 两个概念先分开：时机 vs 手段

`_register_hook` **本身不改任何方法**。`BaseModel` 上的实现是空的：

```4994:4998:odoo/models.py
    def _register_hook(self):
        """ stuff to do right after the registry is built """

    def _unregister_hook(self):
        """ Clean up what `~._register_hook` has done. """
```

它只是一个**约定好的回调点**：registry 可用之后，框架保证会调它。你可以在里面做检查、往 `_onchange_methods` 塞函数，也可以调用 `_patch_method`。

`_patch_method` 才是改方法的工具，和 hook 没有语法绑定。测试里经常单独用它 mock 一个方法，用完 `_revert_method`。

两者叠在一起，才是 Odoo 里“按数据动态包装任意模型 ORM 方法”的标准做法。

---

## 2. Registry 类：patch 改的是谁

模块里写的 `class SaleOrder(models.Model)` 是**定义类**。加载时 `_build_model()` 会再造一个** registry 类**，把所有 `_inherit` 定义类和父模型 registry 类排进 `__base_classes`，最后 `pool[name] = ModelClass`。

```640:691:odoo/models.py
        if name in parents:
            ...
            ModelClass = pool[name]
        else:
            ModelClass = type(name, (cls,), {
                '_name': name,
                '_register': False,
                ...
                '_fields': {},
            })
        ...
        ModelClass.pool = pool
        pool[name] = ModelClass
```

`env['sale.order']` 返回的是这个 registry 类的空实例：

```535:537:odoo/api.py
    def __getitem__(self, model_name):
        """ Return an empty recordset from the given model. """
        return self.registry[model_name](self, (), ())
```

`_patch_method` 是 `@classmethod`，所以：

```python
self.env['sale.order']._patch_method('write', my_write)
# 等价于
self.env.registry['sale.order']._patch_method('write', my_write)
```

`cls` 就是 `sale.order` 的 registry 类。`setattr(cls, 'write', wrapped)` 之后，**这个进程里所有 `sale.order` recordset** 调 `write` 都走包装函数。

影响范围：

| 操作 | 影响 |
| --- | --- |
| 对 `sale.order` 做 `_patch_method('write', ...)` | 只改 `sale.order` registry 类自己的 `__dict__` |
| 子模型若自己也定义了 `write` | 不受父模型上的 patch 影响（MRO 先命中自己） |
| 子模型若没定义 `write`，且 MRO 会落到被 patch 的父 registry 类 | 会间接受影响 |
| 其他 worker / 其他进程 | **看不到**，除非它们重载 registry |

因此官方用法几乎总是：**对规则指定的那个模型名直接 patch**，而不是去 patch `mail.thread` 指望所有继承者一起变。

---

## 3. `_patch_method` / `_revert_method` 逐行

```5001:5036:odoo/models.py
    @classmethod
    def _patch_method(cls, name, method):
        origin = getattr(cls, name)
        method.origin = origin
        wrapped = api.propagate(origin, method)
        wrapped.origin = origin
        setattr(cls, name, wrapped)

    @classmethod
    def _revert_method(cls, name):
        method = getattr(cls, name)
        setattr(cls, name, method.origin)
```

### 3.1 调用链

```
getattr(cls, name)          # 取出当前实现（可能已是上一层 patch）
method.origin = origin      # 在包装函数上留退路
api.propagate(origin, method)
wrapped.origin = origin     # 再写一次，保证 revert 能找到
setattr(cls, name, wrapped) # 挂到 registry 类上
```

之后业务调用 `records.write(vals)`：

```
records.write
  → wrapped (你的函数)
      → wrapped.origin(self, vals)   # 原来的 write
```

官方示例就是这个形状：

```python
def do_write(self, values):
    # 前置逻辑
    return do_write.origin(self, values)

model._patch_method('write', do_write)
```

必须通过 **`方法名.origin(...)`** 调回原实现。写成 `super().write()` 是错的：`super()` 沿 MRO 走，看不到你刚 setattr 上去的包装栈。

### 3.2 可以叠多层

每次 `_patch_method` 都在当前方法外包一层：

```
第 1 次：cls.write = A，A.origin = BaseModel.write
第 2 次：cls.write = B，B.origin = A，A.origin = BaseModel.write
```

`_revert_method('write')` **只剥最外一层**（B → A）。再 revert 一次才回到 `BaseModel.write`。

若包装函数没有 `.origin`（有人手写 `cls.write = fn`），`_revert_method` 会 `AttributeError`。

### 3.3 `api.propagate` 实际做了什么

`_patch_method` 注释写 “propagate decorators from origin to method, and apply api decorator”。Odoo 16 的实现已经收得很窄：

```46:94:odoo/api.py
INHERITED_ATTRS = ('_returns',)

def propagate(method1, method2):
    if method1:
        for attr in INHERITED_ATTRS:
            if hasattr(method1, attr) and not hasattr(method2, attr):
                setattr(method2, attr, getattr(method1, attr))
    return method2
```

它**只拷 `_returns`**（`@api.returns`），**不会**把 `@api.model`、`@api.model_create_multi`、`@api.constrains` 自动套到新函数上。

所以包装 `create` 时，必须自己写：

```python
@api.model_create_multi
def create(self, vals_list, **kw):
    return create.origin(self, vals_list, **kw)
```

漏掉装饰器，调用约定会和原 `create` 对不上（单条 dict / 多条 list、返回 recordset / id）。

### 3.4 闭包必须用工厂函数

`base.automation` 在源码里专门写了警告：包装函数如果定义在 `for` 循环里，闭包会绑到循环最后一次的变量。正确做法是 `make_create()` 这种工厂，每次返回一个新函数：

```378:393:addons/base_automation/models/base_automation.py
        def make_create():
            @api.model_create_multi
            def create(self, vals_list, **kw):
                actions = self.env['base.automation']._get_actions(self, ['on_create', 'on_create_or_write'])
                if not actions:
                    return create.origin(self, vals_list, **kw)
                records = create.origin(self.with_env(actions.env), vals_list, **kw)
                for action in actions.with_context(old_values=None):
                    action._process(action._filter_post(records))
                return records.with_env(self.env)
            return create
```

这里 `create.origin` 能工作，是因为 `_patch_method` 之后 `create.origin` 就是被替换掉的那个方法。

---

## 4. `_register_hook` 何时被调用

### 4.1 模块加载：恰好一次

`Registry.new()` 先 `load_modules()`，期间多次 `setup_models()`，但此时 `registry.ready` 仍是 `False`。加载结束后才 `registry.ready = True`。

`load_modules()` 最后 STEP 9：

```588:596:odoo/modules/loading.py
        # STEP 9: call _register_hook on every model
        # This is done *exactly once* when the registry is being loaded. See the
        # management of those hooks in `Registry.setup_models`: all the calls to
        # setup_models() done here do not mess up with hooks, as registry.ready
        # is False.
        env = api.Environment(cr, SUPERUSER_ID, {})
        for model in env.values():
            model._register_hook()
        env.flush_all()
```

含义：

1. **每个模型都会被调到**，不管它有没有重写 hook。
2. `self` 是该模型的空 recordset，环境是超级用户。
3. hook 里如果写了库，后面的 `flush_all()` 会落盘。
4. 加载过程中的中间 `setup_models()` **故意不跑 hook**，避免模型还没拼完就 patch。

### 4.2 registry 已就绪后再 `setup_models()`：先拆后装

```246:307:odoo/modules/registry.py
    def setup_models(self, cr):
        env = odoo.api.Environment(cr, SUPERUSER_ID, {})
        env.invalidate_all()

        if self.ready:
            for model in env.values():
                model._unregister_hook()
        ...
        # _prepare_setup / _setup_base / _setup_fields / _setup_complete
        ...
        if self.ready:
            for model in env.values():
                model._register_hook()
            env.flush_all()
```

运行时触发 `setup_models()` 的典型入口：

- 设置界面创建/修改自定义模型或字段（`ir.model` / `ir.model.fields`）
- 改模型 `_order` 等需要重建元数据的操作
- `Registry.reset_changes()` 在测试或异常回滚路径上重建

`ready=True` 时的顺序是固定的：

```
_unregister_hook（所有模型）
    → 清掉旧 patch / 动态 onchange
重建模型元数据
    → _prepare_setup：必要时重绑 __bases__
    → _setup_complete → _init_constraints_onchanges
        把 _onchange_methods 重置回 property
_register_hook（所有模型）
    → 按当前数据库状态重新 patch / 重新挂 onchange
```

这就是为什么动态 onchange **不能**只在模块 import 时挂一次：重建后字典会被清掉，必须在 hook 里重挂。

### 4.3 业务自己再调一次

`base.automation` 在规则 create/write/unlink 后：

```225:231:addons/base_automation/models/base_automation.py
    def _update_registry(self):
        if self.env.registry.ready and not self.env.context.get('import_file'):
            self._unregister_hook()
            self._register_hook()
            self.env.registry.registry_invalidated = True
```

这是“数据变了，本进程立刻重挂，并标记 registry 失效”。随后请求结束时 `signal_changes()` 会 `nextval('base_registry_signaling')`，其他 worker 在 `check_signaling()` 里发现序号变了，执行 `Registry.new()` 整库重载，再走一遍 STEP 9。

**hook 必须可重复执行**。框架不保证一生只调一次。

---

## 5. `_unregister_hook` 的两种官方清法

### 5.1 `_revert_method`：精确剥一层

适合“我确定自己是最外层，而且只想撤自己”。`auditlog` 取消订阅时就是按方法名 `_revert_method`。

风险：若中间又有别人 patch 了同一方法，你的包装已经不是最外层，revert 会把别人的包装剥掉，自己的反而留下。

### 5.2 `delattr(Model, name)`：整栈清掉

`base.automation` 这样做：

```535:543:addons/base_automation/models/base_automation.py
    def _unregister_hook(self):
        NAMES = ['create', 'write', '_compute_field_value', 'unlink', '_onchange_methods']
        for Model in self.env.registry.values():
            for name in NAMES:
                try:
                    delattr(Model, name)
                except AttributeError:
                    pass
```

`delattr` 删的是 **registry 类自己 `__dict__` 里的属性**。patch 加上去的 `write` 被删后，MRO 重新落到定义类 / `BaseModel.write`。`_onchange_methods` 被删后，下一次访问会重新走 property，从 `@api.onchange` 收集。

副作用很大：它会删掉**所有模型**上这些名字的类属性，包括其他模块的 patch。随后框架会再调**所有模型**的 `_register_hook`，别的模块如果实现正确，会把自己的包装装回去。

若某模块只设了“已 patch”标记、却不在 `_unregister_hook` 里清标记，就会出现：**方法已被 `delattr` 拆掉，标记还在，hook 以为还挂着，再也不 patch**。这是 hook 设计里最常见的静默失效。

---

## 6. 原生模块怎么用 hook（不谈第三方）

| 模型 | 做什么 | 是否 patch |
| --- | --- | --- |
| `base.automation` | 按自动化规则包装目标模型 CRUD / 计算字段 / onchange | 是 |
| `res.config.settings` | 给每个 `module_*` 字段动态挂卸载警告 onchange | 否，只改 `_onchange_methods` |
| `res.users` | 启动时检查是否还有人定义了已更名的 `check_credentials` | 否 |
| `ir.actions.server` | 扫描 MRO，对仍暴露 `run_action_*` 的 RPC 方法打 warning | 否 |
| `res.lang` | 确认至少有一种启用语言 | 否 |
| `ir.qweb`（测试模块） | 测试环境预生成 assets | 否 |

`res.config.settings` 这段能说明 hook 和 onchange 的关系：

```400:408:odoo/addons/base/models/res_config.py
    def _register_hook(self):
        """ Add an onchange method for each module field. """
        def make_method(name):
            return lambda self: self.onchange_module(self[name], name)

        for name in self._fields:
            if name.startswith('module_'):
                method = make_method(name)
                self._onchange_methods[name].append(method)
```

字段是各模块用 `_inherit` 加进来的，数量在加载结束前才稳定。onchange 映射又在每次 `_setup_complete` 时重建。所以必须放在 hook 里：**等字段齐、等映射建好，再追加**。

表单 onchange 真正执行时：

```6225:6228:odoo/models.py
        if onchange in ("1", "true"):
            for method in self._onchange_methods.get(field_name, ()):
                method_res = method(self)
                process(method_res)
```

hook 里 `append` 的函数和 `@api.onchange` 收集到的函数走同一条分发。

---

## 7. 典型时序

### 7.1 Worker 冷启动

```
Registry.new(db)
  load_modules()
    对每个模块 registry.load() + setup_models()     # ready=False，不跑 hook
  registry.ready = True
  STEP 9: 每个模型._register_hook()
    base.automation 按表里的规则 _patch_method
    res.config.settings 挂 module_* onchange
    其他模型做检查 / 告警
  flush_all()
```

此后 `sale.order.create(...)` 若被自动化规则命中，实际进入的是 `make_create()` 返回的那个 `create`。

### 7.2 管理员新增一条自动化规则

```
base.automation.create(...)
  → _update_registry()
      _unregister_hook()        # delattr 清掉旧包装
      _register_hook()          # 按新规则集重新 patch
      registry_invalidated = True
请求结束
  → signal_changes()
      nextval(base_registry_signaling)
其他 worker 下次请求
  → check_signaling()
      Registry.new()            # 整库重载，再走 STEP 9
```

本进程立刻生效；其他进程靠 signaling，不是共享内存。

### 7.3 运行时加自定义字段

```
ir.model.fields.create(...)
  → pool.setup_models(cr)       # ready=True
      全模型 _unregister_hook
      重建字段 / onchange 映射
      全模型 _register_hook
```

自定义字段能出现在 `_fields` 里，动态 onchange 也能活过来，前提是各模块的 unregister/register 成对、且幂等。

---

## 8. 和 `_inherit` 怎么选

| 需求 | 用什么 |
| --- | --- |
| 永久改某个你能 `_inherit` 的模型 | `_inherit` + `super()` |
| 包装**运行时才知道**的任意模型 | `_register_hook` + `_patch_method` |
| 规则增删后立刻生效、不用升级模块 | hook + 必要时 `registry_invalidated` |
| 给“加载完才齐”的字段挂 onchange | `_register_hook` 改 `_onchange_methods` |
| 启动时做一次一致性检查 | 只重写 `_register_hook` |
| 单测里临时替换方法 | 测试内 `_patch_method` / `_revert_method` |

`_inherit` 改的是定义类，进入 MRO，所有进程加载模块后一致，能 `super()`，能被下一步 inherit 继续扩。

`_patch_method` 改的是已经拼好的 registry 类，**数据驱动、可逆、进程内**。它看不见“下一个 inherit”，也跨不了进程。

---

## 9. 扩展点与踩坑

1. **一定要 `super()`**  
   多个模块都能重写同一模型的 `_register_hook`。漏掉 `super()`，后面的 hook 不会跑。`base.automation` 的 hook 挂在自己模型上，一般还好；若你 inherit 的是 `sale.order` 再 hook，漏 `super()` 会直接丢掉别人的启动逻辑。

2. **hook 必须幂等**  
   会被 STEP 9、`setup_models`、业务 `_update_registry` 多次调用。重复 `_patch_method` 会叠多层包装，同一次 `write` 记两次日志、跑两遍自动化。官方用 `patched_models` 集合或 `hasattr(model, 'xxx_patched')` 防重入。

3. **标记和真实方法必须一起清**  
   只设 `mymodule_patched_write = True`、不在 `_unregister_hook` 里 `delattr` 这个标记，一旦别人 `delattr(Model, 'write')`，你会永远不再 patch。

4. **包装函数自己带 API 装饰器**  
   `propagate` 不管 `@api.model_create_multi`。`create` 必须显式装饰。

5. **用工厂，别在循环里 def**  
   否则所有包装闭包指向最后一次循环变量。

6. **用 `.origin`，不用 `super()`**  
   patch 栈不在 MRO 里。

7. **本进程 ≠ 全站**  
   改完要让其他 worker 生效，需要 `registry.registry_invalidated = True`，并走到 `signal_changes()`。只 `_patch_method` 而不发信号，只有当前 worker 行为变了。

8. **绕过 ORM 就绕过 patch**  
   `cr.execute`、SQL 导入、部分 `insert` 路径不走 `create`/`write`。hook 只能包 Python 方法。

9. **`_unregister_hook` 的 `delattr` 是全局的**  
   `base.automation` 会删掉所有模型上的 `create`/`write`/`unlink`。你的模块必须能在随后的 `_register_hook` 里自行恢复。

10. **不要 patch 到定义类上**  
    `setattr(SaleOrderDefinitionClass, 'write', ...)` 会进 MRO，但 `_revert_method` / `delattr(registry_cls, ...)` 清的是 registry 类，对不上，卸载和重建都会乱。

---

## 参考阅读

| 文件 | 看什么 |
| --- | --- |
| `odoo/models.py` `_register_hook` / `_patch_method` / `_build_model` / `_onchange_methods` | 定义与类模型 |
| `odoo/modules/loading.py` STEP 9 | 冷启动唯一一次统一 register |
| `odoo/modules/registry.py` `setup_models` / `signal_changes` / `check_signaling` | 重建与多进程 |
| `odoo/api.py` `propagate` / `Environment.__getitem__` | 装饰器继承、hook 的 `self` |
| `addons/base_automation/models/base_automation.py` | 完整的 register / unregister / 工厂 / 信号 |
| `odoo/addons/base/models/res_config.py` `_register_hook` | 动态 onchange |
| `OdooDocument/Odoo16-_register_hook与_patch_method-功能扩展.md` | 能做成哪些功能、示例代码 |
