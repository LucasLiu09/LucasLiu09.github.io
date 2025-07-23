# ListController.js 结构分析

## 文件概述
文件路径：`C:\Code\Odoo\Demo1\addons\web\static\src\views\list\list_controller.js`

该文件是 Odoo Web 框架中列表视图控制器的核心实现，负责处理列表视图的业务逻辑、用户交互和数据管理。

## 常量、类和函数结构表

| 类型 | 名称 | 说明 |
|------|------|------|
| 类 | `ListViewHeaderButton` | 列表视图头部按钮类，继承自ViewButton |
| 方法 | `onClick` | 处理头部按钮点击事件，设置按钮上下文并触发视图按钮事件 |
| 静态属性 | `props` | 定义组件属性，继承ViewButton的props并添加list和domain |
| 类 | `ListController` | 列表视图控制器主类，继承自Component |
| 方法 | `setup` | 组件初始化方法，设置服务、模型、钩子和状态管理 |
| 方法 | `createRecord` | 创建新记录的方法，支持分组和非分组场景 |
| 方法 | `openRecord` | 打开记录的方法，支持自定义操作或默认选择记录 |
| 方法 | `onClickCreate` | 处理创建按钮点击事件 |
| 方法 | `onClickDiscard` | 处理丢弃按钮点击事件，可删除虚拟记录或丢弃更改 |
| 方法 | `onClickSave` | 处理保存按钮点击事件 |
| 方法 | `onMouseDownDiscard` | 处理丢弃按钮鼠标按下事件，用于拖拽保存场景 |
| 方法 | `onPageChangeScroll` | 处理页面变更时的滚动重置 |
| 方法 | `getSelectedResIds` | 获取所选记录的资源ID列表 |
| 方法 | `getActionMenuItems` | 获取操作菜单项配置，包括导出、归档、取消归档、删除等 |
| 方法 | `onSelectDomain` | 处理域选择事件，选择当前域下的所有记录 |
| getter | `className` | 获取组件CSS类名 |
| getter | `nbSelected` | 获取已选择记录的数量 |
| getter | `isPageSelected` | 判断当前页是否全部选中 |
| getter | `isDomainSelected` | 判断是否选择了整个域 |
| getter | `nbTotal` | 获取记录总数 |
| 方法 | `onOptionalFieldsChanged` | 处理可选字段变更事件 |
| getter | `defaultExportList` | 获取默认导出字段列表 |
| getter | `display` | 获取显示配置，针对小屏幕进行调整 |
| 方法 | `downloadExport` | 下载导出文件的方法 |
| 方法 | `getExportedFields` | 获取可导出字段列表 |
| 方法 | `onExportData` | 打开导出数据对话框 |
| 方法 | `onDirectExportData` | 直接导出数据为Excel文件 |
| 方法 | `toggleArchiveState` | 切换记录归档状态（归档/取消归档） |
| getter | `deleteConfirmationDialogProps` | 获取删除确认对话框的属性配置 |
| 方法 | `onDeleteSelectedRecords` | 处理删除所选记录事件 |
| 方法 | `discardSelection` | 取消选择所有记录 |
| 方法 | `beforeExecuteActionButton` | 执行操作按钮前的钩子方法 |
| 方法 | `afterExecuteActionButton` | 执行操作按钮后的钩子方法 |
| 静态属性 | `template` | 模板名称 |
| 静态属性 | `components` | 使用的组件列表 |
| 静态属性 | `props` | 组件属性定义 |
| 静态属性 | `defaultProps` | 默认属性值 |

## 总结

该文件包含：
- **2个类**：
  - `ListViewHeaderButton`：头部按钮组件，包含1个方法和1个静态属性
  - `ListController`：主控制器类，包含24个方法/getter和4个静态属性
- **总计31个代码结构单元**

`ListController`类是列表视图的核心控制器，负责：
- 记录的创建、编辑、保存、删除操作
- 记录选择和域选择管理
- 数据导出功能（对话框导出和直接导出）
- 归档/取消归档操作
- 分页和滚动控制
- 操作按钮的事件处理
- 视图显示状态管理

该控制器与模型、渲染器配合工作，实现了完整的列表视图功能。
