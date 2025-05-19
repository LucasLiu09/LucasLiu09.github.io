---
title: ConfirmationDialogWithInput
description: OWL - 支持自定义输入框的确认弹窗
sidebar_label: OWL - 支持自定义输入框的确认弹窗
keywords:
- odoo
- odoo development
tags: [odoo]
last_update:
  date: 2025/5/19
  author: Lucas
---

# ConfirmationDialogWithInput

:::info[Note]
基于`Dialog`实现可以通过`props`传输的内容来自定义输入框的一个确认弹窗。
支持`JavaScript`、`python`调用。
`JavaScript`通过`dialog service`调用。
`python`通过`return` 一个`ir.actions.client`调用。
> [Github](https://github.com/LucasLiu09/odoo-module-lucas/tree/16.0/confirmation_dialog_with_input)
:::

## 需要处理的逻辑

1. 定义一个新的Component
2. 编写模版
3. 设计props，以支持自定义各类内容
4. 实现存储输入框的值，以供后续function使用。
5. 编写function的逻辑（确认/取消）
6. 注册一个actions，以支持python调用。
7. 拓展：支持自定义Button及回调。

