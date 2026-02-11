---
name: translate-odoo-docs
description: 翻译Odoo技术文档到中文，保留专业术语英文原文，保留代码块和技术标识符。适用于翻译Odoo官方文档、Markdown格式技术文章，或当用户要求"翻译Odoo文档"、"中文化Odoo文档"时使用。
---

# Odoo文档翻译技能

## 核心翻译原则

翻译Odoo技术文档时，遵循以下核心原则：

1. **准确性优先**：确保技术含义准确传达，不改变原文的技术意图
2. **保留技术术语**：Odoo专业术语保留英文原文
3. **保护代码块**：所有代码、API名称、技术标识符保持不变
4. **保持格式**：完整保留Markdown格式、缩进、列表结构

## 术语处理规则

### 必须保留英文的术语

以下Odoo核心术语**必须保留英文原文**，不进行翻译：

**架构层面：**
- Model, View, Controller
- ORM (Object-Relational Mapping)
- Field, Widget, Record, Recordset
- Domain, Context, Args, Kwargs
- Odoo Framework, Odoo Server

**技术组件：**
- QWeb, XML-RPC, JSON-RPC
- Wizard, Action, Menu, Report
- Computed Field, Related Field, One2many, Many2one, Many2many
- Constraint, SQL Constraint, Python Constraint
- Inherit, Delegation, Extension

**前端技术：**
- Component, Renderer, Controller, Compiler
- Hook, Reactive, Props, State
- Template, t-call, t-if, t-foreach
- Owl (Odoo Web Library)

**工作流相关：**
- Stage, State, Kanban, Form, List, Tree
- Chatter, Follower, Activity, Mail Thread

### 术语表达方式

对于必须保留的术语，使用以下格式：

```markdown
✅ 正确：Model 负责数据建模和业务逻辑
✅ 正确：View 定义了用户界面的结构
✅ 正确：使用 `compute` 方法定义 Computed Field
❌ 错误：模型负责数据建模和业务逻辑
```

### 可以翻译的通用概念

以下通用技术概念可以翻译：

- class → 类
- function/method → 函数/方法
- parameter/argument → 参数
- return value → 返回值
- database → 数据库
- table → 表
- column → 列
- button → 按钮
- form → 表单
- list → 列表

但当这些词语作为Odoo特定概念时（如 Form View, List View），保留英文。

## 代码块处理规则

### 规则1：代码块完全保留

所有代码块内的代码**必须完全保留**，不进行任何翻译：

````markdown
✅ 正确：
```python
class SaleOrder(models.Model):
    _name = 'sale.order'
    _inherit = ['mail.thread']
    
    def action_confirm(self):
        # Confirm the sale order
        return True
```

❌ 错误：不要翻译代码中的变量名、函数名、类名
````

### 规则2：代码注释翻译

代码注释可以翻译成中文，但保持原有注释格式：

````markdown
✅ 翻译前：
```python
def action_confirm(self):
    # Confirm the sale order
    return True
```

✅ 翻译后：
```python
def action_confirm(self):
    # 确认销售订单
    return True
```
````

### 规则3：内联代码保留

文本中的内联代码标记 `` `code` `` 内容完全保留：

```markdown
✅ 正确：调用 `self.env['sale.order'].search([])` 方法搜索记录
❌ 错误：调用 `self.env['销售订单'].search([])` 方法搜索记录
```

### 规则4：技术路径保留

文件路径、模块路径、导入语句完全保留：

```markdown
✅ 正确：该文件位于 `addons/sale/models/sale_order.py`
✅ 正确：从 `odoo.models` 导入 `Model` 类
```

## Markdown格式保留规则

### 标题层级

保持原有标题层级结构：

```markdown
✅ 原文：
# Installation Guide
## Prerequisites
### System Requirements

✅ 译文：
# 安装指南
## 前置条件
### 系统要求
```

### 列表和缩进

完全保留列表格式和缩进层次：

```markdown
✅ 原文：
- First level
  - Second level
    - Third level

✅ 译文：
- 第一层
  - 第二层
    - 第三层
```

### 表格格式

保持表格结构，仅翻译表格内容（非术语部分）：

```markdown
✅ 原文：
| Field | Type | Description |
|-------|------|-------------|
| name  | Char | Customer name |

✅ 译文：
| Field | 类型 | 描述 |
|-------|------|------|
| name  | Char | 客户名称 |
```

### 链接和引用

保持链接格式，翻译链接文本：

```markdown
✅ 原文：[Read more](https://example.com)
✅ 译文：[阅读更多](https://example.com)
```

## 翻译工作流

执行翻译时，按以下步骤进行：

### 步骤1：识别文档结构

先快速浏览文档，识别：
- 标题层级
- 代码块位置
- 专业术语分布
- 表格和列表结构

### 步骤2：分段翻译

按段落或章节逐步翻译：
1. 识别段落中的术语和代码
2. 翻译描述性文本
3. 保留所有术语和代码
4. 检查格式完整性

### 步骤3：质量检查

翻译完成后，检查：
- [ ] 所有代码块未被修改
- [ ] Odoo专业术语保留英文
- [ ] Markdown格式正确渲染
- [ ] 中文表达流畅自然
- [ ] 技术含义准确无误

## 常见Odoo术语速查表

完整术语表请查看 [glossary.md](glossary.md)

快速参考：

| 术语 | 保留英文 | 说明 |
|------|----------|------|
| Model | ✓ | Odoo数据模型核心概念 |
| View | ✓ | 视图定义，包含Form/Tree/Kanban等 |
| Field | ✓ | 字段定义，包含类型和属性 |
| ORM | ✓ | 对象关系映射框架 |
| QWeb | ✓ | Odoo模板引擎 |
| Wizard | ✓ | 向导对话框 |
| Mixin | ✓ | 混入类 |
| Domain | ✓ | 搜索域表达式 |
| Context | ✓ | 上下文字典 |
| Recordset | ✓ | 记录集对象 |

## 示例对照

### 示例1：技术说明文档

**原文：**
```markdown
## Creating a Model

To create a new model in Odoo, inherit from `models.Model`:

\`\`\`python
from odoo import models, fields

class Product(models.Model):
    _name = 'product.template'
    name = fields.Char('Product Name')
\`\`\`

The `_name` attribute defines the model's database table.
```

**译文：**
```markdown
## 创建 Model

要在 Odoo 中创建新的 Model，需要继承 `models.Model`：

\`\`\`python
from odoo import models, fields

class Product(models.Model):
    _name = 'product.template'
    name = fields.Char('Product Name')
\`\`\`

`_name` 属性定义了 Model 的数据库表名。
```

### 示例2：API文档

**原文：**
```markdown
### search() method

Returns a recordset matching the domain.

**Parameters:**
- `domain` (list): Search domain
- `limit` (int): Maximum records

**Returns:** Recordset
```

**译文：**
```markdown
### search() 方法

返回与 Domain 匹配的 Recordset。

**参数：**
- `domain` (list)：搜索 Domain
- `limit` (int)：最大记录数

**返回值：** Recordset
```

## 特殊场景处理

### 场景1：技术名词首次出现

技术术语首次出现时，可以添加简短中文说明：

```markdown
✅ 推荐：Odoo 使用 ORM（对象关系映射）来操作数据库
✅ 推荐：View 定义了用户界面的展示方式
```

### 场景2：混合表达

当句子中混合使用术语和描述时：

```markdown
✅ 正确：在 Model 中定义 Computed Field 来计算派生值
✅ 正确：使用 `@api.depends` 装饰器声明 Field 的依赖关系
```

### 场景3：代码解释

解释代码时，代码保持原样，解释使用中文：

```markdown
✅ 正确：
`self.env['sale.order']` 返回 Model 的环境代理，用于执行 ORM 操作。
```

## 质量标准

合格的翻译应该：

1. **技术准确**：不改变原文技术含义
2. **术语统一**：相同术语在文档中保持一致
3. **代码完整**：所有代码块、路径、API保持原样
4. **格式正确**：Markdown正确渲染，无格式错误
5. **表达流畅**：中文表达自然，符合阅读习惯
6. **保持简洁**：不添加原文没有的额外解释

## 注意事项

### ✅ 应该做的

- 保持原文的段落结构和逻辑顺序
- 使用专业、准确的中文技术表达
- 遇到不确定的术语时，保留英文原文
- 保持代码示例的完整性和可执行性

### ❌ 不应该做的

- 不要翻译代码中的变量名、函数名、类名
- 不要翻译Odoo特定的技术术语
- 不要改变Markdown格式和结构
- 不要添加原文没有的内容或个人理解
- 不要翻译文件路径、模块名称、导入语句

## 附加资源

- 完整术语对照表：[glossary.md](glossary.md)
- Odoo官方术语：https://www.odoo.com/documentation/
