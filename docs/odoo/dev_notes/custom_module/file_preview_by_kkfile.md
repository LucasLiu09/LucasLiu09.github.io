---
title: 调用kkfileview实现文档在线预览
description: 调用kkfileview实现文档在线预览
sidebar_label: 调用kkfileview实现文档在线预览
keyword:
  - odoo
  - odoo development
tags:
  - odoo
last_update:
  date: 2025/12/3
  author: Lucas
---
# 调用kkfileview实现文档在线预览

:::info[Note]
odoo调用**kkfileview**实现文档在线预览功能，为用户提供了更加便捷和高效的文档管理和浏览方式，增强了odoo系统的用户体验和功能扩展性。

- [Gitee - attachment_preview](https://gitee.com/Mala_Siling/odoo16-custom_addons/tree/master/attachment_preview)
:::

## kkfile介绍

> - [kkFileView](https://kkview.cn/zh-cn/index.html)
> - [Github](https://github.com/kekingcn/kkFileView)

**kkFileView**为文件文档在线预览解决方案，该项目使用流行的spring boot搭建，易上手和部署，基本支持主流办公文档的在线预览，如doc,docx,xls,xlsx,ppt,pptx,pdf,txt,zip,rar,图片,视频,音频等等。

使用odoo调用kkfileview，用户可以在odoo系统中直接预览各种文档，包括但不限于PDF、Word文档、Excel表格、PowerPoint演示文稿等。通过使用kkfileview，odoo系统可以提供更加便捷的文档浏览体验，无需下载文件到本地，直接在浏览器中进行在线预览。

---

## 实现思路

步骤：
1. 对Many2ManyBinaryField进行扩展
	1. 增加操作按钮
	2. 在按钮对应的函数中拼接kkfile的预览url。
2. 编写Controller，开放接口供kkfile加载系统文件。
	1. 获取odoo web url, kkfile service url
	2. download file from public

## 功能截图

form view：

![image1](../_images/file_preview_by_kkfile_1.png)

tree view:

![image2](../_images/file_preview_by_kkfile_2.png)