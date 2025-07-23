# ListRenderer.js 结构分析

## 文件概述
文件路径：`C:\Code\Odoo\Demo1\addons\web\static\src\views\list\list_renderer.js`

该文件是 Odoo Web 框架中列表视图渲染器的核心实现，负责渲染列表视图的所有功能。

## 常量、类和函数结构表

| 类型 | 名称 | 说明 |
|------|------|------|
| 常量 | `formatters` | 格式化器注册表，用于字段值格式化 |
| 常量 | `DEFAULT_GROUP_PAGER_COLSPAN` | 默认分组分页器列跨度，值为1 |
| 常量 | `FIELD_CLASSES` | 字段类型到CSS类名的映射对象 |
| 常量 | `FIXED_FIELD_COLUMN_WIDTHS` | 固定字段列宽度配置对象 |
| 函数 | `containsActiveElement` | 检查父元素是否包含当前活动元素 |
| 函数 | `getElementToFocus` | 获取单元格中需要聚焦的元素 |
| 类 | `ListRenderer` | 列表视图渲染器主类，继承自Component |
| 方法 | `setup` | 组件初始化方法，设置服务、状态和事件监听器 |
| 方法 | `displaySaveNotification` | 显示保存提示通知 |
| 方法 | `getActiveColumns` | 获取当前激活的列配置 |
| getter | `hasSelectors` | 判断是否显示选择器 |
| 方法 | `add` | 添加新记录的方法 |
| 方法 | `freezeColumnWidths` | 冻结列宽度以避免布局闪烁 |
| 方法 | `setDefaultColumnWidths` | 设置默认列宽度 |
| 方法 | `computeColumnWidthsFromContent` | 根据内容计算列宽度 |
| getter | `activeActions` | 获取可用的操作配置 |
| getter | `canResequenceRows` | 判断是否可以重新排序行 |
| getter | `isEmpty` | 判断列表是否为空（无记录、无分组） |
| getter | `fields` | 获取字段定义 |
| getter | `nbCols` | 计算列的总数 |
| 方法 | `canUseFormatter` | 判断是否可以使用格式化器 |
| 方法 | `focusCell` | 聚焦到指定列的单元格 |
| 方法 | `focus` | 聚焦元素并选中文本内容 |
| 方法 | `editGroupRecord` | 编辑分组记录 |
| 方法 | `createKeyOptionalFields` | 创建可选字段的唯一标识键 |
| getter | `getOptionalFields` | 获取可选字段列表 |
| getter | `displayOptionalFields` | 判断是否显示可选字段 |
| 方法 | `nbRecordsInGroup` | 计算分组中的记录数量 |
| getter | `selectAll` | 判断是否全选状态 |
| getter | `aggregates` | 计算聚合值（求和、平均值等） |
| 方法 | `formatAggregateValue` | 格式化分组的聚合值 |
| 方法 | `getGroupLevel` | 获取分组级别 |
| 方法 | `getColumnClass` | 获取列的CSS类名 |
| 方法 | `getColumns` | 获取记录对应的列 |
| 方法 | `isNumericColumn` | 判断是否为数值列 |
| 方法 | `shouldReverseHeader` | 判断是否需要反转头部显示 |
| 方法 | `isSortable` | 判断列是否可排序 |
| 方法 | `getSortableIconClass` | 获取排序图标CSS类名 |
| 方法 | `getRowClass` | 获取行的CSS类名 |
| 方法 | `getCellClass` | 获取单元格CSS类名 |
| 方法 | `getCellTitle` | 获取单元格标题属性 |
| 方法 | `getFieldClass` | 获取字段CSS类名 |
| 方法 | `getFormattedValue` | 获取格式化的字段值 |
| 方法 | `evalModifier` | 评估修饰符条件 |
| 方法 | `getGroupDisplayName` | 获取分组显示名称 |
| getter | `canCreate` | 判断是否可以创建记录 |
| getter | `isX2Many` | 判断是否为关联字段 |
| getter | `getEmptyRowIds` | 获取空行ID列表 |
| getter | `displayRowCreates` | 判断是否显示行创建功能 |
| 方法 | `getFirstAggregateIndex` | 获取第一个聚合列索引 |
| 方法 | `getLastAggregateIndex` | 获取最后一个聚合列索引 |
| 方法 | `getAggregateColumns` | 获取聚合列列表 |
| 方法 | `getGroupNameCellColSpan` | 获取分组名称单元格列跨度 |
| 方法 | `getGroupPagerCellColspan` | 获取分组分页器单元格列跨度 |
| 方法 | `getGroupPagerProps` | 获取分组分页器属性 |
| 方法 | `getOptionalActiveFields` | 获取激活的可选字段 |
| 方法 | `onClickSortColumn` | 处理列排序点击事件 |
| 方法 | `onButtonCellClicked` | 处理按钮单元格点击事件 |
| 方法 | `onCellClicked` | 处理单元格点击事件 |
| 方法 | `onDeleteRecord` | 处理记录删除事件 |
| 方法 | `findFocusFutureCell` | 查找下一个要聚焦的单元格 |
| 方法 | `isInlineEditable` | 判断记录是否支持内联编辑 |
| 方法 | `onCellKeydown` | 处理单元格键盘事件 |
| 方法 | `findNextFocusableOnRow` | 在行中查找下一个可聚焦元素 |
| 方法 | `findPreviousFocusableOnRow` | 在行中查找前一个可聚焦元素 |
| 方法 | `applyCellKeydownMultiEditMode` | 应用多编辑模式的键盘处理 |
| 方法 | `applyCellKeydownEditModeGroup` | 应用分组编辑模式的键盘处理 |
| 方法 | `applyCellKeydownEditModeStayOnRow` | 应用行内编辑模式的键盘处理 |
| 方法 | `onCellKeydownEditMode` | 处理编辑模式下的键盘事件 |
| 方法 | `onCellKeydownReadOnlyMode` | 处理只读模式下的键盘事件 |
| 方法 | `onCreateAction` | 处理创建操作 |
| 方法 | `onFocusIn` | 处理聚焦进入事件 |
| 方法 | `setDirty` | 设置脏数据状态 |
| 方法 | `saveOptionalActiveFields` | 保存激活的可选字段配置 |
| getter | `showNoContentHelper` | 判断是否显示无内容提示 |
| 方法 | `showGroupPager` | 判断是否显示分组分页器 |
| 方法 | `toggleGroup` | 切换分组折叠状态 |
| getter | `canSelectRecord` | 判断是否可以选择记录 |
| 方法 | `toggleSelection` | 切换全选状态 |
| 方法 | `toggleRecordSelection` | 切换单个记录选择状态 |
| 方法 | `toggleOptionalField` | 切换可选字段显示状态 |
| 方法 | `onGlobalClick` | 处理全局点击事件 |
| 方法 | `calculateColumnWidth` | 计算列宽度 |
| getter | `isDebugMode` | 判断是否为调试模式 |
| 方法 | `makeTooltip` | 创建字段工具提示 |
| 方法 | `onHoverSortColumn` | 处理排序列悬停事件 |
| 方法 | `onColumnTitleMouseUp` | 处理列标题鼠标释放事件 |
| 方法 | `onStartResize` | 处理列宽调整开始事件 |
| 方法 | `resetLongTouchTimer` | 重置长按计时器 |
| 方法 | `onRowTouchStart` | 处理行触摸开始事件 |
| 方法 | `onRowTouchEnd` | 处理行触摸结束事件 |
| 方法 | `onRowTouchMove` | 处理行触摸移动事件 |
| 方法 | `sortDrop` | 处理拖拽排序放置事件 |
| 方法 | `sortStart` | 处理拖拽排序开始事件 |
| 方法 | `sortStop` | 处理拖拽排序结束事件 |
| 方法 | `ignoreEventInSelectionMode` | 在选择模式下忽略事件 |
| 方法 | `onClickCapture` | 处理点击捕获事件 |
| 静态属性 | `template` | 主模板名称 |
| 静态属性 | `rowsTemplate` | 行模板名称 |
| 静态属性 | `recordRowTemplate` | 记录行模板名称 |
| 静态属性 | `groupRowTemplate` | 分组行模板名称 |
| 静态属性 | `components` | 使用的组件列表 |
| 静态属性 | `props` | 组件属性定义 |
| 静态属性 | `defaultProps` | 默认属性值 |
| 静态属性 | `LONG_TOUCH_THRESHOLD` | 长按触摸阈值常量，值为400毫秒 |

## 总结

该文件包含：
- **4个常量**：格式化器、默认值、字段类映射和固定宽度配置
- **2个独立函数**：用于元素活动状态检查和聚焦元素获取
- **1个主类**：`ListRenderer`，包含69个方法/getter和6个静态属性
- **总计80个代码结构单元**

`ListRenderer`类是一个功能完整的列表视图渲染器，支持内联编辑、排序、分组、分页、键盘导航、拖拽排序、列宽调整、记录选择等丰富功能。
