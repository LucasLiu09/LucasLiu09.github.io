# FormController.js 结构分析

## 文件概述
文件路径：`C:\Code\Odoo\Demo1\addons\web\static\src\views\form\form_controller.js`

该文件是 Odoo Web 框架中表单视图控制器的核心实现，负责处理表单视图的业务逻辑、用户交互、数据管理和生命周期控制。

## 常量、类和函数结构表

| 类型 | 名称 | 说明 |
|------|------|------|
| 常量 | `viewRegistry` | 视图注册表，从registry获取views分类 |
| 函数 | `loadSubViews` | 异步函数，加载X2Many字段的子视图配置 |
| 类 | `FormController` | 表单视图控制器主类，继承自Component |
| 方法 | `setup` | 组件初始化方法，设置服务、状态、模型和各种钩子 |
| 方法 | `displayName` | 获取记录显示名称，新记录返回"New" |
| 方法 | `onPagerUpdate` | 处理分页器更新事件，保存当前记录后切换到指定记录 |
| 方法 | `beforeLeave` | 离开视图前的钩子，保存未保存的更改 |
| 方法 | `beforeUnload` | 页面卸载前的钩子，执行紧急保存 |
| 方法 | `updateURL` | 更新浏览器URL，反映当前记录ID |
| 方法 | `getActionMenuItems` | 获取操作菜单项，包括归档、复制、删除等操作 |
| 方法 | `shouldExecuteAction` | 判断是否应该执行操作，决定是否需要先保存 |
| 方法 | `duplicateRecord` | 复制当前记录 |
| getter | `deleteConfirmationDialogProps` | 获取删除确认对话框的属性配置 |
| 方法 | `deleteRecord` | 删除记录，显示确认对话框 |
| 方法 | `disableButtons` | 禁用按钮，防止重复操作 |
| 方法 | `enableButtons` | 启用按钮 |
| 方法 | `setFieldAsDirty` | 设置字段脏数据状态 |
| 方法 | `beforeExecuteActionButton` | 执行操作按钮前的钩子，处理保存和丢弃逻辑 |
| 方法 | `afterExecuteActionButton` | 执行操作按钮后的钩子，空实现供子类重写 |
| 方法 | `edit` | 切换记录到编辑模式 |
| 方法 | `create` | 创建新记录，保存当前记录后加载空记录 |
| 方法 | `saveButtonClicked` | 处理保存按钮点击事件 |
| 方法 | `discard` | 丢弃记录更改，恢复到保存状态 |
| getter | `className` | 获取控制器CSS类名，根据屏幕尺寸和环境调整 |
| 静态属性 | `template` | 组件模板名称 |
| 静态属性 | `components` | 使用的组件列表 |
| 静态属性 | `props` | 组件属性定义 |
| 静态属性 | `defaultProps` | 默认属性值 |

## 核心逻辑详细解释

### 1. 子视图加载机制 (`loadSubViews` 函数)

这是一个关键的异步函数，负责加载表单中X2Many字段（One2many、Many2many）的子视图：

```javascript
// 核心流程：
1. 遍历所有激活字段，筛选出X2Many字段
2. 跳过不可见或不需要子视图的字段
3. 确定子视图类型（list或kanban），在小屏幕上优先使用kanban
4. 从字段上下文中提取view_ref配置
5. 过滤掉通用上下文中的view_ref键，防止冲突
6. 调用viewService.loadViews加载子视图架构
7. 使用ArchParser解析架构并存储到fieldInfo.views中
```

**核心价值**：
- **延迟加载**：只加载需要的子视图，提高性能
- **上下文隔离**：为子视图提供独立的上下文环境
- **权限控制**：通过base_model_name防止父视图权限影响子视图

### 2. 组件初始化 (`setup` 方法)

这是整个控制器的核心初始化逻辑：

#### 服务注入与状态管理
```javascript
// 注入核心服务
this.dialogService = useService("dialog");
this.router = useService("router");
this.user = useService("user");
this.viewService = useService("view");
this.ui = useService("ui");

// 状态管理
this.state = useState({
    isDisabled: false,    // 按钮禁用状态
    fieldIsDirty: false,  // 字段脏数据状态
});
```

#### 权限控制
```javascript
const { create, edit } = this.archInfo.activeActions;
this.canCreate = create && !this.props.preventCreate;
this.canEdit = edit && !this.props.preventEdit;

let mode = this.props.mode || "edit";
if (!this.canEdit) {
    mode = "readonly";  // 无编辑权限时强制只读模式
}
```

#### 模型初始化
```javascript
this.model = useModel(this.props.Model, {
    resModel: this.props.resModel,
    resId: this.props.resId || false,
    resIds: this.props.resIds,
    fields: this.props.fields,
    activeFields,
    viewMode: "form",
    rootType: "record",
    mode,
    beforeLoadProm,  // 确保子视图加载完成后再加载主记录
    component: this,
});
```

#### Footer处理
```javascript
// 提取footer元素到单独的架构中，用于对话框显示
const footers = [...this.archInfo.xmlDoc.querySelectorAll("footer:not(field footer)")];
if (footers.length) {
    this.footerArchInfo = Object.assign({}, this.archInfo);
    this.footerArchInfo.xmlDoc = createElement("t");
    this.footerArchInfo.xmlDoc.append(...footers);
}
```

### 3. 生命周期管理

#### 页面离开处理
```javascript
useSetupView({
    beforeLeave: () => this.beforeLeave(),      // 保存未保存的更改
    beforeUnload: (ev) => this.beforeUnload(ev), // 紧急保存
    getLocalState: () => ({
        activeNotebookPages: !this.model.root.isNew && activeNotebookPages,
        resId: this.model.root.resId,
    }),
});
```

**beforeLeave逻辑**：
- 检查记录是否有未保存的更改
- 如果有，执行保存操作
- 使用stayInEdition保持编辑模式
- 显示保存错误对话框

**beforeUnload逻辑**：
- 执行紧急保存（urgentSave）
- 如果保存失败，阻止页面卸载
- 显示浏览器原生的离开确认对话框

#### 分页器集成
```javascript
usePager(() => {
    if (!this.model.root.isVirtual) {
        const resIds = this.model.root.resIds;
        return {
            offset: resIds.indexOf(this.model.root.resId),
            limit: 1,
            total: resIds.length,
            onUpdate: ({ offset }) => this.onPagerUpdate({ offset, resIds }),
        };
    }
});
```

### 4. 数据操作核心逻辑

#### 保存机制
```javascript
async saveButtonClicked(params = {}) {
    this.disableButtons();  // 防止重复点击
    const record = this.model.root;
    let saved = false;

    if (this.props.saveRecord) {
        saved = await this.props.saveRecord(record, params);  // 自定义保存
    } else {
        saved = await record.save();  // 默认保存
    }
    
    this.enableButtons();
    if (saved && this.props.onSave) {
        this.props.onSave(record, params);  // 保存成功回调
    }
    return saved;
}
```

**保存策略**：
1. **按钮防抖**：禁用按钮防止重复操作
2. **自定义保存**：支持外部传入saveRecord函数
3. **回调机制**：保存成功后执行onSave回调
4. **错误处理**：内置保存错误对话框

#### 创建记录流程
```javascript
async create() {
    await this.model.root.askChanges();  // 确保isDirty状态正确
    let canProceed = true;
    
    if (this.model.root.isDirty) {
        canProceed = await this.model.root.save({
            stayInEdition: true,
            useSaveErrorDialog: true,
        });
    }
    
    if (canProceed) {
        this.disableButtons();
        await this.model.load({ resId: null });  // 加载空记录
        this.enableButtons();
    }
}
```

**创建逻辑**：
1. **脏数据检查**：检查当前记录是否有未保存更改
2. **条件保存**：如果有更改，先保存当前记录
3. **切换记录**：加载空记录进入创建模式
4. **UI保护**：操作期间禁用按钮

### 5. 操作菜单系统

#### 动态菜单生成
```javascript
getActionMenuItems() {
    const otherActionItems = [];
    
    // 归档/取消归档
    if (this.archiveEnabled) {
        if (this.model.root.isActive) {
            otherActionItems.push({
                key: "archive",
                description: this.env._t("Archive"),
                callback: () => { /* 显示确认对话框 */ },
            });
        } else {
            otherActionItems.push({
                key: "unarchive", 
                callback: () => this.model.root.unarchive(),
            });
        }
    }
    
    // 复制记录
    if (this.archInfo.activeActions.create && this.archInfo.activeActions.duplicate) {
        otherActionItems.push({
            key: "duplicate",
            callback: () => this.duplicateRecord(),
        });
    }
    
    // 删除记录
    if (this.archInfo.activeActions.delete && !this.model.root.isVirtual) {
        otherActionItems.push({
            key: "delete",
            callback: () => this.deleteRecord(),
            skipSave: true,  // 删除前不保存
        });
    }
    
    return Object.assign({}, this.props.info.actionMenus, { other: otherActionItems });
}
```

**菜单特性**：
- **权限控制**：根据activeActions和记录状态动态显示
- **状态感知**：根据记录的激活状态显示不同选项
- **操作保护**：删除等危险操作显示确认对话框

### 6. 按钮执行生命周期

#### 执行前处理
```javascript
async beforeExecuteActionButton(clickParams) {
    const record = this.model.root;
    
    if (clickParams.special !== "cancel") {
        let saved = false;
        
        if (clickParams.special === "save" && this.props.saveRecord) {
            saved = await this.props.saveRecord(record, clickParams);
        } else {
            saved = await record.save({ stayInEdition: true });
        }
        
        if (saved !== false && this.props.onSave) {
            this.props.onSave(record, clickParams);
        }
        
        return saved;
    } else if (this.props.onDiscard) {
        this.props.onDiscard(record);
    }
}
```

**执行策略**：
- **save操作**：根据参数决定使用自定义保存还是默认保存
- **cancel操作**：执行丢弃回调
- **链式处理**：保存成功后执行回调函数

### 7. 响应式UI适配

#### 屏幕尺寸适配
```javascript
get className() {
    const result = {};
    const { size } = this.ui;
    
    if (size <= SIZES.XS) {
        result.o_xxs_form_view = true;  // 超小屏幕样式
    } else if (!this.env.inDialog && size === SIZES.XXL) {
        result["o_xxl_form_view h-100"] = true;  // 超大屏幕样式
    }
    
    // 触摸设备或小屏幕启用字段高亮
    result["o_field_highlight"] = size < SIZES.SM || hasTouch();
    
    return result;
}
```

**适配特性**：
- **多尺寸支持**：从XS到XXL的全尺寸适配
- **设备感知**：检测触摸设备并应用相应样式
- **对话框优化**：对话框模式下禁用某些大屏样式

## 架构设计特点

### 1. **关注点分离**
- **Controller**：业务逻辑和用户交互
- **Model**：数据管理和状态
- **Renderer**：UI渲染和显示

### 2. **生命周期管理**
- **初始化**：setup阶段完成所有配置
- **运行时**：通过钩子处理各种事件
- **清理**：beforeLeave和beforeUnload确保数据安全

### 3. **扩展性设计**
- **钩子系统**：beforeExecuteActionButton等钩子支持自定义逻辑
- **回调机制**：onSave、onDiscard等回调支持外部集成
- **属性注入**：saveRecord、discardRecord等允许外部控制

### 4. **用户体验优化**
- **防重复操作**：按钮禁用机制
- **数据保护**：多层保存确认
- **响应式设计**：适配各种屏幕尺寸
- **自动聚焦**：提高操作效率

这个FormController是一个功能完备、设计精良的表单控制器，展现了现代Web应用中复杂业务逻辑的最佳实践。
