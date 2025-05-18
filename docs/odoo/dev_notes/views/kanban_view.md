---
title: Kanban view
description: Kanban view
sidebar_label: Kanban 
keywords:
- odoo
- odoo development
tags: [odoo]
last_update:
  date: 2025/5/18
  author: Lucas
---
# Kanban view

Kanban 视图是一种标准的 Odoo 视图（类似于表单和列表视图），但它们的结构更加灵活。事实上，每张卡片的结构是表单元素（包括基本的 HTML）和 QWeb 的混合。

最小的栗子：
```xml
<kanban>
  
  <templates>
    <t t-name="kanban-box">
      <div class="oe_kanban_global_click">
        <field name="name"/>
      </div>
    </t>
  </templates>
</kanban>
```

对以上代码进行拆解说明：

- `<templates>`: 定义 QWeb 模板模板列表。Kanban 视图必须至少定义一个根模板 kanban-box，该模板将为每条记录渲染一次。
- `<t t-name="kanban-box">`: `<t>` 是 QWeb 指令的占位符元素。在这种情况下，它用于设置模板的名称为 kanban-box。
- `<div class="oe_kanban_global_click">`：oe_kanban_global_click 使 `<div>` 具有可点击性，以打开记录。
- `<field name="name"/>`：这将在视图中添加名为 "name" 的字段。

**kanban中可调用的属性：**

record：一个对象，其属性为所有请求的字段。每个字段都有两个属性，`value`和 `raw_value`。前者根据当前用户的参数进行格式化，而后者是从 `read()` 直接获取的值。

当我们需要字段的值但不想在视图中显示它时，可以将其添加到 `<templates>` 元素之外。例如下面的`state`字段。

```xml
<kanban>
    <field name="state"/>
    <templates>
        <t t-name="kanban-box">
            <div class="oe_kanban_global_click">
                <field name="name"/>
                <div t-if="record.state.raw_value == 'new'">
                    This is new!
                </div>
            </div>
        </t>
    </templates>
</kanban>
```

## 看板在分组情况下禁用拖拽

在v13之后，可以在kanban的标签内添加属性`records_draggable="0"`
