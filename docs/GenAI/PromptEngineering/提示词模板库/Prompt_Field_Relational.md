---
title: Odoo OWL关系型字段组件Prompt模板
sidebar_label: Odoo OWL关系型字段组件Prompt模板
keywords:
  - AI
  - GenAI
tags: [GenAI]
unlisted: true
---

# Odoo OWL 关系型字段组件 Prompt 模板

> **适用类型**: Many2one, One2many, Many2many  
> **复杂度**: ⭐⭐⭐⭐⭐  
> **版本**: v1.0  
> **最后更新**: 2026-01-23

---

## 📖 使用说明

本模板专门用于生成**关系型字段组件**，这些字段具有以下共性：
- 复杂的关联记录管理
- 自动补全和搜索功能
- 记录创建、编辑、打开操作
- 多服务依赖（ORM、Action、Dialog等）
- 数据格式为元组或记录列表

**适用场景：**
- Many2one: 多对一关联（选择单个记录）
- One2many: 一对多关联（管理子记录列表）
- Many2many: 多对多关联（管理关联记录列表）

---

## 🎯 类型特定规范

### 必需的导入

```javascript
/** @odoo-module **/

// 1. OWL 核心
import { Component, onWillUpdateProps, useState } from "@odoo/owl";

// 2. 字段基础
import { standardFieldProps } from "@web/views/fields/standard_field_props";

// 3. 关系型字段专用工具
import { 
    Many2XAutocomplete,
    useOpenMany2XRecord 
} from "@web/views/fields/relational_utils";

// 4. 服务和Hooks
import { useService, useChildRef, useOwnedDialogs } from "@web/core/utils/hooks";

// 5. 其他工具
import { _lt } from "@web/core/l10n/translation";
import { registry } from "@web/core/registry";
import { escape, sprintf } from "@web/core/utils/strings";

// 6. 可选：对话框组件
import { Dialog } from "@web/core/dialog/dialog";
```

### Many2one 数据结构

```javascript
// Many2one 值格式: [id, display_name]
// 示例: [5, "John Doe"] 或 false

// 辅助函数
export function m2oTupleFromData(data) {
    const id = data.id;
    let name;
    if ("display_name" in data) {
        name = data.display_name;
    } else {
        const _name = data.name;
        name = Array.isArray(_name) ? _name[1] : _name;
    }
    return [id, name];
}
```

### Many2many/One2many 数据结构

```javascript
// x2many 值格式: 
// - One2many: 记录ID列表 [1, 2, 3]
// - Many2many: 记录ID列表 [1, 2, 3]

// 通过 record.data[fieldName] 访问关联记录
const relatedRecords = this.props.record.data[this.props.name];
```

### 核心服务依赖

```javascript
setup() {
    // 必需服务
    this.orm = useService("orm");           // ORM操作
    this.action = useService("action");     // 打开表单、列表等
    this.dialog = useService("dialog");     // 对话框管理
    this.notification = useService("notification");  // 通知提示
    
    // 必需的Refs和Dialogs
    this.autocompleteContainerRef = useChildRef();
    this.addDialog = useOwnedDialogs();
    
    // 状态管理
    this.state = useState({
        isFloating: !this.props.value,
        // 其他状态...
    });
}
```

### Many2one 核心模式

```javascript
setup() {
    this.orm = useService("orm");
    this.action = useService("action");
    this.autocompleteContainerRef = useChildRef();
    
    this.state = useState({
        isFloating: !this.props.value,
    });
    
    // 计算可用操作
    this.computeActiveActions(this.props);
    
    // 打开/编辑关联记录
    this.openMany2X = useOpenMany2XRecord({
        resModel: this.relation,
        activeActions: this.state.activeActions,
        isToMany: false,
        onRecordSaved: async (record) => {
            // 刷新记录显示
            const resId = this.props.value[0];
            const records = await this.orm.read(
                this.relation, 
                [resId], 
                ["display_name"]
            );
            await this.props.update(m2oTupleFromData(records[0]));
        },
        fieldString: this.props.string,
    });
    
    // 更新值的方法
    this.update = (value) => {
        if (value) {
            value = m2oTupleFromData(value[0]);
        }
        return this.props.update(value);
    };
}

get relation() {
    return this.props.record.fields[this.props.name].relation;
}
```

### 自动补全组件使用

```xml
<Many2XAutocomplete
    value="props.value"
    resModel="relation"
    fieldString="props.string"
    placeholder="props.placeholder"
    autoSelect="true"
    getDomain.bind="getDomain"
    update.bind="update"
    openRecord.bind="(id) => openMany2X.open({ resId: id })"
    setInputFloats.bind="setFloating"
    autocompleteContainer="autocompleteContainerRef.el"
/>
```

---

## 📋 Prompt 模板

````text
你是一位精通 Odoo OWL 框架的前端开发专家。请为我生成一个**关系型字段组件**。

## 组件信息

**组件名称**: 【如 CustomMany2oneField】
**技术名称**: 【如 custom_many2one_field】  
**字段类型**: [Many2one / One2many / Many2many]
**关联模型**: 【如 res.partner】
**显示名称**: 【如 "自定义客户选择"】

## 功能需求

### 核心功能

#### Many2one 功能
1. 【功能1】: 【如 自动补全搜索客户】
2. 【功能2】: 【如 点击打开客户详情】
3. 【功能3】: 【如 支持快速创建新客户】
4. 【功能4】: 【如 显示客户头像（如果有）】

#### One2many 功能
1. 【功能1】: 【如 显示订单行列表】
2. 【功能2】: 【如 内联编辑订单行】
3. 【功能3】: 【如 添加/删除订单行】
4. 【功能4】: 【如 订单行排序和分页】

#### Many2many 功能
1. 【功能1】: 【如 多选标签显示】
2. 【功能2】: 【如 标签添加/移除】
3. 【功能3】: 【如 弹窗选择多个记录】
4. 【功能4】: 【如 显示记录数量徽章】

### 搜索和过滤

#### 搜索域（Domain）
```python
# 静态域
domain = [['is_company', '=', True], ['active', '=', True]]

# 动态域（基于其他字段）
domain = [['country_id', '=', record.country_id]]
```

#### 搜索逻辑
- 搜索字段: 【如 name, email, ref】
- 最小搜索长度: 【如 2个字符】
- 最大结果数: 【如 8条】
- 搜索延迟: 【如 300ms 防抖】

### 记录操作

#### 快速创建（Quick Create）
- 是否启用: 【是/否】
- 创建表单: 【简化表单/完整表单】
- 必填字段: 【如 name, email】
- 创建成功后: 【自动选中/需要确认】

#### 打开记录（Open Record）
- 打开方式: 【弹窗/新标签页/侧边栏】
- 可编辑: 【是/否】
- 保存后行为: 【刷新显示名称】

#### 编辑记录（Edit Record）
- 是否允许编辑: 【是/否】
- 编辑方式: 【同打开记录】

### Props 配置

#### 标准Props（自动继承）
```javascript
// 通过 standardFieldProps 自动获得
- record: Object      // 当前记录
- name: String        // 字段名称
- type: String        // 字段类型（many2one/one2many/many2many）
- readonly: Boolean   // 是否只读
- value: Any         // 字段值（[id, name] 或 [ids...]）
- update: Function   // 更新回调
```

#### 自定义Props
```javascript
- placeholder: String          // 【占位符】
- domain: Array               // 【搜索域】
- context: Object             // 【上下文】
- canCreate: Boolean          // 【是否可创建】
- canQuickCreate: Boolean     // 【是否快速创建】
- canOpen: Boolean            // 【是否可打开】
- canEdit: Boolean            // 【是否可编辑】
- canDelete: Boolean          // 【是否可删除】(x2many)
- searchLimit: Number         // 【搜索结果限制】
- nameSearch: String          // 【name_search 方法】
- 【其他自定义选项】
```

#### Widget 使用示例

**Many2one**:
```xml
<field name="partner_id" 
       widget="custom_many2one_field"
       domain="[['is_company', '=', True]]"
       context="{'default_customer_rank': 1}"
       options="{
           'no_create': false,
           'no_quick_create': false,
           'no_open': false
       }"/>
```

**One2many**:
```xml
<field name="order_line" 
       widget="custom_one2many_field"
       context="{'default_product_uom_qty': 1}">
    <tree editable="bottom">
        <field name="product_id"/>
        <field name="product_uom_qty"/>
        <field name="price_unit"/>
    </tree>
</field>
```

**Many2many**:
```xml
<field name="tag_ids" 
       widget="custom_many2many_tags"
       options="{'color_field': 'color', 'no_create_edit': true}"/>
```

### 交互逻辑

#### Only读模式（Many2one）
- 显示: 【格式化的显示名称，可点击】
- 点击行为: 【打开记录详情】
- 空值显示: 【显示 placeholder 或空白】

#### 编辑模式（Many2one）
- 输入框: 【带自动补全的搜索框】
- 下拉列表: 【显示搜索结果】
- 快速创建: 【输入不存在的值时提示创建】
- 清除按钮: 【点击清空选择】

#### 列表编辑（One2many/Many2many）
- 显示方式: 【列表/卡片/看板】
- 添加记录: 【内联添加/弹窗选择】
- 编辑记录: 【内联编辑/打开表单】
- 删除记录: 【确认删除/直接删除】
- 排序: 【拖拽排序/字段排序】

### 样式需求
- Many2one 样式: 【输入框、下拉列表、选中项】
- x2many 样式: 【列表、卡片、标签】
- 只读样式: 【链接样式、禁用样式】
- 验证样式: 【必填标记、错误提示】
- 响应式: 【移动端适配】

### 特殊功能（可选）
- [ ] 条形码扫描（Many2one Barcode）
- [ ] 头像显示（Many2one Avatar）
- [ ] 颜色标签（Many2many Tags）
- [ ] 文件上传（Many2many Binary）
- [ ] 树形选择（层级关系）
- [ ] 内联创建弹窗
- [ ] 高级搜索过滤器
- [ ] 【其他】

## 技术要求

### 文件生成

请生成以下文件：

#### 1. JS 组件文件（Many2one）
**路径**: `static/src/fields/【技术名称】/【技术名称】.js`

**核心结构**:
```javascript
export class YourMany2oneField extends Component {
    setup() {
        this.orm = useService("orm");
        this.action = useService("action");
        this.autocompleteContainerRef = useChildRef();
        
        this.state = useState({ isFloating: !this.props.value });
        this.computeActiveActions(this.props);
        this.openMany2X = useOpenMany2XRecord({ ... });
        
        this.update = (value) => { ... };
        this.getDomain = () => { ... };
    }
    
    get relation() {
        return this.props.record.fields[this.props.name].relation;
    }
    
    computeActiveActions(props) {
        this.state.activeActions = {
            create: !props.canCreate === false,
            write: !props.readonly,
        };
    }
}
```

#### 2. JS 组件文件（One2many/Many2many）
**路径**: `static/src/fields/【技术名称】/【技术名称】.js`

**核心结构**:
```javascript
export class YourX2manyField extends Component {
    setup() {
        this.orm = useService("orm");
        this.action = useService("action");
        
        this.state = useState({
            records: [],
            isLoading: false,
        });
    }
    
    async loadRecords() {
        const ids = this.props.value || [];
        if (ids.length === 0) return;
        
        const records = await this.orm.read(
            this.relation,
            ids,
            this.fieldNames
        );
        this.state.records = records;
    }
    
    async onAddRecord() { ... }
    async onRemoveRecord(id) { ... }
    async onOpenRecord(id) { ... }
}
```

#### 3. XML 模板文件（Many2one）
**路径**: `static/src/fields/【技术名称】/【技术名称】.xml`

**基础结构**:
```xml
<t t-name="【模块】.YourMany2oneField" owl="1">
    <div class="o_field_many2one" t-ref="autocompleteContainerRef">
        <!-- 只读模式 -->
        <span t-if="props.readonly" 
              class="o_readonly"
              t-on-click="() => openMany2X.open({ resId: props.value[0] })">
            <t t-esc="props.value[1]"/>
        </span>
        
        <!-- 编辑模式 -->
        <Many2XAutocomplete t-else=""
            value="props.value"
            resModel="relation"
            fieldString="props.string"
            update.bind="update"
            getDomain.bind="getDomain"
            openRecord.bind="(id) => openMany2X.open({ resId: id })"
            autocompleteContainer="autocompleteContainerRef.el"
        />
    </div>
</t>
```

#### 4. XML 模板文件（One2many/Many2many）
**路径**: `static/src/fields/【技术名称】/【技术名称】.xml`

**基础结构**:
```xml
<t t-name="【模块】.YourX2manyField" owl="1">
    <div class="o_field_x2many">
        <!-- 标题和操作按钮 -->
        <div class="o_x2m_control_panel">
            <button t-if="!props.readonly" 
                    class="btn btn-sm btn-primary"
                    t-on-click="onAddRecord">
                添加记录
            </button>
        </div>
        
        <!-- 记录列表 -->
        <div class="o_x2m_list">
            <t t-foreach="state.records" t-as="record" t-key="record.id">
                <div class="o_x2m_item">
                    <!-- 记录显示和操作 -->
                </div>
            </t>
        </div>
    </div>
</t>
```

#### 5. SCSS 样式文件
**路径**: `static/src/fields/【技术名称】/【技术名称】.scss`

**样式要点**:
```scss
.o_field_【技术名称】 {
    // 基础样式
    
    // Many2one 自动补全样式
    .o_input_dropdown { ... }
    
    // x2many 列表样式
    .o_x2m_list { ... }
    .o_x2m_item { ... }
    
    // 只读模式
    &.o_readonly { ... }
    
    // 移动端适配
    @media (max-width: 768px) { ... }
}
```

#### 6. 资源注册
**路径**: `views/assets.xml`

### 参考实现

请参考以下 Odoo 标准字段实现：

**Many2one**: `@web/views/fields/many2one/many2one_field`
**One2many**: `@web/views/fields/x2many/x2many_field`
**Many2many**: `@web/views/fields/x2many/x2many_field`
**Many2many Tags**: `@web/views/fields/many2many_tags/many2many_tags_field`
**关系型工具**: `@web/views/fields/relational_utils`

### 代码规范

- [ ] 使用 `Many2XAutocomplete` 组件（Many2one）
- [ ] 实现 `useOpenMany2XRecord` hook
- [ ] 正确处理数据格式（tuple/array）
- [ ] 实现 `getDomain` 方法支持动态域
- [ ] 实现 `computeActiveActions` 控制操作权限
- [ ] 添加加载状态和错误处理
- [ ] 支持国际化
- [ ] 添加完整注释

### 使用示例

#### Python 模型定义

**Many2one**:
```python
partner_id = fields.Many2one(
    'res.partner',
    string='Customer',
    domain=[('customer_rank', '>', 0)],
    context={'default_customer_rank': 1},
    required=True
)
```

**One2many**:
```python
order_line = fields.One2many(
    'sale.order.line',
    'order_id',
    string='Order Lines'
)
```

**Many2many**:
```python
tag_ids = fields.Many2many(
    'crm.tag',
    string='Tags'
)
```

#### 视图使用

请在生成代码后提供完整的视图使用示例。

## 额外说明

【在此添加任何额外的说明、约束或特殊要求】

- Many2one 是否需要支持 `name_create`？
- One2many 是否需要内联编辑？
- Many2many 显示为标签还是列表？
- 是否需要自定义搜索字段？
- 是否需要特殊的创建/编辑表单？

## 期望输出

请生成：
1. 完整的 JavaScript 组件代码
2. 完整的 XML 模板代码
3. 完整的 SCSS 样式代码
4. assets.xml 注册代码
5. 完整的使用文档和示例
6. 数据交互说明
7. 测试建议

确保代码：
- 完全符合 Odoo 16.0+ OWL 框架规范
- 正确使用 `Many2XAutocomplete` 和相关工具
- 正确处理关系型字段的数据格式
- 实现所有必需的服务依赖
- 处理边界情况和错误
````

---

## 🎨 快速示例

### 示例1：带头像的客户选择字段

```text
**组件名称**: PartnerAvatarField
**技术名称**: partner_avatar_field
**字段类型**: Many2one
**关联模型**: res.partner
**显示名称**: "客户选择（带头像）"

核心功能:
1. 自动补全搜索客户
2. 显示客户头像
3. 支持快速创建
4. 点击打开客户详情

自定义Props:
- showAvatar: Boolean (是否显示头像)
- avatarSize: Number (头像大小)
- domain: [['customer_rank', '>', 0]]

Widget使用:
<field name="partner_id" widget="partner_avatar_field" 
       options="{'showAvatar': true, 'avatarSize': 32}"/>
```

### 示例2：可排序的订单行字段

```text
**组件名称**: SortableOrderLineField
**技术名称**: sortable_order_line_field
**字段类型**: One2many
**关联模型**: sale.order.line
**显示名称**: "可排序订单行"

核心功能:
1. 显示订单行列表
2. 拖拽排序
3. 内联编辑
4. 自动计算总额

特殊功能:
- 拖拽排序（sequence字段）
- 实时计算小计
- 产品快速选择
- 数量增减按钮

Widget使用:
<field name="order_line" widget="sortable_order_line_field">
    <tree editable="bottom">
        <field name="sequence" widget="handle"/>
        <field name="product_id"/>
        <field name="product_uom_qty"/>
        <field name="price_unit"/>
        <field name="price_subtotal"/>
    </tree>
</field>
```

---

## 📚 常见问题

### Q1: 如何自定义搜索域？

```javascript
getDomain() {
    const baseDomain = this.props.domain || [];
    // 添加动态条件
    if (this.props.record.data.country_id) {
        return [...baseDomain, ['country_id', '=', this.props.record.data.country_id[0]]];
    }
    return baseDomain;
}
```

### Q2: 如何自定义显示名称？

```javascript
async loadDisplayName(id) {
    const nameGet = await this.orm.call(
        this.relation,
        'name_get',
        [[id]],
        { context: this.props.record.getFieldContext(this.props.name) }
    );
    return nameGet[0];
}
```

### Q3: 如何实现快速创建？

```javascript
this.quickCreate = async (name) => {
    const record = await this.orm.call(
        this.relation,
        'name_create',
        [name],
        { context: this.props.record.getFieldContext(this.props.name) }
    );
    return this.props.update(record);
};
```

### Q4: 如何处理 x2many 的添加和删除？

```javascript
async onAddRecord(recordData) {
    const currentIds = this.props.value || [];
    const newRecord = await this.orm.create(this.relation, [recordData]);
    await this.props.update([...currentIds, newRecord[0]]);
}

async onRemoveRecord(id) {
    const currentIds = this.props.value || [];
    await this.props.update(currentIds.filter(rid => rid !== id));
}
```

---

## 🔗 相关资源

- [Many2one 标准实现](https://github.com/odoo/odoo/tree/16.0/addons/web/static/src/views/fields/many2one)
- [X2many 标准实现](https://github.com/odoo/odoo/tree/16.0/addons/web/static/src/views/fields/x2many)
- [Relational Utils](https://github.com/odoo/odoo/blob/16.0/addons/web/static/src/views/fields/relational_utils.js)
- [Many2XAutocomplete 组件](https://github.com/odoo/odoo/blob/16.0/addons/web/static/src/views/fields/relational_utils.js)

---

**版本历史**:
- v1.0 (2026-01-23): 初始版本
