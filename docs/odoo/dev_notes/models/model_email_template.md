---
title: Email Template
description: Email Template
sidebar_label: Email Template
keywords:
- docs
- odoo development
tags: [odoo]
---
# Email Template

## Model

- _name: mail.template
- _inherit: ['mail.render.mixin', 'template.reset.mixin']

## Feilds

| 字段                                                 | 名称 | 说明 |
|----------------------------------------------------| --- | --- |
| <font style={{color:'#DF2A3F'}}>name</font>        | 模板名称 | |
| <font style={{color:'#DF2A3F'}}>description</font> | 描述 | |
| active                                             | 是否有效 | |
| template_category                                  | | |
| <font style={{color:'#DF2A3F'}}>model_id</font>    | 关联模型 | ref(xml_id) |
| model                                              |  | related -> [ir.model].model |
| lang                                               | 语言 |  |
| <font style={{color:'#DF2A3F'}}>subject</font>     | 邮件主题 | |
| <font style={{color:'#DF2A3F'}}>email_from</font>  | 发件人 | |
| use_default_to                                     | 是否默认收件人 | |
| <font style={{color:'#DF2A3F'}}>email_to</font>    | 收件人 | |
| <font style={{color:'#ED740C'}}>partner_to</font>  | 至合作伙伴 | |
| <font style={{color:'#ED740C'}}>email_cc</font>    | 抄送人 | |
| reply_to                                           | 回复邮箱地址 | 批量发送email时将回复重定向到的email地址 |
| <font style={{color:'#DF2A3F'}}>body_html</font>   | 邮件内容 | Html（qweb） |
| attachment_ids                                     | 附件 | |
| report_name                                        | 报表名称 | |
| report_template                                    | 关联报表(ir.actions.report) | 可选的打印和附加报表 |
| mail_server_id                                     | 发件服务器(ir.mail_server) | 用于外发邮件的可选首选服务器。<br/>如果未设置，将使用最高优先级。 |
| scheduled_date                                     | 安排的发送时间 | |
| auto_delete                                        | 是否自动删除(默认True) | |
| ref_ir_act_window                                  | Sidebar action(ir.actions.act_window) | 使此模板在相关文档模型的记录上可用的侧边栏操作 |
| can_write                                          | 是否可编辑，Access | 当前用户是否可编辑模板 |
