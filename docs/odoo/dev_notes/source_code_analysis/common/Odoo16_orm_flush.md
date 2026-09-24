---
title: ORM flush 用法(Odoo16)
description: Odoo 16 中 flush_model、flush_recordset、flush_all 的用途与用法
sidebar_label: ORM flush 用法(Odoo16)
keyword:
    - odoo
    - odoo development
    - flush
tags:
    - odoo
    - odoo development
last_update:
  date: 2026/9/24
  author: Lucas
---

# Odoo 16 ORM flush 用法

`flush` 把还停在内存里的字段修改和待计算的存储字段写进数据库。业务代码里多数 ORM 读写会自动完成这一步；需要手写的场合，是紧接着用 SQL 去读刚刚在 Python 里改过的列。

## 1. 用途

给已存在的记录赋值时，Odoo 先改 `env.cache`，并把字段标成脏数据（`Cache._dirty`），不会立刻发 `UPDATE`。存储型计算字段也一样：依赖变更后只记入 `env.all.tocompute`，等到 flush 才真正计算并写库。

因此同一事务里会出现两份数据：

| 读取方式 | 看到的值 |
| :--- | :--- |
| `record.partner_id` 等 ORM 读取 | 缓存里的新值 |
| `self.env.cr.execute("SELECT ...")` | 数据库里的旧值，除非先 flush |

flush 做两件事，顺序固定：

1. **重算**：处理该范围内 `compute` 且 `store=True` 的待计算字段。
2. **写库**：把脏缓存交给 `Model._write()`，生成 `UPDATE`。

非存储字段、尚未 `create` 的新记录（`NewId`，`id` 为假）不会进入脏集合，flush 不会为它们插入数据库行。

## 2. 接口

| 方法 | 调用对象 | 范围 | 用途 |
| :--- | :--- | :--- | :--- |
| `env.flush_all()` | 环境 | 当前事务里所有模型的待计算字段和脏字段 | 不确定脏数据落在哪个模型时，一次性写完 |
| `Model.flush_model(fnames=None)` | 模型（空 recordset 即可） | 该模型上的脏数据。传了 `fnames` 时，保证这些字段被写出，其它脏字段也可能一起写出 | 手写 SQL 前，只刷当前模型 |
| `records.flush_recordset(fnames=None)` | 具体记录 | 先重算这批记录上的存储计算字段；仅当这批记录的对应字段是脏的，才进入写库。一旦进入，同模型上其它脏记录也可能被写出 | 明确只关心少数记录时使用 |
| `Model.flush(fnames=None, records=None)` | 模型 | 按参数转发到上面三个 | Odoo 16 已弃用，调用会发出 `DeprecationWarning` |

`fnames` 是字段名的可迭代对象，例如 `['partner_id', 'state']`。省略时处理该模型的全部字段。

旧的 `Model.recompute()` 同样已弃用，重算已经包含在 flush 里，不要再单独调用。

## 3. 用法

### 3.1 刷整个环境

在原始 SQL、或依赖多个模型都已落库的操作之前：

```python
self.env.flush_all()
self.env.cr.execute("SELECT id FROM sale_order WHERE state = 'sale'")
```

`flush_all()` 会先 `_recompute_all()`，再对每个仍有脏字段的模型调用 `flush_model()`。

### 3.2 刷一个模型上的指定字段

```python
order.partner_id = partner
self.env['sale.order'].flush_model(['partner_id'])
self.env.cr.execute(
    "SELECT partner_id FROM sale_order WHERE id = %s",
    [order.id],
)
```

`flush_model` 不看你手中的 recordset 里有哪些 id。`order.flush_model(['partner_id'])` 与 `self.env['sale.order'].flush_model(['partner_id'])` 一样，处理的是 `sale.order` 这个模型上的脏数据。

### 3.3 从一批记录入口刷出

```python
orders.flush_recordset(['partner_id'])
```

这只保证：这批 `orders` 上的 `partner_id` 若待计算会被重算；若它们的 `partner_id` 是脏的，就会进入写库。写库阶段仍可能把同模型上其它脏字段、其它记录一并写出。文档字符串写明了这一点：*More fields and records can be flushed, though.*

### 3.4 不要传字段名来“限制只写这些列”

传入 `fnames` 的含义是**至少**写出这些字段。`_flush()` 一旦发现请求的字段（或其 related 字段）在脏集合里，就会把该模型当前所有脏字段都交给 `_write()`。需要“只更新某一列”时，应组织 `write()` 的 `vals`，而不是靠 `fnames` 做裁剪。

## 4. 框架自动 flush 的时机

下面这些路径已经会把相关脏数据写入数据库，普通 `create` / `write` / `search` / `read` 不必再手写 flush。

| 时机 | 行为 |
| :--- | :--- |
| `search()` / `_search()` | 执行 SQL 前调用 `_flush_search()`，刷 domain、排序字段、记录规则、`_depends` 以及 one2many 的反向字段、related 链路 |
| `cr.commit()` | 先 `cr.flush()`，即 `Transaction.flush()` → `env.flush_all()`，再跑 precommit 钩子 |
| `cr.savepoint()`（默认 `flush=True`） | 进入和正常退出时都会 flush |
| XML-RPC / `call_kw` 返回前 | `model.env.flush_all()`，保证本次调用的修改已落库 |
| `unlink()` 真正删行之前 | `env.flush_all()`，避免悬空的待写入数据 |
| `invalidate_model()` / `invalidate_all()` | 默认 `flush=True`，先写出再丢缓存，避免把未落库的修改直接丢掉 |

`cr.execute()` **不会**自动 flush。这是手写 SQL 必须自己调用 flush 的原因。

`search()` 只刷 domain 和排序用到的字段。SQL 里若读了 domain 没覆盖的列，仍要自己 `flush_model`。

## 5. 什么时候手写

手写的判断标准只有一条：下一步要读的是数据库，而不是 ORM 缓存。

适合手写：

- `cr.execute()` / `cr.executemany()` 读取刚赋值或刚重算的列。
- 调用会直接查库、且不走 `search()` 的底层方法之前。
- 测试里要用 SQL 断言刚刚的修改已经落库。此时 `flush_all()` 最省事。

不需要手写：

- 后续仍然用 `record.field`、`search()`、`read()`、`write()`。
- 只是为了“早点写库”。事务结束或 `commit()` 时框架会 flush。在循环里反复 `flush_all()` 会把本可合并的更新拆成多次 `UPDATE`。

## 6. 与 invalidate 的差别

| 操作 | 方向 | 结果 |
| :--- | :--- | :--- |
| flush | 缓存 → 数据库 | 脏数据写成 `UPDATE`，缓存保留 |
| invalidate | 丢掉缓存 | 下次 ORM 读取重新从数据库加载 |

数据库被 ORM 以外的 SQL 改过时，用 `invalidate_model()` / `invalidate_recordset()`。它们默认先 flush，这样缓存里还没写出去的值不会被清掉。只有确定缓存可以丢弃时才传 `flush=False`：

```python
self.env.cr.execute("UPDATE sale_order SET state = 'cancel' WHERE id = %s", [order.id])
order.invalidate_recordset(['state'])
```

## 7. 边界

- **one2many**：刷某个 one2many 字段时，`_flush()` 会再对 comodel 调用 `flush_model([inverse_name])`，把子表上的外键写出去。
- **related**：刷 related 字段时，会把路径末端那个真实存储字段一并列入待写模型。
- **依赖 context 的字段**：写出时改用这些 context 键全为 `None` 的环境，避免把某一语言或某一公司下的缓存值写错列。
- **新记录**：`NewId` 不会被标脏。flush 不会把它变成数据库行，仍要走 `create()`。
- **非存储字段**：`Cache.set(dirty=True)` 要求字段有 `column_type`、`store=True` 且记录已有数据库 id。只存在于缓存的计算字段不会被 flush 写库。

## 8. 源码位置

| 符号 | 文件 |
| :--- | :--- |
| `flush_model` / `flush_recordset` / `_flush` / `_flush_search` | `odoo/models.py` |
| `Environment.flush_all` | `odoo/api.py` |
| `Cache._dirty`、`get_dirty_fields`、`clear_dirty_field` | `odoo/api.py` 的 `Cache` |
| `Cursor.commit` → `flush`，`savepoint(flush=True)` | `odoo/sql_db.py` |
| 字段赋值标脏 | `odoo/fields.py` 的 `Field.write` → `Cache.update(..., dirty=True)` |
