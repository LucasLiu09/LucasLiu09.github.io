# 代码速查表

## 后端<!-- {docsify-ignore} -->

### Domain<!-- {docsify-ignore} -->

`from odoo.osv import expression`

- expression.AND(domains)
- expression.OR(domains)

### One2many/Many2many Command<!-- {docsify-ignore} -->

对于x2m的关联关系，通过更直观的命名函数执行更具有可读性，以此替代三元组首位为整数的方式。

`from odoo import Command` or `from odoo.fields import Command`

- `Command.create(values)`: 传入values, 创建新的记录并关联到当前记录。

- `Command.update(id, values)`: 传入id、values，修改关联记录的数据。

- `Command.delete(id)`: 传入id，移除关联关系。

- `Command.unlink(id)`: 传入id，移除关联关系并删除指定id的记录集。

- `Command.link(id)`: 传入id，添加关联关系。

- `Command.clear()`: 移除所有关联关系。

- `Command.set(ids)`: 传入ids，先移除所有关联关系，再将所有ids添加关联。

### return ir.actions.client

- display_notification

```python
return {
    'type': 'ir.actions.client',
    'tag': 'display_notification',
    'params': {
        'type': 'success',				# 提示窗类型，可选项: success/danger/warning/info/...
        'title': _("Leads Assigned"),	# 标题
        'message': 'Message, %s',
        'next': {						# 在services.notification.add之后返回next的action
            'type': 'ir.actions.act_window_close'
        },
        'links': [{						# 在message中通过%s占位符设置一个a标签
            'label': production.name,
            'url': f'#action={action.id}&id={production.id}&model=mrp.production'
        }],
        'sticky': True,		# 是否滞留提示窗，需要手工关闭。
    }
}
```



## 前端<!-- {docsify-ignore} -->

