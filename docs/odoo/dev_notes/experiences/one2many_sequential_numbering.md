---
title: One2many 子行编号递增方案
description: One2many 子行编号递增方案
sidebar_label: One2many 子行编号递增方案
keyword:
  - odoo
  - odoo development
tags:
  - odoo
last_update:
  date: 2026/07/30
  author: Lucas
---

# Odoo 16 One2many 子行编号递增方案

> 适用场景：父记录 Form 上的 One2many 可编辑列表，新增行时自动生成「父级范围内唯一」的序号字段（如 `001`、`002`）。

---

## 快速实现（简略版）

三层：`default` 给初值 → `onchange` 校正未保存行 → `create`/`write` 校验唯一。将 `parent_id` / `line_ids` / `line_code` / `parent.model` / `your.line.model` 替换为实际名称即可。

**子模型（Python）**

```python
def _get_next_code(self, existing_codes, item_len=None, width=3):
    next_num = 1
    nums = [int(c) for c in existing_codes if c and str(c).isdigit()]
    if nums:
        next_num = max(nums) + 1
    if item_len is not None:
        next_num = max(next_num, int(item_len) + 1)
    return str(next_num).zfill(width)

def _get_default_line_code(self):
    parent = self.parent_id or self.env['parent.model'].browse(
        self.env.context.get('default_parent_id') or 0)
    codes = parent.line_ids.mapped('line_code') if parent else []
    return self._get_next_code(codes, self.env.context.get('item_len'))

def _get_sibling_codes(self):
    self.ensure_one()
    siblings = self.parent_id.line_ids if self.parent_id else self.env['your.line.model']
    return [l.line_code for l in siblings if l != self and l.line_code]

@api.onchange('parent_id')
def _onchange_set_line_code(self):
    if self._origin:  # 已保存行不改号
        return
    self.line_code = self._get_next_code(self._get_sibling_codes())

line_code = fields.Char(default=lambda self: self._get_default_line_code())

# create / write 中调用 _check_parent_code_unique（详见第 6 节）
```

**父表单视图（XML）**

```xml
<field name="line_ids"
       context="{'default_parent_id': id, 'item_len': len(line_ids)}">
    <tree editable="bottom">
        <field name="line_code"/>
    </tree>
</field>
```

下文为完整说明与陷阱；上手可先按上面抄改。

---

## 1. 问题背景

在父表单的 One2many（`editable="bottom"`）中新增子行时，需要自动生成递增编号，但 Odoo 生命周期有几个坑：


| 阶段                                | 能看到什么                                         | 看不到什么                          |
| --------------------------------- | --------------------------------------------- | ------------------------------ |
| `default` / `_get_default_line_code` | 库中已保存的兄弟行；`context` 里的 `default_*`、`item_len` | 用户改过但**未保存**的编号；当前界面上未落库的虚拟行内容 |
| `@api.onchange`                   | 当前界面所有兄弟行（含未保存、含用户手工改过的编号）                    | —                              |
| `create` / `write`                | 即将写入 DB 的最终值                                  | —                              |


因此：**仅靠 default 不够**；必须用「default 兜底 + onchange 校正 + create/write 唯一性校验」三层配合。

---

## 2. 方案总览（三层）

```
┌─────────────────────────────────────────────────────────────┐
│  Layer 1: default（快速给初始值）                           │
│  - 读已保存 sibling codes + context.item_len                │
│  - max(numeric) + 1，三位补零                               │
├─────────────────────────────────────────────────────────────┤
│  Layer 2: onchange（校正未保存场景）                        │
│  - 读界面 sibling 当前值（含用户改过的编号）                │
│  - 仅对新行生效（跳过 self._origin）                        │
├─────────────────────────────────────────────────────────────┤
│  Layer 3: create/write（落库前唯一性）                      │
│  - 批量校验「父键 + 编号」不重复                            │
│  - 先查本次提交内部，再查库中冲突                           │
└─────────────────────────────────────────────────────────────┘
```

---



## 3. 核心算法：`_get_next_code`



### 3.1 规则

1. 从已有编号中筛出**纯数字**字符串，取 `max + 1`。
2. 若传入 `item_len`（当前 One2many 行数，含未保存行），则 `next = max(next, item_len + 1)`，防止 default 阶段因看不到未保存行而撞号。
3. 用 `zfill(N)` 补零（本例为 3 位：`001`）。



### 3.2 可复用实现

```python
def _get_next_code(self, existing_codes, item_len=None, width=3):
    """根据已有编号计算下一个补零编号（max + 1）。

    :param existing_codes: 同父级下已有编号列表
    :param item_len: One2many 当前行数（含未保存行），default 阶段兜底
    :param width: 补零位数
    """
    next_num = 1
    numeric_codes = [int(code) for code in existing_codes if code and str(code).isdigit()]
    if numeric_codes:
        next_num = max(numeric_codes) + 1
    if item_len is not None:
        next_num = max(next_num, int(item_len) + 1)
    return str(next_num).zfill(width)
```



### 3.3 为何不用 `len(lines) + 1`？

中间可能有删除空洞（已有 `001`、`003`，删了 `002`），`len + 1` 会得到 `003` 与现有冲突；**max + 1** 得到 `004`，更安全。`item_len` 只是 default 阶段的额外下界，不是最终权威来源。

---



## 4. Layer 1：字段 default



### 4.1 字段声明

```python
line_code = fields.Char(
    string='編號',
    default=lambda self: self._get_default_line_code(),
)
```



### 4.2 Default 方法模式

```python
def _get_default_line_code(self):
    """One2many 新增时按已有数据生成编号。

    优先从记录上的父字段取值；若尚未赋值，回退到 context 的 default_xxx。
    注意：此阶段看不到用户改过但未保存的编号，精确递增依赖 onchange。
    """
    parent = self.parent_id
    if not parent:
        parent = self.env['parent.model'].browse(
            self.env.context.get('default_parent_id') or 0
        )

    existing_codes = []
    if parent:
        existing_codes = parent.line_ids.mapped('line_code')
    # 若有旧模型兼容入口，在此 elif 分支处理

    return self._get_next_code(
        existing_codes,
        self.env.context.get('item_len'),
    )
```



### 4.3 视图侧必须传入 context

```xml
<field name="line_ids"
       context="{
           'default_parent_id': id,
           'default_company_id': company_id,
           'item_len': len(line_ids)
       }">
    <tree editable="bottom">
        <field name="line_code"/>
        <!-- ... -->
    </tree>
</field>
```

要点：

- `default_parent_id`：default 阶段子行尚未绑定父记录时，靠它找兄弟行。
- `item_len: len(line_ids)`：把「含未保存行的当前行数」传给 default，缓解连续点「新增」时的撞号。

---



## 5. Layer 2：onchange 校正



### 5.1 收集界面兄弟编号

```python
def _get_sibling_codes(self):
    """收集同父级其他行的编号（onchange 中含未保存行的当前值）。"""
    self.ensure_one()
    siblings = self.env['your.line.model']
    if self.parent_id:
        siblings = self.parent_id.line_ids
    return [
        line.line_code
        for line in siblings
        if line != self and line.line_code
    ]
```



### 5.2 仅对新行自动改号

```python
@api.onchange('parent_id')
def _onchange_set_line_code(self):
    """新增行时按同父级所有行（含未保存）重新计算编号。

    default_get 只能看到库中已保存数据；用户改完未保存编号后再新增时，
    需在 onchange 中读取 sibling 当前值，才能继续正确 +1。
    """
    # 已保存记录不自动改编号，避免覆盖用户历史数据
    if self._origin:
        return
    sibling_codes = self._get_sibling_codes()
    self.line_code = self._get_next_code(sibling_codes)
```

触发字段选「父关联字段」（如 `parent_id`）：One2many 新建行时这些字段会从 context default 灌入，从而触发 onchange。

---



## 6. Layer 3：落库唯一性校验

Default/onchange 不能替代约束。保存时必须校验「父键 + 编号」唯一。

### 6.1 批量校验（避免循环查库）

```python
def _check_parent_code_unique(self, pairs, exclude_ids=None):
    """批量校验同一 parent_id 下 line_code 唯一。

    :param pairs: iterable of (parent_id, line_code)
    :param exclude_ids: write/constrains 时排除自身
    """
    exclude_ids = exclude_ids or []
    valid_pairs = [
        (parent_id, code)
        for parent_id, code in pairs
        if parent_id and code
    ]
    if not valid_pairs:
        return

    # 1) 本次提交内部重复
    seen = set()
    for parent_id, code in valid_pairs:
        key = (parent_id, code)
        if key in seen:
            raise ValidationError(_('同一父记录下编号 [%s] 重复，不能保存。') % code)
        seen.add(key)

    # 2) 与库中已有记录冲突（一次 search_read）
    parent_ids = list({pid for pid, _ in valid_pairs})
    codes = list({code for _, code in valid_pairs})
    domain = [
        ('parent_id', 'in', parent_ids),
        ('line_code', 'in', codes),
    ]
    if exclude_ids:
        domain.append(('id', 'not in', exclude_ids))

    existing = self.search_read(domain, ['parent_id', 'line_code'])
    existing_keys = {
        (rec['parent_id'][0], rec['line_code'])
        for rec in existing
        if rec.get('parent_id')
    }
    for parent_id, code in valid_pairs:
        if (parent_id, code) in existing_keys:
            raise ValidationError(_('同一父记录下编号 [%s] 已存在，不能重复。') % code)
```



### 6.2 挂到 create / write

```python
@api.model_create_multi
def create(self, vals_list):
    pairs = [(v.get('parent_id'), v.get('line_code')) for v in vals_list]
    self._check_parent_code_unique(pairs)
    return super().create(vals_list)

def write(self, vals):
    if 'parent_id' in vals or 'line_code' in vals:
        pairs = [
            (vals.get('parent_id', rec.parent_id.id),
             vals.get('line_code', rec.line_code))
            for rec in self
        ]
        self._check_parent_code_unique(pairs, exclude_ids=self.ids)
    return super().write(vals)
```

说明：唯一性已在 create/write 做完时，可不必再挂 `@api.constrains`，避免重复执行。若希望 ORM 层双保险，可再加 constrains，但注意性能。

---



## 7. 接入清单（复制到新模型时对照）

将下列占位符替换为实际名称后，按顺序落地：


| 占位符               | 说明               |
| ----------------- | ---------------- |
| `your.line.model` | 子模型 `_name`      |
| `parent.model`    | 父模型 `_name`      |
| `parent_id`       | 子→父 Many2one 字段名 |
| `line_ids`        | 父→子 One2many 字段名 |
| `line_code`       | 编号字段名            |
| `width`           | 补零位数（如 `3`）      |


**检查项：**

- [ ] `_get_next_code`：max+1 + 可选 `item_len` + `zfill`
- [ ] `_get_default_line_code`：父记录 / `default_parent_id` 双路径取 sibling
- [ ] 字段 `default=lambda self: self._get_default_line_code()`
- [ ] 视图 `context` 含 `default_parent_id` 与 `item_len: len(line_ids)`
- [ ] `_get_sibling_codes` + `@api.onchange`（跳过 `_origin`）
- [ ] create/write 批量唯一性校验

- [ ]（可选）旧入口兼容：`elif old_parent_id` / `default_old_parent_id`

---



## 8. 时序示意

```
用户打开父记录 Form
        │
        ▼
点击 One2many「新增」
        │
        ├─► default_get / 字段 default
        │     读 DB 已保存 line_ids + context.item_len
        │     → 得到初始 line_code（可能不够准）
        │
        ├─► 注入 default_parent_id 等
        │     触发 onchange(parent_id)
        │     读界面 sibling（含未保存、含手工改号）
        │     → 覆盖为准确的 max+1
        │
        ▼
用户保存父记录
        │
        ▼
create / write
        │
        └─► 批量校验 (parent_id, line_code) 唯一
              通过则落库；冲突则 ValidationError
```

---



## 9. 常见陷阱


| 陷阱                         | 原因                  | 处理                               |
| -------------------------- | ------------------- | -------------------------------- |
| 连续新增两行编号相同                 | default 看不到上一行未保存编号 | 用 `item_len` 兜底 + onchange 校正    |
| 用户把某行改成 `005` 后再新增仍出 `005` | default 只读 DB       | onchange 读界面 sibling             |
| 编辑旧行时编号被改掉                 | onchange 误伤已保存记录    | `if self._origin: return`        |
| 删除中间行后撞号                   | 用 `len+1`           | 改用 `max(numeric)+1`              |
| 批量导入/多行 create 内部重复        | 只查了库                | 先查本次 `vals_list` 内部，再查库          |
| default 时 `parent_id` 为空   | 子行尚未绑定父             | 读 `context['default_parent_id']` |
| 非数字编号参与 max                | `"A01"` 等           | 只用 `str.isdigit()` 的项参与计算        |


---



## 10. 与「仅用 item_len」方案的对比

存在更简单的做法：直接用 `item_len + 1` 生成编号，不做 max 扫描与 onchange 校正。


|        | 本方案（完整三层）                      | 仅用 item_len（简化） |
| ------ | ------------------------------ | --------------- |
| 算法     | max(已有数字编号)+1，再与 item_len+1 取大 | 基本等于 item_len+1 |
| 空洞/删行  | 安全                             | 可能与残留编号冲突       |
| 用户手工改号 | onchange 能跟上                   | 易撞号             |
| 复杂度    | 较高，适合编号需严格唯一                   | 较低，适合编号弱约束场景    |


**建议：** 编号有业务唯一性要求（尤其对接外部系统）时，采用本方案的完整三层；仅作界面展示序号时可简化。
