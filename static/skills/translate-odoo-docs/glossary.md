# Odoo技术术语对照表

本文档提供Odoo开发中常见技术术语的翻译处理规则。

## 使用说明

- ✓ = 必须保留英文原文
- ✗ = 可以翻译成中文
- ⚠️ = 根据上下文决定

## 核心架构术语

| 英文术语 | 保留 | 中文说明 | 使用示例 |
|---------|------|---------|----------|
| Model | ✓ | Odoo数据模型 | "定义一个新的 Model" |
| View | ✓ | 视图 | "创建 Form View" |
| Controller | ✓ | 控制器 | "HTTP Controller 处理请求" |
| ORM | ✓ | 对象关系映射 | "使用 ORM 查询数据" |
| Framework | ✗ | 框架 | "Odoo 框架提供了..." |
| Module | ✓ | 模块 | "安装 sale Module" |
| Addon | ✓ | 插件/附加组件 | "开发自定义 Addon" |

## 字段相关术语

| 英文术语 | 保留 | 中文说明 | 使用示例 |
|---------|------|---------|----------|
| Field | ✓ | 字段 | "添加一个 Char Field" |
| Char | ✓ | 字符型字段 | "`fields.Char()`" |
| Integer | ✓ | 整数型字段 | "`fields.Integer()`" |
| Float | ✓ | 浮点型字段 | "`fields.Float()`" |
| Boolean | ✓ | 布尔型字段 | "`fields.Boolean()`" |
| Date | ✓ | 日期字段 | "`fields.Date()`" |
| Datetime | ✓ | 日期时间字段 | "`fields.Datetime()`" |
| Text | ✓ | 文本字段 | "`fields.Text()`" |
| Html | ✓ | HTML字段 | "`fields.Html()`" |
| Binary | ✓ | 二进制字段 | "`fields.Binary()`" |
| Selection | ✓ | 选择型字段 | "`fields.Selection()`" |
| Many2one | ✓ | 多对一关系 | "`fields.Many2one('res.partner')`" |
| One2many | ✓ | 一对多关系 | "`fields.One2many()`" |
| Many2many | ✓ | 多对多关系 | "`fields.Many2many()`" |
| Reference | ✓ | 引用字段 | "`fields.Reference()`" |
| Computed Field | ✓ | 计算字段 | "定义 Computed Field" |
| Related Field | ✓ | 关联字段 | "使用 Related Field" |
| Sparse Field | ✓ | 稀疏字段 | "配置 Sparse Field" |

## Widget相关术语

| 英文术语 | 保留 | 中文说明 | 使用示例 |
|---------|------|---------|----------|
| Widget | ✓ | 部件/控件 | "使用 many2many_tags Widget" |
| Field Widget | ✓ | 字段部件 | "自定义 Field Widget" |
| Statusbar | ✓ | 状态栏部件 | "`widget='statusbar'`" |
| Badge | ✓ | 徽章部件 | "`widget='badge'`" |
| Handle | ✓ | 拖拽手柄 | "`widget='handle'`" |
| Progressbar | ✓ | 进度条 | "`widget='progressbar'`" |

## View类型术语

| 英文术语 | 保留 | 中文说明 | 使用示例 |
|---------|------|---------|----------|
| Form View | ✓ | 表单视图 | "配置 Form View" |
| Tree View | ✓ | 树形/列表视图 | "定义 Tree View" |
| List View | ✓ | 列表视图 | "List View 显示记录" |
| Kanban View | ✓ | 看板视图 | "创建 Kanban View" |
| Calendar View | ✓ | 日历视图 | "Calendar View 配置" |
| Gantt View | ✓ | 甘特图视图 | "Gantt View 项目管理" |
| Pivot View | ✓ | 透视表视图 | "Pivot View 数据分析" |
| Graph View | ✓ | 图表视图 | "Graph View 可视化" |
| Search View | ✓ | 搜索视图 | "自定义 Search View" |
| Activity View | ✓ | 活动视图 | "Activity View 跟踪" |

## QWeb模板术语

| 英文术语 | 保留 | 中文说明 | 使用示例 |
|---------|------|---------|----------|
| QWeb | ✓ | Odoo模板引擎 | "使用 QWeb 渲染模板" |
| Template | ✓ | 模板 | "定义 QWeb Template" |
| t-call | ✓ | 模板调用指令 | "`<t t-call='template_name'/>`" |
| t-if | ✓ | 条件指令 | "`<t t-if='condition'/>`" |
| t-foreach | ✓ | 循环指令 | "`<t t-foreach='items'/>`" |
| t-set | ✓ | 变量赋值指令 | "`<t t-set='var' t-value='value'/>`" |
| t-esc | ✓ | 转义输出指令 | "`<t t-esc='value'/>`" |
| t-raw | ✓ | 原始输出指令 | "`<t t-raw='html'/>`" |
| t-att | ✓ | 属性绑定指令 | "`<div t-att-class='className'/>`" |

## ORM操作术语

| 英文术语 | 保留 | 中文说明 | 使用示例 |
|---------|------|---------|----------|
| Record | ✓ | 记录 | "创建新 Record" |
| Recordset | ✓ | 记录集 | "返回 Recordset" |
| search() | ✓ | 搜索方法 | "`self.search([...])`" |
| create() | ✓ | 创建方法 | "`self.create({...})`" |
| write() | ✓ | 写入方法 | "`record.write({...})`" |
| unlink() | ✓ | 删除方法 | "`record.unlink()`" |
| browse() | ✓ | 浏览方法 | "`self.browse(ids)`" |
| read() | ✓ | 读取方法 | "`record.read(['field'])`" |
| ensure_one() | ✓ | 单记录检查 | "`self.ensure_one()`" |
| sudo() | ✓ | 超级用户模式 | "`record.sudo()`" |
| with_context() | ✓ | 上下文设置 | "`self.with_context(key=val)`" |
| Domain | ✓ | 搜索域 | "定义 Domain 表达式" |
| Context | ✓ | 上下文 | "传递 Context 字典" |

## 前端框架术语（Owl）

| 英文术语 | 保留 | 中文说明 | 使用示例 |
|---------|------|---------|----------|
| Owl | ✓ | Odoo Web Library | "使用 Owl 框架" |
| Component | ✓ | 组件 | "创建 Owl Component" |
| Hook | ✓ | 钩子函数 | "使用 useState Hook" |
| useState | ✓ | 状态钩子 | "`useState(initialValue)`" |
| useRef | ✓ | 引用钩子 | "`useRef('refName')`" |
| useEffect | ✓ | 副作用钩子 | "`useEffect(fn)`" |
| Props | ✓ | 属性 | "组件 Props 定义" |
| State | ✓ | 状态 | "管理组件 State" |
| Reactive | ✓ | 响应式 | "Reactive 对象" |
| Renderer | ✓ | 渲染器 | "Form Renderer 渲染表单" |
| Compiler | ✓ | 编译器 | "View Compiler 编译视图" |

## 业务逻辑术语

| 英文术语 | 保留 | 中文说明 | 使用示例 |
|---------|------|---------|----------|
| Action | ✓ | 动作 | "定义 Window Action" |
| Wizard | ✓ | 向导 | "创建配置 Wizard" |
| Report | ✓ | 报表 | "生成 PDF Report" |
| Menu | ✓ | 菜单 | "添加顶级 Menu" |
| Access Rights | ✓ | 访问权限 | "配置 Access Rights" |
| Record Rules | ✓ | 记录规则 | "定义 Record Rules" |
| Security | ✗ | 安全性 | "配置安全规则" |
| Workflow | ✗ | 工作流 | "定义工作流程" |

## 约束相关术语

| 英文术语 | 保留 | 中文说明 | 使用示例 |
|---------|------|---------|----------|
| Constraint | ✓ | 约束 | "添加字段 Constraint" |
| SQL Constraint | ✓ | SQL约束 | "`_sql_constraints`" |
| Python Constraint | ✓ | Python约束 | "`@api.constrains`" |
| Validation | ✗ | 验证 | "数据验证" |

## 继承相关术语

| 英文术语 | 保留 | 中文说明 | 使用示例 |
|---------|------|---------|----------|
| Inherit | ✓ | 继承 | "`_inherit = 'sale.order'`" |
| Inherits | ✓ | 委托继承 | "`_inherits = {'res.partner': 'partner_id'}`" |
| Extension | ✓ | 扩展 | "Model Extension" |
| Override | ✗ | 重写 | "重写方法" |
| Mixin | ✓ | 混入类 | "使用 Mail Mixin" |
| Abstract Model | ✓ | 抽象模型 | "`models.AbstractModel`" |

## 通信协议术语

| 英文术语 | 保留 | 中文说明 | 使用示例 |
|---------|------|---------|----------|
| XML-RPC | ✓ | XML远程过程调用 | "XML-RPC 接口" |
| JSON-RPC | ✓ | JSON远程过程调用 | "JSON-RPC 请求" |
| REST API | ✓ | REST接口 | "REST API 集成" |
| Route | ✓ | 路由 | "定义 HTTP Route" |
| Endpoint | ✗ | 端点 | "API 端点" |

## 邮件系统术语

| 英文术语 | 保留 | 中文说明 | 使用示例 |
|---------|------|---------|----------|
| Chatter | ✓ | 聊天组件 | "启用 Chatter" |
| Follower | ✓ | 关注者 | "添加 Follower" |
| Activity | ✓ | 活动 | "创建待办 Activity" |
| Mail Thread | ✓ | 邮件线程 | "`_inherit = ['mail.thread']`" |
| Message | ✗ | 消息 | "发送消息" |
| Notification | ✗ | 通知 | "系统通知" |

## 工作流状态术语

| 英文术语 | 保留 | 中文说明 | 使用示例 |
|---------|------|---------|----------|
| Stage | ✓ | 阶段 | "Kanban Stage" |
| State | ✓ | 状态 | "订单 State" |
| Status | ⚠️ | 状态 | 根据上下文 |
| Draft | ✗ | 草稿 | "草稿状态" |
| Confirmed | ✗ | 已确认 | "已确认状态" |
| Done | ✗ | 完成 | "完成状态" |
| Cancelled | ✗ | 已取消 | "已取消状态" |

## API装饰器术语

| 英文术语 | 保留 | 中文说明 | 使用示例 |
|---------|------|---------|----------|
| @api.depends | ✓ | 依赖装饰器 | "`@api.depends('field')`" |
| @api.onchange | ✓ | 变更装饰器 | "`@api.onchange('field')`" |
| @api.constrains | ✓ | 约束装饰器 | "`@api.constrains('field')`" |
| @api.model | ✓ | 模型装饰器 | "`@api.model`" |
| @api.returns | ✓ | 返回装饰器 | "`@api.returns('model')`" |

## 数据库相关术语

| 英文术语 | 保留 | 中文说明 | 使用示例 |
|---------|------|---------|----------|
| Database | ✗ | 数据库 | "连接数据库" |
| Table | ⚠️ | 表 | 一般翻译，指Model表时可保留 |
| Column | ⚠️ | 列 | 一般翻译，指Field时用Field |
| Index | ✗ | 索引 | "添加数据库索引" |
| Transaction | ✗ | 事务 | "数据库事务" |
| Cursor | ⚠️ | 游标 | 数据库上下文中翻译 |

## 通用编程术语

这些通用术语在非Odoo特定上下文中可以翻译：

| 英文术语 | 翻译 | 说明 |
|---------|------|------|
| function | 函数 | 通用编程概念 |
| method | 方法 | 类中的函数 |
| class | 类 | 面向对象概念 |
| object | 对象 | 实例对象 |
| parameter | 参数 | 函数参数 |
| argument | 参数 | 函数参数 |
| return | 返回 | 返回值 |
| variable | 变量 | 变量 |
| loop | 循环 | for/while循环 |
| condition | 条件 | if条件 |
| exception | 异常 | 异常处理 |
| import | 导入 | 模块导入 |

## 术语组合规则

当多个术语组合使用时：

| 组合 | 保留方式 | 示例 |
|------|---------|------|
| 术语+术语 | 全部保留 | "Form View Renderer" |
| 术语+描述 | 术语保留，描述翻译 | "Model 定义" |
| 描述+术语 | 术语保留，描述翻译 | "自定义 Widget" |

## 特殊情况处理

### 情况1：首字母缩写

首字母缩写**必须保留**：
- ORM, QWeb, XML, JSON, API, HTTP, URL, UI, UX, CSS, JS

### 情况2：Odoo特有命名

Odoo生态系统特有的命名**必须保留**：
- `res.partner`, `sale.order`, `stock.move`
- `_name`, `_inherit`, `_rec_name`
- `self.env`, `self.cr`, `self.uid`

### 情况3：Python内置

Python内置类型和关键字根据上下文：
- 代码中：保留（`str`, `int`, `dict`, `list`）
- 文档描述中：可翻译（"字符串类型"，"整数"）

## 版本相关术语

| 术语 | 保留 | 说明 |
|------|------|------|
| Odoo 16, Odoo 17 | ✓ | 版本号保留 |
| Enterprise | ✓ | 企业版保留 |
| Community | ✓ | 社区版保留 |
| SaaS | ✓ | 软件即服务 |
| On-premise | ✗ | 本地部署 |

## 快速决策流程

遇到术语时，按此顺序判断：

1. **是否在术语表中？** → 遵循术语表规则
2. **是否是Odoo特定概念？** → 保留英文
3. **是否是代码标识符？** → 保留英文
4. **是否是通用编程概念？** → 可以翻译
5. **不确定？** → 保留英文（安全选择）

## 更新记录

- 2026-02-11：初始版本创建
