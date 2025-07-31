# Odoo 16 Copy 方法完整指南

## 目录
1. [概述](#概述)
2. [核心实现架构](#核心实现架构)
3. [copy_data 方法详解](#copy_data-方法详解)
4. [copy 方法详解](#copy-方法详解)
5. [copy_translations 方法详解](#copy_translations-方法详解)
6. [字段copy属性](#字段copy属性)
7. [重写copy方法的最佳实践](#重写copy方法的最佳实践)
8. [常见使用场景](#常见使用场景)
9. [性能优化建议](#性能优化建议)
10. [常见问题与解决方案](#常见问题与解决方案)

## 概述

Odoo 16的copy功能是ORM框架的核心特性之一，用于复制记录及其关联数据。该功能通过三个主要方法实现：
- `copy_data()`: 准备复制数据
- `copy()`: 执行复制操作
- `copy_translations()`: 复制翻译信息

**文件位置**: `odoo/models.py`

## 核心实现架构

### 方法调用流程
```
copy(default) 
├── copy_data(default)
│   ├── 循环引用检测
│   ├── 黑名单过滤
│   ├── 字段复制逻辑
│   └── 关联记录处理
├── create(vals)
└── copy_translations(new_record)
```

### 关键特性
- **递归复制**: 自动处理one2many关系的子记录
- **循环引用防护**: 避免无限递归
- **翻译支持**: 自动复制多语言内容
- **字段控制**: 通过copy属性精确控制复制行为
- **默认值覆盖**: 支持通过default参数定制复制行为

## copy_data 方法详解

### 方法签名
```python
def copy_data(self, default=None):
```

### 核心实现逻辑

#### 1. 循环引用防护
```python
# 避免递归复制时的循环引用
if '__copy_data_seen' not in self._context:
    self = self.with_context(__copy_data_seen=defaultdict(set))
seen_map = self._context['__copy_data_seen']
if self.id in seen_map[self._name]:
    return
seen_map[self._name].add(self.id)
```

#### 2. 黑名单机制
```python
# 构建不可复制字段的黑名单
blacklist = set(MAGIC_COLUMNS + ['parent_path'])
whitelist = set(name for name, field in self._fields.items() if not field.inherited)
```

**MAGIC_COLUMNS 包含**:
- `id`: 主键
- `create_date`, `create_uid`: 创建信息
- `write_date`, `write_uid`: 修改信息
- `__last_update`: 最后更新时间

#### 3. 字段复制逻辑
```python
fields_to_copy = {name: field
                  for name, field in self._fields.items()
                  if field.copy and name not in default and name not in blacklist}
```

#### 4. 关联字段处理

**One2many 字段**:
```python
if field.type == 'one2many':
    # 按ID排序确保翻译复制时的顺序一致性
    lines = [rec.copy_data()[0] for rec in self[name].sorted(key='id')]
    default[name] = [Command.create(line) for line in lines if line]
```

**Many2many 字段**:
```python
elif field.type == 'many2many':
    default[name] = [Command.set(self[name].ids)]
```

## copy 方法详解

### 方法签名
```python
def copy(self, default=None):
```

### 实现逻辑
```python
def copy(self, default=None):
    self.ensure_one()
    vals = self.with_context(active_test=False).copy_data(default)[0]
    record_copy = self.create(vals)
    self.with_context(from_copy_translation=True).copy_translations(record_copy, excluded=default or ())
    return record_copy
```

### 关键点说明
- `ensure_one()`: 确保只操作单条记录
- `active_test=False`: 包含归档记录
- `create(vals)`: 创建新记录
- `copy_translations()`: 复制翻译内容

## copy_translations 方法详解

### 功能说明
递归复制原记录的翻译信息到新记录，支持：
- 可翻译字段的多语言内容
- One2many关系中子记录的翻译
- 循环引用防护

### 核心逻辑
```python
def copy_translations(self, new, excluded=()):
    # 循环引用防护
    if '__copy_translations_seen' not in old._context:
        old = old.with_context(__copy_translations_seen=defaultdict(set))
    
    # 处理可翻译字段
    if field.translate and field.store and name not in excluded:
        old_translations = field._get_stored_translations(old)
        # 复制翻译内容到新记录
```

## 字段copy属性

### copy属性值

| 值 | 说明 |
|---|---|
| `True` | 字段会被复制（默认） |
| `False` | 字段不会被复制 |

### 字段类型默认copy行为

| 字段类型 | 默认copy值 | 说明 |
|---------|-----------|------|
| Char, Text, Html | `True` | 普通文本字段 |
| Integer, Float | `True` | 数值字段 |
| Boolean | `True` | 布尔字段 |
| Date, Datetime | `True` | 日期时间字段 |
| Selection | `True` | 选择字段 |
| Many2one | `True` | 多对一关系 |
| One2many | `True` | 一对多关系（递归复制） |
| Many2many | `True` | 多对多关系（引用复制） |
| Binary | `True` | 二进制字段 |
| Computed | `False` | 计算字段（除非store=True） |

### 字段定义示例
```python
class MyModel(models.Model):
    _name = 'my.model'
    
    name = fields.Char(copy=True)           # 会被复制
    code = fields.Char(copy=False)          # 不会被复制
    description = fields.Text()             # 默认copy=True
    state = fields.Selection([...])         # 默认copy=True
    line_ids = fields.One2many(copy=True)   # 子记录会被递归复制
    tag_ids = fields.Many2many()            # 默认copy=True，引用相同记录
```

## 重写copy方法的最佳实践

### 1. 基本模板
```python
def copy(self, default=None):
    self.ensure_one()
    default = dict(default or {})
    
    # 自定义逻辑
    # ...
    
    return super().copy(default)
```

### 2. 处理唯一性约束
```python
def copy(self, default=None):
    self.ensure_one()
    default = dict(default or {})
    
    # 处理唯一字段
    if not default.get('name'):
        default['name'] = _('%s (copy)') % self.name
    if not default.get('code'):
        default['code'] = self._generate_unique_code()
    
    return super().copy(default)
```

### 3. 重置状态字段
```python
def copy(self, default=None):
    self.ensure_one()
    default = dict(default or {})
    
    # 重置工作流状态
    default.update({
        'state': 'draft',
        'date_confirmed': False,
        'confirmed_by': False,
        'approval_date': False,
    })
    
    return super().copy(default)
```

### 4. 处理计算字段
```python
def copy(self, default=None):
    self.ensure_one()
    default = dict(default or {})
    
    # 重置依赖计算的字段
    default.update({
        'total_amount': 0.0,
        'computed_field': False,
    })
    
    return super().copy(default)
```

### 5. 复杂业务逻辑示例
```python
def copy(self, default=None):
    self.ensure_one()
    default = dict(default or {})
    
    # 生成新的序列号
    if not default.get('sequence'):
        default['sequence'] = self.env['ir.sequence'].next_by_code('my.model.sequence')
    
    # 处理关联记录
    if not default.get('line_ids'):
        # 自定义子记录复制逻辑
        default['line_ids'] = self._prepare_copy_lines()
    
    # 重置权限相关字段
    default.update({
        'user_id': self.env.uid,
        'company_id': self.env.company.id,
    })
    
    return super().copy(default)

def _prepare_copy_lines(self):
    """准备子记录复制数据"""
    commands = []
    for line in self.line_ids:
        line_vals = line.copy_data()[0]
        # 自定义子记录处理
        line_vals.update({
            'state': 'draft',
            'processed': False,
        })
        commands.append(Command.create(line_vals))
    return commands
```

## 常见使用场景

### 1. 产品模板复制
```python
class ProductTemplate(models.Model):
    _inherit = 'product.template'
    
    def copy(self, default=None):
        default = dict(default or {})
        default.update({
            'name': _('%s (copy)') % self.name,
            'default_code': False,  # 重置产品编码
            'active': True,
        })
        return super().copy(default)
```

### 2. 销售订单复制
```python
class SaleOrder(models.Model):
    _inherit = 'sale.order'
    
    def copy(self, default=None):
        default = dict(default or {})
        default.update({
            'name': self.env['ir.sequence'].next_by_code('sale.order'),
            'state': 'draft',
            'date_order': fields.Datetime.now(),
            'validity_date': False,
            'invoice_ids': [],
            'picking_ids': [],
        })
        return super().copy(default)
```

### 3. 项目复制
```python
class Project(models.Model):
    _inherit = 'project.project'
    
    def copy(self, default=None):
        default = dict(default or {})
        
        # 生成新的项目名称
        if not default.get('name'):
            default['name'] = _('%s (copy)') % self.name
        
        # 重置项目状态
        default.update({
            'stage_id': self._get_default_stage_id(),
            'date_start': False,
            'date': False,
        })
        
        # 复制任务但重置状态
        if self.task_ids and not default.get('task_ids'):
            task_defaults = {
                'stage_id': self.env['project.task.type'].search([('name', '=', 'New')], limit=1).id,
                'date_deadline': False,
            }
            default['task_ids'] = [
                Command.create(dict(task.copy_data()[0], **task_defaults))
                for task in self.task_ids
            ]
        
        return super().copy(default)
```

## 性能优化建议

### 1. 批量复制优化
```python
def copy_multiple(records, defaults_list=None):
    """批量复制多条记录"""
    if not defaults_list:
        defaults_list = [{}] * len(records)
    
    # 准备批量创建数据
    vals_list = []
    for record, default in zip(records, defaults_list):
        vals = record.with_context(active_test=False).copy_data(default)[0]
        vals_list.append(vals)
    
    # 批量创建
    new_records = records[0].create(vals_list)
    
    # 批量处理翻译
    for old_record, new_record, default in zip(records, new_records, defaults_list):
        old_record.copy_translations(new_record, excluded=default or ())
    
    return new_records
```

### 2. 避免不必要的计算
```python
def copy(self, default=None):
    # 在复制时暂时禁用自动重计算
    self = self.with_context(recompute=False)
    result = super().copy(default)
    # 复制完成后手动触发必要的计算
    result.recompute()
    return result
```

### 3. 优化大量关联记录的复制
```python
def copy(self, default=None):
    default = dict(default or {})
    
    # 对于大量子记录，可以选择性复制
    if len(self.line_ids) > 1000:
        # 只复制最近的记录
        recent_lines = self.line_ids.sorted('create_date', reverse=True)[:100]
        default['line_ids'] = [
            Command.create(line.copy_data()[0])
            for line in recent_lines
        ]
    
    return super().copy(default)
```

## 常见问题与解决方案

### 1. 唯一性约束错误
**问题**: 复制时违反唯一性约束
```python
# 错误示例
record.copy()  # 可能因为重复的code字段失败
```

**解决方案**:
```python
def copy(self, default=None):
    default = dict(default or {})
    # 确保唯一字段不重复
    default['code'] = self._generate_unique_code()
    return super().copy(default)

def _generate_unique_code(self):
    base_code = self.code or 'COPY'
    counter = 1
    while self.search([('code', '=', f'{base_code}_{counter}')]):
        counter += 1
    return f'{base_code}_{counter}'
```

### 2. 计算字段不更新
**问题**: 复制后计算字段显示错误值

**解决方案**:
```python
def copy(self, default=None):
    result = super().copy(default)
    # 强制重新计算
    result._recompute_todo(result._fields['computed_field'])
    return result
```

### 3. 权限问题
**问题**: 复制关联记录时权限不足

**解决方案**:
```python
def copy(self, default=None):
    # 使用sudo权限进行复制
    if self.env.user.has_group('base.group_system'):
        return super().copy(default)
    else:
        # 限制复制内容
        default = dict(default or {})
        default['restricted_field'] = False
        return super().copy(default)
```

### 4. 循环引用问题
**问题**: 自定义复制逻辑导致无限递归

**解决方案**:
```python
def copy(self, default=None):
    # 检查上下文避免循环
    if self._context.get('copying'):
        return super().copy(default)
    
    return self.with_context(copying=True).copy(default)
```

### 5. 大数据集复制性能问题
**问题**: 复制包含大量子记录的父记录时性能差

**解决方案**:
```python
def copy(self, default=None):
    default = dict(default or {})
    
    # 分批处理子记录
    if len(self.line_ids) > 500:
        # 暂时不复制子记录，后续异步处理
        default['line_ids'] = []
        result = super().copy(default)
        # 启动异步任务复制子记录
        self._async_copy_lines(result)
        return result
    
    return super().copy(default)

def _async_copy_lines(self, new_record):
    """异步复制子记录"""
    self.env['queue.job'].sudo().delay(
        'my.model', '_copy_lines_job', 
        self.id, new_record.id
    )
```

## 总结

Odoo 16的copy功能是一个强大且灵活的记录复制系统，通过合理使用可以满足各种复杂的业务需求。重要的是要理解其内部机制，并根据具体场景进行适当的定制。

**关键要点**:
1. 始终调用`ensure_one()`
2. 合理处理`default`参数
3. 必须调用`super().copy(default)`
4. 注意唯一性约束
5. 考虑性能影响
6. 处理权限和安全性

遵循这些最佳实践，可以确保copy功能既安全又高效。