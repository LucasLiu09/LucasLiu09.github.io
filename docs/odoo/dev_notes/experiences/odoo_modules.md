---
title: 模块收录
description: 模块收录
sidebar_label: 模块收录
keyword:
  - odoo
  - odoo development
tags:
  - odoo
toc_max_heading_level: 4
---

# Odoo 模块收录

## OCA

### queue

#### Job Queue

- 描述：为 Odoo 添加了一个集成的作业队列。它允许延迟执行异步方法调用。作业由 Jobrunner 在后台独立运行，并在各自的事务中执行。
- 来源：[Github](https://github.com/OCA/queue/tree/19.0/queue_job)、 [OCA](https://apps.odoo-community.org/modules/queue_job)

### server-auth

#### Password Security

- 描述：允许管理员设置公司级别的密码安全要求，并对用户强制执行这些要求。
- 来源：[Github](https://github.com/OCA/server-auth/tree/18.0/password_security)、 [OCA](https://apps.odoo-community.org/modules/password_security)

### server-brand

#### Remove odoo.com Bindings

- 描述：停用所有标准代码自带的与 odoo.com 的绑定。更新通知代码已被停用，并且该函数已被覆盖。此操作仅在社区版中停用，因为在 Odoo 企业版中停用通知代码是不允许的。设置中的“应用”和“更新”菜单项已隐藏在“技术参数”中。用户菜单中的“文档”、“支持”和“odoo.com 帐户”选项已被移除。
- 来源：[Github](https://github.com/OCA/server-brand/tree/19.0/disable_odoo_online)、 [OCA](https://apps.odoo-community.org/modules/disable_odoo_online)

### server-tools

#### Improved Name Search

- 描述：扩展了name search功能，使其使用更多、更宽松的匹配方法，并允许搜索可配置的其他记录字段。
- 来源：[Github](https://github.com/OCA/server-tools/tree/18.0/base_name_search_improved)、 [OCA](https://apps.odoo-community.org/modules/base_name_search_improved)

### server-ux

#### Date Range

- 描述：此模块允许您定义全局日期范围，该范围可用于在树状视图中筛选值。
- 来源：[Github](https://github.com/OCA/server-ux/tree/19.0/date_range)、 [OCA](https://apps.odoo-community.org/modules/date_range)

#### Mass Editing

- 描述：允许在任何 Odoo 模型中同时编辑多个记录。
- 来源：[Github](https://github.com/OCA/server-ux/tree/19.0/server_action_mass_edit)、 [OCA](https://apps.odoo-community.org/modules/server_action_mass_edit)

### web

#### 2D matrix for x2many fields

- 描述：This module allows to show an x2many field with 3-tuples ($x_value, $y_value, $value) in a table
- 来源：[Github](https://github.com/OCA/web/tree/18.0/web_widget_x2many_2d_matrix)、 [OCA](https://apps.odoo-community.org/modules/web_widget_x2many_2d_matrix)

#### Advanced search

- 来源：[Github](https://github.com/OCA/web/tree/16.0/web_advanced_search)、 [OCA](https://apps.odoo-community.org/modules/web_advanced_search)

#### Apply Field Style

- 描述：Allow to set an additional css class to fields in form view.
- 来源：[Github](https://github.com/OCA/web/tree/16.0/web_apply_field_style)、 [OCA](https://apps.odoo-community.org/modules/web_apply_field_style)

#### Clickable many2one fields for tree views

- 描述：允许用户从list视图上直接使用按钮打开关联字段的资源而不访问表单。
- 来源：[Github](https://github.com/OCA/web/tree/19.0/web_tree_many2one_clickable)、 [OCA](https://apps.odoo-community.org/modules/web_tree_many2one_clickable)

#### Colorize field in tree views

- 描述：支持对list视图中根据记录中的数据动态设置字段的字体/背景颜色。
- 来源：[Github](https://github.com/OCA/web/tree/18.0/web_tree_dynamic_colored_field)、 [OCA](https://apps.odoo-community.org/modules/web_tree_dynamic_colored_field)

#### Custom shortcut icon

- 描述：自定义 Odoo 实例的快捷方式图标(又名 favicon)
- 来源：[Github](https://github.com/OCA/web/tree/19.0/web_favicon)、 [OCA](https://apps.odoo-community.org/modules/web_favicon)

#### Dynamic Dropdown Widget

- 描述：Dynamic dropdown widget that supports resolving options from backend of：char/integer/float
- 来源：[Github](https://github.com/OCA/web/tree/18.0/web_widget_dropdown_dynamic)、 [OCA](https://apps.odoo-community.org/modules/web_widget_dropdown_dynamic)

#### Group Expand Buttons

- 描述：在list视图增加展开/折叠分组的按钮
- 来源：[Github](https://github.com/OCA/web/tree/19.0/web_group_expand)、 [OCA](https://apps.odoo-community.org/modules/web_group_expand)

#### Input patterns

- 描述：在后端给文本字段设置正则约束
- 来源：[Github](https://github.com/OCA/web/tree/18.0/web_widget_pattern)、 [OCA](https://apps.odoo-community.org/modules/web_widget_pattern)

#### List Range Selection

- 描述：允许用shift键来批量选择list view的记录。
- 来源：[Github](https://github.com/OCA/web/tree/16.0/web_listview_range_select)、 [OCA](https://apps.odoo-community.org/modules/web_listview_range_select)

#### Progressive web application(PWA)

- 描述：Make Odoo an installable Progressive Web Application.
- 来源：[Github](https://github.com/OCA/web/tree/16.0/web_pwa_oca)、 [OCA](https://apps.odoo-community.org/modules/web_pwa_oca)

#### Web Environment Ribbon

- 描述：在每一页左上角用红色丝带标记一个测试环境。
- 来源：[Github](https://github.com/OCA/web/tree/19.0/web_environment_ribbon)、 [OCA](https://apps.odoo-community.org/modules/web_environment_ribbon)

#### Web Form Banner

- 描述：可以给form视图配置动态的横幅提示，以提醒用户输入。
- 来源：[Github](https://github.com/OCA/web/tree/16.0/web_form_banner)、 [OCA](https://apps.odoo-community.org/modules/web_form_banner?serie=16.0)


#### web_notify

- 描述：实时向用户发送即时通知消息。
- 来源：[Github](https://github.com/OCA/web/tree/19.0/web_notify)、 [OCA](https://apps.odoo-community.org/modules/web_notify)


#### web_notify_channel_message

- 描述：当一条新消息被发布时，将向所有频道用户发送即时通知。
- 来源：[Github](https://github.com/OCA/web/tree/18.0/web_notify_channel_message)、 [OCA](https://apps.odoo-community.org/modules/web_notify_channel_message)


#### web_notify_upgrade

- 描述：安装或升级模块时使用 web_notify 向每个活跃用户发送通知。通知将要求用户刷新页面以获取最新信息变化。
- 来源：[Github](https://github.com/OCA/web/tree/18.0/web_notify_upgrade)、 [OCA](https://apps.odoo-community.org/modules/web_notify_upgrade)

#### web_pivot_computed_measure

- 描述：在pivot视图上增加对computed measures的支持。
- 来源：[Github](https://github.com/OCA/web/tree/18.0/web_pivot_computed_measure)、 [OCA](https://apps.odoo-community.org/modules/web_pivot_computed_measure)

#### Web Refresher

- 描述：在Pager旁边添加一个按钮(在`tree/kanban`视图中)以刷新显示列表。
- 来源：[Github](https://github.com/OCA/web/tree/19.0/web_refresher)、 [OCA](https://apps.odoo-community.org/modules/web_refresher?serie=19.0)
 
#### Web Responsive

- 来源：[Github](https://github.com/OCA/web/tree/19.0/web_responsive)、 [OCA](https://apps.odoo-community.org/modules/web_responsive)

#### Web Remember Tree Column Width

- 描述：记住tree视图列的宽度。
- 来源：[Github](https://github.com/OCA/web/tree/19.0/web_remember_tree_column_width)、 [OCA](https://apps.odoo-community.org/modules/web_remember_tree_column_width)
 
#### web_theme_classic

- 描述：本模块扩展了Odoo社区版 web 模块需要改进输入字段的可见性。
- 来源：[Github](https://github.com/OCA/web/tree/18.0/web_theme_classic)、 [OCA](https://apps.odoo-community.org/modules/web_theme_classic)

#### Web Systray Button Init Action

- 描述：在右上角托盘处添加一个按钮以导航到指定页面。
- 来源：[Github](https://github.com/OCA/web/tree/18.0/web_systray_button_init_action)、 [OCA](https://apps.odoo-community.org/modules/web_systray_button_init_action)

#### Web timeline

- 描述：定义一个以交互式可视化形式显示甘特图的新视图图表。
- 依赖：基于外部库 [visjs](https://visjs.github.io/vis-timeline/examples/timeline)
- 来源：[Github](https://github.com/OCA/web/tree/19.0/web_timeline)、 [OCA](https://apps.odoo-community.org/modules/web_timeline)

#### web_widget_datepicker_fulloptions

- 描述：在日期字段中使用的 `datepicker` 中实现完整选项
- 来源：[OCA](https://apps.odoo-community.org/modules/web_widget_datepicker_fulloptions)

#### Web Widget Numeric Step

- 描述：给数字字段增加按钮：以指定步长进行增减。
- 来源：[Github](https://github.com/OCA/web/tree/18.0/web_widget_numeric_step)、 [OCA](https://apps.odoo-community.org/modules/web_widget_numeric_step)

#### Web Widget One2many Tree Line Duplicate

- 描述：允许One2Many字段增加一个按钮复制数据。
- 来源：[Github](https://github.com/OCA/web/tree/19.0/web_widget_one2many_tree_line_duplicate)、 [OCA](https://apps.odoo-community.org/modules/web_widget_one2many_tree_line_duplicate)

#### web_m2x_options

- 来源：[Github](https://github.com/OCA/web/tree/19.0/web_m2x_options)、 [OCA](https://apps.odoo-community.org/modules/web_m2x_options)

### other

#### Base report xlsx

- 描述：This module provides a basic report class to generate xlsx report.
- 来源：[Github](https://github.com/OCA/reporting-engine/tree/19.0/report_xlsx)、 [OCA](https://apps.odoo-community.org/modules/report_xlsx)
