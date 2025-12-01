---
title: Char Field 扩展
description: Char Field 扩展
sidebar_label: Char Field 扩展
keyword:
  - odoo
  - odoo development
tags:
  - odoo
last_update:
  date: 2025/12/1
  author: Lucas
---
# Char field扩展

:::info[Note]
对Char字段进行一些功能扩展

- 支持下拉选择(可搜索)
:::


## 支持下拉选择

> [Github-char_and_selection](https://github.com/LucasLiu09/odoo-module-lucas/tree/16.0/Non_module/char_and_selection)
>
> [Github-char_and_selection_v2](https://github.com/LucasLiu09/odoo-module-lucas/tree/16.0/Non_module/char_and_selection_v2)

支持Char Field使用下拉选项，支持搜索

![char_and_selection1](../../_images/char_and_selection_1.png)

代码示例：
```xml
<field name="remark" widget="char_and_selection" options="{'optionList':[
'送货单与实物不符',
'送货单抬头错误',
'数量不符',
'收货签收责任人不在，下次送货收回']}"/>
```

:::note[TODO]
1. 支持下拉选择的选项从Model中查询。
:::
