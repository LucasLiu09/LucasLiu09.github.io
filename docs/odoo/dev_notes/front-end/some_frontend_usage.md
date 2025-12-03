---
title: 一些前端用法
description: 一些前端用法
sidebar_label: 一些前端用法
keyword:
  - odoo
  - odoo development
tags:
  - odoo
last_update:
  date: 2025/12/3
  author: Lucas
---
# 一些前端用法

:::info[Version]
odoo16
:::

## 修改菜单样式

通过css/scss定位菜单的标签
```css
a.dropdown-item[data-menu-xmlid='menu_id']{
  // 编写样式代码
}
```

## 修改tree视图的字段标题行样式

在tree view上添加class

```xml
<tree class="o_my_class">
  <field name="display_name"/>
  <field name="field1"/>
  <field name="field2"/>
  <!-- ... -->
</tree>
```

定义css，odoo16通过`data-name`定位字段，旧版本需要确认是否通过`data-id`来定位。

若样式未生效，可以在样式后加上`!important`

```css
.o_my_class [data-name="display_name"] {
  width: 10px !important; 
  color: red !important; 
}

.o_my_class th:is([data-name="field1"], [data-name="field2"]) {
  width: 10px !important; 
  color: blue !important; 
}
```

```scss
$o-xx-list-filed-width:
"field1" 150px 150px,
"field2" 150px 150px,
;

@each $field_name, $width, $min-width in $o-xx-list-filed-width {
  .o_my_class [data-name="#{$field_name}"] {
    width: $width !important;
    min-width: $min-width !important;
  }
}

//当只有一条记录时，需要在";"前加","号，以表明是数组。
$o-xx-list-field-align:
"field1" left,
"field2" right,
;

@each $field_name, $t-align in $o-xx-list-field-align {
  .o_my_class [data-name="#{$field_name}"] span {
    text-align: $t-align !important;
  }
}
```

## tree view 固定表头

```css
.sticky-list-header-top {
	.o_list_table,
	{

		thead {
			position: sticky;
			top: 0;
			z-index: 1;
		}
	}
}
```

## Form view布局

这种布局方式保留了框架本身的tooltip。

用div代替group，内嵌的div设置`o_inner_group grid col-lg-x`的class，通过col-x来控制列宽(总宽col12)。

label和field通过两种方式排列

label+field

label+div(class="flex") -> field + [label] + field

```xml
<div class="row">
    <div class="o_inner_group grid col-lg-2">
        <label for="field1" string="创建"/>
        <field name="field1" style="width:130px"/>
    </div>
    <div class="o_inner_group grid col-lg-4">
        <label for="field2" string="修改"/>
        <div class="flex">
            <field name="field2" style="width:130px"/>
            <field name="field3"/>
        </div>
    </div>
    <div class="o_inner_group grid col-lg-4">
        <label for="field4" string="批准"/>
        <div class="flex">
            <field name="field4" style="width:130px"/>
            <label for="field5"/>
            <field name="field5"/>
        </div>
    </div>
</div>
```

