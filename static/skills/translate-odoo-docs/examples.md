# Odoo文档翻译示例

本文档提供完整的翻译示例，展示如何正确处理各种场景。

## 示例1：基础文档翻译

### 原文

```markdown
# Model Creation

In Odoo, models are Python classes that represent database tables. Each model inherits from `models.Model` and defines fields using the ORM.

## Basic Example

\`\`\`python
from odoo import models, fields, api

class Product(models.Model):
    _name = 'product.template'
    _description = 'Product Template'
    
    name = fields.Char('Name', required=True)
    price = fields.Float('Price')
    
    @api.depends('price')
    def _compute_total(self):
        for record in self:
            record.total = record.price * 1.2
\`\`\`

The `_name` attribute defines the model's technical name.
```

### 译文

```markdown
# Model 创建

在 Odoo 中，Model 是代表数据库表的 Python 类。每个 Model 继承自 `models.Model` 并使用 ORM 定义 Field。

## 基础示例

\`\`\`python
from odoo import models, fields, api

class Product(models.Model):
    _name = 'product.template'
    _description = 'Product Template'
    
    name = fields.Char('Name', required=True)
    price = fields.Float('Price')
    
    @api.depends('price')
    def _compute_total(self):
        for record in self:
            record.total = record.price * 1.2
\`\`\`

`_name` 属性定义了 Model 的技术名称。
```

**翻译要点：**
- ✅ "Model" 保持英文
- ✅ "Field" 保持英文
- ✅ "ORM" 保持英文
- ✅ 所有代码块完全不变
- ✅ Python 类名、方法名、属性名保持不变

---

## 示例2：View文档翻译

### 原文

```markdown
# Form Views

Form views display a single record's data. They use XML to define the layout and fields.

## View Structure

\`\`\`xml
<form>
    <header>
        <button name="action_confirm" string="Confirm" type="object"/>
    </header>
    <sheet>
        <group>
            <field name="name"/>
            <field name="date"/>
        </group>
    </sheet>
</form>
\`\`\`

The `<header>` element contains action buttons, while `<sheet>` contains the main form content.
```

### 译文

```markdown
# Form View

Form View 显示单个 Record 的数据。它们使用 XML 定义布局和 Field。

## View 结构

\`\`\`xml
<form>
    <header>
        <button name="action_confirm" string="Confirm" type="object"/>
    </header>
    <sheet>
        <group>
            <field name="name"/>
            <field name="date"/>
        </group>
    </sheet>
</form>
\`\`\`

`<header>` 元素包含操作按钮，而 `<sheet>` 包含主要的表单内容。
```

**翻译要点：**
- ✅ "Form View" 保持英文（Odoo特定视图类型）
- ✅ "Record" 保持英文
- ✅ "Field" 保持英文
- ✅ XML代码完全不变
- ✅ HTML标签名在说明中也保持原样

---

## 示例3：API文档翻译

### 原文

```markdown
## search() Method

Search for records matching the given domain.

**Syntax:**
\`\`\`python
recordset = model.search(domain, offset=0, limit=None, order=None)
\`\`\`

**Parameters:**
- `domain` (list): Search domain as a list of tuples
- `offset` (int): Number of records to skip
- `limit` (int): Maximum number of records to return
- `order` (str): Sorting order

**Returns:** A recordset containing the matching records

**Example:**
\`\`\`python
# Search for active partners
partners = self.env['res.partner'].search([('active', '=', True)])

# Search with limit
partners = self.env['res.partner'].search([], limit=10)
\`\`\`
```

### 译文

```markdown
## search() 方法

搜索与给定 Domain 匹配的 Record。

**语法：**
\`\`\`python
recordset = model.search(domain, offset=0, limit=None, order=None)
\`\`\`

**参数：**
- `domain` (list)：搜索 Domain，以元组列表形式表示
- `offset` (int)：要跳过的记录数
- `limit` (int)：返回的最大记录数
- `order` (str)：排序顺序

**返回值：** 包含匹配 Record 的 Recordset

**示例：**
\`\`\`python
# Search for active partners
partners = self.env['res.partner'].search([('active', '=', True)])

# Search with limit
partners = self.env['res.partner'].search([], limit=10)
\`\`\`
```

**翻译要点：**
- ✅ 方法名 `search()` 保持英文
- ✅ "Domain", "Record", "Recordset" 保持英文
- ✅ 参数名在代码中保持不变
- ✅ 代码注释翻译成中文
- ✅ `self.env['res.partner']` 模型名保持不变

---

## 示例4：QWeb模板文档

### 原文

```markdown
# QWeb Templates

QWeb is Odoo's template engine. It uses XML with special directives.

## Template Directives

### t-if Directive

Conditional rendering based on a condition.

\`\`\`xml
<t t-if="record.active">
    <span>Active</span>
</t>
<t t-else="">
    <span>Inactive</span>
</t>
\`\`\`

### t-foreach Directive

Loop through a collection.

\`\`\`xml
<t t-foreach="records" t-as="record">
    <div t-att-class="record.state">
        <t t-esc="record.name"/>
    </div>
</t>
\`\`\`

Use `t-esc` to escape HTML or `t-raw` for raw HTML output.
```

### 译文

```markdown
# QWeb Template

QWeb 是 Odoo 的模板引擎。它使用带有特殊指令的 XML。

## Template 指令

### t-if 指令

基于条件进行条件渲染。

\`\`\`xml
<t t-if="record.active">
    <span>Active</span>
</t>
<t t-else="">
    <span>Inactive</span>
</t>
\`\`\`

### t-foreach 指令

循环遍历集合。

\`\`\`xml
<t t-foreach="records" t-as="record">
    <div t-att-class="record.state">
        <t t-esc="record.name"/>
    </div>
</t>
\`\`\`

使用 `t-esc` 转义 HTML，或使用 `t-raw` 输出原始 HTML。
```

**翻译要点：**
- ✅ "QWeb" 保持英文
- ✅ "Template" 保持英文
- ✅ QWeb指令名（t-if, t-foreach, t-esc, t-raw）保持英文
- ✅ XML代码完全不变
- ✅ "escape", "raw" 等技术动词翻译成中文

---

## 示例5：Owl组件文档

### 原文

```markdown
# Owl Components

Odoo Web Library (Owl) is the frontend framework used in Odoo 16+.

## Creating a Component

\`\`\`javascript
import { Component } from "@odoo/owl";

class MyComponent extends Component {
    static template = "my_module.MyTemplate";
    
    setup() {
        this.state = useState({ count: 0 });
    }
    
    increment() {
        this.state.count++;
    }
}
\`\`\`

## Using Hooks

Owl provides several hooks for component lifecycle:

- `useState`: Creates reactive state
- `useRef`: Creates a reference to a DOM element
- `useEffect`: Runs side effects

**Example:**
\`\`\`javascript
setup() {
    this.state = useState({ value: "" });
    this.inputRef = useRef("input");
    
    useEffect(() => {
        console.log("Component mounted");
    });
}
\`\`\`
```

### 译文

```markdown
# Owl Component

Odoo Web Library (Owl) 是 Odoo 16+ 使用的前端框架。

## 创建 Component

\`\`\`javascript
import { Component } from "@odoo/owl";

class MyComponent extends Component {
    static template = "my_module.MyTemplate";
    
    setup() {
        this.state = useState({ count: 0 });
    }
    
    increment() {
        this.state.count++;
    }
}
\`\`\`

## 使用 Hook

Owl 提供多个用于组件生命周期的 Hook：

- `useState`：创建响应式 State
- `useRef`：创建对 DOM 元素的引用
- `useEffect`：执行副作用

**示例：**
\`\`\`javascript
setup() {
    this.state = useState({ value: "" });
    this.inputRef = useRef("input");
    
    useEffect(() => {
        console.log("Component mounted");
    });
}
\`\`\`
```

**翻译要点：**
- ✅ "Owl" 保持英文（Odoo专有框架名）
- ✅ "Component" 保持英文
- ✅ "Hook", "useState", "useRef", "useEffect" 保持英文
- ✅ "State" 保持英文
- ✅ 所有JavaScript代码保持不变
- ✅ 导入语句完全不变

---

## 示例6：表格翻译

### 原文

```markdown
## Field Types

| Field Type | Description | Example |
|------------|-------------|---------|
| Char | String field with limited length | Name, email |
| Text | Long text without length limit | Description |
| Integer | Whole numbers | Quantity, count |
| Float | Decimal numbers | Price, amount |
| Boolean | True/False values | Active flag |
| Many2one | Foreign key relationship | Partner reference |
```

### 译文

```markdown
## Field 类型

| Field 类型 | 描述 | 示例 |
|-----------|------|------|
| Char | 有长度限制的字符串字段 | 名称、邮箱 |
| Text | 无长度限制的长文本 | 描述 |
| Integer | 整数 | 数量、计数 |
| Float | 小数 | 价格、金额 |
| Boolean | True/False 值 | 激活标志 |
| Many2one | 外键关系 | 合作伙伴引用 |
```

**翻译要点：**
- ✅ 表头翻译："Field Types" → "Field 类型"
- ✅ 第一列的 Field 类型名保持英文
- ✅ 描述列翻译成中文
- ✅ 示例列翻译成中文
- ✅ 表格格式完全保持一致

---

## 示例7：带列表的文档

### 原文

```markdown
## Model Inheritance

Odoo supports three types of model inheritance:

1. **Class Inheritance** (`_inherit`)
   - Extends an existing model
   - Adds or modifies fields and methods
   - Example: `_inherit = 'sale.order'`

2. **Prototype Inheritance** (`_inherits`)
   - Delegates to another model
   - Uses delegation pattern
   - Example: `_inherits = {'res.partner': 'partner_id'}`

3. **Mixin Pattern**
   - Reusable abstract models
   - Provides common functionality
   - Example: `mail.thread`, `mail.activity.mixin`
```

### 译文

```markdown
## Model 继承

Odoo 支持三种类型的 Model 继承：

1. **类继承** (`_inherit`)
   - 扩展现有 Model
   - 添加或修改 Field 和方法
   - 示例：`_inherit = 'sale.order'`

2. **原型继承** (`_inherits`)
   - 委托给另一个 Model
   - 使用委托模式
   - 示例：`_inherits = {'res.partner': 'partner_id'}`

3. **Mixin 模式**
   - 可重用的抽象 Model
   - 提供通用功能
   - 示例：`mail.thread`、`mail.activity.mixin`
```

**翻译要点：**
- ✅ "Model" 保持英文
- ✅ 技术术语 `_inherit`, `_inherits` 保持原样
- ✅ "Mixin" 保持英文
- ✅ 模型名 `sale.order`, `res.partner` 保持不变
- ✅ 列表格式和编号保持一致

---

## 示例8：复杂技术说明

### 原文

```markdown
## Computed Fields

Computed fields are fields whose values are calculated on-the-fly instead of being stored in the database.

### Definition

Use the `compute` parameter and define a compute method:

\`\`\`python
from odoo import models, fields, api

class SaleOrder(models.Model):
    _inherit = 'sale.order'
    
    total_weight = fields.Float(
        string='Total Weight',
        compute='_compute_total_weight',
        store=True
    )
    
    @api.depends('order_line.product_id.weight')
    def _compute_total_weight(self):
        for order in self:
            order.total_weight = sum(
                line.product_id.weight * line.product_uom_qty
                for line in order.order_line
            )
\`\`\`

### Key Points

- Use `@api.depends()` to declare field dependencies
- Set `store=True` to cache values in the database
- The compute method must set the field value for all records in `self`
- Computed fields are read-only by default
```

### 译文

```markdown
## Computed Field

Computed Field 是指值动态计算而不是存储在数据库中的 Field。

### 定义

使用 `compute` 参数并定义计算方法：

\`\`\`python
from odoo import models, fields, api

class SaleOrder(models.Model):
    _inherit = 'sale.order'
    
    total_weight = fields.Float(
        string='Total Weight',
        compute='_compute_total_weight',
        store=True
    )
    
    @api.depends('order_line.product_id.weight')
    def _compute_total_weight(self):
        for order in self:
            order.total_weight = sum(
                line.product_id.weight * line.product_uom_qty
                for line in order.order_line
            )
\`\`\`

### 关键要点

- 使用 `@api.depends()` 声明 Field 依赖关系
- 设置 `store=True` 将值缓存到数据库中
- 计算方法必须为 `self` 中的所有 Record 设置字段值
- Computed Field 默认是只读的
```

**翻译要点：**
- ✅ "Computed Field" 保持英文（Odoo特定概念）
- ✅ "Field" 保持英文
- ✅ "Record" 保持英文
- ✅ 所有代码完全不变
- ✅ 代码参数名如 `compute`, `store` 保持英文
- ✅ 装饰器 `@api.depends()` 保持不变
- ✅ "read-only" 翻译为"只读"

---

## 常见错误示例

### ❌ 错误1：翻译了代码中的标识符

```python
# 错误
class 产品(models.Model):
    _name = '产品.模板'
    名称 = fields.Char('名称')
```

✅ **正确做法：** 代码必须保持原样

```python
# 正确
class Product(models.Model):
    _name = 'product.template'
    name = fields.Char('Name')
```

### ❌ 错误2：翻译了Odoo术语

```markdown
# 错误
模型是Odoo中代表数据库表的Python类。每个模型继承自视图并定义字段。
```

✅ **正确做法：** 保留Odoo术语

```markdown
# 正确
Model 是 Odoo 中代表数据库表的 Python 类。每个 Model 继承自 View 并定义 Field。
```

### ❌ 错误3：改变了Markdown格式

```markdown
# 错误 - 表格对齐破坏
|Field类型|描述|
|Char|字符串|
```

✅ **正确做法：** 保持表格格式

```markdown
# 正确
| Field 类型 | 描述 |
|-----------|------|
| Char | 字符串 |
```

### ❌ 错误4：翻译了内联代码

```markdown
# 错误
调用 `自我.环境['销售.订单'].搜索([])` 方法
```

✅ **正确做法：** 内联代码保持不变

```markdown
# 正确
调用 `self.env['sale.order'].search([])` 方法
```

### ❌ 错误5：翻译了路径

```markdown
# 错误
文件位于 `插件/销售/模型/销售订单.py`
```

✅ **正确做法：** 路径完全保留

```markdown
# 正确
文件位于 `addons/sale/models/sale_order.py`
```

---

## 快速检查清单

翻译完成后，使用此清单检查：

- [ ] 所有代码块内容未被修改
- [ ] Odoo专业术语保留英文（Model, View, Field, Widget等）
- [ ] 内联代码标记中的内容保持原样
- [ ] 文件路径、模块名、导入语句保持不变
- [ ] Markdown格式正确（标题、列表、表格、链接）
- [ ] 代码注释已翻译成中文
- [ ] 中文表达流畅自然
- [ ] 技术含义准确无误
- [ ] 表格列对齐正确
- [ ] 没有添加原文不存在的内容
