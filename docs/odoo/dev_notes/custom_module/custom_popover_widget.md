---
title: custom_popover_widget
description: 自定义Popover提示，可以固定提示语或从后端返回提示语。
sidebar_label: custom_popover_widget
keyword:
  - odoo
  - odoo development
tags:
  - odoo
last_update: 
  date: 2025/11/20
  author: Lucas
---

# custom_popover_widget

:::info[Note]
自定义Popover提示，可以固定提示语或从后端返回提示语。（在FormView可根据自定义设置在请求后端获取信息前保存Record）
> [Github](https://github.com/LucasLiu09/odoo-module-lucas/tree/16.0/custom_popover_widget)
:::

## 示意图

![custom_popover_widget-1.gif](../_images/custom_popover_widget_1.gif)

## 用法

```xml
<widget name="custom_popover_widget" attrs="{}" icon="fa-search" text="查看库存" tooltip="some tips" autoSave="True" />
```

参数说明：
- icon设置图标
- text：设置图标后的文本
- tooltip：提示信息(设置这个属性视为固定提示语，就不会请求后端获取。)
- autoSave：在请求后端前是否保存。

要从后端获取信息时在调用该`widget`的`Model`定义`get_tooltip()`，通过后端返回信息。

