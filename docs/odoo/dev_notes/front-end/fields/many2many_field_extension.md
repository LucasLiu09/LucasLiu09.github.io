---
title: many2many Field 扩展
description: many2many Field 扩展
sidebar_label: many2many Field 扩展
keyword:
  - odoo
  - odoo development
tags:
  - odoo
last_update:
  date: 2025/12/1
  author: Lucas
---

# many2many field扩展

:::info[Note]
对many2many字段进行一些功能扩展

- 下拉选择改为表格展示
:::

## 下拉选择改为表格展示

> [Github - many2one_field_quick_query](https://github.com/LucasLiu09/odoo-module-lucas/tree/16.0/many2one_field_quick_query)

增强`many2one`功能：

1. 下拉选项支持显示表格，并支持自定义显示的列
2. 下拉显示的表格支持自定义排序、滚到到底部自动加载数据、自定义是否显示行号
3. 在输入框后增加一个按钮，点击按钮打开搜索更多的选择窗。(可通过选项`no_search_more`控制是否显示)

### 功能展示

![image1](../../_images/many2one_quick_query1.png)

![image2](../../_images/many2one_quick_query2.png)

### 快速开始

1. 在xml中使用widget。(示例见下方示例代码)
```xml
<field name="cust_id" widget="many2one_quick_query" options="{'table_columns': [{'name': 'cust_num', 'string': '客户编号', 'class': 'text-end'}, {'name': 'cust_name', 'string': '客户名称', 'class': 'text-primary'}], 'table_row_number': False,'table_order':'cust_num desc'}" />
```

2. 若需要对输入框的搜索进行自定义操作(原来的`_name_search`)，该组件也支持自定义操作，需要重写`_web_name_search`方法。

```python
@api.model
def _name_search(self, name='', args=None, operator='ilike', limit=100, name_get_uid=None):
    if args is None:
        args = []
    domain = expression.AND([[('cust_num', 'ilike', name)], args])
    return self._search(domain, limit=limit, access_rights_uid=name_get_uid)

def _web_name_search(self, name='', args=None, operator='ilike', fields=None, limit=100, offset=0, order=None):
    """
    同_name_search的处理方式，这里返回search_read的结果。
    """
    args = list(args or [])
    domain = expression.AND([[('cust_num', 'ilike', name)], args])
    records = self.search_read(domain, fields, offset=offset, limit=limit, order=order)
    return records
```

### 参数说明

**`attrs.options`**:

- `table_columns`: 显示的列，格式为`Array[Object]`
- `table_columns.Object`: 显示列的配置，可用的值：`name`(字段名)、`string`(标题行显示内容, 未设置时显示为name的值)、`class`(自定义样式)
- `search_limit`: 每次加载数据的数量，默认为39，实际搜索时会+1，即每次搜索40条。
- `table_row_number`: 是否显示行号 `Boolean`
- `table_order`: 自定义排序, `String`(e.g. 'create_date desc')
- `no_search_more`: 是否显示输入框后的按钮(搜索更多), `Boolean`(True：不显示, False：显示)

