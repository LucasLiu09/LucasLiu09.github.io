---
title: Many2one字段Domain字符串解析机制
description: Many2one字段Domain字符串解析机制
sidebar_label: Many2one字段Domain字符串解析机制
keyword:
    - odoo
    - odoo development
tags: [odoo]
---

# Many2one 字段 Domain 字符串解析机制

> 适用版本：Odoo 16  
> 源码位置：`odoo/osv/expression.py`、`odoo/models.py`

## 概述

在 Odoo ORM 中，对 **Many2one** 字段编写 domain 时，右侧值可以是 **整数 ID**，也可以是 **字符串**（或字符串列表）。当传入字符串时，框架不会直接拿该字符串与数据库外键列比较，而是先通过关联模型（comodel）的 `_name_search()` 将其解析为一组 ID，再改写 domain 后执行 SQL 查询。

这是 ORM 的内置行为，与前端下拉框的 `name_search` 使用同一套解析逻辑。

```python
# 以下两种写法在 ORM 层面可能产生等价效果（取决于 name_search 能否唯一匹配）
Model.search([('partner_id', '=', 42)])
Model.search([('partner_id', '=', 'Azure Interior')])
```

---

## 处理流程

```
用户 domain:  ('partner_id', '=', 'Azure Interior')
       │
       ▼
expression.py 识别字段类型为 many2one，且右侧为 str
       │
       ▼
调用 comodel._name_search('Azure Interior', [], '=', limit=None)
  （comodel = partner_id 字段的 comodel，如 res.partner）
       │
       ▼
_name_search 按 _rec_names_search / _rec_name 构造搜索 domain，返回 ID 列表
       │
       ▼
domain 被改写为: ('partner_id', 'in', [3, 7, ...])
       │
       ▼
生成 SQL: WHERE partner_id IN (3, 7, ...)
```

**要点：**

- 字符串不会写入 Many2one 外键列的 SQL 条件。
- 最终 SQL 始终基于 **整数 ID**。
- 解析阶段对 comodel 使用 `active_test=False`，**含 archived（active=False）记录** 也可能被匹配。

---

## 核心源码

### 1. Domain 解析：`expression.py`

当 leaf 的字段为 `many2one`，且右侧为字符串或纯字符串列表时，进入字符串解析分支：

```python
# odoo/osv/expression.py（节选）
elif field.type == 'many2one':
    elif (
        isinstance(right, str)
        or isinstance(right, (tuple, list)) and right and all(isinstance(item, str) for item in right)
    ):
        # 运算符归一化（见下文「运算符映射」）
        res_ids = comodel.with_context(active_test=False)._name_search(right, [], operator, limit=None)
        if operator in NEGATIVE_TERM_OPERATORS:
            for dom_leaf in ('|', (left, 'in', res_ids), (left, '=', False)):
                push(dom_leaf, model, alias)
        else:
            push((left, 'in', res_ids), model, alias)
```

**否定条件**（如 `!=`、`not in`）会被改写为：

```python
('|', (left, 'in', res_ids), (left, '=', False))
```

即：外键为空 **或** 外键指向不在匹配 ID 集合中的记录。这是 Many2one 可为 `False`（NULL）时的标准处理方式。

### 2. 层级运算符：`child_of` / `parent_of`

Many2one 配合层级运算符时，字符串同样先经 `to_ids()` 转为 ID：

```python
# odoo/osv/expression.py — to_ids()（节选）
if isinstance(value, str):
    names = [value]
...
for rid in comodel._name_search(name, [], 'ilike', limit=None):
    ...
```

注意：此处 `_name_search` 固定使用 `'ilike'`，与用户 domain 中的运算符无关。

### 3. 名称搜索：`_name_search()`

```python
# odoo/models.py（节选）
def _name_search(self, name='', args=None, operator='ilike', limit=100, name_get_uid=None):
    search_fnames = self._rec_names_search or ([self._rec_name] if self._rec_name else [])
    if not (name == '' and operator in ('like', 'ilike')):
        aggregator = expression.AND if operator in expression.NEGATIVE_TERM_OPERATORS else expression.OR
        domain = aggregator([[(field_name, operator, name)] for field_name in search_fnames])
        args += domain
    return self._search(args, limit=limit, access_rights_uid=name_get_uid)
```

| 模型属性 | 作用 |
|----------|------|
| `_rec_name` | 记录显示名所用字段，默认 `'name'`；`name_get()` 依赖此字段 |
| `_rec_names_search` | `name_search` / domain 字符串解析时参与匹配的字段列表；未设置时回退为 `[_rec_name]` |

**聚合规则：**

| 运算符类型 | 多字段组合方式 | 示例（`_rec_names_search = ['name', 'ref']`） |
|------------|----------------|-----------------------------------------------|
| 正向（`=`, `ilike`, `in` 等） | **OR** | `name ilike 'x' OR ref ilike 'x'` |
| 否定（`!=`, `not in` 等） | **AND** | `name != 'x' AND ref != 'x'` |

---

## 运算符映射

字符串解析分支会对部分运算符做归一化，再传给 `_name_search`：

| 原始 domain 运算符 | 右侧类型 | 传给 `_name_search` 的运算符 | 最终 leaf 形式 |
|--------------------|----------|-------------------------------|----------------|
| `=` | `str` | `=` | `(field, 'in', ids)` |
| `!=` | `str` | `!=` | `('\|', (field, 'in', ids), (field, '=', False))` |
| `in` | `[str, ...]` | `=` | `(field, 'in', ids)` |
| `not in` | `[str, ...]` | `!=` | 否定形式（含 NULL） |
| `=` | `[str, ...]` | `in` | `(field, 'in', ids)` |
| `!=` | `[str, ...]` | `not in` | 否定形式（含 NULL） |

若右侧为 **整数** 或 **整数列表**，不经过 `_name_search`，直接参与 SQL 生成。

---

## 与 `name_search()` 的关系

| 方法 | 可见性 | 用途 |
|------|--------|------|
| `name_search()` | 公开 API | UI 下拉联想、RPC 调用；内部调用 `_name_search` 后执行 `name_get()` |
| `_name_search()` | 内部实现 | domain 字符串解析、层级运算符 `to_ids()` 均调用此方法 |

两者共享 `_rec_names_search` / `_rec_name` 配置。重写 `_name_search()` 会同时影响 UI 联想与 domain 中的字符串匹配行为。

---

## 行为特征与注意事项

### 1. 匹配不保证唯一

字符串解析可能返回 **多个 ID**（模糊匹配或多名同义），domain 最终变为 `in`，语义为「关联到其中任一记录即命中」。

```python
# partner_id 可能匹配到多个 partner
Model.search([('partner_id', '=', 'Demo')])  # → partner_id IN (id1, id2, ...)
```

需要精确匹配时，应直接使用 ID 或 comodel 上唯一字段的 domain。

### 2. 匹配字段由 comodel 决定

解析搜索哪些字段，取决于 **关联模型** 的 `_rec_names_search` / `_rec_name`，而非当前模型的字段定义。

### 3. 与 `display_name` 的差异

`_name_search` 按配置的存储字段搜索，**不一定**等同于用户在界面上看到的 `display_name`（`name_get()` 可自定义格式、可依赖 context）。

### 4. 空值与空字符串

- Many2one 为空时，数据库外键为 `NULL`。
- 否定条件自动包含 `(field, '=', False)`，避免遗漏空值记录。
- `_name_search` 对 `name=''` 且 `operator in ('like', 'ilike')` 做了优化，不会构造「匹配一切」的条件。

### 5. 可扩展点

| 扩展方式 | 影响范围 |
|----------|----------|
| 设置 `_rec_names_search` | 指定 domain / name_search 参与匹配的字段 |
| 重写 `_name_search()` | 完全自定义字符串 → ID 的解析逻辑 |
| 重写 `name_get()` | 仅影响显示，**不**改变 domain 字符串解析（除非同时改 `_name_search`） |

---

## 示例

### 基本用法

```python
# 字符串 → 经 _name_search 解析
orders = self.env['sale.order'].search([
    ('partner_id', '=', 'Azure Interior'),
])

# 整数 ID → 直接比较，不调用 _name_search
orders = self.env['sale.order'].search([
    ('partner_id', '=', 42),
])
```

### 多值字符串

```python
# 等价于：partner_id 关联 res.partner 中 name/ref 等字段 in ['A', 'B'] 的并集
records = Model.search([
    ('partner_id', 'in', ['Azure Interior', 'Gemini Furniture']),
])
```

### 否定条件

```python
# 匹配：partner_id 为空，或 partner_id 不在 name_search 结果中
records = Model.search([
    ('partner_id', '!=', 'Azure Interior'),
])
```

### 自定义搜索字段

```python
class ResPartner(models.Model):
    _inherit = 'res.partner'
    _rec_names_search = ['name', 'ref', 'email']
```

此后 `[('partner_id', '=', 'xxx')]` 会在 `name`、`ref`、`email` 上以 OR 方式查找。

---

## 调试方法

```python
comodel = self.env['res.partner']

# 1. 查看字符串会解析出哪些 ID
comodel._name_search('Azure Interior', operator='=')

# 2. 查看参与搜索的字段
comodel._rec_names_search or [comodel._rec_name]

# 3. 对比两种写法的结果集
Model.search([('partner_id', '=', 42)])
Model.search([('partner_id', '=', 'Azure Interior')])
```

---

## 相关源码索引

| 文件 | 内容 |
|------|------|
| `odoo/osv/expression.py` | Domain → SQL 解析；Many2one 字符串分支；`to_ids()` |
| `odoo/models.py` | `_name_search()`、`name_search()`；`_rec_name`、`_rec_names_search` |
| `odoo/fields.py` | Many2one 字段定义与 comodel 关联 |

---

## 总结

Many2one 字段 domain 传入字符串，是 Odoo ORM **有意支持** 的语法糖：解析层（`expression.py`）识别类型后，委托关联模型的 `_name_search()` 完成「名称 → ID」转换，再将条件归一化为基于 ID 的 `in` / 否定形式。理解该机制有助于解释「未传 ID 仍能查到数据」的现象，并在需要精确、唯一匹配时改用 ID 或显式 comodel domain。
