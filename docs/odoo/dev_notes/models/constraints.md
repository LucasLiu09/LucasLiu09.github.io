---
title: Constraints
description: SQL constraint / Python constraint
sidebar_label: Constraints
keywords:
- odoo
- odoo development
tags: [odoo]
last_update:
  date: 2025/5/18
  author: Lucas
---

# Constraints

:::tip
设置约束规则，来防止用户输入不正确的数据。
:::

odoo提供两种约束方式：

- Python constraint
- SQL constraint

<strong style={{color: 'red'}}>SQL 约束通常比 Python 约束更有效。当性能很重要时，始终首选 SQL 而不是 Python 约束。</strong>

## SQL constraint

在Model中通过`_sql_constraints`属性定义。

该属性包含一个含字符串的三元组列表：`(name, sql_definition, message)`

其中`name`是有效的SQL约束名称，`sql_definition`是<font style={{color: 'blue'}}>table_constraint</font>表达式，`message`是错误信息。

举个栗子：

```python
_sql_constraints = [
        ('check_percentage', 'CHECK(percentage >= 0 AND percentage <= 100)',
         'The percentage of an analytic distribution should be between 0 and 100.'),
        ('unique name', 'UNIQUE(name)', 'The name already exists.')
    ]
```

:::danger
⚠️当你在已有数据的模型上新增约束且存在已有数据不满足约束时，升级模块会失败并弹出类似于以下的错误信息，你需要对不满足约束的数据进行处理后来执行升级应用新的约束。

ERROR rd-demo odoo.schema: Table 'estate_property_offer': unable to add constraint 'estate_property_offer_check_price' as CHECK(price > 0)
:::

## Python constraint

SQL 约束是确保数据一致性的有效方法。但是，可能需要进行更复杂的检查，这需要 Python 代码。

python约束通过`@api.constraints(*args)`装饰器来调用，修饰器指定约束中涉及哪些字段，当修改这些字段中的任何一个时，将自动评估约束。如果不满足该方法的不变性，则该方法应引发异常。（注意函数中的self代表记录集，通过循环遍历来处理。）

python constraint 有以下需要注意的点：

1. 仅支持**简单字段名称**，不支持**点缀名称**（例如关系字段的字段 partner_id.customer ）将被忽略。
2. 仅当修饰方法中声明的字段包含在 `create`或 `write` 调用中时才会触发。这意味着视图中不存在的字段不会在记录创建期间触发调用。重写 `create` 是必要的，以确保约束始终被触发（例如，测试是否缺少值）。

举个栗子：

```python
from odoo.exceptions import ValidationError

...

@api.constrains('date_end')
def _check_date_end(self):
    for record in self:
        if record.date_end < fields.Date.today():
            raise ValidationError("The end date cannot be set in the past")
    # all records passed the test, don't return anything
```