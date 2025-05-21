---
title: List View select same group records(Odoo16)
description: List View select same group records(Odoo16)
sidebar_label: List视图Checkbox选择同组记录
keyword:
    - odoo
    - odoo development
tags: [odoo]
last_update:
  date: 2025/5/21
  author: Lucas
---

# List视图Checkbox选择同组记录(Odoo16)

:::info[Note]
通过js_class绑定ListView, 实现List视图点击Checkbox同时选择/取消同组记录
> [Github](https://github.com/LucasLiu09/odoo-module-lucas/blob/16.0/Non_module/list_select_same_group.js)
:::

List视图支持在字段设置属性以支持选中时自动选中指定字段数据相同的记录。

例如：选中记录时自动选中其他记录中公司与选中记录相等的记录。

```xml
<tree js_class="...">
    <field name="company_id" options="{'select_group': True}"/>
</tree>
```

:::tip[Note]
* 在选中或取消list中的Checkbox时，同时操作字段数据相等的记录
* -- 在field标签中设置`options="{'select_group': True}"`
* 支持多个字段设置，此时需要所有设置的字段数据都相等。
* 对于Many2one字段是比较ID。
* -- 在field标签内设置`options="{..., 'select_valid': True }"`
* 此时将过滤无效数据( 数据为空或0等等: 即`!Boolean(data)` )，只对有效数据进行操作。
:::