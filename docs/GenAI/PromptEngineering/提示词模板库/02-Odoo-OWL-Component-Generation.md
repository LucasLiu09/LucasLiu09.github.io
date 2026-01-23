---
title: 02-Odoo OWL组件开发专用模板
sidebar_position: 102
sidebar_label: 02-Odoo OWL组件开发专用模板
keywords:
  - AI
  - GenAI
  - Prompt
tags: [GenAI, Prompt]
---

# Odoo OWL 组件开发专用 Prompt 模板

> **版本**: v1.0  
> **适用范围**: Odoo 16.0+ (OWL Framework)  
> **最后更新**: 2026-01-23  
> **框架**: Odoo Web Library (OWL) - 基于响应式编程的组件框架

---

## 📖 模板使用说明

本模板专门用于生成 Odoo 前端 OWL（Odoo Web Library）组件代码。OWL 是 Odoo 16.0+ 使用的现代化前端框架，采用响应式编程范式。

**使用方法**：
1. 根据组件类型选择对应的场景模板
2. 填写【】内的占位符
3. 将完整 Prompt 提交给 AI 助手
4. 获得符合 Odoo OWL 规范的完整代码

---

## 🎯 通用开发规范（所有场景必读）

````text
你是一位精通 Odoo OWL 框架的前端开发专家。请严格遵循以下规范生成组件代码：

## OWL 核心原则
1. **响应式编程**: 使用 reactive/useState 管理状态，自动触发重渲染
2. **组件化**: 单一职责，组件独立可复用
3. **Hook 优先**: 优先使用 Hook（useService/useBus 等）而非直接访问环境
4. **模板驱动**: 使用 XML 模板（t-name）定义视图结构
5. **生命周期管理**: 正确使用 setup/onWillStart/onMounted/onWillDestroy

## 必须遵循的编码规范
- 文件命名: snake_case.js (如 custom_dashboard.js)
- 类名: PascalCase (如 CustomDashboard)
- 方法名: camelCase (如 onButtonClick)
- 私有方法: 前缀下划线 (如 _computeTotal)
- 常量: UPPER_SNAKE_CASE (如 DEFAULT_LIMIT)
- 模板名称: 与组件类名一致的点号路径 (如 custom.CustomDashboard)

## 导入规范
```javascript
/** @odoo-module **/  // 必须在文件首行

// 1. OWL 框架导入
import { Component, useState, onWillStart, onMounted } from "@odoo/owl";

// 2. Odoo 服务导入
import { useService } from "@web/core/utils/hooks";
import { registry } from "@web/core/registry";

// 3. 其他 Odoo 组件导入
import { Dialog } from "@web/core/dialog/dialog";

// 4. 工具函数导入
import { debounce } from "@web/core/utils/timing";

// 5. 标准字段Props
import { standardFieldProps } from "@web/views/fields/standard_field_props";
```


## 模板规范
```xml
<?xml version="1.0" encoding="UTF-8"?>
<templates xml:space="preserve">
    <t t-name="module_name.ComponentName" owl="1">
        <!-- 必须有单一根元素 -->
        <div class="o_component_name">
            <!-- 内容 -->
        </div>
    </t>
</templates>
```

## 样式规范
- 使用 SCSS 编写样式
- 类名前缀: o_ (Odoo 标准) 或模块前缀
- 遵循 BEM 命名规范（可选但推荐）
- 响应式设计: 移动端优先

## 性能要求
- 避免在 render 中进行复杂计算
- 大列表使用 t-key 优化
- 防抖/节流处理高频事件
- 合理使用 t-memo 缓存子组件
````

---

## 🎨 场景一：字段组件（Field Widget）

````text
## 字段组件开发需求

【组件名称】: 【如 ProgressBarField】
【显示名称】: 【如 "进度条字段"】
【应用场景】: 【如 在表单中展示百分比进度】
【支持的字段类型】: [Integer/Float/Char/Selection/其他]

### 功能需求

#### 核心功能
- 【功能1】: 【如 显示 0-100 的数值为彩色进度条】
- 【功能2】: 【如 超过阈值显示警告色】
- 【功能3】: 【如 支持点击编辑模式】

#### Props 接收
```javascript
// 标准字段 Props (自动传入)
// 标准field props可以通过以下导入的`standardFieldProps`传入
// `import { standardFieldProps } from "@web/views/fields/standard_field_props";`
- record: Object          // 当前记录对象
- name: String            // 字段名称
- type: String            // 字段类型
- readonly: Boolean       // 是否只读
- required: Boolean       // 是否必填
- value: Any             // 字段当前值
- update: Function       // 更新字段值的回调

// 自定义 Props (通过 options 传入)
- threshold: Number      // 【自定义：阈值】
- showLabel: Boolean     // 【自定义：是否显示文本】
```

#### Widget 选项 (XML 中使用)
```xml
<field name="progress" widget="progress_bar" 
       options="{'threshold': 80, 'showLabel': true}"/>
```

#### 状态管理
- 【state1】: 【如 isEditing: Boolean - 是否处于编辑模式】
- 【state2】: 【如 tempValue: Number - 临时编辑值】

#### 交互逻辑
1. 只读模式: 【如 显示彩色进度条，颜色根据 threshold 变化】
2. 编辑模式: 【如 显示滑块或输入框，支持拖拽或输入修改】
3. 验证逻辑: 【如 值必须在 0-100 之间】

#### 样式需求
- 进度条外观: 【圆角/渐变色/动画效果等】
- 响应式布局: 【移动端显示方式】
- 主题适配: 【深色/浅色主题】

### 技术要求

请生成以下文件：

1. **JS 组件**: `static/src/fields/progress_bar_field/progress_bar_field.js`
   - 继承自 `Component` 或 `AbstractField`
   - 实现 `extractProps` 静态方法
   - 注册到字段注册表: `registry.category("fields").add("progress_bar", ProgressBarField)`

2. **XML 模板**: `static/src/fields/progress_bar_field/progress_bar_field.xml`
   - 模板名: `web.ProgressBarField`
   - 支持只读和编辑两种模式切换

3. **SCSS 样式**: `static/src/fields/progress_bar_field/progress_bar_field.scss`
   - 类名前缀: `.o_field_progress_bar`

4. **资源注册**: `views/assets.xml`
   - 在 `web.assets_backend` 中注册上述文件

### 参考实现
- 参考标准字段: `@web/views/fields/integer/integer_field`
- 参考进度条组件: `@web/core/progress_bar/progress_bar`

### 代码要求
- 添加完整的 JSDoc 注释
- 支持字段验证和错误提示
- 支持国际化（使用 _t 函数）
- 提供使用示例（XML 视图片段）
````

---

## 🧩 场景二：独立组件（Standalone Component）

````text
## 独立组件开发需求

【组件名称】: 【如 DataVisualizer】
【组件用途】: 【如 在仪表板中展示数据可视化图表】
【是否可复用】: [是/否]
【使用位置】: [表单视图/列表视图/仪表板/对话框/其他]

### 功能规格

#### 核心功能
1. 【功能描述1】: 【如 支持柱状图、折线图、饼图三种展示方式】
2. 【功能描述2】: 【如 数据实时刷新，支持时间范围过滤】
3. 【功能描述3】: 【如 点击图表元素跳转到详情记录】

#### Props 定义
```javascript
static props = {
    // 必需参数
    dataSource: { type: String, optional: false },        // 数据源模型
    chartType: { type: String, optional: false },         // 图表类型
    
    // 可选参数
    domain: { type: Array, optional: true },              // 过滤域
    groupBy: { type: String, optional: true },            // 分组字段
    measure: { type: String, optional: true },            // 度量字段
    limit: { type: Number, optional: true },              // 数据条数
    refreshInterval: { type: Number, optional: true },    // 刷新间隔(ms)
    
    // 回调函数
    onItemClick: { type: Function, optional: true },      // 点击事件
};

static defaultProps = {
    chartType: "bar",
    limit: 10,
    refreshInterval: 0,  // 0 表示不自动刷新
};
```

#### 状态管理
```javascript
setup() {
    this.state = useState({
        data: [],              // 图表数据
        isLoading: false,      // 加载状态
        error: null,           // 错误信息
        selectedItem: null,    // 选中项
    });
}
```

#### 服务依赖
- ORM Service: 【用于数据查询】
- RPC Service: 【用于自定义 API 调用】
- Notification Service: 【用于错误提示】
- Action Service: 【用于打开记录详情】

#### 生命周期
- `setup()`: 【初始化服务、状态和定时器】
- `onWillStart()`: 【首次加载数据】
- `onWillUpdateProps()`: 【Props 变化时重新加载数据】
- `onMounted()`: 【初始化第三方图表库（如 Chart.js）】
- `onWillUnmount()`: 【清理定时器和图表实例】

#### 方法实现
```javascript
// 公开方法
async loadData() { /* 加载数据逻辑 */ }
refresh() { /* 手动刷新 */ }
exportData() { /* 导出数据 */ }

// 私有方法
_formatData(rawData) { /* 格式化数据 */ }
_renderChart(data) { /* 渲染图表 */ }
_handleItemClick(item) { /* 处理点击事件 */ }
```

#### 外部依赖
- 图表库: 【Chart.js / ECharts / 其他】
- 工具库: 【moment.js / lodash / 其他】

### 模板结构
```xml
<t t-name="custom.DataVisualizer" owl="1">
    <div class="o_data_visualizer">
        <!-- 头部工具栏 -->
        <div class="o_visualizer_header">
            <div class="o_title">【标题区】</div>
            <div class="o_controls">
                <button t-on-click="refresh">刷新</button>
                <button t-on-click="exportData">导出</button>
            </div>
        </div>
        
        <!-- 加载指示器 -->
        <div t-if="state.isLoading" class="o_loading">
            Loading...
        </div>
        
        <!-- 错误提示 -->
        <div t-elif="state.error" class="o_error">
            <t t-esc="state.error"/>
        </div>
        
        <!-- 图表内容 -->
        <div t-else class="o_chart_container" t-ref="chartContainer">
            <!-- 图表将通过 JS 渲染到这里 -->
        </div>
    </div>
</t>
```

### 样式需求
- 响应式布局: 【适配手机/平板/桌面】
- 主题支持: 【跟随 Odoo 主题颜色】
- 动画效果: 【数据更新时的过渡动画】

### 使用示例
```xml
<!-- 在视图中使用 -->
<t t-component="DataVisualizer"
   dataSource="'sale.order'"
   chartType="'bar'"
   domain="[['state', '=', 'sale']]"
   groupBy="'team_id'"
   measure="'amount_total'"
   onItemClick.bind="onChartClick"/>
```

请生成：
1. 完整的 JS 组件文件
2. XML 模板文件
3. SCSS 样式文件
4. 使用文档和示例
5. 单元测试文件（可选）
````

---

## 🪟 场景三：对话框组件（Dialog）

````text
## 对话框组件需求

【对话框类型】: [确认对话框/表单对话框/选择对话框/自定义对话框]
【对话框名称】: 【如 BatchEditDialog】
【触发方式】: [按钮点击/动作触发/服务调用]

### 功能需求

#### 对话框配置
- 标题: 【如 "批量编辑记录"】
- 尺寸: [extra-large/large/medium/small]
- 是否模态: [是/否]
- 关闭按钮: [显示/隐藏]
- 背景遮罩: [允许点击关闭/禁止点击关闭]

#### Props 定义
```javascript
static props = {
    // 数据相关
    records: { type: Array, optional: false },      // 要编辑的记录列表
    fields: { type: Array, optional: false },       // 可编辑的字段列表
    model: { type: String, optional: false },       // 模型名称
    
    // 回调函数
    onSave: { type: Function, optional: false },    // 保存回调
    close: { type: Function, optional: false },     // 关闭回调
    
    // 可选配置
    title: { type: String, optional: true },
    readonly: { type: Boolean, optional: true },
};
```

#### 对话框内容
1. 表单区域:
   - 【字段1】: 【类型和用途】
   - 【字段2】: 【类型和用途】
   
2. 数据展示区域:
   - 【如 显示选中的 N 条记录列表】
   
3. 验证逻辑:
   - 【必填字段检查】
   - 【数据格式验证】
   - 【业务规则校验】

#### 按钮定义
```javascript
// 底部按钮配置
static buttons = [
    {
        text: _t("保存"),
        classes: "btn-primary",
        click: "onSave",
        close: true,
    },
    {
        text: _t("取消"),
        classes: "btn-secondary",
        click: "onDiscard",
        close: true,
    },
];
```

#### 状态管理
```javascript
this.state = useState({
    formData: {},           // 表单数据
    errors: {},             // 验证错误
    isSaving: false,        // 保存中状态
    isDirty: false,         // 是否有修改
});
```

#### 业务逻辑

##### 打开对话框
```javascript
// 从外部调用
import { MyDialog } from "./my_dialog";

this.dialogService.add(MyDialog, {
    records: selectedRecords,
    fields: editableFields,
    model: "sale.order",
    onSave: async (data) => {
        await this.orm.write("sale.order", selectedIds, data);
    },
});
```

##### 数据处理
- 初始化: 【从 props.records 加载初始数据】
- 验证: 【实时验证或提交时验证】
- 保存: 【调用 ORM 或 RPC 保存到后端】
- 关闭: 【确认是否有未保存修改】

#### 交互体验
- 加载状态: 【显示 Spinner】
- 保存中状态: 【禁用按钮，显示保存中】
- 成功提示: 【保存成功后显示通知】
- 错误处理: 【显示错误信息，不关闭对话框】

### 模板结构
```xml
<t t-name="custom.BatchEditDialog" owl="1">
    <Dialog title="props.title" size="'large'">
        <div class="o_batch_edit_dialog">
            <!-- 记录信息 -->
            <div class="o_records_info">
                <span>已选择 <t t-esc="props.records.length"/> 条记录</span>
            </div>
            
            <!-- 表单字段 -->
            <div class="o_form_fields">
                <t t-foreach="props.fields" t-as="field" t-key="field.name">
                    <div class="o_field_wrapper">
                        <label t-esc="field.string"/>
                        <!-- 根据字段类型渲染不同组件 -->
                        <t t-component="getFieldComponent(field)"
                           value="state.formData[field.name]"
                           onChange.bind="(value) => this.onFieldChange(field.name, value)"/>
                    </div>
                </t>
            </div>
            
            <!-- 错误提示 -->
            <div t-if="state.errors" class="alert alert-danger">
                <t t-esc="state.errors"/>
            </div>
        </div>
        
        <!-- 底部按钮 -->
        <t t-set-slot="footer">
            <button class="btn btn-secondary" t-on-click="onDiscard">
                取消
            </button>
            <button class="btn btn-primary" 
                    t-on-click="onSave"
                    t-att-disabled="state.isSaving">
                <t t-if="state.isSaving">
                    <i class="fa fa-spinner fa-spin"/> 保存中...
                </t>
                <t t-else>保存</t>
            </button>
        </t>
    </Dialog>
</t>
```

### 继承方式
```javascript
// 方式1: 继承标准 Dialog
import { Dialog } from "@web/core/dialog/dialog";

export class BatchEditDialog extends Component {
    static template = "custom.BatchEditDialog";
    static components = { Dialog };
    // ...
}

// 方式2: 使用 Dialog Service
this.dialog = useService("dialog");
```

请生成：
1. 对话框组件完整代码
2. 使用示例（如何从视图或动作中打开）
3. 样式文件
4. 处理键盘快捷键（ESC 关闭、Enter 保存）
````

---

## ⚡ 场景四：服务（Service）

````text
## 服务开发需求

【服务名称】: 【如 customNotification】
【服务用途】: 【如 增强的通知系统，支持更多样式和交互】
【服务类型】: [全局单例/可重复实例]
【依赖服务】: 【如 rpc, notification, user】

### 服务功能

#### 核心功能
1. 【功能1】: 【如 显示成功/警告/错误/信息通知】
2. 【功能2】: 【如 支持持久化通知，需要手动关闭】
3. 【功能3】: 【如 支持带操作按钮的通知】

#### 服务 API
```javascript
// 服务接口定义
export const customNotificationService = {
    // 服务依赖
    dependencies: ["notification", "rpc", "orm"],
    
    // 服务启动函数
    start(env, { notification, rpc, orm }) {
        return {
            // 基础通知方法
            success(message, options = {}) { },
            warning(message, options = {}) { },
            error(message, options = {}) { },
            info(message, options = {}) { },
            
            // 高级通知方法
            confirm(message, onConfirm, onCancel) { },
            progress(message, promise) { },
            sticky(message, actions) { },
            
            // 管理方法
            close(notificationId) { },
            closeAll() { },
        };
    },
};
```

#### 使用示例
```javascript
// 在组件中使用
import { useService } from "@web/core/utils/hooks";

setup() {
    this.customNotification = useService("customNotification");
}

async saveData() {
    try {
        await this.orm.write(/*...*/);
        this.customNotification.success("保存成功！");
    } catch (error) {
        this.customNotification.error("保存失败：" + error.message);
    }
}

deleteRecords() {
    this.customNotification.confirm(
        "确定要删除这些记录吗？",
        async () => {
            await this.orm.unlink(/*...*/);
            this.customNotification.success("删除成功");
        },
        () => {
            this.customNotification.info("已取消删除");
        }
    );
}
```

#### 配置选项
```javascript
const options = {
    duration: 3000,           // 显示时长(ms)，0 为持久化
    type: "success",          // success/warning/error/info
    sticky: false,            // 是否持久化显示
    className: "",            // 自定义 CSS 类
    buttons: [                // 操作按钮
        {
            name: "查看详情",
            onClick: () => { },
        },
    ],
    onClose: () => { },       // 关闭回调
};
```

#### 内部状态
```javascript
// 服务内部管理的状态
const state = reactive({
    notifications: [],        // 当前显示的通知列表
    nextId: 1,               // 通知ID计数器
});
```

### 服务注册
```javascript
import { registry } from "@web/core/registry";

const serviceRegistry = registry.category("services");
serviceRegistry.add("customNotification", customNotificationService);
```

### 组件支持
如果服务需要UI组件支持：

```javascript
// 通知容器组件
export class CustomNotificationContainer extends Component {
    static template = "custom.NotificationContainer";
    
    setup() {
        this.state = useState({ notifications: [] });
        this.notificationService = useService("customNotification");
    }
}

// 在主应用中挂载
import { MainComponentsContainer } from "@web/core/main_components_container";
MainComponentsContainer.components = {
    ...MainComponentsContainer.components,
    CustomNotificationContainer,
};
```

### 技术要求
1. 服务必须是无状态的或使用 reactive 管理状态
2. 避免内存泄漏，及时清理定时器和事件监听
3. 提供完整的 TypeScript 类型定义（可选）
4. 添加单元测试

请生成：
1. 服务实现代码
2. 配套的 UI 组件（如需）
3. 使用文档和示例
4. 注册代码
````

---

## 🔌 场景五：钩子函数（Custom Hook）

````text
## 自定义 Hook 需求

【Hook 名称】: 【如 useDebounce】
【Hook 用途】: 【如 对状态变化进行防抖处理】
【适用场景】: 【如 搜索框输入、窗口 resize 等】

### Hook 功能

#### 参数定义
```javascript
/**
 * 防抖 Hook
 * @param {Function} callback - 要防抖的回调函数
 * @param {Number} delay - 延迟时间(ms)
 * @param {Object} options - 可选配置
 * @returns {Function} - 防抖后的函数
 */
export function useDebounce(callback, delay = 300, options = {}) {
    // Hook 实现
}
```

#### 返回值
```javascript
// 返回值示例
return {
    debouncedFn,      // 防抖后的函数
    cancel,           // 取消执行
    flush,            // 立即执行
};
```

#### 使用示例
```javascript
import { useDebounce } from "@custom/hooks";

setup() {
    const searchOrders = async (keyword) => {
        const orders = await this.orm.searchRead(/*...*/);
        this.state.orders = orders;
    };
    
    // 使用 Hook
    this.debouncedSearch = useDebounce(searchOrders, 500);
}

onSearchInput(event) {
    const keyword = event.target.value;
    this.debouncedSearch(keyword);
}
```

#### 内部实现要点
- 使用 `useEffect` 或 `onWillUnmount` 清理
- 考虑组件卸载时的清理逻辑
- 支持依赖项变化时重新创建

### 其他常用 Hook 示例

#### 1. useLocalStorage
```javascript
// 持久化状态到 localStorage
const [value, setValue] = useLocalStorage('myKey', defaultValue);
```

#### 2. useAsync
```javascript
// 处理异步操作的加载/错误状态
const { data, loading, error, execute } = useAsync(asyncFunction);
```

#### 3. useInterval
```javascript
// 安全的定时器 Hook
useInterval(() => {
    // 每秒执行
}, 1000);
```

#### 4. useClickOutside
```javascript
// 检测外部点击
const ref = useRef("container");
useClickOutside(ref, () => {
    console.log("Clicked outside");
});
```

请生成：
1. Hook 函数实现
2. 完整的 JSDoc 文档
3. 使用示例（至少3个场景）
4. 边界条件处理
5. 单元测试
````

---

## 🎬 场景六：动作（Client Action）

````text
## 客户端动作需求

【动作名称】: 【如 custom_dashboard】
【动作类型】: [全屏应用/侧边栏/弹窗]
【访问路径】: 【如 /web#action=custom_dashboard】

### 动作配置

#### 后端动作定义（XML）
```xml
<record id="action_custom_dashboard" model="ir.actions.client">
    <field name="name">Custom Dashboard</field>
    <field name="tag">custom_dashboard</field>
    <field name="target">main</field>  <!-- main/new/fullscreen -->
    <field name="context">{
        'default_period': 'month',
        'show_filters': True,
    }</field>
</record>

<menuitem id="menu_custom_dashboard"
          name="Dashboard"
          action="action_custom_dashboard"
          parent="base.menu_reporting"
          sequence="10"/>
```

#### 前端动作组件
```javascript
/** @odoo-module **/
import { Component } from "@odoo/owl";
import { registry } from "@web/core/registry";
import { useService } from "@web/core/utils/hooks";

export class CustomDashboard extends Component {
    static template = "custom.Dashboard";
    
    setup() {
        // 获取动作信息
        this.actionService = useService("action");
        const action = this.env.services.action.currentController.action;
        this.context = action.context || {};
        
        // 其他服务
        this.orm = useService("orm");
        this.notification = useService("notification");
        
        // 状态
        this.state = useState({
            period: this.context.default_period || "month",
            data: {},
            isLoading: true,
        });
        
        onWillStart(async () => {
            await this.loadData();
        });
    }
    
    async loadData() {
        // 加载仪表板数据
    }
}

// 注册动作
registry.category("actions").add("custom_dashboard", CustomDashboard);
```

### 功能需求

#### 页面布局
- 顶部: 【标题、刷新按钮、时间范围选择器】
- 主体: 【多个数据卡片、图表、列表】
- 侧边栏: 【过滤器、快捷操作】

#### 数据源
- 【数据源1】: 【模型和统计逻辑】
- 【数据源2】: 【模型和统计逻辑】

#### 交互功能
1. 时间范围切换: 【今天/本周/本月/本季度/本年/自定义】
2. 数据过滤: 【按部门/按用户/按状态等】
3. 钻取功能: 【点击卡片打开详细列表】
4. 数据导出: 【导出 Excel/PDF】

#### 权限控制
```javascript
// 根据用户权限显示不同内容
setup() {
    this.user = useService("user");
    
    if (this.user.isAdmin) {
        // 显示管理员视图
    } else {
        // 显示普通用户视图
    }
}
```

### 与后端交互

#### 自定义 RPC 方法
```python
# Python 后端
class CustomDashboard(models.Model):
    _name = 'custom.dashboard'
    
    @api.model
    def get_dashboard_data(self, period='month'):
        """获取仪表板数据"""
        return {
            'sales': self._compute_sales(period),
            'orders': self._compute_orders(period),
            'customers': self._compute_customers(period),
        }
```

```javascript
// JS 前端调用
async loadData() {
    this.state.isLoading = true;
    try {
        const data = await this.orm.call(
            "custom.dashboard",
            "get_dashboard_data",
            [this.state.period]
        );
        this.state.data = data;
    } catch (error) {
        this.notification.add(error.message, { type: "danger" });
    } finally {
        this.state.isLoading = false;
    }
}
```

### 路由和面包屑
```javascript
// 更新浏览器 URL
this.actionService.doAction({
    type: 'ir.actions.client',
    tag: 'custom_dashboard',
    name: 'Dashboard',
    params: { period: 'month' },
});

// 设置面包屑
return {
    type: 'ir.actions.client',
    tag: 'custom_dashboard',
    display_name: 'Custom Dashboard',
};
```

请生成：
1. 完整的前端动作组件
2. 后端动作定义 XML
3. 后端数据提供方法（Python）
4. 菜单配置
5. 权限配置（security/ir.model.access.csv）
````

---

## 🎪 场景七：视图扩展（View Widget）

````text
## 视图组件扩展需求

【目标视图】: [Form/List/Kanban/Calendar/Pivot/Graph]
【组件名称】: 【如 CustomStatusBar】
【插入位置】: 【如 表单状态栏、列表表头、看板卡片等】

### 扩展方式

#### 方式1: 注册新 Widget 在视图中使用
```xml
<!-- 在视图 XML 中使用 -->
<widget name="custom_status_bar" options="{'show_history': true}"/>
```

```javascript
// JS 注册
import { registry } from "@web/core/registry";

export class CustomStatusBar extends Component {
    static template = "custom.CustomStatusBar";
    static props = {
        record: { type: Object },
        options: { type: Object, optional: true },
    };
}

registry.category("view_widgets").add("custom_status_bar", CustomStatusBar);
```

#### 方式2: 继承并扩展现有视图
```javascript
import { ListRenderer } from "@web/views/list/list_renderer";
import { patch } from "@web/core/utils/patch";

patch(ListRenderer.prototype, "custom_list_extension", {
    // 扩展方法
    getRowClass(record) {
        const classes = this._super(...arguments);
        if (record.data.is_urgent) {
            classes += " o_row_urgent";
        }
        return classes;
    },
});
```

### 功能需求

#### Widget Props
```javascript
static props = {
    record: Object,           // 当前记录
    readonly: Boolean,        // 是否只读
    options: Object,          // 自定义选项
    update: Function,         // 更新记录方法
};
```

#### 交互逻辑
- 【描述组件的具体交互】
- 【与记录数据的关联】
- 【如何触发更新】

#### 样式集成
- 遵循 Odoo 设计规范
- 支持主题颜色
- 响应式布局

### 使用示例
```xml
<record id="view_sale_order_form_custom" model="ir.ui.view">
    <field name="name">sale.order.form.custom</field>
    <field name="model">sale.order</field>
    <field name="inherit_id" ref="sale.view_order_form"/>
    <field name="arch" type="xml">
        <xpath expr="//sheet" position="before">
            <widget name="custom_status_bar" 
                    options="{'show_history': true, 'allow_edit': true}"/>
        </xpath>
    </field>
</record>
```

请生成：
1. Widget 组件完整代码
2. 注册代码
3. 视图集成示例（XML）
4. 样式文件
````

---

## 🧪 场景八：测试代码

````text
## 组件测试需求

【测试组件】: 【组件名称】
【测试类型】: [单元测试/集成测试/E2E测试]
【测试框架】: QUnit + @odoo/hoot

### 测试用例

#### 测试环境设置
```javascript
/** @odoo-module **/
import { describe, test, expect } from "@odoo/hoot";
import { mount, getFixture } from "@odoo/hoot-dom";
import { MyComponent } from "@custom/components/my_component";

describe("MyComponent", () => {
    test("基本渲染", async () => {
        await mount(MyComponent, getFixture(), {
            props: { /* props */ },
        });
        
        expect(".o_my_component").toHaveCount(1);
        expect(".o_title").toHaveText("Expected Title");
    });
});
```

#### 测试场景清单
1. 【场景1】: 【如 组件正常渲染】
2. 【场景2】: 【如 Props 变化时正确更新】
3. 【场景3】: 【如 用户交互触发正确的事件】
4. 【场景4】: 【如 异步数据加载和错误处理】
5. 【场景5】: 【如 生命周期钩子正确执行】

#### Mock 服务
```javascript
import { makeMockEnv } from "@web/../tests/helpers/mock_env";
import { mockService } from "@web/../tests/helpers/mock_services";

test("使用 ORM 服务", async () => {
    const mockORM = {
        call: (model, method, args) => {
            if (method === "search_read") {
                return [{ id: 1, name: "Test" }];
            }
        },
    };
    
    mockService("orm", mockORM);
    
    await mount(MyComponent, getFixture());
    // 断言...
});
```

### 测试要求
- 覆盖率 > 80%
- 测试正常流程和异常流程
- 测试边界条件
- 添加清晰的测试说明

请生成：
1. 完整的测试文件
2. Mock 数据和服务
3. 测试文档
````

---

## 📋 代码生成检查清单

生成 OWL 组件代码后，请确保包含以下内容：

### ✅ 必需项
- [ ] 文件首行包含 `/** @odoo-module **/`
- [ ] 正确的 import 语句
- [ ] 组件类定义和导出
- [ ] `static template` 定义
- [ ] `static props` 定义（如有 props）
- [ ] XML 模板文件
- [ ] 注册到相应的 registry
- [ ] 资源在 assets.xml 中声明

### ✅ 代码质量
- [ ] 完整的 JSDoc 注释
- [ ] 变量命名符合规范
- [ ] 正确使用 Hook（useService/useState 等）
- [ ] 生命周期钩子使用正确
- [ ] 错误处理完善

### ✅ 功能性
- [ ] 响应式状态管理
- [ ] 正确的事件处理
- [ ] RPC 调用正确
- [ ] 国际化支持（_t 函数）

### ✅ 性能
- [ ] 避免不必要的重渲染
- [ ] 大列表使用 t-key
- [ ] 防抖/节流（如适用）
- [ ] 清理定时器和事件监听

### ✅ 可维护性
- [ ] 代码结构清晰
- [ ] 注释充分
- [ ] 提供使用示例
- [ ] 包含测试（可选但推荐）

---

## 📚 OWL 框架参考

### 核心 API

```javascript
// 组件基类
import { Component } from "@odoo/owl";

// 响应式
import { useState, reactive } from "@odoo/owl";

// 生命周期
import { 
    onWillStart, 
    onMounted, 
    onWillUpdateProps,
    onWillUnmount 
} from "@odoo/owl";

// Hook
import { useService } from "@web/core/utils/hooks";
import { useRef } from "@odoo/owl";

// 工具
import { registry } from "@web/core/registry";
import { patch } from "@web/core/utils/patch";
```

### 常用服务

```javascript
this.orm = useService("orm");              // ORM 操作
this.rpc = useService("rpc");              // RPC 调用
this.action = useService("action");        // 动作服务
this.dialog = useService("dialog");        // 对话框服务
this.notification = useService("notification");  // 通知服务
this.user = useService("user");            // 用户信息
this.router = useService("router");        // 路由服务
```

### 模板语法

```xml
<!-- 条件渲染 -->
<t t-if="condition">...</t>
<t t-elif="condition">...</t>
<t t-else="">...</t>

<!-- 循环 -->
<t t-foreach="items" t-as="item" t-key="item.id">
    <t t-esc="item.name"/>
</t>

<!-- 组件 -->
<t t-component="MyComponent" 
   prop1="value1"
   prop2.bind="state.value"/>

<!-- 事件 -->
<button t-on-click="onClick">Click</button>
<input t-on-change="onChange" t-model="state.value"/>

<!-- 引用 -->
<div t-ref="myDiv">...</div>

<!-- 插槽 -->
<t t-slot="header">Header Content</t>
```

---

## 💡 最佳实践

### 1. 状态管理

```javascript
// 使用 useState 包裹对象
this.state = useState({
    data: [],
    isLoading: false,
});

// 更新状态（自动触发重渲染）
this.state.data.push(newItem);
this.state.isLoading = true;
```

### 2. 服务注入

```javascript
// 推荐：使用 Hook
setup() {
    this.orm = useService("orm");
}

// 不推荐：直接访问 env
setup() {
    this.orm = this.env.services.orm;  // ❌ 避免
}
```

### 3. 异步操作

```javascript
// 在 onWillStart 中加载数据
onWillStart(async () => {
    this.state.data = await this.loadData();
});

// 避免在 setup 中直接 await
setup() {
    // ❌ 不要这样做
    // const data = await this.loadData();
}
```

### 4. 清理资源

```javascript
setup() {
    this.intervalId = setInterval(() => { }, 1000);
    
    onWillUnmount(() => {
        clearInterval(this.intervalId);
    });
}
```

### 5. 性能优化

```xml
<!-- 使用 t-key 优化列表 -->
<t t-foreach="state.items" t-as="item" t-key="item.id">
    <div t-esc="item.name"/>
</t>

<!-- 使用 t-memo 缓存子组件 -->
<t t-component="ExpensiveComponent" 
   t-memo="state.memoKey"
   prop="state.value"/>
```

---

## 🔗 相关资源

- [Odoo OWL 官方文档](https://github.com/odoo/owl)
- [Odoo 16.0 开发文档](https://www.odoo.com/documentation/16.0/developer.html)
- [Odoo JS 框架指南](https://www.odoo.com/documentation/16.0/developer/reference/frontend/framework_overview.html)

---

**维护者**: AI_GEN Team  
**版本**: v1.0  
**最后更新**: 2026-01-23
