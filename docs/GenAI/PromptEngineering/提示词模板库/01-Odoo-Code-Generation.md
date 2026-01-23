---
title: 01-Odoo框架代码生成通用模板
sidebar_position: 101
sidebar_label: 01-Odoo框架代码生成通用模板
keywords:
  - AI
  - GenAI
  - Prompt
tags: [GenAI, Prompt]
---

# Odoo 框架代码生成通用 Prompt 模板

> **版本**: v1.0  
> **适用范围**: Odoo 16.0+  
> **最后更新**: 2026-01-23

---

## 📋 使用说明

将此 Prompt 模板复制后，根据具体需求填写【】内的占位符，然后提交给 AI 助手。模板分为多个场景，按需选择对应章节使用。

---

## 🎯 通用基础 Prompt

```
你是一位精通 Odoo 框架的高级开发专家。请严格遵循以下规范生成代码：

【开发场景】: [后端模型/视图开发/控制器/前端组件/完整模块/其他]
【Odoo 版本】: Odoo 16.0
【模块名称】: 【填写模块技术名称，如 custom_sales】
【功能描述】: 【详细描述要实现的功能】

## 核心要求

### 1. 代码规范
- 严格遵循 Odoo ORM、OWL、PEP8 编码规范
- 所有字符串使用翻译函数 _() 包裹
- 类名使用大驼峰（CamelCase），方法名使用蛇形（snake_case）
- 添加详细的中文注释和文档字符串
- 遵循 Odoo 的 MVC 架构模式

### 2. 安全性
- 所有用户输入必须进行验证和清理
- 使用 Odoo 的访问权限系统（ir.model.access.csv）
- 敏感操作添加记录规则（ir.rule）
- SQL 注入防护：禁止使用字符串拼接 SQL

### 3. 性能优化
- 合理使用 @api.depends 装饰器避免不必要的计算
- 批量操作使用 ORM 的批处理方法
- 避免循环中调用 search/read
- 使用 prefetch 优化关系字段访问

### 4. 兼容性
- 使用 Odoo 标准 API，避免私有方法依赖
- 考虑多公司、多语言、多币种支持
- 遵循数据库约束和索引最佳实践

### 5. 可维护性
- 模块化设计，单一职责原则
- 提供清晰的升级路径（migrations/）
- 添加完整的 manifest 描述和依赖声明
```

---

## 🏗️ 场景一：后端模型开发

```
## 模型开发需求

【模型名称】: 【如 custom.sales.order】
【继承方式】: [新建模型/_inherit 继承/_inherits 委托继承]
【表名】: 【数据库表名，如 custom_sales_order】

### 字段清单
| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| 【name】 | 【Char】 | 【名称】 | 【required=True, index=True】 |
| 【...】 | 【...】 | 【...】 | 【...】 |

### 业务逻辑
1. **计算字段**: 【描述需要哪些计算字段及计算逻辑】
2. **约束检查**: 【描述数据验证规则】
3. **默认值**: 【描述字段的默认值逻辑】
4. **状态流转**: 【如果有工作流，描述状态机】
5. **自动化动作**: 【描述需要的 onchange/create/write 钩子】

### 关联关系
- Many2one: 【关联到哪些模型】
- One2many: 【被哪些模型引用】
- Many2many: 【多对多关系描述】

### 访问权限
- 【角色组】: 【读/写/创建/删除权限】

请生成：
1. models/ 下的 Python 模型文件
2. security/ir.model.access.csv 权限文件
3. security/ir_rule.xml 记录规则（如需）
4. views/ 下的 XML 视图文件
```

---

## 🎨 场景二：视图开发

```
## 视图开发需求

【模型名称】: 【如 sale.order】
【视图类型】: [form/tree/kanban/calendar/pivot/graph/search]

### Form 视图需求
- 布局结构: 【sheet/group/notebook 布局描述】
- 状态栏: 【statusbar 字段和按钮】
- 字段分组: 【按 notebook 页签或 group 分组描述】
- 特殊组件: 【如 widget="many2many_tags"】
- 条件显示: 【attrs/invisible 逻辑】
- 按钮动作: 【需要哪些操作按钮】

### Tree 视图需求
- 显示字段: 【列表显示哪些字段】
- 装饰器: 【decoration-danger/success 等条件】
- 可编辑: 【editable="top"/editable="bottom"】
- 分组支持: 【group_by 字段】

### Search 视图需求
- 搜索字段: 【默认搜索哪些字段】
- 过滤器: 【domain 过滤器定义】
- 分组: 【group_by 选项】
- 默认过滤: 【context 中的默认过滤】

请生成完整的 XML 视图文件，包含：
- view id 定义
- arch 结构
- action 和 menu 配置（如需）
```

---

## ⚙️ 场景三：控制器开发

````text
## HTTP 控制器需求

【路由路径】: 【如 /custom/api/orders】
【请求方法】: [GET/POST/PUT/DELETE]
【认证方式】: [user/public/none]
【数据格式】: [json/http]

### 功能描述
【详细描述接口的输入输出和业务逻辑】

### 请求参数
```json
{
  "param1": "类型和说明",
  "param2": "类型和说明"
}
```


### 返回格式
```json
{
  "status": "success/error",
  "data": {},
  "message": ""
}
```


### 错误处理
- 【描述需要处理的异常情况】

请生成：
1. controllers/ 下的控制器文件
2. 完整的错误处理逻辑
3. 请求验证和权限检查
4. 日志记录
````

---

## 🎭 场景四：前端 JS 组件开发（OWL）

```
## 前端组件需求

【组件类型】: [Field Widget/View Widget/Dialog/Action/Service/其他]
【组件名称】: 【如 CustomDashboard】
【继承自】: 【如 Component/AbstractField】

### 功能描述
【详细描述组件的交互逻辑和视觉效果】

### Props 定义
- 【prop1】: 【类型和说明】
- 【prop2】: 【类型和说明】

### 状态管理
- 【描述需要响应式的数据】

### 生命周期
- setup(): 【初始化逻辑】
- onWillStart(): 【异步数据加载】
- onMounted(): 【DOM 操作】

### RPC 调用
- 【描述需要与后端交互的接口】

### 事件处理
- 【描述用户交互事件】

请生成：
1. static/src/components/ 下的 JS 文件（OWL Component）
2. 对应的 XML 模板文件
3. static/src/scss/ 下的样式文件
4. 在 assets_backend.xml 中注册资源
```

---

## 📦 场景五：完整模块脚手架

````text
## 新模块创建需求

【模块技术名】: 【如 custom_inventory】
【模块显示名】: 【如 "库存管理扩展"】
【模块分类】: [Sales/Inventory/Accounting/Human Resources/其他]
【依赖模块】: 【如 stock, sale】

### 功能模块清单
1. 【功能1】: 【描述】
2. 【功能2】: 【描述】
3. 【...】

### 数据模型
- 【模型1】: 【字段和关系】
- 【模型2】: 【字段和关系】

### 用户界面
- 【视图1】: 【类型和用途】
- 【视图2】: 【类型和用途】

### 业务流程
【用流程图或步骤描述业务逻辑】

请生成完整的模块结构：

```
custom_module/
├── __init__.py
├── __manifest__.py
├── models/
│   ├── __init__.py
│   └── *.py
├── views/
│   └── *.xml
├── security/
│   ├── ir.model.access.csv
│   └── ir_rule.xml
├── data/
│   └── *.xml
├── controllers/
│   ├── __init__.py
│   └── *.py
├── static/
│   ├── description/
│   │   ├── icon.png
│   │   └── index.html
│   └── src/
│       ├── components/
│       ├── scss/
│       └── xml/
├── wizard/
│   ├── __init__.py
│   └── *.py
├── report/
│   └── *.xml
├── i18n/
│   └── zh_CN.po
└── README.md
```

````

---

## 🔄 场景六：模块继承与扩展

```
## 模块扩展需求

【目标模块】: 【如 sale】
【目标模型】: 【如 sale.order】
【扩展方式】: [添加字段/修改方法/添加视图/修改视图]

### 新增字段
- 【字段名】: 【类型和说明】

### 方法重写
- 【方法名】: 【重写目的和逻辑】

### 视图继承
- 【视图 ID】: 【xpath 位置和修改内容】

请生成：
1. 继承模型的 Python 代码
2. 视图继承的 XML 文件（使用 xpath）
3. 必要的权限更新
4. 数据迁移脚本（如需）
```

---

## 🧪 场景七：测试代码生成

```
## 测试需求

【测试类型】: [单元测试/集成测试/UI 测试]
【测试场景】: 【描述测试的业务场景】

请生成：
1. tests/ 目录下的测试文件
2. 测试用例涵盖：
   - 正常流程测试
   - 边界条件测试
   - 异常处理测试
   - 权限控制测试
3. 使用 TransactionCase 或 SingleTransactionCase
4. 包含 setUp 和 tearDown 方法
```

---

## 🔧 场景八：数据迁移脚本

```
## 迁移需求

【迁移版本】: 【如 16.0.1.0.1】
【迁移类型】: [字段重命名/模型重构/数据转换/配置更新]
【迁移描述】: 【详细描述需要迁移的内容】

请生成：
1. migrations/16.0.1.0.1/ 目录下的迁移脚本
2. pre-migrate.py（迁移前脚本）
3. post-migrate.py（迁移后脚本）
4. end-migrate.py（迁移结束脚本）
5. 包含完整的错误处理和回滚机制
```

---

## 📊 场景九：报表开发

```
## 报表需求

【报表类型】: [QWeb PDF/QWeb HTML/Excel/自定义]
【报表名称】: 【如 "销售订单报表"】
【数据来源】: 【模型和字段】

### 报表布局
- 【页眉】: 【公司信息/logo】
- 【表头】: 【列定义】
- 【明细行】: 【字段映射】
- 【页脚】: 【合计/签名】

### 打印选项
- 纸张大小: 【A4/Letter/自定义】
- 方向: 【纵向/横向】

请生成：
1. report/ 下的 Python 报表模型
2. report/ 下的 QWeb 模板
3. 报表 action 和 menu 定义
4. 报表样式（CSS）
```

---

## 🌐 场景十：多语言与国际化

```
## 国际化需求

【目标语言】: 【zh_CN/en_US/fr_FR/其他】
【翻译范围】: 【模型字段/视图标签/错误消息/帮助文本】

请生成：
1. i18n/zh_CN.po 翻译文件
2. 确保所有字符串使用 _() 函数
3. 提供翻译模板（POT 文件）
4. 字段 string 和 help 属性的翻译
```

---

## 📝 输出格式要求

对于所有场景，请按以下格式输出：

### 1. 文件结构说明
```
【模块目录树】
```

### 2. 核心代码
```python
【Python 代码，包含详细注释】
```

```xml
【XML 代码，包含注释】
```

```javascript
【JavaScript 代码，符合 OWL 规范】
```

### 3. 使用说明
- 安装步骤
- 配置说明
- 测试方法
- 注意事项

### 4. 依赖清单
- Python 依赖（requirements.txt）
- Odoo 模块依赖（manifest.py）
- 前端依赖（package.json，如需）

---

## 🔍 代码审查清单

生成代码后，请自检以下项目：

### 功能性
- [ ] 实现了所有需求功能
- [ ] 边界条件处理完善
- [ ] 错误处理完整

### 安全性
- [ ] 权限控制正确
- [ ] 无 SQL 注入风险
- [ ] 敏感数据加密

### 性能
- [ ] 无 N+1 查询问题
- [ ] 合理使用缓存
- [ ] 数据库索引正确

### 兼容性
- [ ] 多公司支持
- [ ] 多语言支持
- [ ] 浏览器兼容（前端）

### 可维护性
- [ ] 代码结构清晰
- [ ] 注释充分
- [ ] 符合 Odoo 规范

---

## 📚 参考资源

生成代码时，请参考以下 Odoo 最佳实践：

1. **ORM API**: 使用 Odoo 的 ORM 方法（search/read/write/create/unlink）
2. **装饰器**: @api.model / @api.depends / @api.constrains / @api.onchange
3. **视图架构**: 遵循 Odoo 的 XML 视图规范
4. **前端框架**: OWL 框架的组件开发模式
5. **服务注册**: registry.category("services") 注册机制
6. **资源加载**: 在 assets_backend/frontend.xml 中正确声明资源

---

## 💡 提示词优化建议

使用本 Prompt 时，你可以：

1. **组合场景**: 同时使用多个场景章节，如"场景一+场景二"生成带视图的模型
2. **添加约束**: 在【】占位符中详细描述业务规则和技术约束
3. **提供示例**: 附上类似功能的 Odoo 标准模块作为参考
4. **分步生成**: 对于复杂模块，先生成模型，再生成视图，逐步完善
5. **迭代优化**: 生成后根据实际需求调整 Prompt 并重新生成

---

## 📋 版本历史

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| v1.0 | 2026-01-23 | 初始版本，包含10大场景模板 |

---

## 🤝 贡献与反馈

请根据实际使用情况持续优化此 Prompt 模板。建议的改进方向：

1. 添加更多垂直领域的场景（如电商/制造/财务）
2. 补充 Odoo 18 的新特性支持
3. 增加性能优化和调试的专项 Prompt
4. 添加 CI/CD 和部署相关的 Prompt

---

**使用许可**: 内部使用 | **维护者**: AI_GEN Team
