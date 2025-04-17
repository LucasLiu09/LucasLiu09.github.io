
# write()与update()的区别

`write()` 方法：

- `write()` 方法用于更新当前<strong style="color:red">记录集</strong>中的<strong style="color:red">所有记录</strong>的字段值。
- 你可以一次性更新多个记录的多个字段。例如，如果你想要同时更新多个记录的名称和年龄，你可以使用`write()`
- `write()`属于CRUD方法之一，这个方法只适用于已经存在于数据库中的记录。如果你尝试在一个不存在于数据库中的伪记录上调用 `write()`，会出现未定义的行为。（onchange 方法返回数据库中尚不存在的伪记录）

`update()` 方法：

- `update()` 方法用于在<strong style="color:red">单个记录</strong>上更新特定字段的值。
- 它适用于单个记录，而不是整个记录集。
- 如果你需要在一个伪记录上设置字段值（即尚未在数据库中创建的记录，onchange 方法返回数据库中尚不存在的伪记录），你应该使用 update() 方法。

所以，总结一下：
- 如果你需要同时<strong style="color:red">更新多个记录</strong>的多个字段，使用 `write()`。
- 如果你只需要在<strong style="color:red">单个记录</strong>上更新特定字段，或者在<strong style="color:red">伪记录</strong>上设置字段值，使用`update()`

# get_view
可通过template动态向view插入内容。

!> （`fields_view_get`也可实现相同需求，但官方提示`fields_view_get`将丢弃，用`get_view`代替）

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

!> 以上插入子节点的操作可以改成以下处理方式更合适，将`etree.SubElement`替换成`etree.Element`然后在通过`append`插入到尾部。

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

# get_view设置record readonly(v16)

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