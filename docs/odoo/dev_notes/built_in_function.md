---
title: 内置函数
description: 整理一些Odoo常用的内置函数
sidebar_label: 内置函数
keywords:
- docs
- odoo development

tags: [odoo]
---

## write()与update()的区别

`write()` 方法：

- `write()` 方法用于更新当前<strong style={{color: 'red'}}>记录集</strong>中的<strong style={{color: 'red'}}>所有记录</strong>的字段值。
- 你可以一次性更新多个记录的多个字段。例如，如果你想要同时更新多个记录的名称和年龄，你可以使用`write()`
- `write()`属于CRUD方法之一，这个方法只适用于已经存在于数据库中的记录。如果你尝试在一个不存在于数据库中的伪记录上调用 `write()`，会出现未定义的行为。（onchange 方法返回数据库中尚不存在的伪记录）

`update()` 方法：

- `update()` 方法用于在<strong style={{color: 'red'}}>单个记录</strong>上更新特定字段的值。
- 它适用于单个记录，而不是整个记录集。
- 如果你需要在一个伪记录上设置字段值（即尚未在数据库中创建的记录，onchange 方法返回数据库中尚不存在的伪记录），你应该使用 update() 方法。

所以，总结一下：

- 如果你需要同时<strong style={{color: 'red'}}>更新多个记录</strong>的多个字段，使用 `write()`。
- 如果你只需要在<strong style={{color: 'red'}}>单个记录</strong>上更新特定字段，或者在<strong style={{color: 'red'}}>伪记录</strong>上设置字段值，使用`update()`

## get_view

可通过template动态向view插入内容。

:::warning

（`fields_view_get`也可实现相同需求，但官方提示`fields_view_get`将丢弃，用`get_view`代替）

:::

- 通过template渲染添加的内容
  
  ```html
  <?xml version="1.0" encoding="UTF-8" ?>
  <odoo>
        <!-- qweb 语法 -->
        <!-- 可通过后端传params，在此处通过qweb语法引用 -->
        <!-- t-att t-attf -->
    <template id="template_id">
        <field name="field" readonly="1" context="{}"/>
                <button/>
            <!-- other tags -->
    </template>
  </odoo>
  ```
  
  ```
  
  ```

```python
class XXX():

    @api.model
    def get_view(self, view_id=None, view_type="form", **options):
        res = super(CbSoDtSearchWizard, self).get_view(view_id=view_id, view_type=view_type, **options)
        View = self.env["ir.ui.view"]
        if view_type == 'form':
            doc = etree.XML(res["arch"])
            all_models = res["models"].copy()
            div = doc.xpath("//div[@name='xxx']")
            if len(div):
                if self.env.context.get('context1'):
                    # 此处添加attrib时注意不能用Boolean类型
                    etree.SubElement(div[0], 'field',
                                     {'name': 'field_name', 'readonly': 'true',
                                      'context': "{}"})
                # 此处postprocess_and_fields只能对新增的节点处理，否则会影响原xml其他节点设置的属性。
                new_node = doc.xpath("//field[@name='field_name']")
                if len(new_node):
                    new_arch, new_models = View.postprocess_and_fields(new_node[0], self._name)
                    _merge_view_fields(all_models, new_models)
            res["arch"] = etree.tostring(new_arch)
            res["models"] = frozendict(all_models)
        return res


def _merge_view_fields(all_models: dict, new_models: dict):
    """Merge new_models into all_models. Both are {modelname(str) ➔ fields(tuple)}."""
    for model, view_fields in new_models.items():
        if model in all_models:
            all_models[model] = tuple(set(all_models[model]) | set(view_fields))
        else:
            all_models[model] = tuple(view_fields)
```

- 直接插入内容

```python
class XXX():

    @api.model
    def get_view(self, view_id=None, view_type="form", **options):
        res = super(XXX, self).get_view(view_id=view_id, view_type=view_type, **options)
        View = self.env["ir.ui.view"]
        if view_type == 'form':
            doc = etree.XML(res["arch"])
            all_models = res["models"].copy()
            div = doc.xpath("//div[@name='xxx']")
            if len(div):
                if self.env.context.get('context1'):
                    # 此处添加attrib时注意不能用Boolean类型
                    etree.SubElement(div[0], 'field',
                                     {'name': 'field_name', 'readonly': 'true',
                                      'context': "{}"})
                # 此处postprocess_and_fields只能对新增的节点处理，否则会影响原xml其他节点设置的属性。
                new_node = doc.xpath("//field[@name='field_name']")
                if len(new_node):
                    new_arch, new_models = View.postprocess_and_fields(new_node[0], self._name)
                    _merge_view_fields(all_models, new_models)
            res["arch"] = etree.tostring(new_arch)
            res["models"] = frozendict(all_models)
        return res


def _merge_view_fields(all_models: dict, new_models: dict):
    """Merge new_models into all_models. Both are {modelname(str) ➔ fields(tuple)}."""
    for model, view_fields in new_models.items():
        if model in all_models:
            all_models[model] = tuple(set(all_models[model]) | set(view_fields))
        else:
            all_models[model] = tuple(view_fields)
```
:::info
以上插入子节点的操作可以改成以下处理方式更合适，将`etree.SubElement`替换成`etree.Element`然后在通过`append`插入到尾部。
:::
```python
@api.model
def get_view(self, view_id=None, view_type="form", **options):
    res = super(CbSoDtSearchWizard, self).get_view(view_id=view_id, view_type=view_type, **options)
    View = self.env["ir.ui.view"]
    if view_type == 'form':
        doc = etree.XML(res["arch"])
        all_models = res["models"].copy()
        div = doc.xpath("//div[@name='xxx']")
        if len(div):
            if self.env.context.get('context1'):
                # 此处添加attrib时注意不能用Boolean类型
                new_node = etree.Element('field', {'name': 'so_dt_ids', 'readonly': 'true',
                                      'context': "{'tree_view_ref': 'xxx_view_tree'}"})
                div[0].append(new_node)
                # 此处postprocess_and_fields只能对新增的节点处理，否则会影响原xml其他节点设置的属性。
                new_arch, new_models = View.postprocess_and_fields(new_node, self._name)
                _merge_view_fields(all_models, new_models)            
        res["arch"] = etree.tostring(new_arch)
        res["models"] = frozendict(all_models)
    return res
```

## get_view设置record readonly(v16)

通过修改`get_view`来全局设置`record`的字段只读

场景: 

- 当记录的状态=已锁定，记录不可编辑。

```python
import json

from lxml import etree
from lxml.builder import E

from odoo import api, fields, models, Command, _
from odoo.osv import expression


class Base(models.AbstractModel):
    _inherit = 'base'
    _readonly_domain = False

    @api.model
    def readonly_domain(self):
        return self._readonly_domain

    @api.model
    def get_view(self, view_id=None, view_type='form', **options):
        res = super().get_view(view_id, view_type, **options)
        if view_type not in ['form', 'tree']:
            return res

        domain = self.readonly_domain()
        if not domain:
            return res

        doc = etree.XML(res['arch'])
        can_edit = doc.get('edit')
        if can_edit and not json.loads(can_edit):
            return res

        if view_type == 'tree':
            editable = doc.get('editable')
            if not editable:
                return res

        field_elements = doc.xpath('//field[not(ancestor::field)]')
        for field_element in field_elements:
            modifiers = json.loads(field_element.get('modifiers', '{}'))
            readonly = modifiers.get('readonly')
            if readonly is True:
                continue

            if not readonly:
                readonly = domain
            else:
                readonly = expression.OR([readonly, domain])

            modifiers['readonly'] = readonly
            field_element.set('modifiers', json.dumps(modifiers))

        res['arch'] = etree.tostring(doc, encoding='unicode')
        return res
```

## user_has_groups

> 判断当前登录用户res_users是否存在某群组res_group中。

```python
@api.model
def user_has_groups(self, groups):    
    # groups 为','分隔的群组名，包括所在模块， module_name.group_name
    # 判断当前用户是否存在这些群组中，是则返回True，否则返回False
    # 如果在groups中以"!,"开头，则取否。即如果用户存在这些群组中，返回False，否则返回True
    # 也可以解释为，如果当前用户不存在这些群组中，则返回True，反之则返回False
    ....

self.user_has_groups(group_name)
self.user_has_groups(!group_name)
```

## name_search

> Odoo模型的一个公共方法，用于根据名称模式搜索记录。它通常用于前端UI中的自动完成字段(Many2one字段的下拉搜索)。

通常建议重写`_name_search()`而不是`name_search()`，因为前者提供了更多的灵活性。

## _name_search

> `_name_search()`是`name_search()`的底层实现方法，包含了实际的搜索逻辑。

<details>
  <summary>源码</summary>

```python
@api.model
def name_search(self, name='', args=None, operator='ilike', limit=100):
    """ name_search(name='', args=None, operator='ilike', limit=100) -> records

    Search for records that have a display name matching the given
    ``name`` pattern when compared with the given ``operator``, while also
    matching the optional search domain (``args``).

    This is used for example to provide suggestions based on a partial
    value for a relational field. Should usually behave as the reverse of
    :meth:`~.name_get`, but that is ont guaranteed.

    This method is equivalent to calling :meth:`~.search` with a search
    domain based on ``display_name`` and then :meth:`~.name_get` on the
    result of the search.

    :param str name: the name pattern to match
    :param list args: optional search domain (see :meth:`~.search` for
                      syntax), specifying further restrictions
    :param str operator: domain operator for matching ``name``, such as
                         ``'like'`` or ``'='``.
    :param int limit: optional max number of records to return
    :rtype: list
    :return: list of pairs ``(id, text_repr)`` for all matching records.
    """
    ids = self._name_search(name, args, operator, limit=limit)
    return self.browse(ids).sudo().name_get()

@api.model
def _name_search(self, name='', args=None, operator='ilike', limit=100, name_get_uid=None):
    """ _name_search(name='', args=None, operator='ilike', limit=100, name_get_uid=None) -> ids

        Private implementation of name_search, allows passing a dedicated user
        for the name_get part to solve some access rights issues.
        """
        args = list(args or [])
        search_fnames = self._rec_names_search or ([self._rec_name] if self._rec_name else [])
        if not search_fnames:
            _logger.warning("Cannot execute name_search, no _rec_name or _rec_names_search defined on %s", self._name)
        # optimize out the default criterion of ``like ''`` that matches everything
        elif not (name == '' and operator in ('like', 'ilike')):
            aggregator = expression.AND if operator in expression.NEGATIVE_TERM_OPERATORS else expression.OR
            domain = aggregator([[(field_name, operator, name)] for field_name in search_fnames])
            args += domain
        return self._search(args, limit=limit, access_rights_uid=name_get_uid)
```

</details>

适用_name_search()的场景

- 需要自定义搜索逻辑时
- 需要添加额外的搜索条件时
- 需要优化搜索性能时
- 需要基于域(domain)进行复杂过滤时

:::info[参数说明]
- `name` (str): (default='')用于匹配的名称模式。这是要搜索的文本模式，系统会根据这个模式来查找匹配的记录。
- `args` (list): (default=None)可选的搜索域，用于指定进一步的搜索限制条件。这是一个遵循 Odoo 搜索语法的域表达式列表，可以添加额外的过滤条件。
- `operator` (str): (default='ilike')用于匹配 name 参数的域操作符。常见的操作符包括：
  - 'like': 模糊匹配（区分大小写）
  - 'ilike': 模糊匹配（不区分大小写）
  - '=': 精确匹配
- `limit` (int): (default=100)可选的最大返回记录数限制。控制搜索结果的数量上限，避免返回过多的记录。
:::

### _name_search()基础用法

```python
from odoo.osv import expression

...

@api.model
def _name_search(self, name='', args=None, operator='ilike', limit=100, name_get_uid=None):
    args = list(args or [])
    if self._context.get('xxxx'):    # 通过context控制影响范围
        domain = []
        if name:
            # 添加额外的搜索条件my_field
            domain = expression.OR([args, [('my_field', operator, name)]])
        # 添加额外的过滤条件
        domain = expression.AND([('state', '!=', 'cancelled')])
        return super()._name_search(name=name, args=domain, operator=operator, limit=limit, name_get_uid=name_get_uid)
    return super()._name_search(name=name, args=args, operator=operator, limit=limit, name_get_uid=name_get_uid)
```

### 处理特殊操作符

:::warning
关于_name_search的代码片段均为用法举例，并非项目最佳实践，在实践中基于实际情况分析。
:::

```python
@api.model
def _name_search(self, name='', args=None, operator='ilike', limit=100, name_get_uid=None):
    args = list(args or [])
    
    # 优化空搜索
    if not name and operator in ('like', 'ilike'):
        return self._search(args, limit=limit, access_rights_uid=name_get_uid)
    
    # 处理不同的操作符
    if operator == 'ilike':
        # 不区分大小写的模糊匹配
        search_domain = [
            '|', '|',
            ('name', 'ilike', name),
            ('code', 'ilike', name),
            ('display_name', 'ilike', name)
        ]
    elif operator == '=':
        # 精确匹配
        search_domain = [
            '|', '|',
            ('name', '=', name),
            ('code', '=', name),
            ('display_name', '=', name)
        ]
    elif operator in expression.NEGATIVE_TERM_OPERATORS:
        # 负向操作符使用 AND 连接
        search_domain = [
            ('name', operator, name),
            ('code', operator, name),
            ('display_name', operator, name)
        ]
    else:
        # 其他操作符
        search_domain = [('name', operator, name)]
    
    args += search_domain
    return self._search(args, limit=limit, access_rights_uid=name_get_uid)
```

### 优化字段搜索

> 这个用法需要测试。

```python
@api.model
def _name_search(self, name='', args=None, operator='ilike', limit=100, name_get_uid=None):
    args = list(args or [])
    
    if not name:
        return self._search(args, limit=limit, access_rights_uid=name_get_uid)
    
    # 定义搜索字段的优先级
    search_fields = [
        ('code', 10),      # 代码匹配优先级最高
        ('name', 8),       # 名称匹配
        ('short_name', 6), # 简称匹配
        ('alias', 4),      # 别名匹配
    ]
    
    # 构建搜索域
    search_domain = []
    for field, priority in search_fields:
        if self._fields.get(field):
            search_domain.append((field, operator, name))
    
    # 使用 OR 连接所有搜索条件
    if search_domain:
        if len(search_domain) > 1:
            domain = expression.OR([[domain] for domain in search_domain])
        else:
            domain = search_domain
        args += domain
    
    return self._search(args, limit=limit, access_rights_uid=name_get_uid)
```

### 实现分词搜索

```python
@api.model
def _name_search(self, name='', args=None, operator='ilike', limit=100, name_get_uid=None):
    args = list(args or [])
    
    if not name:
        return self._search(args, limit=limit, access_rights_uid=name_get_uid)
    
    # 智能搜索逻辑
    search_terms = name.strip().split()
    
    if len(search_terms) == 1:
        # 单个搜索词
        term = search_terms[0]
        search_domain = [
            '|', '|', '|',
            ('code', operator, term),
            ('name', operator, term),
            ('short_name', operator, term),
            ('description', operator, term)
        ]
    else:
        # 多个搜索词，每个词都必须匹配
        search_domain = []
        for term in search_terms:
            term_domain = [
                '|', '|',
                ('name', operator, term),
                ('code', operator, term),
                ('description', operator, term)
            ]
            search_domain.append(term_domain)
        
        # 使用 AND 连接多个搜索词
        if search_domain:
            search_domain = expression.AND(search_domain)
    
    args += search_domain
    return self._search(args, limit=limit, access_rights_uid=name_get_uid)
```

### 考虑性能优化、优先精确匹配

```python
@api.model
def _name_search(self, name='', args=None, operator='ilike', limit=100, name_get_uid=None):
    args = list(args or [])
    
    # 性能优化：限制搜索长度
    if len(name) > 100:
        name = name[:100]
    
    # 性能优化：优先搜索索引字段
    if not name:
        return self._search(args, limit=limit, access_rights_uid=name_get_uid)
    
    # 首先尝试精确匹配（通常更快）
    if operator == 'ilike':
        exact_args = args + [('code', '=', name)]
        exact_ids = self._search(exact_args, limit=limit, access_rights_uid=name_get_uid)
        
        if exact_ids:
            return exact_ids
        
        # 如果没有精确匹配，再进行模糊搜索
        fuzzy_args = args + [
            '|', '|',
            ('name', 'ilike', name),
            ('code', 'ilike', name),
            ('short_name', 'ilike', name)
        ]
        return self._search(fuzzy_args, limit=limit, access_rights_uid=name_get_uid)
    
    # 其他操作符的处理
    search_domain = [('name', operator, name)]
    args += search_domain
    return self._search(args, limit=limit, access_rights_uid=name_get_uid)
```

### 根据上下文调整逻辑

```python
@api.model
def _name_search(self, name='', args=None, operator='ilike', limit=100, name_get_uid=None):
    args = list(args or [])
    
    # 根据上下文调整搜索逻辑
    context = self.env.context
    
    # 特定模块的搜索优化
    if context.get('search_default_active'):
        args.append(('active', '=', True))
    
    # 基于用户角色的搜索过滤
    if not self.env.user.has_group('base.group_system'):
        args.append(('is_public', '=', True))
    
    if not name:
        return self._search(args, limit=limit, access_rights_uid=name_get_uid)
    
    # 构建搜索域
    search_domain = [
        '|', '|',
        ('name', operator, name),
        ('code', operator, name),
        ('display_name', operator, name)
    ]
    
    args += search_domain
    return self._search(args, limit=limit, access_rights_uid=name_get_uid)
```

## fields_get

> Odoo模型的一个重要方法，用于动态获取模型的字段定义信息。它返回一个字典，包含模型中所有字段的元数据，通常用于前端界面动态生成表单视图或进行字段级别的权限控制。

`def fields_get(self, allfields=None, attributes=None)`

参数说明：

- `allfields`: 可选参数，指定要获取的字段列表(默认返回所有字段)
- attributes: 可选参数，指定要获取的字段属性列表(默认返回所有属性)

### 重写的场景<!-- {docsify-ignore} -->

1. 动态修改字段属性
   
   **场景**：根据用户权限或某些条件动态修改字段属性(如只读、必填等)
   
   ```python
   from odoo import models, api
   
   class SaleOrder(models.Model):
       _inherit = 'sale.order'
   
       @api.model
       def fields_get(self, allfields=None, attributes=None):
           res = super(SaleOrder, self).fields_get(allfields, attributes)
   
           # 如果用户不是经理，使某些字段只读
           if not self.env.user.has_group('sales_team.group_sale_manager'):
               for field_name in ['discount', 'payment_term_id']:
                   if field_name in res:
                       res[field_name]['readonly'] = True
   
           return res
   ```

2. 隐藏敏感字段
   
   **场景**：根据用户角色隐藏敏感或内部字段
   
   ```python
   class HrEmployee(models.Model):
       _inherit = 'hr.employee'
   
       @api.model
       def fields_get(self, allfields=None, attributes=None):
           res = super(HrEmployee, self).fields_get(allfields, attributes)
   
           # 非HR用户看不到薪资相关字段
           if not self.env.user.has_group('hr.group_hr_user'):
               for field in ['salary', 'bank_account_id', 'ssnid']:
                   if field in res:
                       del res[field]
   
           return res
   ```

3. 动态字段依赖
   
   **场景**：根据其他系统配置动态改变字段属性
   
   ```python
   class ProductProduct(models.Model):
       _inherit = 'product.product'
   
       @api.model
       def fields_get(self, allfields=None, attributes=None):
           res = super(ProductProduct, self).fields_get(allfields, attributes)
   
           # 如果公司启用了多仓库，显示仓库相关字段
           multi_warehouse = self.env['ir.config_parameter'].get_param('stock.multi_warehouse')
           if multi_warehouse == 'False':
               for field in ['warehouse_id', 'stock_location_id']:
                   if field in res:
                       res[field]['invisible'] = True
   
           return res
   ```

4. 自定义字段描述
   
   场景：根据上下文或用户语言动态修改字段描述
   
   ```python
   class ProjectTask(models.Model):
       _inherit = 'project.task'
   
       @api.model
       def fields_get(self, allfields=None, attributes=None):
           res = super(ProjectTask, self).fields_get(allfields, attributes)
   
           # 根据用户语言提供不同的帮助文本
           lang = self.env.context.get('lang', 'en_US')
           if lang == 'fr_FR':
               if 'deadline' in res:
                   res['deadline']['help'] = "Date limite pour terminer cette tâche"
   
           return res
   ```
   ```python
   class Product(models.Model):
   
       _inherit = "product.product"
       
       @api.model
       def fields_get(self, allfields=None, attributes=None):
           res = super().fields_get(allfields, attributes)
           if self._context.get('location') and isinstance(self._context['location'], int):
               location = self.env['stock.location'].browse(self._context['location'])
               if location.usage == 'supplier':
                   if res.get('virtual_available'):
                       res['virtual_available']['string'] = _('Future Receipts')
                   if res.get('qty_available'):
                       res['qty_available']['string'] = _('Received Qty')
               elif location.usage == 'internal':
                   if res.get('virtual_available'):
                       res['virtual_available']['string'] = _('Forecasted Quantity')
               elif location.usage == 'customer':
                   if res.get('virtual_available'):
                       res['virtual_available']['string'] = _('Future Deliveries')
                   if res.get('qty_available'):
                       res['qty_available']['string'] = _('Delivered Qty')
               elif location.usage == 'inventory':
                   if res.get('virtual_available'):
                       res['virtual_available']['string'] = _('Future P&L')
                   if res.get('qty_available'):
                       res['qty_available']['string'] = _('P&L Qty')
               elif location.usage == 'production':
                   if res.get('virtual_available'):
                       res['virtual_available']['string'] = _('Future Productions')
                   if res.get('qty_available'):
                       res['qty_available']['string'] = _('Produced Qty')
           return res

```
5. 限制字段导出

**场景**：不允许导出敏感或内部信息。（也可以在字段定义时设置属性`exportable=False`）

```python
def _get_export_disable_fields(self):
    '''不允许导出的字段'''
    disable_fields_1 = ['field1', 'field2', 'field3']
    return disable_fields_1

@api.model
def fields_get(self, fields=None, attributes=None):
    """
        fields[name].update(exportable=False, ) 将不允许导出的字段的exportable修改为False
    """
    fields = super(hr_employee, self).fields_get(fields, attributes=attributes)
    for name in self._get_export_disable_fields():
        if name not in fields:
            continue
        fields[name].update(exportable=False, )
    return fields
```

## _check_recursion

> 检查字段循环关联，例如防止parent_id循环关联造成闭环。

```python
from odoo.exceptions import ValidationError

class modelA(models.Model):

    parent_id = fields.Many2one()

    # 函数名称可以自定义(_check_hierarchy)
    @api.constrains('parent_id')
    def _check_hierarchy(self):
         if not self._check_recursion():
             raise models.ValidationError('Error! You cannot create recursive categories.')
```

## @api.ondelete

用途：在对记录集执行`unlink`前执行的一系列校验。如果在`Model`中重写了`unlink()`，那么它只会在调用`super().unlink()`之前执行，处于`super().unlink()`之前的代码将会在`@api.ondelete`装饰的函数之前被执行。

此处不做详细说明，以下为v16源码

```python
def ondelete(*, at_uninstall):
    """
    Mark a method to be executed during :meth:`~odoo.models.BaseModel.unlink`.

    The goal of this decorator is to allow client-side errors when unlinking
    records if, from a business point of view, it does not make sense to delete
    such records. For instance, a user should not be able to delete a validated
    sales order.

    While this could be implemented by simply overriding the method ``unlink``
    on the model, it has the drawback of not being compatible with module
    uninstallation. When uninstalling the module, the override could raise user
    errors, but we shouldn't care because the module is being uninstalled, and
    thus **all** records related to the module should be removed anyway.

    This means that by overriding ``unlink``, there is a big chance that some
    tables/records may remain as leftover data from the uninstalled module. This
    leaves the database in an inconsistent state. Moreover, there is a risk of
    conflicts if the module is ever reinstalled on that database.

    Methods decorated with ``@ondelete`` should raise an error following some
    conditions, and by convention, the method should be named either
    ``_unlink_if_<condition>`` or ``_unlink_except_<not_condition>``.

    .. code-block:: python

        @api.ondelete(at_uninstall=False)
        def _unlink_if_user_inactive(self):
            if any(user.active for user in self):
                raise UserError("Can't delete an active user!")

        # same as above but with _unlink_except_* as method name
        @api.ondelete(at_uninstall=False)
        def _unlink_except_active_user(self):
            if any(user.active for user in self):
                raise UserError("Can't delete an active user!")

    :param bool at_uninstall: Whether the decorated method should be called if
        the module that implements said method is being uninstalled. Should
        almost always be ``False``, so that module uninstallation does not
        trigger those errors.

    .. danger::
        The parameter ``at_uninstall`` should only be set to ``True`` if the
        check you are implementing also applies when uninstalling the module.

        For instance, it doesn't matter if when uninstalling ``sale``, validated
        sales orders are being deleted because all data pertaining to ``sale``
        should be deleted anyway, in that case ``at_uninstall`` should be set to
        ``False``.

        However, it makes sense to prevent the removal of the default language
        if no other languages are installed, since deleting the default language
        will break a lot of basic behavior. In this case, ``at_uninstall``
        should be set to ``True``.
    """
    return attrsetter('_ondelete', at_uninstall)
```

## fields_view_get

!> 在odoo16版本已经开始弃用fields_view_get，用get_view代替。

> **Model.fields_view_get([view_id | view_type='form'])**
> 
> Get the detailed composition of the requested view like fields, model, view architecture
> 
> **Parameters**
> 
> - **view_id** (int) – id of the view or None
> - **view_type** (str) – type of the view to return if view_id is None (‘form’, ‘tree’, …)
> - **toolbar** (bool) – true to include contextual actions
> - **submenu** – deprecated
> 
> **Returns**
> 
> composition of the requested view (including inherited views and extensions)
> 
> **Return type：**dict
> 
> **Raises:**    
> 
> AttributeError –
> 
> if the inherited view has unknown position to work with other than ‘before’, ‘after’, ‘inside’, ‘replace’
> 
> if some tag other than ‘position’ is found in parent view
> 
> Invalid ArchitectureError – 
> 
> if there is view type other than form, tree, calendar, search etc defined on the structure

### 用法<!-- {docsify-ignore} -->

odoo的视图结构是以XML的格式存放于ir.ui.view表中，属于静态格式。

- 在视图加载时修改arch属性，动态修改视图的结构。
  1. 修改field的属性
  2. 根据条件限制view的操作权限(create/edit/delete)
  3. 增加field字段
  4. 增加页面内容(符合xml格式)
  5. 动态修改field的domain

修改属性

```python
from lxml import etree

@api.model
def fields_view_get(self, view_id=None, view_type='form', toolbar=False, submenu=False):
    ret_val = super(xxx, self).fields_view_get(view_id=view_id, view_type=view_type,
                                                               toolbar=toolbar, submenu=submenu)
    if self._context and self._context.get('handle_type') == 'readonly':
        doc = etree.XML(ret_val['arch'])
        for field in ret_val['fields']:
            for node in doc.xpath("//field[@name='%s']" % field):
                # 设置只读
                node.set("readonly", "1")
                modifiers = json.loads(node.get("modifiers"))
                modifiers['readonly'] = True
                node.set("modifiers", json.dumps(modifiers))
        for node in doc.xpath("//button"):
            # 设置不可见, 不修改modifiers不生效。
            node.set("invisible", "1")
            if node.get("modifiers"):
                modifiers = json.loads(node.get("modifiers"))
                modifiers['invisible'] = True
                node.set("modifiers", json.dumps(modifiers))
            else:
                modifiers = {'invisible': True}
                node.set("modifiers", json.dumps(modifiers))
        ret_val['arch'] = etree.tostring(doc, encoding='unicode')
        return ret_val
    else:
        return ret_val
```

修改视图操作权限

```python
def fields_view_get(self, view_id=None, view_type='form', toolbar=False, submenu=False):  
    res = super(xxx, self).fields_view_get(view_id=view_id, view_type=view_type, toolbar=toolbar,submenu=False)  
    if res['type']=="form":  
        id = res['id']  
        //根据id去取得资料，并进行判断  
        if 条件成立:  
            doc = etree.XML(res['arch'])  
            doc.xpath("//form")[0].set("edit","false")  
            res['arch']=etree.tostring(doc)  
    return res 
```

动态增加field

```python
@api.model
def fields_view_get(self, view_id=None, view_type='form', toolbar=False, submenu=False):
    res = super(xxx, self).fields_view_get(view_id=view_id, view_type=view_type, toolbar=toolbar,submenu=False)  
    doc = etree.XML(res['arch'])
    summary = doc.xpath("//field[@name='product_id']")
    if len(summary):
        summary = summary[0]
        summary.addnext(etree.Element('field', {'name': 'product_id', 
                                                'string':'title of new field',
                                                'nolabel':'0',
                                                }))
        # 添加子标签
        # etree.SubElement() 
    res['arch'] = etree.tostring(doc) 
    return res
```

增加page

```python
class product_product(osv.osv):
  _inherit = 'product.product'

  def fields_view_get(self, view_id=None, view_type='form', toolbar=False,submenu=False):
    """
    Changes the view dynamically
    @param self: The object pointer.
    @return: New arch of view.
    """
    ret_val = super(product_product, self).fields_view_get(view_id, view_type, toolbar,submenu)
    if view_type == 'form':
      doc = etree.XML(ret_val['arch'], parser=None, base_url=None)

      #要加入到视图里的page
      _moves_arch_lst = """
        <page string='Feature'>
        </page>
      """
      first_node = doc.xpath("//page[@string='Sales']")
      if first_node and len(first_node)>0:  
        #先把_moves_arch_lst转成XML Node，然后加到查找到node中
        feature_page = etree.XML(_moves_arch_lst)
        first_node.addnext(feature_page)            
        ret_val['arch'] = etree.tostring(doc, encoding="utf-8")
    return ret_val
```

动态修改domain

```python
"""
    Add domain 'allow_check_writting = True' on journal_id field 
    and remove 'widget = selection' on the same field 
    because the dynamic domain is not allowed on such widget
"""
if not context: 
    context = {}
res = super(account_voucher, self).fields_view_get(view_id=view_id, view_type=view_type, toolbar=toolbar, submenu=submenu)
doc = etree.XML(res['arch'])
nodes = doc.xpath("//field[@name='journal_id']")

# 检查context是否有指定的标志（write_check）
if context.get('write_check', False) :
    for node in nodes:

        # 动态修改 journal_id 这个field的domain
        node.set('domain', "[('type', '=', 'bank'), ('allow_check_writing','=',True),('your_field','=','value')]")

        # 把 widget 清空，原因在上面已经说了
        node.set('widget', '')

    res['arch'] = etree.tostring(doc)
return res
```
