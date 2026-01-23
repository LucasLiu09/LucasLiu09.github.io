---
title: Odoo OWL选择类字段组件Prompt模板
sidebar_label: Odoo OWL选择类字段组件Prompt模板
keywords:
  - AI
  - GenAI
tags: [GenAI]
unlisted: true
---

# Odoo OWL 选择类字段组件 Prompt 模板

> **适用类型**: Selection, Radio, Badge Selection, State Selection  
> **复杂度**: ⭐⭐⭐  
> **版本**: v1.0  
> **最后更新**: 2026-01-23

---

## 📖 使用说明

本模板专门用于生成**选择类字段组件**，这些字段具有以下共性：
- 固定的选项列表
- 单选或多选模式
- 不同的视觉呈现（下拉、单选按钮、徽章等）
- 选项可能带有颜色、图标等属性

**适用场景：**
- Selection: 下拉选择框
- Radio: 单选按钮组
- Badge: 徽章/标签选择
- State Selection: 状态选择（带颜色）

---

## 🎯 类型特定规范

### 必需的导入

```javascript
/** @odoo-module **/

// 1. OWL 核心
import { Component } from "@odoo/owl";

// 2. 字段基础
import { standardFieldProps } from "@web/views/fields/standard_field_props";

// 3. 工具
import { _lt } from "@web/core/l10n/translation";
import { registry } from "@web/core/registry";
```

### Selection 字段数据结构

```javascript
// Selection 定义（Python）
state = fields.Selection([
    ('draft', 'Draft'),
    ('confirmed', 'Confirmed'),
    ('done', 'Done'),
    ('cancel', 'Cancelled')
], string='Status')

// 在 JS 中获取选项
get options() {
    const field = this.props.record.fields[this.props.name];
    return field.selection.filter(
        (option) => option[0] !== false && option[1] !== ""
    );
}

// 选项格式: [value, label]
// 示例: [['draft', 'Draft'], ['done', 'Done']]
```

### 核心Props结构

```javascript
SelectionField.props = {
    ...standardFieldProps,
    placeholder: { type: String, optional: true },
};

// 获取当前选项的显示文本
get string() {
    if (this.props.value === false) return "";
    const option = this.options.find(o => o[0] === this.props.value);
    return option ? option[1] : "";
}
```

### 选项处理方法

```javascript
// 获取选项列表
get options() {
    const field = this.props.record.fields[this.props.name];
    // 过滤掉 false 和空字符串
    return field.selection.filter(
        (option) => option[0] !== false && option[1] !== ""
    );
}

// 序列化值（用于 select 元素）
stringify(value) {
    return JSON.stringify(value);
}

// 处理变更
onChange(ev) {
    const value = JSON.parse(ev.target.value);
    this.props.update(value);
}
```

---

## 📋 Prompt 模板

````text
你是一位精通 Odoo OWL 框架的前端开发专家。请为我生成一个**选择类字段组件**。

## 组件信息

**组件名称**: 【如 BadgeSelectionField】
**技术名称**: 【如 badge_selection_field】  
**展现类型**: [Dropdown / Radio / Badge / Button Group]
**显示名称**: 【如 "徽章选择字段"】

## 功能需求

### 核心功能

1. 【功能1】: 【如 显示选项为彩色徽章】
2. 【功能2】: 【如 点击徽章切换选择】
3. 【功能3】: 【如 支持选项图标】
4. 【功能4】: 【如 只读模式显示高亮徽章】

### 选项配置

#### 选项来源
- **标准 Selection**: 【从字段定义获取】
```python
# Python 模型中定义
priority = fields.Selection([
    ('0', 'Low'),
    ('1', 'Normal'),
    ('2', 'High'),
    ('3', 'Urgent')
], string='Priority', default='1')
```

- **动态选项**: 【通过方法获取】
- **选项属性**: 【值、标签、颜色、图标】

#### 选项显示
- 显示格式: 【标签/图标+标签/仅图标】
- 空选项: 【是否允许空值】
- 默认选项: 【首个/指定/空】

### 视觉样式

#### Dropdown（下拉选择）
- 样式: 【标准下拉/搜索下拉/分组下拉】
- 选中显示: 【值/标签/自定义】
- 下拉选项: 【带图标/带颜色/纯文本】

#### Radio（单选按钮）
- 布局: 【水平/垂直/网格】
- 样式: 【圆形按钮/方形卡片/文本按钮】
- 间距: 【紧凑/标准/宽松】

#### Badge（徽章）
- 外观: 【圆角矩形/圆形/药丸形】
- 颜色: 【固定/基于值/基于选项】
- 大小: 【小/中/大】
- 图标: 【前置/后置/无】

#### Button Group（按钮组）
- 样式: 【实心/空心/文本】
- 布局: 【单行/多行/自适应】
- 选中效果: 【高亮/阴影/边框】

### Props 配置

#### 标准Props（自动继承）
```javascript
// 通过 standardFieldProps 自动获得
- record: Object      // 当前记录
- name: String        // 字段名称
- type: String        // 字段类型（selection）
- readonly: Boolean   // 是否只读
- value: String       // 当前选中值
- update: Function   // 更新回调
```

#### 自定义Props
```javascript
- placeholder: String         // 【占位符（下拉模式）】
- allowEmpty: Boolean        // 【是否允许空值】
- horizontal: Boolean        // 【是否水平布局（Radio）】
- badgeStyle: String         // 【徽章样式】
- colorField: String         // 【颜色字段名】
- iconField: String          // 【图标字段名】
- showLabel: Boolean         // 【是否显示标签】
- size: String              // 【大小: 'sm', 'md', 'lg'】
- 【其他自定义选项】
```

#### Widget 使用示例

**Badge Selection**:
```xml
<field name="priority" 
       widget="badge_selection_field"
       options="{
           'badgeStyle': 'pill',
           'size': 'md'
       }"/>
```

**Radio Selection**:
```xml
<field name="state" 
       widget="radio_selection_field"
       options="{
           'horizontal': true
       }"/>
```

**Colored Badge**:
```xml
<field name="stage_id" 
       widget="state_selection_field"
       options="{
           'color_field': 'color',
           'show_label': true
       }"/>
```

### 颜色映射（可选）

#### 固定颜色映射
```javascript
const COLOR_MAP = {
    'draft': 'secondary',      // 灰色
    'confirmed': 'primary',    // 蓝色
    'done': 'success',         // 绿色
    'cancel': 'danger'         // 红色
};
```

#### 基于值的颜色
```javascript
getColorClass(value) {
    // 优先级数字 -> 颜色
    const colors = ['success', 'info', 'warning', 'danger'];
    return colors[parseInt(value)] || 'secondary';
}
```

#### 从字段读取颜色
```javascript
// 如果关联记录有颜色字段
const option = this.props.record.data[this.props.name];
const color = option && option.color ? option.color : 0;
```

### 交互逻辑

#### 只读模式
- 显示: 【高亮显示当前值的徽章/标签】
- 可点击: 【是否可点击查看详情】
- 空值: 【显示占位符/空白/'-'】

#### 编辑模式

**Dropdown**:
- 点击: 【展开下拉列表】
- 选择: 【点击选项更新值】
- 清除: 【X按钮清空（如果允许）】

**Radio/Badge**:
- 点击: 【直接切换到该选项】
- 多次点击: 【不允许取消/允许取消】
- 键盘导航: 【上下键/左右键切换】

#### 验证逻辑
- 必填验证: 【基于 props.required】
- 空值处理: 【false 或 null】
- 错误提示: 【边框变红/提示文本】

### 样式需求

#### 基础样式
- 容器布局: 【flex/grid/inline】
- 间距: 【选项之间的间距】
- 对齐: 【左对齐/居中/两端对齐】

#### 选项样式
- 未选中: 【浅色背景、深色文本】
- 选中: 【高亮背景、白色文本】
- Hover: 【悬停效果】
- Disabled: 【禁用样式】

#### 响应式
- 桌面: 【完整显示】
- 平板: 【适度缩放】
- 手机: 【垂直布局/滚动】

### 特殊功能（可选）
- [ ] 选项分组
- [ ] 选项搜索（下拉模式）
- [ ] 自定义选项模板
- [ ] 选项提示文本（tooltip）
- [ ] 动态加载选项
- [ ] 多语言选项
- [ ] 选项计数徽章
- [ ] 【其他】

## 技术要求

### 文件生成

请生成以下文件：

#### 1. JS 组件文件
**路径**: `static/src/fields/【技术名称】/【技术名称】.js`

**核心结构**:
```javascript
export class YourSelectionField extends Component {
    // 获取选项列表
    get options() {
        const field = this.props.record.fields[this.props.name];
        return field.selection.filter(
            (option) => option[0] !== false && option[1] !== ""
        );
    }
    
    // 获取当前显示文本
    get string() {
        if (this.props.value === false) return "";
        const option = this.options.find(o => o[0] === this.props.value);
        return option ? option[1] : "";
    }
    
    // 获取当前值
    get value() {
        return this.props.value;
    }
    
    // 序列化（用于select元素）
    stringify(value) {
        return JSON.stringify(value);
    }
    
    // 处理变更
    onChange(ev) {
        const value = JSON.parse(ev.target.value);
        this.props.update(value);
    }
    
    // 直接更新（用于按钮点击）
    selectOption(value) {
        this.props.update(value);
    }
    
    // 获取选项颜色类
    getColorClass(value) {
        // 实现颜色映射逻辑
    }
}

YourSelectionField.template = "【模块】.YourSelectionField";
YourSelectionField.props = {
    ...standardFieldProps,
    placeholder: { type: String, optional: true },
    // 其他自定义props
};

YourSelectionField.displayName = _lt("Your Selection");
YourSelectionField.supportedTypes = ["selection"];

YourSelectionField.isEmpty = (record, fieldName) => 
    record.data[fieldName] === false;

YourSelectionField.extractProps = ({ attrs }) => {
    return {
        placeholder: attrs.placeholder,
        // 从 attrs.options 提取其他配置
    };
};

registry.category("fields").add("your_selection_field", YourSelectionField);
```

#### 2. XML 模板文件（Dropdown）
**路径**: `static/src/fields/【技术名称】/【技术名称】.xml`

```xml
<t t-name="【模块】.YourSelectionField" owl="1">
    <div class="o_field_selection">
        <!-- 只读模式 -->
        <span t-if="props.readonly" class="o_readonly">
            <t t-esc="string"/>
        </span>
        
        <!-- 编辑模式 - 下拉选择 -->
        <select t-else=""
                class="o_input"
                t-att-disabled="props.readonly"
                t-on-change="onChange">
            <option t-if="props.placeholder"
                    value="false"
                    t-esc="props.placeholder"/>
            <t t-foreach="options" t-as="option" t-key="option[0]">
                <option t-att-value="stringify(option[0])"
                        t-att-selected="value === option[0]"
                        t-esc="option[1]"/>
            </t>
        </select>
    </div>
</t>
```

#### 3. XML 模板文件（Badge）
```xml
<t t-name="【模块】.BadgeSelectionField" owl="1">
    <div class="o_field_badge_selection">
        <!-- 只读模式 -->
        <span t-if="props.readonly" 
              t-att-class="'badge badge-' + getColorClass(value)">
            <t t-esc="string"/>
        </span>
        
        <!-- 编辑模式 -->
        <div t-else="" class="o_badge_group">
            <t t-foreach="options" t-as="option" t-key="option[0]">
                <button type="button"
                        t-att-class="'badge badge-' + getColorClass(option[0]) + 
                                    (value === option[0] ? ' active' : '')"
                        t-on-click="() => selectOption(option[0])">
                    <t t-esc="option[1]"/>
                </button>
            </t>
        </div>
    </div>
</t>
```

#### 4. XML 模板文件（Radio）
```xml
<t t-name="【模块】.RadioSelectionField" owl="1">
    <div class="o_field_radio">
        <!-- 只读模式 -->
        <span t-if="props.readonly" class="o_readonly">
            <t t-esc="string"/>
        </span>
        
        <!-- 编辑模式 -->
        <div t-else="" 
             t-att-class="'o_radio_group' + (props.horizontal ? ' horizontal' : '')">
            <t t-foreach="options" t-as="option" t-key="option[0]">
                <label class="o_radio_item">
                    <input type="radio"
                           t-att-name="props.name"
                           t-att-value="stringify(option[0])"
                           t-att-checked="value === option[0]"
                           t-on-change="onChange"/>
                    <span t-esc="option[1]"/>
                </label>
            </t>
        </div>
    </div>
</t>
```

#### 5. SCSS 样式文件
**路径**: `static/src/fields/【技术名称】/【技术名称】.scss`

```scss
.o_field_【技术名称】 {
    // Dropdown样式
    select.o_input {
        width: 100%;
        padding: 0.375rem 0.75rem;
        border: 1px solid #ced4da;
        border-radius: 0.25rem;
    }
    
    // Badge样式
    .o_badge_group {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
        
        .badge {
            cursor: pointer;
            padding: 0.35em 0.65em;
            transition: all 0.2s;
            
            &:hover {
                opacity: 0.8;
            }
            
            &.active {
                box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
            }
        }
    }
    
    // Radio样式
    .o_radio_group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        
        &.horizontal {
            flex-direction: row;
        }
        
        .o_radio_item {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            cursor: pointer;
            
            input[type="radio"] {
                cursor: pointer;
            }
        }
    }
    
    // 只读样式
    .o_readonly {
        &.badge {
            pointer-events: none;
        }
    }
    
    // 响应式
    @media (max-width: 768px) {
        .o_badge_group,
        .o_radio_group.horizontal {
            flex-direction: column;
        }
    }
}
```

### 参考实现

请参考以下 Odoo 标准字段实现：

**Selection**: `@web/views/fields/selection/selection_field`
**Badge Selection**: `@web/views/fields/badge_selection/badge_selection_field`
**Radio**: `@web/views/fields/radio/radio_field`
**State Selection**: `@web/views/fields/state_selection/state_selection_field`

### 代码规范

- [ ] 正确获取选项列表
- [ ] 处理空值情况
- [ ] 支持必填验证
- [ ] 实现isEmpty静态方法
- [ ] 实现extractProps静态方法
- [ ] 添加完整注释
- [ ] 支持国际化
- [ ] 响应式设计

### 使用示例

#### Python 模型定义

```python
from odoo import models, fields

class YourModel(models.Model):
    _name = 'your.model'
    
    state = fields.Selection([
        ('draft', 'Draft'),
        ('confirmed', 'Confirmed'),
        ('done', 'Done'),
        ('cancel', 'Cancelled')
    ], string='Status', default='draft', required=True)
    
    priority = fields.Selection([
        ('0', 'Low'),
        ('1', 'Normal'),
        ('2', 'High'),
        ('3', 'Urgent')
    ], string='Priority', default='1')
```

#### 视图使用

请在生成代码后提供完整的视图使用示例。

## 额外说明

【在此添加任何额外的说明、约束或特殊要求】

- 是否需要颜色映射？颜色如何定义？
- 是否需要图标支持？
- 只读模式是否可点击？
- 是否允许空值？
- 选项是否需要分组？

## 期望输出

请生成：
1. 完整的 JavaScript 组件代码
2. 完整的 XML 模板代码（包含多种布局）
3. 完整的 SCSS 样式代码
4. assets.xml 注册代码
5. 使用文档和示例
6. 颜色/图标配置说明
7. 测试建议

确保代码：
- 完全符合 Odoo 16.0+ OWL 框架规范
- 正确处理选项列表
- 支持多种视觉样式
- 处理边界情况和错误
````

---

## 🎨 快速示例

### 示例1：彩色状态徽章

```text
**组件名称**: ColoredStateField
**技术名称**: colored_state_field
**展现类型**: Badge
**显示名称**: "彩色状态徽章"

核心功能:
1. 显示为彩色徽章
2. 不同状态不同颜色
3. 点击切换状态
4. 只读模式高亮显示

颜色映射:
- draft: secondary (灰色)
- confirmed: primary (蓝色)
- done: success (绿色)
- cancel: danger (红色)

Widget使用:
<field name="state" widget="colored_state_field"/>
```

### 示例2：优先级星级选择

```text
**组件名称**: PriorityStarField
**技术名称**: priority_star_field
**展现类型**: Badge
**显示名称**: "星级优先级"

核心功能:
1. 显示为星星图标
2. 点击星星设置优先级
3. 1-5颗星表示不同优先级
4. 只读模式显示填充星星

选项定义:
- 1: Low (1星)
- 2: Normal (2星)
- 3: High (3星)
- 4: Urgent (4星)
- 5: Critical (5星)

Widget使用:
<field name="priority" widget="priority_star_field" 
       options="{'icon': 'fa-star'}"/>
```

---

## 📚 常见问题

### Q1: 如何添加颜色映射？

```javascript
getColorClass(value) {
    const colorMap = {
        'draft': 'secondary',
        'confirmed': 'primary',
        'done': 'success',
        'cancel': 'danger'
    };
    return colorMap[value] || 'secondary';
}
```

### Q2: 如何添加图标？

```javascript
getIcon(value) {
    const iconMap = {
        '0': 'fa-arrow-down',
        '1': 'fa-minus',
        '2': 'fa-arrow-up',
        '3': 'fa-exclamation'
    };
    return iconMap[value] || '';
}
```

### Q3: 如何实现选项分组？

```javascript
get groupedOptions() {
    return {
        'Active': [['draft', 'Draft'], ['confirmed', 'Confirmed']],
        'Inactive': [['done', 'Done'], ['cancel', 'Cancelled']]
    };
}
```

### Q4: 如何处理动态选项？

```javascript
async onWillStart() {
    // 如果选项需要从服务器加载
    this.dynamicOptions = await this.orm.call(
        this.props.record.resModel,
        'get_selection_options',
        [this.props.name]
    );
}
```

---

## 🔗 相关资源

- [Selection 标准实现](https://github.com/odoo/odoo/tree/16.0/addons/web/static/src/views/fields/selection)
- [Badge Selection](https://github.com/odoo/odoo/tree/16.0/addons/web/static/src/views/fields/badge_selection)
- [Radio Field](https://github.com/odoo/odoo/tree/16.0/addons/web/static/src/views/fields/radio)
- [State Selection](https://github.com/odoo/odoo/tree/16.0/addons/web/static/src/views/fields/state_selection)

---

**版本历史**:
- v1.0 (2026-01-23): 初始版本
