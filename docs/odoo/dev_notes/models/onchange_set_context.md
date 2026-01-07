---
title: onchange设置上下文(Odoo16)
description: onchange设置上下文(Odoo16)
sidebar_label: onchange设置上下文(Odoo16)
keyword:
    - odoo
    - odoo development
tags: [odoo]
last_update:
  date: 2026/1/7
  author: Lucas
---

:::tip
onchange设置上下文，以便onchange中update的其他字段触发对应的onchange函数时可以使用上下文。
:::

# onchange设置上下文(Odoo16)

## 修改onchange实现需求

核心部分：
- `onchange()`: 模型的onchange函数。(source code: `odoo.models.py` -> `BaseModel.onchange()`)

odoo原生代码在onchange上有一些用法：

- 当`onchange`事件调用时，避免更新一些不希望变更的数据，在其中将更新的字段剔除。
- 在`onchange`事件中传递上下文`context`。

我们也通过修改`onchange`函数来实现一些特定需求：

```python
def onchange(self, values, field_name, field_onchange):
    # 判断字段是否在变更的字段列表中
    if 'your_field' in field_name:

        # 更新self并设置context
        self = self.with_context(update_skip_onchange=True)
        # 此处设置context之后，便可以在其他字段的onchange函数中使用这个上下文。

        # 如果想要在变更"your_field"的时候不更新"your_field_x"，则在field_onchange中将其删除。
        if 'your_field' in field_onchange:
            del field_onchange['your_field_x']
    return super().onchange(values, field_name, field_onchange)
```

---

## 原生代码示例

当`onchange`事件调用时，避免更新一些不希望变更的数据，在其中将更新的字段剔除。

```python title="addons/purchse/models/purchase.py"
class PurchaseOrder(models.Model):

  def onchange(self, values, field_name, field_onchange):
    """Override onchange to NOT to update all date_planned on PO lines when
    date_planned on PO is updated by the change of date_planned on PO lines.
    """
    result = super(PurchaseOrder, self).onchange(values, field_name, field_onchange)
    if self._must_delete_date_planned(field_name) and 'value' in result:
        already_exist = [ol[1] for ol in values.get('order_line', []) if ol[1]]
        for line in result['value'].get('order_line', []):
            if line[0] < 2 and 'date_planned' in line[2] and line[1] in already_exist:
                del line[2]['date_planned']
    return result
```

在`onchange`事件中传递上下文`context`。

```python title="addons/hr_holidays/models/hr_leave.py"
class HolidaysRequest(models.Model):

    def onchange(self, values, field_name, field_onchange):
        # Try to force the leave_type name_get when creating new records
        # This is called right after pressing create and returns the name_get for
        # most fields in the view.
        if field_onchange.get('employee_id') and 'employee_id' not in self._context and values:
            employee_id = get_employee_from_context(values, self._context, self.env.user.employee_id.id)
            self = self.with_context(employee_id=employee_id)
        return super().onchange(values, field_name, field_onchange)
```
