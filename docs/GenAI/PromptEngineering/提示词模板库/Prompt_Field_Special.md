---
title: Odoo OWL特殊字段组件Prompt模板
sidebar_label: Odoo OWL特殊字段组件Prompt模板
keywords:
  - AI
  - GenAI
tags: [GenAI]
unlisted: true
---

# Odoo OWL 特殊字段组件 Prompt 模板

> **适用类型**: Monetary, Progress Bar, Priority, Handle, Domain, Status Bar  
> **复杂度**: ⭐⭐⭐⭐  
> **版本**: v1.0  
> **最后更新**: 2026-01-23

---

## 📖 使用说明

本模板专门用于生成**特殊业务逻辑字段组件**，这些字段具有以下共性：
- 特定业务场景的专用字段
- 复杂的交互逻辑
- 可能依赖其他字段
- 特殊的视觉呈现

**适用场景：**
- Monetary: 货币字段（带货币符号）
- Progress Bar: 进度条字段
- Priority: 优先级字段（星级）
- Handle: 拖拽排序手柄
- Domain: 域名构建器
- Status Bar: 状态栏字段

---

## 🎯 类型特定规范

### 必需的导入

```javascript
/** @odoo-module **/

// 1. OWL 核心
import { Component, useState } from "@odoo/owl";

// 2. 字段基础
import { standardFieldProps } from "@web/views/fields/standard_field_props";

// 3. 服务和工具
import { useService } from "@web/core/utils/hooks";
import { _lt } from "@web/core/l10n/translation";
import { registry } from "@web/core/registry";

// 4. 格式化工具
import { formatMonetary, formatFloat } from "@web/views/fields/formatters";
import { parseFloat } from "@web/views/fields/parsers";
```

### Monetary 字段数据结构

```javascript
// Monetary 字段需要配合货币字段使用
// value: 数值
// currency_id: 货币记录 [id, name]

get formattedValue() {
    if (!this.props.value) return '';
    
    const currency = this.currency;
    if (!currency) return formatFloat(this.props.value);
    
    return formatMonetary(this.props.value, {
        currencyId: currency[0],
        currencyPosition: currency.position,
        currencySymbol: currency.symbol,
    });
}

get currency() {
    const currencyField = this.props.currencyField || 'currency_id';
    return this.props.record.data[currencyField];
}
```

### Progress Bar 字段

```javascript
// 进度值通常是 0-100 的数字
get progressValue() {
    const value = this.props.value || 0;
    return Math.max(0, Math.min(100, value));
}

get progressClass() {
    const value = this.progressValue;
    if (value < 30) return 'bg-danger';
    if (value < 70) return 'bg-warning';
    return 'bg-success';
}
```

### Priority 字段（星级）

```javascript
// Priority 通常是 0-3 或 0-5 的整数
get stars() {
    const maxStars = this.props.maxStars || 3;
    return Array.from({ length: maxStars }, (_, i) => ({
        index: i,
        filled: i < (this.props.value || 0)
    }));
}

selectPriority(index) {
    this.props.update(index + 1);
}
```

### Handle 字段（拖拽手柄）

```javascript
// Handle 字段通常用于 sequence 字段
// 配合 list 视图的拖拽排序功能

setup() {
    this.handleRef = useRef("handle");
}

get isDraggable() {
    return !this.props.readonly && this.props.record.isInEdition;
}
```

---

## 📋 Prompt 模板

````text
你是一位精通 Odoo OWL 框架的前端开发专家。请为我生成一个**特殊字段组件**。

## 组件信息

**组件名称**: 【如 ProgressBarField】
**技术名称**: 【如 progress_bar_field】  
**字段类型**: [Monetary / Progress Bar / Priority / Handle / Domain / Status Bar / Custom]
**显示名称**: 【如 "进度条字段"】
**业务场景**: 【如 显示任务完成进度】

## 功能需求

### 核心功能

#### Monetary 货币字段
1. 【功能1】: 【如 显示金额和货币符号】
2. 【功能2】: 【如 自动格式化（千分位）】
3. 【功能3】: 【如 支持多币种】
4. 【功能4】: 【如 货币符号位置（前/后）】

#### Progress Bar 进度条
1. 【功能1】: 【如 显示0-100的进度条】
2. 【功能2】: 【如 根据进度改变颜色】
3. 【功能3】: 【如 显示百分比文本】
4. 【功能4】: 【如 支持点击编辑】

#### Priority 优先级
1. 【功能1】: 【如 显示星级评分】
2. 【功能2】: 【如 点击星星设置优先级】
3. 【功能3】: 【如 悬停预览效果】
4. 【功能4】: 【如 支持半星显示】

#### Handle 拖拽手柄
1. 【功能1】: 【如 显示拖拽图标】
2. 【功能2】: 【如 支持拖拽排序】
3. 【功能3】: 【如 拖拽时视觉反馈】
4. 【功能4】: 【如 自动更新sequence】

#### Domain 域构建器
1. 【功能1】: 【如 可视化构建搜索域】
2. 【功能2】: 【如 添加/删除条件】
3. 【功能3】: 【如 AND/OR 逻辑组合】
4. 【功能4】: 【如 预览域字符串】

#### Status Bar 状态栏
1. 【功能1】: 【如 显示工作流状态】
2. 【功能2】: 【如 点击切换状态】
3. 【功能3】: 【如 显示已完成/待完成状态】
4. 【功能4】: 【如 状态颜色标识】

### 依赖字段

#### Monetary 字段依赖
- 货币字段: 【如 currency_id】
- 关联模型: 【res.currency】
- 货币符号: 【如 $, €, ¥】
- 货币位置: 【before / after】

#### Progress Bar 字段依赖（可选）
- 完成数量字段: 【如 completed_count】
- 总数字段: 【如 total_count】
- 自动计算: 【completed / total * 100】

#### Domain 字段依赖
- 目标模型: 【如 res.partner】
- 可用字段: 【从模型获取】

### 值的范围和验证

#### Progress Bar
- 最小值: 【0】
- 最大值: 【100】
- 步长: 【1 / 0.1】
- 单位: 【百分比 / 数值】

#### Priority
- 最小优先级: 【0】
- 最大优先级: 【3 / 5】
- 默认值: 【0 / 1】

#### Monetary
- 小数位数: 【根据货币配置】
- 最小值: 【无限制 / 0】
- 最大值: 【无限制 / 指定值】

### Props 配置

#### 标准Props（自动继承）
```javascript
// 通过 standardFieldProps 自动获得
- record: Object      // 当前记录
- name: String        // 字段名称
- type: String        // 字段类型
- readonly: Boolean   // 是否只读
- value: Any         // 字段值
- update: Function   // 更新回调
```

#### Monetary 字段Props
```javascript
- currencyField: String      // 【货币字段名，默认 'currency_id'】
- digits: Array              // 【小数位数 [总位数, 小数位]】
```

#### Progress Bar Props
```javascript
- title: String              // 【标题文本】
- showPercentage: Boolean    // 【是否显示百分比】
- editable: Boolean          // 【是否可编辑】
- maxValue: Number           // 【最大值，默认 100】
- colorThresholds: Object    // 【颜色阈值配置】
```

#### Priority Props
```javascript
- maxStars: Number           // 【最大星数，默认 3】
- allowHalf: Boolean         // 【是否允许半星】
- icons: Object              // 【图标配置】
```

#### Domain Props
```javascript
- resModel: String           // 【目标模型】
- readonly: Boolean          // 【是否只读】
- debug: Boolean             // 【显示调试信息】
```

#### Widget 使用示例

**Monetary**:
```xml
<field name="amount" 
       widget="monetary_field"
       options="{'currency_field': 'currency_id'}"/>
```

**Progress Bar**:
```xml
<field name="progress" 
       widget="progress_bar_field"
       options="{
           'show_percentage': true,
           'editable': true,
           'color_thresholds': {30: 'danger', 70: 'warning', 100: 'success'}
       }"/>
```

**Priority**:
```xml
<field name="priority" 
       widget="priority_field"
       options="{'max_stars': 3}"/>
```

**Handle**:
```xml
<field name="sequence" widget="handle_field"/>
```

**Domain**:
```xml
<field name="domain" 
       widget="domain_field"
       options="{'model': 'res.partner'}"/>
```

### 颜色和样式配置

#### Progress Bar 颜色
```javascript
// 基于进度的动态颜色
colorThresholds: {
    0: 'bg-danger',      // 0-30%: 红色
    30: 'bg-warning',    // 30-70%: 黄色
    70: 'bg-success'     // 70-100%: 绿色
}

// 或基于状态
colorByStatus: {
    'todo': 'bg-secondary',
    'in_progress': 'bg-info',
    'done': 'bg-success'
}
```

#### Priority 图标
```javascript
icons: {
    filled: 'fa-star',        // 填充星星
    empty: 'fa-star-o',       // 空心星星
    half: 'fa-star-half-o'    // 半星
}

colors: {
    filled: '#FFD700',        // 金色
    empty: '#cccccc',         // 灰色
    hover: '#FFA500'          // 橙色
}
```

### 交互逻辑

#### 只读模式

**Monetary**:
- 显示: 【格式化的货币值】
- 样式: 【正常文本 / 负数红色】

**Progress Bar**:
- 显示: 【彩色进度条 + 百分比】
- 不可交互: 【纯展示】

**Priority**:
- 显示: 【填充的星星】
- 不可点击: 【固定状态】

#### 编辑模式

**Monetary**:
- 输入: 【数字输入框】
- 货币选择: 【下拉选择器（如果可编辑）】
- 实时格式化: 【失焦时格式化】

**Progress Bar**:
- 点击: 【弹出滑块或输入框】
- 拖动: 【拖动滑块改变进度】
- 输入: 【直接输入数值】

**Priority**:
- 点击: 【点击星星设置优先级】
- 悬停: 【显示预览效果】
- 取消: 【点击当前星可取消选择（可选）】

**Handle**:
- 显示: 【拖拽图标】
- 拖拽: 【拖拽行重新排序】
- 自动保存: 【拖拽结束后更新sequence】

### 计算和格式化

#### Monetary 格式化
```javascript
formatMonetary(value, currency) {
    const symbol = currency.symbol;
    const position = currency.position; // 'before' or 'after'
    const formatted = formatFloat(value, {
        digits: currency.decimal_places
    });
    
    if (position === 'before') {
        return `${symbol} ${formatted}`;
    } else {
        return `${formatted} ${symbol}`;
    }
}
```

#### Progress Bar 计算
```javascript
// 自动计算进度
get autoProgress() {
    const completed = this.props.record.data[this.props.completedField] || 0;
    const total = this.props.record.data[this.props.totalField] || 1;
    return Math.round((completed / total) * 100);
}
```

### 样式需求

#### Monetary 字段
- 数字对齐: 【右对齐】
- 货币符号: 【略小字体】
- 负数显示: 【红色文本 / 括号包裹】

#### Progress Bar
- 高度: 【20px / 自定义】
- 圆角: 【4px】
- 动画: 【进度变化时平滑过渡】
- 文本: 【居中显示百分比】

#### Priority
- 星星大小: 【16px / 自定义】
- 星星间距: 【4px】
- 悬停效果: 【放大 / 颜色变化】

#### Handle
- 图标: 【六个点 / 三条线】
- 颜色: 【灰色】
- 悬停: 【深色 / 光标变化】
- 拖拽时: 【行高亮 / 半透明】

### 特殊功能（可选）
- [ ] 货币换算
- [ ] 进度动画效果
- [ ] 星级评分详细说明
- [ ] 拖拽撤销/重做
- [ ] 域构建器高级模式
- [ ] 状态流转权限控制
- [ ] 【其他】

## 技术要求

### 文件生成

请生成以下文件：

#### 1. JS 组件文件（Monetary）
**路径**: `static/src/fields/【技术名称】/【技术名称】.js`

**核心结构**:
```javascript
export class MonetaryField extends Component {
    setup() {
        useInputField({
            getValue: () => this.formattedValue,
            parse: (v) => parseFloat(v),
        });
    }
    
    get formattedValue() {
        if (!this.props.value) return '';
        
        const currency = this.currency;
        if (!currency) {
            return formatFloat(this.props.value);
        }
        
        return formatMonetary(this.props.value, {
            currencyId: currency[0],
            currencyPosition: currency.position,
            currencySymbol: currency.symbol,
            digits: [0, currency.decimal_places || 2],
        });
    }
    
    get currency() {
        const currencyField = this.props.currencyField || 'currency_id';
        return this.props.record.data[currencyField];
    }
}

MonetaryField.props = {
    ...standardFieldProps,
    currencyField: { type: String, optional: true },
};

MonetaryField.defaultProps = {
    currencyField: 'currency_id',
};
```

#### 2. JS 组件文件（Progress Bar）
**路径**: `static/src/fields/【技术名称】/【技术名称】.js`

**核心结构**:
```javascript
export class ProgressBarField extends Component {
    setup() {
        this.state = useState({
            isEditing: false,
            tempValue: this.props.value || 0,
        });
    }
    
    get progressValue() {
        const value = this.props.value || 0;
        return Math.max(0, Math.min(this.props.maxValue || 100, value));
    }
    
    get progressPercent() {
        const maxValue = this.props.maxValue || 100;
        return (this.progressValue / maxValue) * 100;
    }
    
    get progressClass() {
        const value = this.progressValue;
        const thresholds = this.props.colorThresholds || {
            0: 'danger',
            30: 'warning',
            70: 'success'
        };
        
        let colorClass = 'secondary';
        Object.keys(thresholds).sort((a, b) => b - a).forEach(threshold => {
            if (value >= threshold) {
                colorClass = thresholds[threshold];
            }
        });
        
        return `bg-${colorClass}`;
    }
    
    onClick() {
        if (!this.props.readonly && this.props.editable) {
            this.state.isEditing = true;
        }
    }
    
    onInputChange(ev) {
        this.state.tempValue = parseFloat(ev.target.value) || 0;
    }
    
    async save() {
        await this.props.update(this.state.tempValue);
        this.state.isEditing = false;
    }
    
    cancel() {
        this.state.tempValue = this.props.value || 0;
        this.state.isEditing = false;
    }
}
```

#### 3. JS 组件文件（Priority）
**路径**: `static/src/fields/【技术名称】/【技术名称】.js`

**核心结构**:
```javascript
export class PriorityField extends Component {
    setup() {
        this.state = useState({
            hoverIndex: -1,
        });
    }
    
    get stars() {
        const maxStars = this.props.maxStars || 3;
        const value = parseInt(this.props.value) || 0;
        
        return Array.from({ length: maxStars }, (_, i) => ({
            index: i,
            filled: i < value,
            hovered: i <= this.state.hoverIndex,
        }));
    }
    
    selectPriority(index) {
        if (!this.props.readonly) {
            // 点击已选中的星可以取消选择
            const newValue = (index + 1) === this.props.value ? 0 : (index + 1);
            this.props.update(newValue);
        }
    }
    
    onMouseEnter(index) {
        if (!this.props.readonly) {
            this.state.hoverIndex = index;
        }
    }
    
    onMouseLeave() {
        this.state.hoverIndex = -1;
    }
}

PriorityField.props = {
    ...standardFieldProps,
    maxStars: { type: Number, optional: true },
};

PriorityField.defaultProps = {
    maxStars: 3,
};
```

#### 4. XML 模板文件（Monetary）
```xml
<t t-name="【模块】.MonetaryField" owl="1">
    <div class="o_field_monetary">
        <span t-if="props.readonly" 
              t-att-class="'o_readonly' + (props.value &lt; 0 ? ' text-danger' : '')">
            <t t-esc="formattedValue"/>
        </span>
        <input t-else=""
               type="text"
               class="o_input"
               t-att-value="formattedValue"
               t-ref="input"/>
    </div>
</t>
```

#### 5. XML 模板文件（Progress Bar）
```xml
<t t-name="【模块】.ProgressBarField" owl="1">
    <div class="o_field_progress_bar" t-on-click="onClick">
        <div t-if="!state.isEditing" class="progress">
            <div class="progress-bar"
                 t-att-class="progressClass"
                 t-att-style="'width: ' + progressPercent + '%'"
                 role="progressbar">
                <span t-if="props.showPercentage" 
                      class="o_progress_text"
                      t-esc="progressValue + '%'"/>
            </div>
        </div>
        
        <div t-else="" class="o_progress_editor">
            <input type="number"
                   class="form-control form-control-sm"
                   t-att-value="state.tempValue"
                   t-att-max="props.maxValue"
                   t-on-input="onInputChange"/>
            <button class="btn btn-sm btn-primary" t-on-click="save">
                <i class="fa fa-check"/>
            </button>
            <button class="btn btn-sm btn-secondary" t-on-click="cancel">
                <i class="fa fa-times"/>
            </button>
        </div>
    </div>
</t>
```

#### 6. XML 模板文件（Priority）
```xml
<t t-name="【模块】.PriorityField" owl="1">
    <div class="o_field_priority"
         t-on-mouseleave="onMouseLeave">
        <t t-foreach="stars" t-as="star" t-key="star.index">
            <i t-att-class="'fa ' + (star.filled || star.hovered ? 'fa-star' : 'fa-star-o')"
               t-att-style="'color: ' + (star.filled || star.hovered ? '#FFD700' : '#cccccc')"
               t-on-click="() => selectPriority(star.index)"
               t-on-mouseenter="() => onMouseEnter(star.index)"/>
        </t>
    </div>
</t>
```

#### 7. SCSS 样式文件
**路径**: `static/src/fields/【技术名称】/【技术名称】.scss`

```scss
.o_field_monetary {
    text-align: right;
    
    .o_readonly {
        font-weight: 500;
        
        &.text-danger {
            color: #dc3545;
        }
    }
}

.o_field_progress_bar {
    .progress {
        height: 20px;
        cursor: pointer;
        position: relative;
        
        .progress-bar {
            transition: width 0.6s ease;
            position: relative;
            
            .o_progress_text {
                position: absolute;
                width: 100%;
                text-align: center;
                line-height: 20px;
                font-size: 12px;
                color: #fff;
                font-weight: 500;
            }
        }
    }
    
    .o_progress_editor {
        display: flex;
        gap: 0.25rem;
        
        input {
            flex: 1;
        }
    }
}

.o_field_priority {
    i.fa {
        font-size: 16px;
        cursor: pointer;
        margin-right: 4px;
        transition: all 0.2s;
        
        &:hover {
            transform: scale(1.2);
        }
    }
}
```

### 参考实现

请参考以下 Odoo 标准字段实现：

**Monetary**: `@web/views/fields/monetary/monetary_field`
**Progress Bar**: `@web/views/fields/progress_bar/progress_bar_field`
**Priority**: `@web/views/fields/priority/priority_field`
**Handle**: `@web/views/fields/handle/handle_field`
**Domain**: `@web/views/fields/domain/domain_field`
**Status Bar**: `@web/views/fields/statusbar/statusbar_field`

### 代码规范

- [ ] 正确处理依赖字段
- [ ] 实现格式化和解析逻辑
- [ ] 处理边界值
- [ ] 添加交互反馈
- [ ] 支持键盘操作
- [ ] 添加ARIA属性（可访问性）
- [ ] 处理空值情况
- [ ] 添加完整注释

### 使用示例

#### Python 模型定义

```python
from odoo import models, fields

class YourModel(models.Model):
    _name = 'your.model'
    _order = 'sequence'
    
    # Monetary字段
    amount = fields.Monetary(string='Amount', currency_field='currency_id')
    currency_id = fields.Many2one('res.currency', string='Currency')
    
    # Progress Bar字段
    progress = fields.Float(string='Progress', default=0.0)
    
    # Priority字段
    priority = fields.Selection([
        ('0', 'Low'),
        ('1', 'Normal'),
        ('2', 'High'),
        ('3', 'Urgent')
    ], string='Priority', default='1')
    
    # Handle字段
    sequence = fields.Integer(string='Sequence', default=10)
    
    # Domain字段
    domain = fields.Char(string='Domain')
```

#### 视图使用

请在生成代码后提供完整的视图使用示例。

## 额外说明

【在此添加任何额外的说明、约束或特殊要求】

- 是否需要自动计算功能？
- 是否需要动画效果？
- 颜色方案如何定义？
- 是否需要支持键盘操作？
- 是否需要无障碍支持（ARIA）？

## 期望输出

请生成：
1. 完整的 JavaScript 组件代码
2. 完整的 XML 模板代码
3. 完整的 SCSS 样式代码
4. assets.xml 注册代码
5. 使用文档和示例
6. 依赖字段说明
7. 业务逻辑说明
8. 测试建议

确保代码：
- 完全符合 Odoo 16.0+ OWL 框架规范
- 正确处理依赖字段
- 实现特定的业务逻辑
- 提供良好的用户体验
- 处理边界情况和错误
````

---

## 🎨 快速示例

### 示例1：销售订单金额字段

```text
**组件名称**: SaleAmountField
**技术名称**: sale_amount_field
**字段类型**: Monetary
**显示名称**: "销售金额"

核心功能:
1. 显示金额和货币符号
2. 千分位格式化
3. 支持多币种
4. 负数显示为红色

配置:
- 货币字段: currency_id
- 小数位数: 根据货币配置
- 对齐方式: 右对齐

Widget使用:
<field name="amount_total" widget="sale_amount_field" 
       options="{'currency_field': 'currency_id'}"/>
```

### 示例2：任务完成进度

```text
**组件名称**: TaskProgressField
**技术名称**: task_progress_field
**字段类型**: Progress Bar
**显示名称**: "任务进度"

核心功能:
1. 显示0-100%进度条
2. 颜色随进度变化
3. 点击可编辑进度
4. 显示百分比文本

颜色规则:
- 0-30%: 红色（danger）
- 30-70%: 黄色（warning）
- 70-100%: 绿色（success）

Widget使用:
<field name="progress" widget="task_progress_field"
       options="{'show_percentage': true, 'editable': true}"/>
```

### 示例3：工单优先级

```text
**组件名称**: TicketPriorityField
**技术名称**: ticket_priority_field
**字段类型**: Priority
**显示名称**: "工单优先级"

核心功能:
1. 3星评级系统
2. 点击星星设置优先级
3. 悬停预览效果
4. 金色星星显示

配置:
- 最大星数: 3
- 默认优先级: 1
- 可点击取消

Widget使用:
<field name="priority" widget="ticket_priority_field" 
       options="{'max_stars': 3}"/>
```

---

## 📚 常见问题

### Q1: 如何处理货币字段的动态变化？

```javascript
setup() {
    onWillUpdateProps((nextProps) => {
        // 货币变化时重新格式化
        if (nextProps.record.data.currency_id !== this.props.record.data.currency_id) {
            // 触发重新渲染
        }
    });
}
```

### Q2: 如何实现进度条的平滑动画？

```scss
.progress-bar {
    transition: width 0.6s ease;
}
```

```javascript
// 在更新进度时自动触发CSS transition
async updateProgress(newValue) {
    await this.props.update(newValue);
    // CSS transition 会自动处理动画
}
```

### Q3: 如何实现星级的半星显示？

```javascript
get stars() {
    const maxStars = this.props.maxStars || 5;
    const value = parseFloat(this.props.value) || 0;
    
    return Array.from({ length: maxStars }, (_, i) => {
        const starValue = i + 1;
        if (value >= starValue) {
            return { index: i, type: 'full' };
        } else if (value >= starValue - 0.5) {
            return { index: i, type: 'half' };
        } else {
            return { index: i, type: 'empty' };
        }
    });
}
```

### Q4: 如何实现拖拽排序？

```javascript
// Handle 字段通常配合 list 视图的内置拖拽功能
// 只需要提供拖拽手柄的视觉元素即可

// 在 list 视图中启用拖拽
<tree editable="bottom" multi_edit="1" default_order="sequence">
    <field name="sequence" widget="handle"/>
    <field name="name"/>
</tree>
```

---

## 🔗 相关资源

- [Monetary Field 标准实现](https://github.com/odoo/odoo/tree/16.0/addons/web/static/src/views/fields/monetary)
- [Progress Bar Field](https://github.com/odoo/odoo/tree/16.0/addons/web/static/src/views/fields/progress_bar)
- [Priority Field](https://github.com/odoo/odoo/tree/16.0/addons/web/static/src/views/fields/priority)
- [Handle Field](https://github.com/odoo/odoo/tree/16.0/addons/web/static/src/views/fields/handle)
- [Domain Field](https://github.com/odoo/odoo/tree/16.0/addons/web/static/src/views/fields/domain)
- [Formatters 工具](https://github.com/odoo/odoo/blob/16.0/addons/web/static/src/views/fields/formatters.js)

---

**版本历史**:
- v1.0 (2026-01-23): 初始版本
