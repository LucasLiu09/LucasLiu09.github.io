---
title: Many2manyBinary Field 扩展
description: Many2manyBinary Field 扩展
sidebar_label: Many2manyBinary Field 扩展
keyword:
  - odoo
  - odoo development
tags:
  - odoo
last_update:
  date: 2025/12/1
  author: Lucas
---
# Many2manyBinary field扩展

:::info[Note]
对Many2manyBinary字段进行一些功能扩展

- 文件预览(基于fancybox)
:::


## 文件预览

> [Github-m2m_attachment_preview](https://github.com/LucasLiu09/odoo-module-lucas/blob/16.0/Non_module/m2m_attachment_preview/m2m_attachment_preview.js)

支持many2many IrAttachment文件预览，

支持文件类型: 'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'mp4', 'webm', 'pdf', 'html'

代码示例：
```xml
<field name="attachment_ids" widget="m2m_attachment_preview" />
```
