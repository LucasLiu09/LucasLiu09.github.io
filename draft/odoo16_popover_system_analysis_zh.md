# Odoo 16 弹出层(Popover)系统详细分析与实用Widget实现

## 目录
1. [系统概述](#系统概述)
2. [架构分析](#架构分析)
3. [文件结构](#文件结构)
4. [使用示例](#使用示例)
5. [实用Widget实现](#实用widget实现)
6. [最佳实践](#最佳实践)

## 系统概述

Odoo 16的popover(弹出层)系统是一个强大的浮层管理解决方案，基于OWL框架构建，提供了灵活、高效的弹出层功能。该系统广泛用于工具提示、下拉菜单、表单弹窗、数据预览等场景。

### 核心特性
- **智能定位系统**: 自动计算最佳显示位置，支持8个方向的精确定位
- **生命周期管理**: 完整的创建、显示、隐藏、销毁生命周期管理
- **事件处理**: 完善的点击外部区域关闭、目标元素变化监听等机制
- **动画效果**: 流畅的进入和退出动画
- **响应式设计**: 适配不同屏幕尺寸和设备类型
- **组件化架构**: 高度可复用和可扩展的组件设计

## 架构分析

### 目录结构
```
addons/web/static/src/core/popover/
├── popover.js              # 主要的Popover组件
├── popover.scss            # 样式定义和动画效果
├── popover.xml             # QWeb模板
├── popover_container.js    # 容器组件和控制器
├── popover_hook.js         # OWL hooks集成
└── popover_service.js      # 核心服务实现
```

### 组件层次结构
```
PopoverService (服务层)
├── PopoverContainer (容器组件)
│   └── PopoverController (控制器)
│       └── Popover (展示组件)
│           └── 用户自定义组件
└── usePopover Hook (钩子函数)
```

### 详细文件分析

#### 1. popover.js (`addons/web/static/src/core/popover/popover.js:1-103`)
这是核心的Popover展示组件，负责定位和样式管理。

```javascript
export class Popover extends Component {
    setup() {
        usePosition(this.props.target, {
            onPositioned: this.props.onPositioned || this.onPositioned.bind(this),
            position: this.props.position,
        });
    }
    
    onPositioned(el, { direction, variant }) {
        const position = `${direction[0]}${variant[0]}`;
        // 动态设置CSS类名和箭头位置
        el.classList = [
            "o_popover popover mw-100 shadow-sm",
            `bs-popover-${directionMap[direction]}`,
            `o-popover-${direction}`,
            `o-popover--${position}`,
        ].join(" ");
    }
}
```

**关键特性**:
- **智能定位**: 使用`usePosition` hook实现8个方向的智能定位(tm/ts/te/bm/bs/be/lm/ls/le/rm/rs/re)
- **动态样式**: 根据实际位置动态调整CSS类名
- **箭头定位**: 精确控制箭头的位置和样式
- **响应式**: 支持不同方向和变体的组合

#### 2. popover_service.js (`addons/web/static/src/core/popover/popover_service.js:8-68`)
这是popover系统的核心服务，管理所有popover实例。

```javascript
export const popoverService = {
    start() {
        let nextId = 0;
        const popovers = {};
        const bus = new EventBus();

        function add(target, Component, props, options = {}) {
            const id = ++nextId;
            const closeFn = () => close(id);
            const popover = {
                id,
                target,
                Component,
                props,
                close: closeFn,
                onClose: options.onClose,
                position: options.position,
                onPositioned: options.onPositioned,
                popoverClass: options.popoverClass,
                closeOnClickAway: options.closeOnClickAway,
                preventClose: options.preventClose,
            };
            popovers[id] = popover;
            bus.trigger("UPDATE");
            return closeFn;
        }

        return { add };
    },
};
```

**核心功能**:
- **实例管理**: 统一管理所有popover实例，分配唯一ID
- **事件总线**: 使用EventBus进行组件间通信
- **生命周期**: 完整的添加和关闭生命周期管理
- **配置选项**: 支持丰富的配置选项(位置、样式、关闭行为等)

#### 3. popover_container.js (`addons/web/static/src/core/popover/popover_container.js:7-92`)
容器组件负责渲染和控制popover的行为。

```javascript
class PopoverController extends Component {
    setup() {
        this.state = useState({ displayed: false });
        
        if (this.target.isConnected) {
            useExternalListener(window, "click", this.onClickAway, { capture: true });
            const targetObserver = new MutationObserver(this.onTargetMutate.bind(this));
            targetObserver.observe(this.target.parentElement, { childList: true });
        }
    }
    
    onClickAway(ev) {
        if (this.target.contains(ev.target) || 
            ev.target.closest(`.o_popover[popover-id="${this.props.id}"]`)) {
            return;
        }
        if (this.props.closeOnClickAway) {
            this.props.close();
        }
    }
}
```

**关键机制**:
- **点击外部关闭**: 智能检测点击区域，避免误关闭
- **DOM变化监听**: 监听目标元素的DOM变化，自动清理
- **状态管理**: 管理popover的显示状态
- **事件代理**: 高效的事件处理机制

#### 4. popover_hook.js (`addons/web/static/src/core/popover/popover_hook.js:7-47`)
提供便捷的OWL hooks集成。

```javascript
export function usePopover() {
    const removeFns = new Set();
    const service = useService("popover");
    const component = useComponent();

    onWillUnmount(function () {
        for (const removeFn of removeFns) {
            removeFn();
        }
        removeFns.clear();
    });
    
    return {
        add(target, Component, props, options = {}) {
            const removeFn = service.add(target, Component, props, newOptions);
            removeFns.add(removeFn);
            return removeFn;
        },
    };
}
```

**优势**:
- **自动清理**: 组件卸载时自动清理所有popover
- **状态同步**: 与组件生命周期同步
- **简化API**: 提供更简洁的使用接口

#### 5. popover.xml (`addons/web/static/src/core/popover/popover.xml:4-13`)
定义popover的HTML结构模板。

```xml
<t t-name="web.PopoverWowl" owl="1">
    <div role="tooltip" class="o_popover popover mw-100 shadow-sm"
        t-att-class="props.popoverClass"
        t-ref="popper"
        t-att-popover-id="props.id">
        <div class="popover-arrow"/>
        <t t-slot="default" />
    </div>
</t>
```

**特性**:
- **无障碍性**: 使用`role="tooltip"`提供无障碍支持
- **可定制**: 支持自定义CSS类名
- **插槽系统**: 使用slot允许插入任意内容
- **标识符**: 提供唯一的popover-id用于定位

#### 6. popover.scss (`addons/web/static/src/core/popover/popover.scss:1-71`)
定义样式和动画效果。

```scss
@keyframes slide-top {
    0% {
        opacity: 0;
        transform: translateY(-5%);
    }
}

.o_popover {
    @each $direction in (top, end, bottom, start) {
        &.bs-popover-#{$direction} {
            animation: 0.2s slide-#{$direction};
        }
    }
    
    &.o-popover--ts .popover-arrow {
        left: $popover-border-radius;
    }
}
```

**动画特性**:
- **方向动画**: 每个方向都有对应的滑入动画
- **流畅过渡**: 0.2秒的平滑动画效果
- **箭头定位**: 精确的箭头位置计算
- **响应式边距**: 根据方向自动调整边距

## 使用示例

### 基础用法
```javascript
import { usePopover } from "@web/core/popover/popover_hook";

class MyComponent extends Component {
    setup() {
        this.popover = usePopover();
    }
    
    showPopover() {
        this.popover.add(
            this.buttonRef.el,
            MyPopoverContent,
            { message: "Hello World" },
            { position: "bottom" }
        );
    }
}
```

### 高级配置
```javascript
const closeFn = this.popover.add(
    target,
    CustomComponent,
    { data: complexData },
    {
        position: "top",
        popoverClass: "custom-popover",
        closeOnClickAway: true,
        onClose: () => console.log("Popover closed"),
        preventClose: (event) => event.target.matches('.keep-open'),
        onPositioned: (el, position) => {
            // 自定义定位后的处理
        }
    }
);
```

## 实用Widget实现

### 1. 快捷操作菜单Widget - 上下文操作面板

**使用场景**: 为列表项、卡片或按钮提供快捷操作菜单，提升用户操作效率。

```javascript
/** @odoo-module **/
import { Component } from "@odoo/owl";
import { usePopover } from "@web/core/popover/popover_hook";
import { useRef, useState } from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";

export class QuickActionMenuWidget extends Component {
    static template = "web.QuickActionMenuWidget";
    static props = {
        record: Object,
        actions: Array,
        position: { type: String, optional: true },
        triggerStyle: { type: String, optional: true }, // 'button', 'icon', 'context'
        size: { type: String, optional: true }, // 'sm', 'md', 'lg'
    };

    setup() {
        this.popover = usePopover();
        this.actionService = useService("action");
        this.orm = useService("orm");
        this.notification = useService("notification");
        
        this.state = useState({
            isOpen: false,
            processing: new Set()
        });
        
        this.triggerRef = useRef("trigger");
    }

    get availableActions() {
        return this.props.actions.filter(action => 
            !action.condition || action.condition(this.props.record)
        );
    }

    get triggerClass() {
        const baseClass = "quick-action-trigger";
        const styleClass = `trigger-${this.props.triggerStyle || 'button'}`;
        const sizeClass = `size-${this.props.size || 'md'}`;
        return `${baseClass} ${styleClass} ${sizeClass}`;
    }

    showActionMenu() {
        if (this.state.isOpen) return;
        
        this.state.isOpen = true;
        const closeFn = this.popover.add(
            this.triggerRef.el,
            QuickActionMenuPopover,
            {
                record: this.props.record,
                actions: this.availableActions,
                onActionClick: this.executeAction.bind(this),
                processing: this.state.processing,
            },
            {
                position: this.props.position || "bottom",
                popoverClass: "quick-action-menu-popover",
                closeOnClickAway: true,
                onClose: () => {
                    this.state.isOpen = false;
                }
            }
        );
    }

    async executeAction(action) {
        if (this.state.processing.has(action.key)) return;
        
        this.state.processing.add(action.key);
        
        try {
            const result = await this.performAction(action);
            
            if (result.success) {
                this.notification.add(
                    result.message || `${action.label}执行成功`,
                    { type: "success" }
                );
                
                // 触发记录刷新
                if (action.refreshRecord) {
                    this.trigger('record-refresh', { 
                        recordId: this.props.record.id 
                    });
                }
            } else {
                throw new Error(result.error || "操作失败");
            }
        } catch (error) {
            this.notification.add(
                `${action.label}执行失败: ${error.message}`,
                { type: "danger" }
            );
        } finally {
            this.state.processing.delete(action.key);
        }
    }

    async performAction(action) {
        const record = this.props.record;
        
        switch (action.type) {
            case 'method':
                return await this.orm.call(
                    record.resModel,
                    action.method,
                    [record.resId],
                    action.kwargs || {}
                );
                
            case 'write':
                await this.orm.write(
                    record.resModel,
                    [record.resId],
                    action.values
                );
                return { 
                    success: true, 
                    message: `${action.label}完成` 
                };
                
            case 'action':
                const actionResult = await this.actionService.doAction(
                    action.actionId,
                    {
                        additionalContext: {
                            active_id: record.resId,
                            active_ids: [record.resId],
                            active_model: record.resModel,
                        }
                    }
                );
                return { success: true };
                
            case 'wizard':
                return await this.openWizard(action);
                
            case 'url':
                window.open(action.url.replace('{{id}}', record.resId), '_blank');
                return { success: true, message: "页面已打开" };
                
            case 'download':
                return await this.downloadFile(action);
                
            default:
                throw new Error(`未知的操作类型: ${action.type}`);
        }
    }

    async openWizard(action) {
        const wizardAction = await this.orm.call(
            action.wizardModel,
            'create_wizard',
            [],
            {
                context: {
                    default_res_id: this.props.record.resId,
                    default_res_model: this.props.record.resModel,
                    ...action.context
                }
            }
        );
        
        await this.actionService.doAction(wizardAction);
        return { success: true };
    }

    async downloadFile(action) {
        const url = `/web/content/${this.props.record.resModel}/${this.props.record.resId}/${action.field}`;
        const link = document.createElement('a');
        link.href = url;
        link.download = action.filename || 'download';
        link.click();
        return { success: true, message: "文件下载已开始" };
    }
}

// 弹出菜单组件
class QuickActionMenuPopover extends Component {
    static template = "web.QuickActionMenuPopover";
    static props = {
        record: Object,
        actions: Array,
        onActionClick: Function,
        processing: Set,
        close: Function,
    };

    getActionIcon(action) {
        const iconMap = {
            'method': 'fa-cogs',
            'write': 'fa-edit',
            'action': 'fa-external-link',
            'wizard': 'fa-magic',
            'url': 'fa-link',
            'download': 'fa-download',
        };
        return action.icon || iconMap[action.type] || 'fa-circle';
    }

    getActionClass(action) {
        const baseClass = "action-item";
        const typeClass = `action-${action.type}`;
        const levelClass = `level-${action.level || 'normal'}`;
        const processingClass = this.props.processing.has(action.key) ? 'processing' : '';
        
        return `${baseClass} ${typeClass} ${levelClass} ${processingClass}`;
    }

    async handleActionClick(action) {
        if (this.props.processing.has(action.key)) return;
        
        // 需要确认的操作
        if (action.confirm) {
            const confirmed = confirm(action.confirm);
            if (!confirmed) return;
        }
        
        await this.props.onActionClick(action);
        
        // 执行后是否关闭菜单
        if (action.closeAfter !== false) {
            this.props.close();
        }
    }
}

// XML模板
`<t t-name="web.QuickActionMenuWidget">
    <div class="quick-action-menu-widget">
        <button t-ref="trigger" 
                t-att-class="triggerClass"
                t-on-click="showActionMenu"
                t-att-disabled="availableActions.length === 0">
            <i t-if="props.triggerStyle === 'icon'" class="fa fa-ellipsis-v"/>
            <span t-elif="props.triggerStyle === 'button'">操作</span>
            <span t-else="" class="context-trigger">⋯</span>
            <span t-if="availableActions.length > 0" class="action-count" t-esc="availableActions.length"/>
        </button>
    </div>
</t>

<t t-name="web.QuickActionMenuPopover">
    <div class="quick-action-menu-content">
        <div class="menu-header">
            <span class="record-info">
                <strong t-esc="props.record.display_name or props.record.name"/>
            </span>
            <button class="close-btn" t-on-click="props.close">
                <i class="fa fa-times"/>
            </button>
        </div>
        
        <div class="actions-list">
            <div t-foreach="props.actions" t-as="action" 
                 t-att-class="getActionClass(action)"
                 t-on-click="() => this.handleActionClick(action)">
                
                <div class="action-icon">
                    <i t-if="!props.processing.has(action.key)" 
                       t-att-class="'fa ' + getActionIcon(action)"/>
                    <i t-else="" class="fa fa-spinner fa-spin"/>
                </div>
                
                <div class="action-content">
                    <div class="action-label" t-esc="action.label"/>
                    <div t-if="action.description" 
                         class="action-description" 
                         t-esc="action.description"/>
                </div>
                
                <div t-if="action.shortcut" class="action-shortcut">
                    <kbd t-esc="action.shortcut"/>
                </div>
            </div>
        </div>
        
        <div t-if="props.actions.length === 0" class="no-actions">
            <i class="fa fa-info-circle"/>
            <span>暂无可用操作</span>
        </div>
    </div>
</t>`

// SCSS样式
`.quick-action-menu-widget {
    display: inline-block;
    
    .quick-action-trigger {
        position: relative;
        border: none;
        background: transparent;
        cursor: pointer;
        transition: all 0.2s ease;
        
        &.trigger-button {
            padding: 6px 12px;
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 4px;
            font-size: 13px;
            
            &:hover {
                background: #e9ecef;
                border-color: #adb5bd;
            }
        }
        
        &.trigger-icon {
            padding: 8px;
            border-radius: 50%;
            width: 32px;
            height: 32px;
            
            &:hover {
                background: rgba(0,0,0,0.05);
            }
        }
        
        &.trigger-context {
            padding: 4px 8px;
            font-size: 16px;
            font-weight: bold;
            
            &:hover {
                background: rgba(0,0,0,0.05);
                border-radius: 4px;
            }
        }
        
        .action-count {
            position: absolute;
            top: -4px;
            right: -4px;
            background: #dc3545;
            color: white;
            border-radius: 50%;
            width: 16px;
            height: 16px;
            font-size: 10px;
            line-height: 16px;
            text-align: center;
        }
        
        &:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
    }
}

.quick-action-menu-popover {
    min-width: 220px;
    max-width: 300px;
    
    .quick-action-menu-content {
        .menu-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 12px;
            border-bottom: 1px solid #e9ecef;
            background: #f8f9fa;
            
            .record-info {
                font-size: 12px;
                font-weight: 500;
                color: #495057;
                max-width: 180px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
            
            .close-btn {
                border: none;
                background: none;
                padding: 2px;
                cursor: pointer;
                color: #6c757d;
                
                &:hover {
                    color: #495057;
                }
            }
        }
        
        .actions-list {
            max-height: 300px;
            overflow-y: auto;
            
            .action-item {
                display: flex;
                align-items: center;
                padding: 8px 12px;
                cursor: pointer;
                transition: background-color 0.15s ease;
                border-bottom: 1px solid #f8f9fa;
                
                &:hover {
                    background-color: #f8f9fa;
                }
                
                &.processing {
                    opacity: 0.7;
                    cursor: wait;
                }
                
                &.level-danger {
                    .action-icon {
                        color: #dc3545;
                    }
                    
                    &:hover {
                        background-color: #f8d7da;
                    }
                }
                
                &.level-warning {
                    .action-icon {
                        color: #ffc107;
                    }
                    
                    &:hover {
                        background-color: #fff3cd;
                    }
                }
                
                .action-icon {
                    width: 20px;
                    text-align: center;
                    margin-right: 10px;
                    color: #6c757d;
                    flex-shrink: 0;
                }
                
                .action-content {
                    flex: 1;
                    min-width: 0;
                    
                    .action-label {
                        font-size: 13px;
                        font-weight: 500;
                        color: #212529;
                        margin-bottom: 2px;
                    }
                    
                    .action-description {
                        font-size: 11px;
                        color: #6c757d;
                        line-height: 1.3;
                    }
                }
                
                .action-shortcut {
                    margin-left: 8px;
                    flex-shrink: 0;
                    
                    kbd {
                        font-size: 10px;
                        padding: 2px 4px;
                        background: #e9ecef;
                        border: 1px solid #adb5bd;
                        border-radius: 3px;
                        color: #495057;
                    }
                }
            }
        }
        
        .no-actions {
            padding: 20px;
            text-align: center;
            color: #6c757d;
            font-size: 13px;
            
            .fa {
                margin-bottom: 8px;
                font-size: 24px;
                display: block;
            }
        }
    }
}`
```

### 2. 数据筛选器Widget - 高级筛选面板

**使用场景**: 为列表视图、看板视图提供复杂的数据筛选功能，支持多条件组合筛选。

```javascript
/** @odoo-module **/
import { Component } from "@odoo/owl";
import { usePopover } from "@web/core/popover/popover_hook";
import { useRef, useState, onWillStart } from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";

export class DataFilterWidget extends Component {
    static template = "web.DataFilterWidget";
    static props = {
        model: String,
        fields: Object,
        domain: { type: Array, optional: true },
        onFilterChange: Function,
        savedFilters: { type: Array, optional: true },
        allowSave: { type: Boolean, optional: true },
    };

    setup() {
        this.popover = usePopover();
        this.orm = useService("orm");
        this.user = useService("user");
        
        this.state = useState({
            isOpen: false,
            filters: [],
            activeFilters: new Map(),
            savedFilters: this.props.savedFilters || [],
            quickFilters: new Map(),
        });
        
        this.triggerRef = useRef("trigger");
        
        onWillStart(async () => {
            await this.loadQuickFilters();
            this.initializeFilters();
        });
    }

    get availableFields() {
        return Object.entries(this.props.fields)
            .filter(([name, field]) => this.isFilterableField(field))
            .map(([name, field]) => ({
                name,
                ...field,
                label: field.string || name,
            }));
    }

    get activeFilterCount() {
        return this.state.activeFilters.size;
    }

    get filterDomain() {
        const domains = Array.from(this.state.activeFilters.values());
        return domains.length > 0 ? ['&'].concat(...domains) : [];
    }

    isFilterableField(field) {
        const filterableTypes = [
            'char', 'text', 'selection', 'many2one', 'many2many',
            'integer', 'float', 'monetary', 'date', 'datetime', 'boolean'
        ];
        return filterableTypes.includes(field.type) && !field.deprecated;
    }

    async loadQuickFilters() {
        // 加载常用的快速筛选选项
        const quickFilters = [
            {
                key: 'my_records',
                label: '我的记录',
                domain: [['create_uid', '=', this.user.userId]],
                icon: 'fa-user'
            },
            {
                key: 'recent',
                label: '最近创建',
                domain: [['create_date', '>=', this.getRecentDate(7)]],
                icon: 'fa-clock-o'
            },
            {
                key: 'active',
                label: '活跃记录',
                domain: [['active', '=', true]],
                icon: 'fa-check-circle',
                condition: () => 'active' in this.props.fields
            }
        ];

        for (const filter of quickFilters) {
            if (!filter.condition || filter.condition()) {
                this.state.quickFilters.set(filter.key, filter);
            }
        }
    }

    initializeFilters() {
        if (this.props.domain && this.props.domain.length > 0) {
            // 解析现有domain为筛选条件
            this.parseDomainToFilters(this.props.domain);
        }
    }

    getRecentDate(days) {
        const date = new Date();
        date.setDate(date.getDate() - days);
        return date.toISOString().split('T')[0];
    }

    showFilterPanel() {
        if (this.state.isOpen) return;
        
        this.state.isOpen = true;
        const closeFn = this.popover.add(
            this.triggerRef.el,
            DataFilterPopover,
            {
                model: this.props.model,
                fields: this.availableFields,
                activeFilters: this.state.activeFilters,
                quickFilters: this.state.quickFilters,
                savedFilters: this.state.savedFilters,
                onFilterAdd: this.addFilter.bind(this),
                onFilterRemove: this.removeFilter.bind(this),
                onFilterUpdate: this.updateFilter.bind(this),
                onQuickFilterToggle: this.toggleQuickFilter.bind(this),
                onSavedFilterApply: this.applySavedFilter.bind(this),
                onSaveFilter: this.saveCurrentFilter.bind(this),
                onClearAll: this.clearAllFilters.bind(this),
            },
            {
                position: "bottom",
                popoverClass: "data-filter-popover",
                closeOnClickAway: true,
                onClose: () => {
                    this.state.isOpen = false;
                }
            }
        );
    }

    addFilter(fieldName) {
        const field = this.props.fields[fieldName];
        const filterId = `${fieldName}_${Date.now()}`;
        
        const newFilter = {
            id: filterId,
            fieldName,
            field,
            operator: this.getDefaultOperator(field.type),
            value: this.getDefaultValue(field.type),
            label: field.string || fieldName,
        };
        
        this.state.activeFilters.set(filterId, newFilter);
        this.applyFilters();
    }

    removeFilter(filterId) {
        this.state.activeFilters.delete(filterId);
        this.applyFilters();
    }

    updateFilter(filterId, updates) {
        const filter = this.state.activeFilters.get(filterId);
        if (filter) {
            Object.assign(filter, updates);
            this.applyFilters();
        }
    }

    toggleQuickFilter(filterKey) {
        const quickFilter = this.state.quickFilters.get(filterKey);
        if (!quickFilter) return;
        
        const filterId = `quick_${filterKey}`;
        
        if (this.state.activeFilters.has(filterId)) {
            this.state.activeFilters.delete(filterId);
        } else {
            this.state.activeFilters.set(filterId, {
                id: filterId,
                type: 'quick',
                label: quickFilter.label,
                domain: quickFilter.domain,
            });
        }
        
        this.applyFilters();
    }

    async applySavedFilter(savedFilter) {
        this.state.activeFilters.clear();
        
        if (savedFilter.domain) {
            this.parseDomainToFilters(savedFilter.domain);
        }
        
        this.applyFilters();
    }

    async saveCurrentFilter(name, isPublic = false) {
        const filterData = {
            name,
            model_id: this.props.model,
            domain: JSON.stringify(this.filterDomain),
            is_default: false,
            user_id: isPublic ? false : this.user.userId,
            context: JSON.stringify({}),
        };
        
        try {
            const filterId = await this.orm.create('ir.filters', [filterData]);
            const newFilter = { id: filterId[0], ...filterData };
            this.state.savedFilters.push(newFilter);
            
            return { success: true, filter: newFilter };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    clearAllFilters() {
        this.state.activeFilters.clear();
        this.applyFilters();
    }

    applyFilters() {
        const domain = this.buildDomain();
        this.props.onFilterChange(domain);
    }

    buildDomain() {
        const conditions = [];
        
        for (const filter of this.state.activeFilters.values()) {
            if (filter.type === 'quick') {
                conditions.push(...filter.domain);
            } else {
                const condition = this.buildFieldCondition(filter);
                if (condition) {
                    conditions.push(condition);
                }
            }
        }
        
        if (conditions.length === 0) return [];
        if (conditions.length === 1) return conditions;
        
        // 使用 '&' 连接多个条件
        const result = ['&'];
        for (let i = 0; i < conditions.length - 2; i++) {
            result.push('&');
        }
        result.push(...conditions);
        
        return result;
    }

    buildFieldCondition(filter) {
        const { fieldName, operator, value } = filter;
        
        if (value === undefined || value === null || value === '') {
            return null;
        }
        
        switch (filter.field.type) {
            case 'char':
            case 'text':
                return [fieldName, operator, value];
                
            case 'selection':
                return [fieldName, '=', value];
                
            case 'many2one':
                return [fieldName, '=', Array.isArray(value) ? value[0] : value];
                
            case 'many2many':
                return [fieldName, 'in', Array.isArray(value) ? value : [value]];
                
            case 'integer':
            case 'float':
            case 'monetary':
                return [fieldName, operator, parseFloat(value)];
                
            case 'date':
            case 'datetime':
                return [fieldName, operator, value];
                
            case 'boolean':
                return [fieldName, '=', value];
                
            default:
                return [fieldName, operator, value];
        }
    }

    getDefaultOperator(fieldType) {
        const operatorMap = {
            'char': 'ilike',
            'text': 'ilike',
            'selection': '=',
            'many2one': '=',
            'many2many': 'in',
            'integer': '=',
            'float': '=',
            'monetary': '=',
            'date': '=',
            'datetime': '=',
            'boolean': '=',
        };
        return operatorMap[fieldType] || '=';
    }

    getDefaultValue(fieldType) {
        const defaultMap = {
            'char': '',
            'text': '',
            'selection': '',
            'many2one': null,
            'many2many': [],
            'integer': 0,
            'float': 0.0,
            'monetary': 0.0,
            'date': '',
            'datetime': '',
            'boolean': true,
        };
        return defaultMap[fieldType];
    }

    parseDomainToFilters(domain) {
        // 简化的domain解析实现
        // 实际应用中需要更复杂的解析逻辑
        if (!Array.isArray(domain) || domain.length === 0) return;
        
        for (const condition of domain) {
            if (Array.isArray(condition) && condition.length === 3) {
                const [fieldName, operator, value] = condition;
                const field = this.props.fields[fieldName];
                
                if (field) {
                    const filterId = `parsed_${fieldName}_${Date.now()}`;
                    this.state.activeFilters.set(filterId, {
                        id: filterId,
                        fieldName,
                        field,
                        operator,
                        value,
                        label: field.string || fieldName,
                    });
                }
            }
        }
    }
}

// 筛选面板弹出组件
class DataFilterPopover extends Component {
    static template = "web.DataFilterPopover";
    static props = {
        model: String,
        fields: Array,
        activeFilters: Map,
        quickFilters: Map,
        savedFilters: Array,
        onFilterAdd: Function,
        onFilterRemove: Function,
        onFilterUpdate: Function,
        onQuickFilterToggle: Function,
        onSavedFilterApply: Function,
        onSaveFilter: Function,
        onClearAll: Function,
        close: Function,
    };

    setup() {
        this.state = useState({
            activeTab: 'filters', // 'filters', 'quick', 'saved'
            selectedField: '',
            showSaveDialog: false,
            saveFilterName: '',
            saveAsPublic: false,
        });
    }

    get operatorOptions() {
        return {
            'char': [
                { value: 'ilike', label: '包含' },
                { value: '=', label: '等于' },
                { value: '!=', label: '不等于' },
                { value: 'not ilike', label: '不包含' },
            ],
            'integer': [
                { value: '=', label: '等于' },
                { value: '!=', label: '不等于' },
                { value: '>', label: '大于' },
                { value: '>=', label: '大于等于' },
                { value: '<', label: '小于' },
                { value: '<=', label: '小于等于' },
            ],
            'date': [
                { value: '=', label: '等于' },
                { value: '!=', label: '不等于' },
                { value: '>', label: '晚于' },
                { value: '>=', label: '不早于' },
                { value: '<', label: '早于' },
                { value: '<=', label: '不晚于' },
            ],
            'boolean': [
                { value: '=', label: '是' },
            ],
        };
    }

    addNewFilter() {
        if (this.state.selectedField) {
            this.props.onFilterAdd(this.state.selectedField);
            this.state.selectedField = '';
        }
    }

    updateFilterValue(filterId, field, value) {
        this.props.onFilterUpdate(filterId, { [field]: value });
    }

    getFieldOperators(fieldType) {
        return this.operatorOptions[fieldType] || this.operatorOptions['char'];
    }

    async saveFilter() {
        if (!this.state.saveFilterName.trim()) return;
        
        const result = await this.props.onSaveFilter(
            this.state.saveFilterName,
            this.state.saveAsPublic
        );
        
        if (result.success) {
            this.state.showSaveDialog = false;
            this.state.saveFilterName = '';
            this.state.saveAsPublic = false;
        }
    }
}

// XML模板
`<t t-name="web.DataFilterWidget">
    <div class="data-filter-widget">
        <button t-ref="trigger" 
                class="filter-trigger"
                t-on-click="showFilterPanel"
                t-att-class="activeFilterCount > 0 ? 'has-filters' : ''">
            <i class="fa fa-filter"/>
            <span>筛选</span>
            <span t-if="activeFilterCount > 0" 
                  class="filter-count" 
                  t-esc="activeFilterCount"/>
        </button>
    </div>
</t>

<t t-name="web.DataFilterPopover">
    <div class="data-filter-content">
        <!-- 标签页导航 -->
        <div class="filter-tabs">
            <button t-att-class="state.activeTab === 'filters' ? 'active' : ''"
                    t-on-click="() => this.state.activeTab = 'filters'">
                条件筛选
            </button>
            <button t-att-class="state.activeTab === 'quick' ? 'active' : ''"
                    t-on-click="() => this.state.activeTab = 'quick'">
                快速筛选
            </button>
            <button t-att-class="state.activeTab === 'saved' ? 'active' : ''"
                    t-on-click="() => this.state.activeTab = 'saved'">
                保存的筛选
            </button>
        </div>

        <!-- 条件筛选面板 -->
        <div t-if="state.activeTab === 'filters'" class="filter-panel">
            <!-- 添加新筛选 -->
            <div class="add-filter-section">
                <select t-model="state.selectedField" class="field-selector">
                    <option value="">选择字段...</option>
                    <option t-foreach="props.fields" t-as="field" 
                            t-att-value="field.name" t-esc="field.label"/>
                </select>
                <button t-on-click="addNewFilter" 
                        t-att-disabled="!state.selectedField"
                        class="btn btn-sm btn-primary">
                    <i class="fa fa-plus"/> 添加
                </button>
            </div>

            <!-- 活跃的筛选条件 -->
            <div class="active-filters">
                <div t-foreach="Array.from(props.activeFilters.values())" t-as="filter"
                     t-if="filter.type !== 'quick'"
                     class="filter-item">
                    
                    <div class="filter-field">
                        <strong t-esc="filter.label"/>
                    </div>
                    
                    <div class="filter-operator">
                        <select t-model="filter.operator"
                                t-on-change="(ev) => this.updateFilterValue(filter.id, 'operator', ev.target.value)">
                            <option t-foreach="getFieldOperators(filter.field.type)" t-as="op"
                                    t-att-value="op.value" t-esc="op.label"
                                    t-att-selected="op.value === filter.operator"/>
                        </select>
                    </div>
                    
                    <div class="filter-value">
                        <input t-if="filter.field.type in ['char', 'text']"
                               t-model="filter.value"
                               t-on-input="(ev) => this.updateFilterValue(filter.id, 'value', ev.target.value)"
                               class="form-control form-control-sm"/>
                        
                        <input t-elif="filter.field.type in ['integer', 'float', 'monetary']"
                               type="number"
                               t-model="filter.value"
                               t-on-input="(ev) => this.updateFilterValue(filter.id, 'value', ev.target.value)"
                               class="form-control form-control-sm"/>
                        
                        <input t-elif="filter.field.type === 'date'"
                               type="date"
                               t-model="filter.value"
                               t-on-change="(ev) => this.updateFilterValue(filter.id, 'value', ev.target.value)"
                               class="form-control form-control-sm"/>
                        
                        <select t-elif="filter.field.type === 'boolean'"
                                t-model="filter.value"
                                t-on-change="(ev) => this.updateFilterValue(filter.id, 'value', ev.target.value === 'true')"
                                class="form-control form-control-sm">
                            <option value="true">是</option>
                            <option value="false">否</option>
                        </select>
                    </div>
                    
                    <button class="remove-filter" 
                            t-on-click="() => this.props.onFilterRemove(filter.id)">
                        <i class="fa fa-times"/>
                    </button>
                </div>
            </div>
        </div>

        <!-- 快速筛选面板 -->
        <div t-if="state.activeTab === 'quick'" class="quick-filter-panel">
            <div t-foreach="Array.from(props.quickFilters.values())" t-as="quickFilter"
                 class="quick-filter-item"
                 t-att-class="props.activeFilters.has('quick_' + quickFilter.key) ? 'active' : ''"
                 t-on-click="() => this.props.onQuickFilterToggle(quickFilter.key)">
                
                <i t-att-class="'fa ' + quickFilter.icon"/>
                <span t-esc="quickFilter.label"/>
                <i t-if="props.activeFilters.has('quick_' + quickFilter.key)" 
                   class="fa fa-check active-indicator"/>
            </div>
        </div>

        <!-- 保存的筛选面板 -->
        <div t-if="state.activeTab === 'saved'" class="saved-filter-panel">
            <div t-foreach="props.savedFilters" t-as="savedFilter"
                 class="saved-filter-item"
                 t-on-click="() => this.props.onSavedFilterApply(savedFilter)">
                
                <div class="filter-info">
                    <div class="filter-name" t-esc="savedFilter.name"/>
                    <div class="filter-meta">
                        <small t-if="savedFilter.user_id" class="text-muted">
                            私有筛选
                        </small>
                        <small t-else="" class="text-muted">
                            公共筛选
                        </small>
                    </div>
                </div>
            </div>
            
            <div t-if="props.savedFilters.length === 0" class="no-saved-filters">
                <i class="fa fa-info-circle"/>
                <span>暂无保存的筛选</span>
            </div>
        </div>

        <!-- 底部操作栏 -->
        <div class="filter-actions">
            <button t-if="props.activeFilters.size > 0"
                    class="btn btn-sm btn-outline-secondary"
                    t-on-click="props.onClearAll">
                <i class="fa fa-eraser"/> 清除全部
            </button>
            
            <button t-if="props.activeFilters.size > 0"
                    class="btn btn-sm btn-outline-primary"
                    t-on-click="() => this.state.showSaveDialog = true">
                <i class="fa fa-save"/> 保存筛选
            </button>
        </div>

        <!-- 保存筛选对话框 -->
        <div t-if="state.showSaveDialog" class="save-filter-dialog">
            <div class="dialog-content">
                <h6>保存筛选条件</h6>
                <input t-model="state.saveFilterName" 
                       placeholder="输入筛选名称..."
                       class="form-control form-control-sm"/>
                
                <label class="checkbox-label">
                    <input type="checkbox" t-model="state.saveAsPublic"/>
                    <span>保存为公共筛选</span>
                </label>
                
                <div class="dialog-actions">
                    <button class="btn btn-sm btn-primary" 
                            t-on-click="saveFilter"
                            t-att-disabled="!state.saveFilterName.trim()">
                        保存
                    </button>
                    <button class="btn btn-sm btn-secondary"
                            t-on-click="() => this.state.showSaveDialog = false">
                        取消
                    </button>
                </div>
            </div>
        </div>
    </div>
</t>`

// SCSS样式
`.data-filter-widget {
    display: inline-block;
    
    .filter-trigger {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        border: 1px solid #dee2e6;
        background: #fff;
        border-radius: 4px;
        cursor: pointer;
        font-size: 13px;
        transition: all 0.2s ease;
        
        &:hover {
            border-color: #007bff;
            background: #f8f9fa;
        }
        
        &.has-filters {
            border-color: #007bff;
            background: #e3f2fd;
            color: #0056b3;
        }
        
        .filter-count {
            background: #007bff;
            color: white;
            border-radius: 50%;
            width: 18px;
            height: 18px;
            font-size: 11px;
            line-height: 18px;
            text-align: center;
        }
    }
}

.data-filter-popover {
    width: 350px;
    
    .data-filter-content {
        .filter-tabs {
            display: flex;
            border-bottom: 1px solid #e9ecef;
            
            button {
                flex: 1;
                padding: 8px 12px;
                border: none;
                background: none;
                cursor: pointer;
                font-size: 12px;
                color: #6c757d;
                transition: all 0.2s ease;
                
                &:hover {
                    background: #f8f9fa;
                }
                
                &.active {
                    color: #007bff;
                    border-bottom: 2px solid #007bff;
                    background: #f8f9fa;
                }
            }
        }
        
        .filter-panel {
            padding: 12px;
            
            .add-filter-section {
                display: flex;
                gap: 8px;
                margin-bottom: 12px;
                
                .field-selector {
                    flex: 1;
                    padding: 4px 8px;
                    border: 1px solid #dee2e6;
                    border-radius: 4px;
                    font-size: 12px;
                }
            }
            
            .active-filters {
                .filter-item {
                    display: grid;
                    grid-template-columns: 1fr auto 1fr auto;
                    gap: 8px;
                    align-items: center;
                    padding: 8px;
                    border: 1px solid #e9ecef;
                    border-radius: 4px;
                    margin-bottom: 8px;
                    background: #f8f9fa;
                    
                    .filter-field {
                        font-size: 12px;
                        font-weight: 500;
                    }
                    
                    .filter-operator select,
                    .filter-value input,
                    .filter-value select {
                        width: 100%;
                        padding: 2px 6px;
                        border: 1px solid #dee2e6;
                        border-radius: 3px;
                        font-size: 11px;
                    }
                    
                    .remove-filter {
                        border: none;
                        background: none;
                        color: #dc3545;
                        cursor: pointer;
                        padding: 2px;
                        
                        &:hover {
                            background: #f8d7da;
                            border-radius: 3px;
                        }
                    }
                }
            }
        }
        
        .quick-filter-panel {
            padding: 12px;
            
            .quick-filter-item {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 8px 12px;
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.2s ease;
                margin-bottom: 4px;
                
                &:hover {
                    background: #f8f9fa;
                }
                
                &.active {
                    background: #e3f2fd;
                    color: #0056b3;
                    
                    .active-indicator {
                        margin-left: auto;
                        color: #28a745;
                    }
                }
                
                .fa {
                    width: 16px;
                    text-align: center;
                }
            }
        }
        
        .saved-filter-panel {
            padding: 12px;
            
            .saved-filter-item {
                padding: 8px 12px;
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.2s ease;
                margin-bottom: 4px;
                
                &:hover {
                    background: #f8f9fa;
                }
                
                .filter-info {
                    .filter-name {
                        font-size: 13px;
                        font-weight: 500;
                        margin-bottom: 2px;
                    }
                    
                    .filter-meta {
                        font-size: 11px;
                    }
                }
            }
            
            .no-saved-filters {
                text-align: center;
                padding: 20px;
                color: #6c757d;
                font-size: 12px;
                
                .fa {
                    display: block;
                    font-size: 24px;
                    margin-bottom: 8px;
                }
            }
        }
        
        .filter-actions {
            display: flex;
            justify-content: space-between;
            padding: 8px 12px;
            border-top: 1px solid #e9ecef;
            background: #f8f9fa;
            
            .btn {
                font-size: 11px;
                padding: 4px 8px;
            }
        }
        
        .save-filter-dialog {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.1);
            display: flex;
            align-items: center;
            justify-content: center;
            
            .dialog-content {
                background: white;
                padding: 16px;
                border-radius: 6px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                min-width: 250px;
                
                h6 {
                    margin: 0 0 12px 0;
                    font-size: 14px;
                }
                
                input[type="text"] {
                    width: 100%;
                    padding: 6px 8px;
                    border: 1px solid #dee2e6;
                    border-radius: 4px;
                    margin-bottom: 8px;
                }
                
                .checkbox-label {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 12px;
                    margin-bottom: 12px;
                    cursor: pointer;
                }
                
                .dialog-actions {
                    display: flex;
                    gap: 8px;
                    justify-content: flex-end;
                    
                    .btn {
                        font-size: 11px;
                        padding: 4px 12px;
                    }
                }
            }
        }
    }
}`
```

### 3. 数据预览卡片Widget - 关联记录展示

**使用场景**: 在表单视图中展示关联记录的详细信息，无需跳转页面即可查看相关数据。

```javascript
/** @odoo-module **/
import { Component } from "@odoo/owl";
import { usePopover } from "@web/core/popover/popover_hook";
import { useRef, useState, onWillStart } from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";

export class DataPreviewCardWidget extends Component {
    static template = "web.DataPreviewCardWidget";
    static props = {
        record: Object,
        fieldName: String,
        previewFields: { type: Array, optional: true },
        showActions: { type: Boolean, optional: true },
        customTemplate: { type: String, optional: true },
        maxItems: { type: Number, optional: true },
    };

    setup() {
        this.popover = usePopover();
        this.orm = useService("orm");
        this.actionService = useService("action");
        
        this.state = useState({
            previewData: null,
            loading: false,
            error: null,
        });
        
        this.previewRef = useRef("previewTrigger");
        
        onWillStart(async () => {
            await this.loadPreviewData();
        });
    }

    get fieldValue() {
        return this.props.record.data[this.props.fieldName];
    }

    get fieldInfo() {
        return this.props.record.fields[this.props.fieldName];
    }

    get displayValue() {
        const value = this.fieldValue;
        if (!value) return "无数据";
        
        if (this.fieldInfo.type === 'many2one') {
            return Array.isArray(value) ? value[1] : value.toString();
        } else if (this.fieldInfo.type === 'many2many') {
            return Array.isArray(value) ? `${value.length} 项` : "0 项";
        } else if (this.fieldInfo.type === 'one2many') {
            return Array.isArray(value) ? `${value.length} 项` : "0 项";
        }
        
        return value.toString();
    }

    async loadPreviewData() {
        if (!this.fieldValue) return;
        
        this.state.loading = true;
        this.state.error = null;
        
        try {
            const relatedModel = this.fieldInfo.relation;
            if (!relatedModel) {
                throw new Error("字段没有关联模型");
            }
            
            let recordIds = [];
            if (this.fieldInfo.type === 'many2one') {
                recordIds = Array.isArray(this.fieldValue) 
                    ? [this.fieldValue[0]] 
                    : [this.fieldValue];
            } else if (this.fieldInfo.type === 'many2many' || this.fieldInfo.type === 'one2many') {
                recordIds = Array.isArray(this.fieldValue) ? this.fieldValue : [];
            }
            
            if (recordIds.length === 0) return;
            
            // 限制预览数量
            const maxItems = this.props.maxItems || 5;
            const limitedIds = recordIds.slice(0, maxItems);
            
            const fields = this.getPreviewFields(relatedModel);
            const records = await this.orm.read(relatedModel, limitedIds, fields);
            
            this.state.previewData = {
                model: relatedModel,
                records: records,
                totalCount: recordIds.length,
                hasMore: recordIds.length > maxItems,
            };
            
        } catch (error) {
            this.state.error = error.message || "加载预览数据失败";
            console.error("Preview loading error:", error);
        } finally {
            this.state.loading = false;
        }
    }

    getPreviewFields(model) {
        if (this.props.previewFields) {
            return ['id', 'display_name', ...this.props.previewFields];
        }
        
        // 默认的预览字段
        const commonFields = [
            'id', 'display_name', 'name', 'create_date', 'write_date', 'create_uid'
        ];
        
        // 根据模型类型添加特定字段
        const modelSpecificFields = this.getModelSpecificFields(model);
        
        return [...commonFields, ...modelSpecificFields];
    }

    getModelSpecificFields(model) {
        const fieldMap = {
            'res.partner': ['email', 'phone', 'is_company', 'parent_id'],
            'sale.order': ['state', 'amount_total', 'date_order', 'partner_id'],
            'purchase.order': ['state', 'amount_total', 'date_order', 'partner_id'],
            'account.move': ['state', 'amount_total', 'invoice_date', 'partner_id'],
            'stock.picking': ['state', 'scheduled_date', 'partner_id', 'origin'],
            'project.project': ['stage_id', 'partner_id', 'date_start', 'user_id'],
            'project.task': ['stage_id', 'project_id', 'user_id', 'date_deadline'],
            'hr.employee': ['department_id', 'job_id', 'work_email', 'work_phone'],
            'product.product': ['default_code', 'list_price', 'categ_id', 'qty_available'],
        };
        
        return fieldMap[model] || ['state', 'active'];
    }

    showPreviewCard() {
        if (!this.state.previewData || this.state.loading) return;
        
        const closeFn = this.popover.add(
            this.previewRef.el,
            DataPreviewCardPopover,
            {
                data: this.state.previewData,
                fieldInfo: this.fieldInfo,
                showActions: this.props.showActions,
                customTemplate: this.props.customTemplate,
                onActionClick: this.handleAction.bind(this),
                onViewRecord: this.viewRecord.bind(this),
                onEditRecord: this.editRecord.bind(this),
            },
            {
                position: "right",
                popoverClass: "data-preview-card-popover",
                closeOnClickAway: true,
            }
        );
    }

    async handleAction(action, record) {
        try {
            switch (action) {
                case 'view':
                    await this.viewRecord(record);
                    break;
                case 'edit':
                    await this.editRecord(record);
                    break;
                case 'delete':
                    await this.deleteRecord(record);
                    break;
                case 'duplicate':
                    await this.duplicateRecord(record);
                    break;
            }
        } catch (error) {
            console.error(`Action ${action} failed:`, error);
        }
    }

    async viewRecord(record) {
        await this.actionService.doAction({
            type: 'ir.actions.act_window',
            res_model: this.state.previewData.model,
            res_id: record.id,
            views: [[false, 'form']],
            target: 'current',
        });
    }

    async editRecord(record) {
        await this.actionService.doAction({
            type: 'ir.actions.act_window',
            res_model: this.state.previewData.model,
            res_id: record.id,
            views: [[false, 'form']],
            target: 'new',
            context: { form_view_initial_mode: 'edit' },
        });
    }

    async deleteRecord(record) {
        const confirmed = confirm(`确定要删除 "${record.display_name}" 吗？`);
        if (!confirmed) return;
        
        await this.orm.unlink(this.state.previewData.model, [record.id]);
        await this.loadPreviewData(); // 重新加载数据
    }

    async duplicateRecord(record) {
        const duplicatedId = await this.orm.copy(
            this.state.previewData.model, 
            record.id
        );
        
        await this.actionService.doAction({
            type: 'ir.actions.act_window',
            res_model: this.state.previewData.model,
            res_id: duplicatedId,
            views: [[false, 'form']],
            target: 'new',
        });
    }

    formatFieldValue(record, fieldName) {
        const value = record[fieldName];
        if (!value) return '';
        
        // 处理关系字段
        if (Array.isArray(value) && value.length === 2) {
            return value[1]; // [id, name] 格式
        }
        
        // 处理日期字段
        if (fieldName.includes('_date') || fieldName.includes('date_')) {
            if (typeof value === 'string') {
                const date = new Date(value);
                return date.toLocaleDateString('zh-CN');
            }
        }
        
        // 处理金额字段
        if (fieldName.includes('amount') || fieldName.includes('price')) {
            if (typeof value === 'number') {
                return new Intl.NumberFormat('zh-CN', {
                    style: 'currency',
                    currency: 'CNY'
                }).format(value);
            }
        }
        
        // 处理状态字段
        if (fieldName === 'state') {
            const stateLabels = {
                'draft': '草稿',
                'sent': '已发送',
                'sale': '销售订单',
                'done': '完成',
                'cancel': '已取消',
                'confirmed': '已确认',
                'assigned': '已分配',
                'partially_available': '部分可用',
                'waiting': '等待中',
            };
            return stateLabels[value] || value;
        }
        
        return value.toString();
    }

    getRecordIcon(record, model) {
        const iconMap = {
            'res.partner': record.is_company ? 'fa-building' : 'fa-user',
            'sale.order': 'fa-shopping-cart',
            'purchase.order': 'fa-shopping-bag',
            'account.move': 'fa-file-text-o',
            'stock.picking': 'fa-truck',
            'project.project': 'fa-folder-o',
            'project.task': 'fa-tasks',
            'hr.employee': 'fa-user',
            'product.product': 'fa-cube',
        };
        
        return iconMap[model] || 'fa-file-o';
    }
}

// 预览卡片弹出组件
class DataPreviewCardPopover extends Component {
    static template = "web.DataPreviewCardPopover";
    static props = {
        data: Object,
        fieldInfo: Object,
        showActions: { type: Boolean, optional: true },
        customTemplate: { type: String, optional: true },
        onActionClick: Function,
        onViewRecord: Function,
        onEditRecord: Function,
        close: Function,
    };

    getStateClass(state) {
        const stateClasses = {
            'draft': 'state-draft',
            'sent': 'state-sent',
            'sale': 'state-confirmed',
            'done': 'state-done',
            'cancel': 'state-cancelled',
            'confirmed': 'state-confirmed',
            'assigned': 'state-assigned',
        };
        return stateClasses[state] || 'state-default';
    }

    getAvailableActions(record) {
        const actions = [
            { key: 'view', label: '查看', icon: 'fa-eye' },
            { key: 'edit', label: '编辑', icon: 'fa-edit' },
        ];
        
        // 根据记录状态添加条件性操作
        if (record.state !== 'done' && record.state !== 'cancel') {
            actions.push({ key: 'duplicate', label: '复制', icon: 'fa-copy' });
        }
        
        if (record.state === 'draft') {
            actions.push({ 
                key: 'delete', 
                label: '删除', 
                icon: 'fa-trash', 
                class: 'action-danger' 
            });
        }
        
        return actions;
    }
}

// XML模板
`<t t-name="web.DataPreviewCardWidget">
    <div class="data-preview-card-widget">
        <span t-ref="previewTrigger" 
              class="preview-trigger"
              t-on-click="showPreviewCard"
              t-att-class="state.previewData ? 'has-data' : 'no-data'">
            
            <span class="display-value" t-esc="displayValue"/>
            
            <i t-if="state.loading" class="fa fa-spinner fa-spin loading-icon"/>
            <i t-elif="state.error" class="fa fa-exclamation-triangle error-icon"/>
            <i t-elif="state.previewData" class="fa fa-eye preview-icon"/>
            <i t-else="" class="fa fa-question-circle empty-icon"/>
        </span>
    </div>
</t>

<t t-name="web.DataPreviewCardPopover">
    <div class="data-preview-card-content">
        <!-- 头部信息 -->
        <div class="preview-header">
            <div class="model-info">
                <i class="fa fa-database"/>
                <span t-esc="props.data.model"/>
                <span t-if="props.data.hasMore" class="record-count">
                    (显示 <t t-esc="props.data.records.length"/> / <t t-esc="props.data.totalCount"/>)
                </span>
            </div>
            <button class="close-btn" t-on-click="props.close">
                <i class="fa fa-times"/>
            </button>
        </div>

        <!-- 记录列表 -->
        <div class="records-list">
            <div t-foreach="props.data.records" t-as="record" class="record-card">
                
                <!-- 记录头部 -->
                <div class="record-header">
                    <div class="record-icon">
                        <i t-att-class="'fa ' + this.parent.getRecordIcon(record, props.data.model)"/>
                    </div>
                    
                    <div class="record-title">
                        <strong t-esc="record.display_name || record.name"/>
                        <div t-if="record.state" 
                             t-att-class="'record-state ' + getStateClass(record.state)">
                            <t t-esc="this.parent.formatFieldValue(record, 'state')"/>
                        </div>
                    </div>
                    
                    <div t-if="props.showActions" class="record-actions-trigger">
                        <button class="actions-btn" 
                                t-att-id="'actions-' + record.id"
                                t-on-click="(ev) => this.showActions(ev, record)">
                            <i class="fa fa-ellipsis-v"/>
                        </button>
                    </div>
                </div>

                <!-- 记录详情 -->
                <div class="record-details">
                    <div t-foreach="Object.keys(record)" t-as="fieldName"
                         t-if="fieldName !== 'id' and fieldName !== 'display_name' and fieldName !== 'name' and fieldName !== 'state'"
                         class="detail-row">
                        
                        <span class="field-label" t-esc="fieldName.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())"/>:
                        <span class="field-value" t-esc="this.parent.formatFieldValue(record, fieldName)"/>
                    </div>
                </div>

                <!-- 快速操作 -->
                <div t-if="props.showActions" class="record-quick-actions">
                    <button t-foreach="getAvailableActions(record)" t-as="action"
                            t-att-class="'quick-action-btn ' + (action.class or '')"
                            t-on-click="() => this.props.onActionClick(action.key, record)"
                            t-att-title="action.label">
                        <i t-att-class="'fa ' + action.icon"/>
                    </button>
                </div>
            </div>
        </div>

        <!-- 底部操作 -->
        <div t-if="props.data.hasMore or props.showActions" class="preview-footer">
            <button t-if="props.data.hasMore" 
                    class="view-all-btn"
                    t-on-click="() => this.viewAllRecords()">
                <i class="fa fa-list"/> 查看全部 (<t t-esc="props.data.totalCount"/>)
            </button>
        </div>
    </div>
</t>`

// SCSS样式
`.data-preview-card-widget {
    display: inline-block;
    
    .preview-trigger {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 8px;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s ease;
        text-decoration: none;
        color: inherit;
        
        &:hover {
            background: rgba(0,123,255,0.1);
            color: #007bff;
        }
        
        &.has-data {
            .preview-icon {
                color: #28a745;
            }
        }
        
        &.no-data {
            opacity: 0.6;
            
            .empty-icon {
                color: #6c757d;
            }
        }
        
        .display-value {
            max-width: 200px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        
        .loading-icon {
            color: #007bff;
        }
        
        .error-icon {
            color: #dc3545;
        }
        
        .preview-icon {
            font-size: 12px;
            opacity: 0.7;
        }
    }
}

.data-preview-card-popover {
    min-width: 350px;
    max-width: 450px;
    
    .data-preview-card-content {
        .preview-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 12px;
            border-bottom: 1px solid #e9ecef;
            background: #f8f9fa;
            
            .model-info {
                display: flex;
                align-items: center;
                gap: 6px;
                font-size: 12px;
                color: #6c757d;
                
                .record-count {
                    font-size: 11px;
                    color: #495057;
                }
            }
            
            .close-btn {
                border: none;
                background: none;
                padding: 4px;
                cursor: pointer;
                color: #6c757d;
                border-radius: 3px;
                
                &:hover {
                    background: #e9ecef;
                    color: #495057;
                }
            }
        }
        
        .records-list {
            max-height: 400px;
            overflow-y: auto;
            
            .record-card {
                padding: 12px;
                border-bottom: 1px solid #f8f9fa;
                transition: background-color 0.15s ease;
                
                &:hover {
                    background: #f8f9fa;
                }
                
                &:last-child {
                    border-bottom: none;
                }
                
                .record-header {
                    display: flex;
                    align-items: flex-start;
                    gap: 10px;
                    margin-bottom: 8px;
                    
                    .record-icon {
                        width: 20px;
                        text-align: center;
                        color: #007bff;
                        margin-top: 2px;
                        flex-shrink: 0;
                    }
                    
                    .record-title {
                        flex: 1;
                        min-width: 0;
                        
                        strong {
                            font-size: 14px;
                            color: #212529;
                            display: block;
                            margin-bottom: 4px;
                            word-break: break-word;
                        }
                        
                        .record-state {
                            display: inline-block;
                            padding: 2px 6px;
                            border-radius: 12px;
                            font-size: 10px;
                            font-weight: 500;
                            text-transform: uppercase;
                            
                            &.state-draft {
                                background: #e9ecef;
                                color: #6c757d;
                            }
                            
                            &.state-confirmed {
                                background: #d4edda;
                                color: #155724;
                            }
                            
                            &.state-done {
                                background: #d1ecf1;
                                color: #0c5460;
                            }
                            
                            &.state-cancelled {
                                background: #f8d7da;
                                color: #721c24;
                            }
                        }
                    }
                    
                    .record-actions-trigger {
                        .actions-btn {
                            border: none;
                            background: none;
                            padding: 4px 6px;
                            cursor: pointer;
                            color: #6c757d;
                            border-radius: 3px;
                            
                            &:hover {
                                background: #e9ecef;
                                color: #495057;
                            }
                        }
                    }
                }
                
                .record-details {
                    margin-left: 30px;
                    margin-bottom: 8px;
                    
                    .detail-row {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 3px;
                        font-size: 11px;
                        
                        .field-label {
                            color: #6c757d;
                            font-weight: 500;
                            margin-right: 8px;
                            min-width: 80px;
                            text-transform: capitalize;
                        }
                        
                        .field-value {
                            color: #495057;
                            text-align: right;
                            word-break: break-word;
                            flex: 1;
                        }
                    }
                }
                
                .record-quick-actions {
                    display: flex;
                    gap: 4px;
                    margin-left: 30px;
                    
                    .quick-action-btn {
                        border: none;
                        background: #f8f9fa;
                        padding: 4px 6px;
                        border-radius: 3px;
                        cursor: pointer;
                        color: #6c757d;
                        font-size: 11px;
                        transition: all 0.15s ease;
                        
                        &:hover {
                            background: #e9ecef;
                            color: #495057;
                        }
                        
                        &.action-danger {
                            &:hover {
                                background: #f8d7da;
                                color: #721c24;
                            }
                        }
                    }
                }
            }
        }
        
        .preview-footer {
            padding: 8px 12px;
            border-top: 1px solid #e9ecef;
            background: #f8f9fa;
            text-align: center;
            
            .view-all-btn {
                border: 1px solid #007bff;
                background: white;
                color: #007bff;
                padding: 6px 12px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                transition: all 0.15s ease;
                
                &:hover {
                    background: #007bff;
                    color: white;
                }
                
                .fa {
                    margin-right: 4px;
                }
            }
        }
    }
}`
```

## 最佳实践

### 性能优化建议
1. **懒加载数据**: 只在popover显示时才加载数据，避免不必要的网络请求
2. **缓存机制**: 对频繁访问的数据实现适当的缓存策略
3. **虚拟滚动**: 对大量数据列表实现虚拟滚动，提升渲染性能
4. **防抖处理**: 对用户输入和交互进行防抖处理，减少API调用频率
5. **内存管理**: 及时清理不需要的DOM元素和事件监听器

### 用户体验优化
1. **加载状态**: 提供清晰的加载状态指示，让用户了解操作进度
2. **错误处理**: 实现友好的错误提示和恢复机制
3. **响应式设计**: 确保popover在不同屏幕尺寸下都能正常工作
4. **动画效果**: 使用平滑的动画过渡，提升视觉体验
5. **快捷键支持**: 为常用操作提供键盘快捷键支持

### 开发建议
1. **组件复用**: 创建通用的popover组件模板，避免重复代码
2. **配置驱动**: 通过配置文件管理不同场景下的popover行为
3. **类型安全**: 使用TypeScript或JSDoc提供类型定义
4. **测试覆盖**: 编写完整的单元测试和集成测试
5. **文档完善**: 提供详细的API文档和使用示例

### 安全考虑
1. **数据权限验证**: 确保只显示用户有权限查看的数据
2. **输入验证**: 对所有用户输入进行严格的验证和过滤
3. **XSS防护**: 防止跨站脚本攻击，特别是在动态内容中
4. **CSRF保护**: 实现跨站请求伪造防护机制
5. **敏感信息保护**: 避免在客户端暴露敏感的系统信息

### 国际化支持
1. **多语言文本**: 所有用户界面文本都应支持国际化
2. **日期时间格式**: 根据用户区域设置格式化日期和时间
3. **数字格式**: 支持不同地区的数字和货币格式
4. **文本方向**: 支持从右到左(RTL)的文本方向

### 移动端适配
1. **触摸友好**: 确保按钮和交互元素足够大，便于触摸操作
2. **屏幕适配**: 在小屏幕设备上合理调整popover的大小和位置
3. **手势支持**: 支持滑动、捏合等移动端手势操作
4. **性能优化**: 针对移动设备的性能特点进行优化

## 集成指南

### 在现有项目中集成

#### 1. 添加依赖
```javascript
// 在你的组件中导入所需模块
import { usePopover } from "@web/core/popover/popover_hook";
import { useService } from "@web/core/utils/hooks";
```

#### 2. 基本集成示例
```javascript
export class MyCustomWidget extends Component {
    static template = "my_module.MyCustomWidget";
    
    setup() {
        // 初始化popover hook
        this.popover = usePopover();
        
        // 其他服务
        this.orm = useService("orm");
        this.notification = useService("notification");
    }
    
    showPopover(event) {
        this.popover.add(
            event.target,
            MyPopoverContent,
            { data: this.getData() },
            { 
                position: "bottom",
                closeOnClickAway: true,
                popoverClass: "my-custom-popover"
            }
        );
    }
}
```

#### 3. 样式定制
```scss
// 在你的SCSS文件中添加自定义样式
.my-custom-popover {
    .o_popover {
        border: 2px solid #007bff;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,123,255,0.3);
        
        .popover-arrow {
            border-color: #007bff;
        }
    }
}
```

### 模块化配置

#### 1. 创建配置文件
```javascript
// popover_config.js
export const POPOVER_CONFIGS = {
    quickAction: {
        position: "bottom",
        closeOnClickAway: true,
        popoverClass: "quick-action-popover"
    },
    dataFilter: {
        position: "bottom",
        closeOnClickAway: true,
        popoverClass: "data-filter-popover"
    },
    dataPreview: {
        position: "right",
        closeOnClickAway: true,
        popoverClass: "data-preview-popover"
    }
};
```

#### 2. 使用配置
```javascript
import { POPOVER_CONFIGS } from './popover_config';

// 在组件中使用预定义配置
showQuickActions() {
    this.popover.add(
        this.triggerRef.el,
        QuickActionComponent,
        this.getActionData(),
        POPOVER_CONFIGS.quickAction
    );
}
```

## 故障排除

### 常见问题及解决方案

#### 1. Popover位置错误
**问题**: Popover显示在错误的位置
**解决方案**:
- 检查目标元素是否已正确渲染到DOM
- 确认目标元素的位置和尺寸计算正确
- 验证position参数是否设置正确

```javascript
// 确保目标元素存在且已渲染
if (this.targetRef.el && this.targetRef.el.isConnected) {
    this.popover.add(this.targetRef.el, Component, props, options);
}
```

#### 2. 内存泄漏
**问题**: 组件卸载后popover仍然存在
**解决方案**:
- 使用usePopover hook自动管理生命周期
- 在组件卸载时手动清理popover

```javascript
// 推荐: 使用hook自动管理
const popover = usePopover();

// 手动管理时的清理
onWillUnmount(() => {
    if (this.closePopover) {
        this.closePopover();
    }
});
```

#### 3. 点击事件冲突
**问题**: 点击popover内容时意外关闭
**解决方案**:
- 使用preventClose回调函数控制关闭行为
- 正确设置事件冒泡

```javascript
this.popover.add(
    target,
    Component,
    props,
    {
        preventClose: (event) => {
            // 阻止在特定元素上的点击关闭popover
            return event.target.closest('.no-close-area');
        }
    }
);
```

#### 4. 样式冲突
**问题**: Popover样式与其他组件冲突
**解决方案**:
- 使用CSS模块或作用域样式
- 提高选择器优先级
- 使用自定义CSS类名

```scss
// 使用更具体的选择器
.my-module {
    .o_popover {
        &.my-custom-popover {
            // 自定义样式
            z-index: 9999;
            
            .popover-content {
                background: white;
                border: 1px solid #ddd;
            }
        }
    }
}
```

### 调试技巧

#### 1. 开启调试模式
```javascript
// 在开发环境中添加调试信息
if (odoo.debug) {
    console.log('Popover created:', {
        target: target,
        component: Component.name,
        props: props,
        options: options
    });
}
```

#### 2. 检查DOM结构
```javascript
// 检查popover是否正确添加到DOM
const popoverContainer = document.querySelector('.o_popover_container');
console.log('Popover container:', popoverContainer);
console.log('Active popovers:', popoverContainer.children.length);
```

#### 3. 性能监控
```javascript
// 监控popover创建和销毁的性能
console.time('popover-creation');
const closePopover = this.popover.add(target, Component, props, options);
console.timeEnd('popover-creation');

// 监控内存使用
if (performance.memory) {
    console.log('Memory usage:', performance.memory);
}
```

## API参考

### PopoverService API

#### add(target, Component, props, options)
创建并显示一个popover。

**参数:**
- `target` (HTMLElement|string): 目标元素或CSS选择器
- `Component` (Component): 要渲染的OWL组件
- `props` (Object): 传递给组件的属性
- `options` (Object): 配置选项
  - `position` (string): 位置 - 'top'|'bottom'|'left'|'right'
  - `closeOnClickAway` (boolean): 点击外部是否关闭，默认true
  - `onClose` (Function): 关闭时的回调函数
  - `preventClose` (Function): 阻止关闭的条件判断函数
  - `popoverClass` (string): 自定义CSS类名
  - `onPositioned` (Function): 定位完成后的回调

**返回值:**
- `Function`: 用于关闭popover的函数

**示例:**
```javascript
const closeFn = this.popover.add(
    this.buttonRef.el,
    MyPopoverContent,
    { message: "Hello World" },
    {
        position: "bottom",
        closeOnClickAway: true,
        onClose: () => console.log("Popover closed")
    }
);
```

### usePopover Hook API

#### add(target, Component, props, options)
与PopoverService的add方法相同，但会自动管理组件的生命周期。

**特性:**
- 组件卸载时自动清理所有创建的popover
- 自动处理组件状态同步
- 提供更简洁的API

### Popover组件 Props

#### 必需属性
- `target` (HTMLElement): 目标元素引用

#### 可选属性
- `id` (Number): popover的唯一标识符
- `position` (String): 显示位置，默认'bottom'
- `popoverClass` (String): 自定义CSS类名
- `onPositioned` (Function): 定位完成回调
- `slots` (Object): 插槽内容

## 总结

Odoo 16的popover系统为开发者提供了强大而灵活的浮层解决方案。通过本文的详细分析和三个实用widget示例，我们可以看到：

### 核心优势
1. **完整的架构设计** - 从服务层到展示层的完整解决方案
2. **智能定位系统** - 支持8个方向的自动定位和碰撞检测
3. **生命周期管理** - 完善的创建、显示、隐藏、销毁管理机制
4. **高度可定制** - 支持自定义样式、模板和行为
5. **性能优化** - 高效的事件处理和内存管理

### 实用Widget展示
通过三个完整的widget实现，我们展示了不同应用场景：

1. **快捷操作菜单Widget** - 上下文操作的完整解决方案
   - 支持多种操作类型（方法调用、数据更新、向导、下载等）
   - 完整的错误处理和用户反馈
   - 灵活的触发器样式和配置选项

2. **数据筛选器Widget** - 高级筛选功能的实现
   - 多条件组合筛选
   - 快速筛选和保存筛选功能
   - 标签页式的用户界面设计

3. **数据预览卡片Widget** - 关联数据的展示方案
   - 智能的数据加载和字段选择
   - 丰富的数据格式化和展示
   - 完整的记录操作支持

### 开发价值
- **降低开发成本** - 提供了可复用的组件和模式
- **提升用户体验** - 统一的交互方式和视觉效果
- **增强可维护性** - 清晰的架构和标准化的实现
- **支持扩展性** - 插件系统和配置化的设计

### 最佳实践指导
文档还提供了完整的最佳实践指导，包括性能优化、用户体验设计、开发建议、安全考虑等各个方面，为实际项目开发提供了全面的参考。

无论是初学者还是经验丰富的开发者，都可以从这个详细的分析和实用示例中获得有价值的知识和经验，快速掌握Odoo 16 popover系统的使用和扩展开发。