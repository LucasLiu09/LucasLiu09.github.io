---
title: Odoo OWL基础字段组件Prompt模板
sidebar_label: Odoo OWL基础字段组件Prompt模板
keywords:
  - AI
  - GenAI
tags: [GenAI]
unlisted: true
---

# Odoo OWL 基础字段组件 Prompt 模板

> **适用类型**: Integer, Float, Char, Text, Date, Datetime, Boolean  
> **复杂度**: ⭐⭐  
> **版本**: v1.0  
> **最后更新**: 2026-01-23

---

## 📖 使用说明

本模板专门用于生成**基础输入型字段组件**，这些字段具有以下共性：
- 简单的值输入/输出模式
- 主要关注格式化和解析
- 使用 `useInputField` hook
- 轻量级验证逻辑

**适用场景：**
- 数字输入（整数、浮点数）
- 文本输入（单行、多行）
- 日期/时间选择
- 布尔值切换

---

## 🎯 类型特定规范

### 必需的导入

```javascript
/** @odoo-module **/

// 1. OWL 核心
import { Component, useState } from "@odoo/owl";

// 2. 字段基础
import { standardFieldProps } from "@web/views/fields/standard_field_props";
import { useInputField } from "@web/views/fields/input_field_hook";

// 3. 格式化和解析（根据类型选择）
import { formatInteger, formatFloat, formatDate } from "@web/views/fields/formatters";
import { parseInteger, parseFloat, parseDate } from "@web/views/fields/parsers";

// 4. 其他工具
import { _lt } from "@web/core/l10n/translation";
import { registry } from "@web/core/registry";

// 5. 可选：特殊功能
import { useNumpadDecimal } from "@web/views/fields/numpad_decimal_hook";  // 数字键盘
```

### 标准Props结构

```javascript
YourField.props = {
    ...standardFieldProps,  // 必须继承
    
    // 基础字段常用可选props
    placeholder: { type: String, optional: true },
    inputType: { type: String, optional: true },    // 'text', 'number'
    step: { type: Number, optional: true },         // 数字字段的步长
    maxLength: { type: Number, optional: true },    // 文本字段的最大长度
};

YourField.defaultProps = {
    inputType: "text",
};
```

### 核心模式：useInputField Hook

```javascript
setup() {
    // 基础字段的核心Hook
    useInputField({
        getValue: () => this.formattedValue,  // 返回格式化后的显示值
        refName: "input",                      // 关联的input元素ref
        parse: (v) => parseInteger(v),         // 解析用户输入
    });
}

get formattedValue() {
    // 只读模式或需要格式化时
    if (this.props.readonly) {
        return formatInteger(this.props.value);
    }
    // 编辑模式可能直接返回原始值
    return this.props.value;
}
```

### 模板结构

```xml
<templates xml:space="preserve">
    <t t-name="your_module.YourField" owl="1">
        <!-- 只读模式 -->
        <span t-if="props.readonly" 
              class="o_field_basic o_readonly">
            <t t-esc="formattedValue"/>
        </span>
        
        <!-- 编辑模式 -->
        <input t-else=""
               type="text"
               class="o_field_basic o_input"
               t-att-placeholder="props.placeholder"
               t-ref="input"
               t-att-value="formattedValue"
               t-att-disabled="props.readonly"
               t-on-change="() => {}" />
    </t>
</templates>
```

### 注册到字段注册表

```javascript
YourField.displayName = _lt("Your Field");
YourField.supportedTypes = ["integer"];  // 支持的字段类型

YourField.isEmpty = (record, fieldName) => {
    return record.data[fieldName] === false;
};

YourField.extractProps = ({ attrs }) => {
    return {
        placeholder: attrs.placeholder,
        inputType: attrs.options.type,
        step: attrs.options.step,
    };
};

registry.category("fields").add("your_field", YourField);
```

---

## 📋 Prompt 模板

````text
你是一位精通 Odoo OWL 框架的前端开发专家。请为我生成一个**基础字段组件**。

## 组件信息

**组件名称**: 【如 CustomIntegerField】
**技术名称**: 【如 custom_integer_field】  
**基础字段类型**: [Integer / Float / Char / Text / Date / Datetime / Boolean]
**显示名称**: 【如 "自定义整数字段"】

## 功能需求

### 核心功能
1. 【功能描述1】: 【如 显示整数值，支持千分位分隔符】
2. 【功能描述2】: 【如 输入时自动格式化】
3. 【功能描述3】: 【如 支持正负数和零】

### 格式化需求
- 显示格式: 【如 1,234,567 或 保留2位小数】
- 输入限制: 【如 只允许数字和负号】
- 特殊处理: 【如 空值显示为 0 还是 空白】

### 验证规则
- 最小值: 【如 0 或 无限制】
- 最大值: 【如 100 或 无限制】
- 必填验证: 【根据 props.required 自动处理】
- 自定义验证: 【如 必须是偶数】

### Props 配置

#### 标准Props（自动继承）
```javascript
// 通过 standardFieldProps 自动获得
- record: Object      // 当前记录
- name: String        // 字段名称
- type: String        // 字段类型
- readonly: Boolean   // 是否只读
- required: Boolean   // 是否必填
- value: Any         // 字段值
- update: Function   // 更新回调
```

#### 自定义Props（通过 options 传入）
```javascript
- placeholder: String     // 【占位符文本】
- inputType: String      // 【'text' 或 'number'】
- step: Number           // 【数字步长，如 0.01】
- prefix: String         // 【前缀符号，如 '$'】
- suffix: String         // 【后缀符号，如 '%'】
- showZero: Boolean      // 【是否显示零值】
- 【其他自定义选项】
```

#### Widget 使用示例
```xml
<field name="amount" 
       widget="custom_integer_field"
       options="{
           'prefix': '$',
           'suffix': 'USD',
           'step': 1,
           'showZero': true
       }"
       placeholder="请输入金额"/>
```

### 交互逻辑

#### 只读模式
- 显示: 【如 格式化后的数值，带前缀和后缀】
- 样式: 【如 灰色文本，无边框】
- 特殊情况: 【如 负数用红色显示】

#### 编辑模式
- 输入框类型: 【text 或 number】
- 实时格式化: 【是否在输入时格式化】
- 失焦行为: 【失焦时完整格式化】
- 快捷键: 【如 上下箭头增减数值】

#### 错误处理
- 无效输入: 【如 输入字母时提示错误】
- 超出范围: 【如 超过最大值时的提示】
- 必填验证: 【空值时的错误提示】

### 样式需求
- 基础样式: 【宽度、高度、边框】
- 只读样式: 【如 无背景、虚线边框】
- 错误样式: 【红色边框、错误图标】
- 前缀/后缀: 【如何展示前缀和后缀】
- 响应式: 【移动端适配】

### 特殊功能（可选）
- [ ] 数字键盘支持（移动端）
- [ ] 千分位分隔符
- [ ] 货币格式化
- [ ] 单位换算
- [ ] 计算器弹窗
- [ ] 【其他】

## 技术要求

### 文件生成

请生成以下文件：

#### 1. JS 组件文件
**路径**: `static/src/fields/【技术名称】/【技术名称】.js`

**要求**:
- 继承 `Component`
- 使用 `useInputField` hook
- 实现 `setup()` 方法
- 实现 `get formattedValue()` 计算属性
- 实现格式化和解析逻辑
- 定义完整的 `props` 和 `defaultProps`
- 实现 `extractProps` 静态方法
- 实现 `isEmpty` 静态方法（可选）
- 注册到 `registry.category("fields")`

#### 2. XML 模板文件
**路径**: `static/src/fields/【技术名称】/【技术名称】.xml`

**要求**:
- 模板名称: `【模块名】.【组件类名】`
- 区分只读和编辑模式
- 使用 `t-ref="input"` 关联输入框
- 支持前缀和后缀显示
- 错误状态显示

#### 3. SCSS 样式文件
**路径**: `static/src/fields/【技术名称】/【技术名称】.scss`

**要求**:
- 类名前缀: `.o_field_【技术名称】`
- 只读/编辑/错误状态样式
- 响应式设计
- 主题适配

#### 4. 资源注册文件
仅在生成模块的情况下才需要输出此项。

**路径**: `__manifest__.py`

**内容**:
```python
{
  "assets": {
    "web.assets_backend": [
      "module_name/static/src/js/*.js",
      "module_name/static/src/xml/*.xml",
      "module_name/static/src/scss/*.scss",
    ],
  }
}
```

### 参考实现

请参考以下 Odoo 标准字段实现：

**Integer 字段**: `@web/views/fields/integer/integer_field`
```javascript
// 核心结构参考
import { formatInteger } from "../formatters";
import { parseInteger } from "../parsers";
import { useInputField } from "../input_field_hook";

setup() {
    useInputField({
        getValue: () => this.formattedValue,
        refName: "numpadDecimal",
        parse: (v) => parseInteger(v),
    });
}
```

**Float 字段**: `@web/views/fields/float/float_field`  
**Char 字段**: `@web/views/fields/char/char_field`  
**Date 字段**: `@web/views/fields/date/date_field`

### 代码规范

- [ ] 添加完整的 JSDoc 注释
- [ ] 所有方法添加类型注释
- [ ] 使用 `_lt()` 实现国际化
- [ ] 私有方法使用下划线前缀
- [ ] 遵循 Odoo 代码风格
- [ ] 添加错误处理
- [ ] 性能优化（避免重复计算）

### 使用示例

请在生成代码后提供以下使用示例：

#### 在表单视图中使用
```xml
<record id="view_model_form" model="ir.ui.view">
    <field name="name">model.form</field>
    <field name="model">your.model</field>
    <field name="arch" type="xml">
        <form>
            <sheet>
                <group>
                    <field name="your_field" 
                           widget="【技术名称】"
                           options="{'prefix': '$'}"/>
                </group>
            </sheet>
        </form>
    </field>
</record>
```

#### 在列表视图中使用
```xml
<tree>
    <field name="your_field" widget="【技术名称】"/>
</tree>
```

#### 在Python模型中定义字段
```python
from odoo import models, fields

class YourModel(models.Model):
    _name = 'your.model'
    
    your_field = fields.【Integer/Float/Char】(
        string="【字段标签】",
        required=【True/False】,
        help="【帮助文本】"
    )
```

## 额外说明

【在此添加任何额外的说明、约束或特殊要求】

## 期望输出

请生成：
1. 完整的 JavaScript 组件代码
2. 完整的 XML 模板代码
3. 完整的 SCSS 样式代码
4. 使用文档和示例
5. 测试建议（可选）

确保代码：
- 完全符合 Odoo 16.0+ OWL 框架规范
- 可以直接使用，无需修改
- 包含必要的注释和文档
- 处理边界情况和错误
````

---

## 🎨 快速示例

### 示例1：带货币符号的整数字段

```text
**组件名称**: CurrencyIntegerField
**技术名称**: currency_integer_field
**基础字段类型**: Integer
**显示名称**: "货币整数字段"

核心功能:
1. 显示整数金额，带千分位分隔符
2. 支持货币符号前缀（可配置）
3. 支持正负数

自定义Props:
- currency: String (货币符号，如 '$', '¥')
- showZero: Boolean (零值是否显示)
- colorNegative: Boolean (负数是否显示为红色)

Widget使用:
<field name="amount" widget="currency_integer_field" 
       options="{'currency': '$', 'showZero': true, 'colorNegative': true}"/>
```

### 示例2：百分比浮点数字段

```text
**组件名称**: PercentageFloatField
**技术名称**: percentage_float_field
**基础字段类型**: Float
**显示名称**: "百分比字段"

核心功能:
1. 显示浮点数值，自动添加 '%' 后缀
2. 保留2位小数
3. 范围限制 0-100

验证规则:
- 最小值: 0
- 最大值: 100
- 小数位数: 2

Widget使用:
<field name="discount" widget="percentage_float_field" 
       options="{'min': 0, 'max': 100, 'digits': 2}"/>
```

---

## 📚 常见问题

### Q1: 如何自定义格式化函数？

```javascript
_formatValue(value) {
    if (value === false || value === null) {
        return '';
    }
    // 自定义格式化逻辑
    const formatted = formatInteger(value);
    return this.props.prefix + formatted + this.props.suffix;
}
```

### Q2: 如何添加输入验证？

```javascript
_parseValue(value) {
    const parsed = parseInteger(value);
    
    // 自定义验证
    if (parsed < this.props.min) {
        throw new Error(`值不能小于 ${this.props.min}`);
    }
    if (parsed > this.props.max) {
        throw new Error(`值不能大于 ${this.props.max}`);
    }
    
    return parsed;
}
```

### Q3: 如何支持移动端数字键盘？

```javascript
import { useNumpadDecimal } from "@web/views/fields/numpad_decimal_hook";

setup() {
    useInputField({ ... });
    useNumpadDecimal();  // 添加这一行
}
```

### Q4: 如何处理空值？

```javascript
YourField.isEmpty = (record, fieldName) => {
    const value = record.data[fieldName];
    // false、null、undefined 都视为空
    return value === false || value === null || value === undefined;
};
```

---

## 🔗 相关资源

- [Odoo 标准字段实现](https://github.com/odoo/odoo/tree/16.0/addons/web/static/src/views/fields)
- [OWL 框架文档](https://github.com/odoo/owl)
- [standardFieldProps 说明](https://github.com/odoo/odoo/blob/16.0/addons/web/static/src/views/fields/standard_field_props.js)

---

**版本历史**:
- v1.0 (2026-01-23): 初始版本
