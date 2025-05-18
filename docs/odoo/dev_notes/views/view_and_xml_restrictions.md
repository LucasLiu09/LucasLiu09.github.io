---
title: view/xml的限制
description: view/xml的限制
sidebar_label: view/xml的限制
keywords:
- docs
- odoo development
tags: [odoo]
---

# 关于view/xml的限制

后端的验证在ir_ui_view模型中，对于视图来说，主要在于_check_xml这类对于xml中的标签定义的验证。

其中，对于各类标签内的可用属性的控制是通过Relax NG (RNG) 验证器实现；具体的RNG文件见`odoo->addons->base->rng`目录内。

![](../_images/view_and_xml_restrictions_1.png)
![](../_images/view_and_xml_restrictions_2.png)
![](../_images/view_and_xml_restrictions_3.png)
![](../_images/view_and_xml_restrictions_4.png)


