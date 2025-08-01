# Odoo 16 快捷键(Hotkeys)系统详细分析与实用Widget实现

## 目录
1. [系统概述](#系统概述)
2. [架构分析](#架构分析)
3. [文件结构](#文件结构)
4. [使用示例](#使用示例)
5. [实用Widget实现](#实用widget实现)
6. [最佳实践](#最佳实践)

## 系统概述

Odoo 16的hotkeys(快捷键)系统是一个强大而灵活的键盘交互管理解决方案，基于OWL框架构建。该系统提供了统一的快捷键注册、管理和分发机制，支持全局和局部快捷键、可视化快捷键提示、以及智能的冲突解决策略。

### 核心特性
- **智能键盘事件处理**: 支持组合键、修饰键识别和跨平台兼容性
- **分层权限管理**: 支持全局、局部和区域限制的快捷键
- **可视化提示系统**: Alt键触发的快捷键覆盖层显示
- **编辑保护机制**: 自动保护可编辑元素的键盘输入
- **动态注册管理**: 支持运行时注册和注销快捷键
- **跨框架支持**: 支持iframe中的快捷键处理

## 架构分析

### 目录结构
```
addons/web/static/src/core/hotkeys/
├── hotkey_service.js    # 核心快捷键服务实现
└── hotkey_hook.js       # OWL hooks集成
```

### 组件层次结构
```
HotkeyService (服务层)
├── 键盘事件监听器 (Browser Event Listeners)
├── 快捷键注册表 (Registration Map)
├── 覆盖层管理器 (Overlay Manager)
├── 分发器 (Dispatcher)
└── useHotkey Hook (钩子函数)
```

### 详细文件分析

#### 1. hotkey_service.js (`addons/web/static/src/core/hotkeys/hotkey_service.js:1-447`)
这是快捷键系统的核心服务，负责所有快捷键的注册、管理和分发。

##### 核心常量定义
```javascript
const ALPHANUM_KEYS = "abcdefghijklmnopqrstuvwxyz0123456789".split("");
const NAV_KEYS = [
    "arrowleft", "arrowright", "arrowup", "arrowdown",
    "pageup", "pagedown", "home", "end", "backspace", 
    "enter", "tab", "delete", "space"
];
const MODIFIERS = ["alt", "control", "shift"];
const AUTHORIZED_KEYS = [...ALPHANUM_KEYS, ...NAV_KEYS, "escape"];
```

**关键特性**:
- **键盘兼容性**: 支持字母数字键、导航键和修饰键
- **跨平台支持**: Mac OS和Windows/Linux的修饰键映射
- **安全白名单**: 只允许授权的键作为快捷键

##### 活动快捷键检测 (`getActiveHotkey` 函数)
```javascript
export function getActiveHotkey(ev) {
    const hotkey = [];
    
    // 跨平台修饰键处理
    if (isMacOS() ? ev.ctrlKey : ev.altKey) {
        hotkey.push("alt");
    }
    if (isMacOS() ? ev.metaKey : ev.ctrlKey) {
        hotkey.push("control");
    }
    if (ev.shiftKey) {
        hotkey.push("shift");
    }
    
    // 键值处理和标准化
    let key = ev.key.toLowerCase();
    if (!MODIFIERS.includes(key)) {
        hotkey.push(key);
    }
    return hotkey.join("+");
}
```

**智能特性**:
- **IME支持**: 处理输入法组合状态
- **数字键识别**: 区分主键盘和数字键盘
- **非拉丁键盘**: 支持非英文键盘布局
- **修饰键去重**: 避免重复的修饰键

##### 快捷键分发机制 (`dispatch` 函数)
```javascript
function dispatch(infos) {
    const { activeElement, hotkey, isRepeated, target, shouldProtectEditable } = infos;
    
    // 获取所有候选注册
    const reversedRegistrations = Array.from(registrations.values()).reverse();
    const domRegistrations = getDomRegistrations(hotkey, activeElement);
    const allRegistrations = reversedRegistrations.concat(domRegistrations);
    
    // 筛选符合条件的候选者
    const candidates = allRegistrations.filter(
        (reg) =>
            reg.hotkey === hotkey &&
            (reg.allowRepeat || !isRepeated) &&
            (reg.bypassEditableProtection || !shouldProtectEditable) &&
            (reg.global || reg.activeElement === activeElement) &&
            (!reg.validate || reg.validate(target)) &&
            (!reg.area || (target instanceof Node && reg.area() && reg.area().contains(target)))
    );
    
    // 选择最佳匹配
    let winner = candidates.shift();
    if (winner && winner.area) {
        // 选择最近的区域限制
        for (const candidate of candidates.filter((c) => Boolean(c.area))) {
            if (candidate.area() && winner.area().contains(candidate.area())) {
                winner = candidate;
            }
        }
    }
    
    // 执行回调
    if (winner) {
        winner.callback({ area: winner.area && winner.area(), target });
        return true;
    }
    return false;
}
```

**优先级机制**:
1. **程序注册优先**: 通过`hotkeyService.add()`注册的快捷键优先
2. **最新注册优先**: 后注册的快捷键覆盖先注册的
3. **区域最小优先**: 最小作用域的快捷键获得优先权
4. **DOM属性支持**: 支持HTML `data-hotkey`属性

##### 可视化覆盖层系统
```javascript
function addHotkeyOverlays(activeElement) {
    for (const el of getVisibleElements(activeElement, "[data-hotkey]:not(:disabled)")) {
        const hotkey = el.dataset.hotkey;
        const overlay = document.createElement("div");
        overlay.classList.add(
            "o_web_hotkey_overlay", "position-absolute", "top-0", "bottom-0",
            "start-0", "end-0", "d-flex", "justify-content-center", 
            "align-items-center", "m-0", "bg-black-50", "h6"
        );
        
        const overlayKbd = document.createElement("kbd");
        overlayKbd.className = "small";
        overlayKbd.appendChild(document.createTextNode(hotkey.toUpperCase()));
        overlay.appendChild(overlayKbd);
        
        // 特殊处理INPUT元素
        let overlayParent = el.tagName.toUpperCase() === "INPUT" ? el.parentElement : el;
        if (overlayParent.style.position !== "absolute") {
            overlayParent.style.position = "relative";
        }
        overlayParent.appendChild(overlay);
    }
    overlaysVisible = true;
}
```

**可视化特性**:
- **Alt键触发**: 按住Alt键显示所有可用快捷键
- **Bootstrap样式**: 使用Bootstrap类名保持一致性
- **智能定位**: 自动处理元素的相对定位
- **可访问性**: 使用`<kbd>`元素提供语义化标记

##### 服务API接口
```javascript
return {
    add(hotkey, callback, options = {}) {
        const token = registerHotkey(hotkey, callback, options);
        return () => { unregisterHotkey(token); };
    },
    registerIframe(iframe) {
        addListeners(iframe.contentWindow);
    },
};
```

**配置选项** (`HotkeyOptions`):
- `allowRepeat`: 允许按键重复触发
- `bypassEditableProtection`: 绕过可编辑元素保护
- `global`: 全局快捷键，不受UI元素限制
- `area`: 限制快捷键作用区域的函数
- `validate`: 自定义验证函数

#### 2. hotkey_hook.js (`addons/web/static/src/core/hotkeys/hotkey_hook.js:7-21`)
提供OWL组件集成的简化Hook。

```javascript
export function useHotkey(hotkey, callback, options = {}) {
    const hotkeyService = useService("hotkey");
    useEffect(
        () => hotkeyService.add(hotkey, callback, options),
        () => []
    );
}
```

**优势**:
- **自动生命周期**: 组件挂载时注册，卸载时自动清理
- **简化API**: 无需手动管理注册令牌
- **OWL集成**: 完美集成OWL组件系统

## 使用示例

### 基础快捷键注册
```javascript
import { useHotkey } from "@web/core/hotkeys/hotkey_hook";

class MyComponent extends Component {
    setup() {
        // 简单快捷键
        useHotkey("escape", () => {
            this.closeDialog();
        });
        
        // 组合快捷键
        useHotkey("control+s", () => {
            this.saveRecord();
        });
        
        // 带选项的快捷键
        useHotkey("control+shift+d", () => {
            this.duplicateRecord();
        }, {
            global: true,
            allowRepeat: false
        });
    }
}
```

### 服务直接使用
```javascript
import { useService } from "@web/core/utils/hooks";

class AdvancedComponent extends Component {
    setup() {
        this.hotkeyService = useService("hotkey");
        
        // 动态注册
        this.unregisterHotkey = this.hotkeyService.add(
            "control+enter",
            (context) => {
                console.log("Hotkey triggered in area:", context.area);
                this.submitForm();
            },
            {
                area: () => this.formRef.el,
                validate: (target) => !target.disabled
            }
        );
    }
    
    willUnmount() {
        // 手动清理
        this.unregisterHotkey();
    }
}
```

### HTML属性方式
```html
<!-- 简单的data-hotkey属性 -->
<button data-hotkey="s">保存</button>
<button data-hotkey="c">取消</button>
<input type="text" data-hotkey="f" placeholder="搜索..."/>

<!-- Alt + 对应字母键触发 -->
<div class="toolbar">
    <button data-hotkey="n">新建</button>
    <button data-hotkey="e">编辑</button>
    <button data-hotkey="d">删除</button>
</div>
```

## 实用Widget实现

### 1. 快捷键面板Widget - 动态快捷键管理器

**使用场景**: 为复杂应用提供快捷键管理面板，支持动态启用/禁用、自定义绑定和快捷键冲突检测。

```javascript
/** @odoo-module **/
import { Component } from "@odoo/owl";
import { useHotkey } from "@web/core/hotkeys/hotkey_hook";
import { useService } from "@web/core/utils/hooks";
import { useRef, useState, onWillStart } from "@odoo/owl";

export class HotkeysPanelWidget extends Component {
    static template = "web.HotkeysPanelWidget";
    static props = {
        shortcuts: { type: Array, optional: true },
        allowCustomization: { type: Boolean, optional: true },
        showCategories: { type: Boolean, optional: true },
        onShortcutChange: { type: Function, optional: true },
    };

    setup() {
        this.hotkeyService = useService("hotkey");
        this.localStorage = useService("local_storage");
        this.notification = useService("notification");
        
        this.state = useState({
            shortcuts: [],
            categories: new Map(),
            activeCategory: 'all',
            searchTerm: '',
            editingShortcut: null,
            customShortcuts: new Map(),
            conflicts: new Set(),
            showConflicts: false,
        });
        
        this.panelRef = useRef("panel");
        this.searchRef = useRef("search");
        
        // 注册面板管理快捷键
        useHotkey("control+shift+k", () => {
            this.togglePanel();
        }, { global: true });
        
        useHotkey("escape", () => {
            if (this.state.editingShortcut) {
                this.cancelEdit();
            }
        });
        
        onWillStart(async () => {
            await this.loadShortcuts();
            await this.loadCustomShortcuts();
            this.detectConflicts();
        });
    }

    get defaultShortcuts() {
        return [
            {
                id: 'save',
                category: 'general',
                label: '保存',
                description: '保存当前记录或文档',
                hotkey: 'control+s',
                action: 'save_record',
                enabled: true,
                customizable: true,
                icon: 'fa-save'
            },
            {
                id: 'new',
                category: 'general', 
                label: '新建',
                description: '创建新记录',
                hotkey: 'control+n',
                action: 'create_record',
                enabled: true,
                customizable: true,
                icon: 'fa-plus'
            },
            {
                id: 'edit',
                category: 'general',
                label: '编辑',
                description: '编辑当前记录',
                hotkey: 'control+e',
                action: 'edit_record',
                enabled: true,
                customizable: true,
                icon: 'fa-edit'
            },
            {
                id: 'delete',
                category: 'general',
                label: '删除',
                description: '删除当前记录',
                hotkey: 'control+shift+d',
                action: 'delete_record',
                enabled: true,
                customizable: true,
                icon: 'fa-trash',
                dangerous: true
            },
            {
                id: 'duplicate',
                category: 'general',
                label: '复制',
                description: '复制当前记录',
                hotkey: 'control+shift+c',
                action: 'duplicate_record',
                enabled: true,
                customizable: true,
                icon: 'fa-copy'
            },
            {
                id: 'search',
                category: 'navigation',
                label: '搜索',
                description: '打开搜索框',
                hotkey: 'control+f',
                action: 'open_search',
                enabled: true,
                customizable: true,
                icon: 'fa-search'
            },
            {
                id: 'list_view',
                category: 'navigation',
                label: '列表视图',
                description: '切换到列表视图',
                hotkey: 'control+shift+l',
                action: 'switch_list_view',
                enabled: true,
                customizable: true,
                icon: 'fa-list'
            },
            {
                id: 'form_view',
                category: 'navigation',
                label: '表单视图',
                description: '切换到表单视图',
                hotkey: 'control+shift+f',
                action: 'switch_form_view',
                enabled: true,
                customizable: true,
                icon: 'fa-wpforms'
            },
            {
                id: 'refresh',
                category: 'navigation',
                label: '刷新',
                description: '刷新当前视图',
                hotkey: 'f5',
                action: 'refresh_view',
                enabled: true,
                customizable: false,
                icon: 'fa-refresh'
            },
            {
                id: 'help',
                category: 'system',
                label: '帮助',
                description: '显示帮助信息',
                hotkey: 'f1',
                action: 'show_help',
                enabled: true,
                customizable: false,
                icon: 'fa-question-circle'
            },
            {
                id: 'debug',
                category: 'system',
                label: '调试模式',
                description: '切换调试模式',
                hotkey: 'control+shift+alt+d',
                action: 'toggle_debug',
                enabled: false,
                customizable: true,
                icon: 'fa-bug'
            },
        ];
    }

    get availableCategories() {
        const categories = new Map([
            ['all', { label: '全部', icon: 'fa-th-large' }],
            ['general', { label: '常规操作', icon: 'fa-cog' }],
            ['navigation', { label: '导航', icon: 'fa-compass' }],
            ['system', { label: '系统', icon: 'fa-desktop' }],
        ]);
        
        if (this.state.customShortcuts.size > 0) {
            categories.set('custom', { label: '自定义', icon: 'fa-user' });
        }
        
        return categories;
    }

    get filteredShortcuts() {
        let shortcuts = this.state.shortcuts;
        
        // 分类筛选
        if (this.state.activeCategory !== 'all') {
            if (this.state.activeCategory === 'custom') {
                shortcuts = Array.from(this.state.customShortcuts.values());
            } else {
                shortcuts = shortcuts.filter(s => s.category === this.state.activeCategory);
            }
        }
        
        // 搜索筛选
        if (this.state.searchTerm) {
            const term = this.state.searchTerm.toLowerCase();
            shortcuts = shortcuts.filter(s =>
                s.label.toLowerCase().includes(term) ||
                s.description.toLowerCase().includes(term) ||
                s.hotkey.toLowerCase().includes(term)
            );
        }
        
        // 冲突筛选
        if (this.state.showConflicts) {
            shortcuts = shortcuts.filter(s => this.state.conflicts.has(s.id));
        }
        
        return shortcuts.sort((a, b) => a.label.localeCompare(b.label, 'zh-CN'));
    }

    async loadShortcuts() {
        // 合并默认快捷键和用户自定义快捷键
        const defaultShortcuts = this.defaultShortcuts;
        const userShortcuts = this.props.shortcuts || [];
        
        this.state.shortcuts = [...defaultShortcuts, ...userShortcuts];
        
        // 按分类分组
        this.state.categories.clear();
        for (const shortcut of this.state.shortcuts) {
            if (!this.state.categories.has(shortcut.category)) {
                this.state.categories.set(shortcut.category, []);
            }
            this.state.categories.get(shortcut.category).push(shortcut);
        }
    }

    async loadCustomShortcuts() {
        try {
            const stored = this.localStorage.getItem('odoo_custom_shortcuts');
            if (stored) {
                const customShortcuts = JSON.parse(stored);
                for (const [id, shortcut] of Object.entries(customShortcuts)) {
                    this.state.customShortcuts.set(id, {
                        ...shortcut,
                        id,
                        category: 'custom',
                        customizable: true,
                    });
                }
            }
        } catch (error) {
            console.error('Failed to load custom shortcuts:', error);
        }
    }

    async saveCustomShortcuts() {
        try {
            const shortcuts = Object.fromEntries(this.state.customShortcuts);
            this.localStorage.setItem('odoo_custom_shortcuts', JSON.stringify(shortcuts));
        } catch (error) {
            console.error('Failed to save custom shortcuts:', error);
            this.notification.add('保存快捷键设置失败', { type: 'warning' });
        }
    }

    detectConflicts() {
        this.state.conflicts.clear();
        const hotkeyMap = new Map();
        
        // 收集所有快捷键
        const allShortcuts = [
            ...this.state.shortcuts,
            ...Array.from(this.state.customShortcuts.values())
        ];
        
        for (const shortcut of allShortcuts) {
            if (!shortcut.enabled) continue;
            
            if (hotkeyMap.has(shortcut.hotkey)) {
                // 发现冲突
                this.state.conflicts.add(shortcut.id);
                this.state.conflicts.add(hotkeyMap.get(shortcut.hotkey).id);
            } else {
                hotkeyMap.set(shortcut.hotkey, shortcut);
            }
        }
    }

    togglePanel() {
        this.state.panelVisible = !this.state.panelVisible;
        if (this.state.panelVisible && this.searchRef.el) {
            // 聚焦搜索框
            setTimeout(() => this.searchRef.el.focus(), 100);
        }
    }

    selectCategory(category) {
        this.state.activeCategory = category;
    }

    searchShortcuts(term) {
        this.state.searchTerm = term;
    }

    toggleShortcut(shortcut) {
        if (!shortcut.customizable) {
            return;
        }
        
        shortcut.enabled = !shortcut.enabled;
        this.detectConflicts();
        
        if (this.props.onShortcutChange) {
            this.props.onShortcutChange(shortcut);
        }
    }

    startEditShortcut(shortcut) {
        if (!shortcut.customizable) {
            return;
        }
        
        this.state.editingShortcut = {
            ...shortcut,
            originalHotkey: shortcut.hotkey,
            newHotkey: shortcut.hotkey,
            recording: false,
        };
    }

    cancelEdit() {
        this.state.editingShortcut = null;
    }

    startRecording() {
        if (!this.state.editingShortcut) return;
        
        this.state.editingShortcut.recording = true;
        this.state.editingShortcut.newHotkey = '';
        
        // 监听下一个键盘事件
        const handleKeyDown = (event) => {
            event.preventDefault();
            event.stopPropagation();
            
            const hotkey = this.getActiveHotkey(event);
            if (hotkey && hotkey !== 'escape') {
                this.state.editingShortcut.newHotkey = hotkey;
                this.state.editingShortcut.recording = false;
            }
            
            document.removeEventListener('keydown', handleKeyDown, true);
        };
        
        document.addEventListener('keydown', handleKeyDown, true);
    }

    getActiveHotkey(event) {
        // 简化版的getActiveHotkey实现
        const hotkey = [];
        
        if (event.altKey) hotkey.push("alt");
        if (event.ctrlKey) hotkey.push("control");
        if (event.shiftKey) hotkey.push("shift");
        
        const key = event.key.toLowerCase();
        if (!['alt', 'control', 'shift'].includes(key)) {
            hotkey.push(key);
        }
        
        return hotkey.join("+");
    }

    saveEdit() {
        if (!this.state.editingShortcut) return;
        
        const editing = this.state.editingShortcut;
        
        // 检查新快捷键是否已存在
        const conflict = this.state.shortcuts.find(s => 
            s.id !== editing.id && s.hotkey === editing.newHotkey && s.enabled
        );
        
        if (conflict) {
            this.notification.add(
                `快捷键 "${editing.newHotkey}" 已被 "${conflict.label}" 使用`,
                { type: 'warning' }
            );
            return;
        }
        
        // 更新快捷键
        const shortcut = this.state.shortcuts.find(s => s.id === editing.id) ||
                         this.state.customShortcuts.get(editing.id);
        
        if (shortcut) {
            shortcut.hotkey = editing.newHotkey;
            
            if (editing.category === 'custom') {
                this.saveCustomShortcuts();
            }
            
            this.detectConflicts();
            this.notification.add(
                `快捷键 "${shortcut.label}" 已更新为 "${editing.newHotkey}"`,
                { type: 'success' }
            );
        }
        
        this.state.editingShortcut = null;
    }

    createCustomShortcut() {
        const id = `custom_${Date.now()}`;
        const newShortcut = {
            id,
            category: 'custom',
            label: '自定义快捷键',
            description: '用户自定义的快捷键',
            hotkey: 'control+shift+u',
            action: 'custom_action',
            enabled: true,
            customizable: true,
            icon: 'fa-keyboard-o',
            custom: true,
        };
        
        this.state.customShortcuts.set(id, newShortcut);
        this.saveCustomShortcuts();
        this.startEditShortcut(newShortcut);
    }

    deleteCustomShortcut(shortcut) {
        if (!shortcut.custom) return;
        
        if (confirm(`确定要删除快捷键 "${shortcut.label}" 吗？`)) {
            this.state.customShortcuts.delete(shortcut.id);
            this.saveCustomShortcuts();
            this.detectConflicts();
            
            if (this.state.editingShortcut && this.state.editingShortcut.id === shortcut.id) {
                this.state.editingShortcut = null;
            }
        }
    }

    resetToDefaults() {
        if (confirm('确定要重置所有快捷键设置吗？这将清除所有自定义快捷键。')) {
            // 重置为默认状态
            for (const shortcut of this.state.shortcuts) {
                if (shortcut.customizable) {
                    const defaultShortcut = this.defaultShortcuts.find(d => d.id === shortcut.id);
                    if (defaultShortcut) {
                        shortcut.hotkey = defaultShortcut.hotkey;
                        shortcut.enabled = defaultShortcut.enabled;
                    }
                }
            }
            
            // 清除自定义快捷键
            this.state.customShortcuts.clear();
            this.localStorage.removeItem('odoo_custom_shortcuts');
            
            this.detectConflicts();
            this.notification.add('快捷键设置已重置', { type: 'success' });
        }
    }

    exportSettings() {
        const settings = {
            shortcuts: this.state.shortcuts.map(s => ({
                id: s.id,
                hotkey: s.hotkey,
                enabled: s.enabled,
            })),
            customShortcuts: Object.fromEntries(this.state.customShortcuts),
            version: '1.0',
            exportDate: new Date().toISOString(),
        };
        
        const blob = new Blob([JSON.stringify(settings, null, 2)], {
            type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'odoo_shortcuts_settings.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    async importSettings(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        try {
            const text = await file.text();
            const settings = JSON.parse(text);
            
            if (settings.version && settings.shortcuts) {
                // 导入快捷键设置
                for (const imported of settings.shortcuts) {
                    const shortcut = this.state.shortcuts.find(s => s.id === imported.id);
                    if (shortcut && shortcut.customizable) {
                        shortcut.hotkey = imported.hotkey;
                        shortcut.enabled = imported.enabled;
                    }
                }
                
                // 导入自定义快捷键
                if (settings.customShortcuts) {
                    this.state.customShortcuts.clear();
                    for (const [id, shortcut] of Object.entries(settings.customShortcuts)) {
                        this.state.customShortcuts.set(id, {
                            ...shortcut,
                            id,
                            category: 'custom',
                            customizable: true,
                        });
                    }
                    this.saveCustomShortcuts();
                }
                
                this.detectConflicts();
                this.notification.add('快捷键设置导入成功', { type: 'success' });
            } else {
                throw new Error('Invalid settings file format');
            }
        } catch (error) {
            console.error('Import failed:', error);
            this.notification.add('导入快捷键设置失败：文件格式错误', { type: 'danger' });
        }
        
        // 清除文件输入
        event.target.value = '';
    }
}

// XML模板
`<t t-name="web.HotkeysPanelWidget">
    <div class="hotkeys-panel-widget">
        <!-- 触发按钮 -->
        <button class="btn btn-outline-secondary btn-sm hotkeys-trigger"
                t-on-click="togglePanel"
                title="快捷键面板 (Ctrl+Shift+K)">
            <i class="fa fa-keyboard-o"/>
            <span class="d-none d-md-inline">快捷键</span>
        </button>
        
        <!-- 面板弹窗 -->
        <div t-if="state.panelVisible" class="hotkeys-panel-overlay">
            <div class="hotkeys-panel" t-ref="panel">
                <!-- 头部 -->
                <div class="panel-header">
                    <div class="panel-title">
                        <i class="fa fa-keyboard-o"/>
                        <span>快捷键管理</span>
                    </div>
                    <div class="panel-actions">
                        <button class="btn btn-sm btn-outline-secondary"
                                t-on-click="() => this.state.showConflicts = !this.state.showConflicts"
                                t-att-class="state.showConflicts ? 'active' : ''">
                            <i class="fa fa-exclamation-triangle"/>
                            <span t-if="state.conflicts.size > 0" class="badge badge-warning" t-esc="state.conflicts.size"/>
                        </button>
                        <button class="btn btn-sm btn-outline-secondary"
                                t-on-click="resetToDefaults">
                            <i class="fa fa-undo"/> 重置
                        </button>
                        <button class="btn btn-sm btn-outline-secondary"
                                t-on-click="exportSettings">
                            <i class="fa fa-download"/> 导出
                        </button>
                        <label class="btn btn-sm btn-outline-secondary mb-0">
                            <i class="fa fa-upload"/> 导入
                            <input type="file" accept=".json" 
                                   t-on-change="importSettings" 
                                   style="display: none;"/>
                        </label>
                        <button class="btn btn-sm btn-outline-danger"
                                t-on-click="togglePanel">
                            <i class="fa fa-times"/>
                        </button>
                    </div>
                </div>
                
                <!-- 搜索和筛选 -->
                <div class="panel-controls">
                    <div class="search-box">
                        <input type="text" 
                               class="form-control form-control-sm"
                               placeholder="搜索快捷键..."
                               t-ref="search"
                               t-model="state.searchTerm"
                               t-on-input="(ev) => this.searchShortcuts(ev.target.value)"/>
                        <i class="fa fa-search search-icon"/>
                    </div>
                    
                    <div class="category-tabs">
                        <button t-foreach="Array.from(availableCategories.entries())" t-as="entry"
                                t-att-class="'category-tab ' + (state.activeCategory === entry[0] ? 'active' : '')"
                                t-on-click="() => this.selectCategory(entry[0])">
                            <i t-att-class="'fa ' + entry[1].icon"/>
                            <span t-esc="entry[1].label"/>
                        </button>
                    </div>
                </div>
                
                <!-- 快捷键列表 -->
                <div class="shortcuts-list">
                    <div t-if="filteredShortcuts.length === 0" class="no-shortcuts">
                        <i class="fa fa-info-circle"/>
                        <span>没有找到匹配的快捷键</span>
                    </div>
                    
                    <div t-foreach="filteredShortcuts" t-as="shortcut" 
                         t-att-class="'shortcut-item ' + (shortcut.enabled ? 'enabled' : 'disabled') + (state.conflicts.has(shortcut.id) ? ' conflict' : '')">
                        
                        <div class="shortcut-info">
                            <div class="shortcut-header">
                                <i t-att-class="'fa ' + shortcut.icon + (shortcut.dangerous ? ' text-danger' : '')"/>
                                <span class="shortcut-label" t-esc="shortcut.label"/>
                                <span t-if="shortcut.custom" class="badge badge-info">自定义</span>
                                <span t-if="state.conflicts.has(shortcut.id)" class="badge badge-warning">冲突</span>
                            </div>
                            <div class="shortcut-description" t-esc="shortcut.description"/>
                        </div>
                        
                        <div class="shortcut-hotkey">
                            <kbd t-esc="shortcut.hotkey"/>
                        </div>
                        
                        <div class="shortcut-actions">
                            <button t-if="shortcut.customizable"
                                    class="btn btn-sm btn-outline-secondary"
                                    t-on-click="() => this.toggleShortcut(shortcut)"
                                    t-att-title="shortcut.enabled ? '禁用' : '启用'">
                                <i t-att-class="'fa ' + (shortcut.enabled ? 'fa-toggle-on' : 'fa-toggle-off')"/>
                            </button>
                            
                            <button t-if="shortcut.customizable"
                                    class="btn btn-sm btn-outline-secondary"
                                    t-on-click="() => this.startEditShortcut(shortcut)"
                                    title="编辑快捷键">
                                <i class="fa fa-edit"/>
                            </button>
                            
                            <button t-if="shortcut.custom"
                                    class="btn btn-sm btn-outline-danger"
                                    t-on-click="() => this.deleteCustomShortcut(shortcut)"
                                    title="删除自定义快捷键">
                                <i class="fa fa-trash"/>
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- 底部操作 -->
                <div class="panel-footer">
                    <button class="btn btn-primary btn-sm"
                            t-on-click="createCustomShortcut">
                        <i class="fa fa-plus"/> 添加自定义快捷键
                    </button>
                </div>
            </div>
        </div>
        
        <!-- 编辑快捷键对话框 -->
        <div t-if="state.editingShortcut" class="edit-shortcut-overlay">
            <div class="edit-shortcut-dialog">
                <div class="dialog-header">
                    <h5>编辑快捷键</h5>
                    <button class="btn btn-sm btn-outline-secondary"
                            t-on-click="cancelEdit">
                        <i class="fa fa-times"/>
                    </button>
                </div>
                
                <div class="dialog-body">
                    <div class="form-group">
                        <label>快捷键名称</label>
                        <input type="text" class="form-control"
                               t-model="state.editingShortcut.label"/>
                    </div>
                    
                    <div class="form-group">
                        <label>描述</label>
                        <textarea class="form-control" rows="2"
                                  t-model="state.editingShortcut.description"/>
                    </div>
                    
                    <div class="form-group">
                        <label>快捷键组合</label>
                        <div class="hotkey-input">
                            <input type="text" class="form-control"
                                   t-model="state.editingShortcut.newHotkey"
                                   readonly=""/>
                            <button class="btn btn-outline-secondary"
                                    t-on-click="startRecording"
                                    t-att-disabled="state.editingShortcut.recording">
                                <i t-if="state.editingShortcut.recording" class="fa fa-circle text-danger"/>
                                <i t-else="" class="fa fa-keyboard-o"/>
                                <span t-if="state.editingShortcut.recording">录制中...</span>
                                <span t-else="">录制</span>
                            </button>
                        </div>
                        <small class="form-text text-muted">
                            点击"录制"按钮，然后按下您想要的快捷键组合
                        </small>
                    </div>
                </div>
                
                <div class="dialog-footer">
                    <button class="btn btn-secondary" t-on-click="cancelEdit">
                        取消
                    </button>
                    <button class="btn btn-primary" 
                            t-on-click="saveEdit"
                            t-att-disabled="!state.editingShortcut.newHotkey">
                        保存
                    </button>
                </div>
            </div>
        </div>
    </div>
</t>`

// SCSS样式
`.hotkeys-panel-widget {
    .hotkeys-trigger {
        transition: all 0.2s ease;
        
        &:hover {
            background-color: #e9ecef;
            border-color: #adb5bd;
        }
    }
    
    .hotkeys-panel-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: 1050;
        display: flex;
        align-items: center;
        justify-content: center;
        
        .hotkeys-panel {
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
            width: 90%;
            max-width: 800px;
            max-height: 80vh;
            display: flex;
            flex-direction: column;
            
            .panel-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 16px 20px;
                border-bottom: 1px solid #e9ecef;
                
                .panel-title {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 18px;
                    font-weight: 600;
                }
                
                .panel-actions {
                    display: flex;
                    gap: 8px;
                    
                    .badge {
                        position: absolute;
                        top: -8px;
                        right: -8px;
                        font-size: 10px;
                    }
                }
            }
            
            .panel-controls {
                padding: 16px 20px;
                border-bottom: 1px solid #f8f9fa;
                
                .search-box {
                    position: relative;
                    margin-bottom: 16px;
                    
                    .search-icon {
                        position: absolute;
                        right: 12px;
                        top: 50%;
                        transform: translateY(-50%);
                        color: #6c757d;
                    }
                }
                
                .category-tabs {
                    display: flex;
                    gap: 4px;
                    flex-wrap: wrap;
                    
                    .category-tab {
                        display: flex;
                        align-items: center;
                        gap: 4px;
                        padding: 6px 12px;
                        border: 1px solid #dee2e6;
                        background: white;
                        border-radius: 4px;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        font-size: 12px;
                        
                        &:hover {
                            background: #f8f9fa;
                            border-color: #adb5bd;
                        }
                        
                        &.active {
                            background: #007bff;
                            border-color: #007bff;
                            color: white;
                        }
                    }
                }
            }
            
            .shortcuts-list {
                flex: 1;
                overflow-y: auto;
                padding: 8px 20px;
                
                .no-shortcuts {
                    text-align: center;
                    padding: 40px 20px;
                    color: #6c757d;
                    
                    .fa {
                        font-size: 24px;
                        margin-bottom: 8px;
                        display: block;
                    }
                }
                
                .shortcut-item {
                    display: flex;
                    align-items: center;
                    padding: 12px 16px;
                    border: 1px solid #e9ecef;
                    border-radius: 6px;
                    margin-bottom: 8px;
                    transition: all 0.2s ease;
                    
                    &:hover {
                        border-color: #adb5bd;
                        background: #f8f9fa;
                    }
                    
                    &.disabled {
                        opacity: 0.6;
                        background: #f8f9fa;
                    }
                    
                    &.conflict {
                        border-color: #ffc107;
                        background: #fff3cd;
                    }
                    
                    .shortcut-info {
                        flex: 1;
                        min-width: 0;
                        
                        .shortcut-header {
                            display: flex;
                            align-items: center;
                            gap: 8px;
                            margin-bottom: 4px;
                            
                            .shortcut-label {
                                font-weight: 500;
                                font-size: 14px;
                            }
                            
                            .badge {
                                font-size: 10px;
                                padding: 2px 6px;
                            }
                        }
                        
                        .shortcut-description {
                            font-size: 12px;
                            color: #6c757d;
                            line-height: 1.3;
                        }
                    }
                    
                    .shortcut-hotkey {
                        margin: 0 16px;
                        
                        kbd {
                            background: #495057;
                            border: 1px solid #343a40;
                            border-radius: 4px;
                            padding: 4px 8px;
                            font-size: 11px;
                            color: white;
                            font-family: monospace;
                        }
                    }
                    
                    .shortcut-actions {
                        display: flex;
                        gap: 4px;
                        
                        .btn {
                            padding: 4px 8px;
                            font-size: 12px;
                        }
                    }
                }
            }
            
            .panel-footer {
                padding: 16px 20px;
                border-top: 1px solid #e9ecef;
                background: #f8f9fa;
                border-radius: 0 0 8px 8px;
            }
        }
    }
    
    .edit-shortcut-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: 1060;
        display: flex;
        align-items: center;
        justify-content: center;
        
        .edit-shortcut-dialog {
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
            width: 90%;
            max-width: 500px;
            
            .dialog-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 16px 20px;
                border-bottom: 1px solid #e9ecef;
                
                h5 {
                    margin: 0;
                    font-size: 16px;
                }
            }
            
            .dialog-body {
                padding: 20px;
                
                .form-group {
                    margin-bottom: 16px;
                    
                    label {
                        display: block;
                        margin-bottom: 4px;
                        font-weight: 500;
                        font-size: 13px;
                    }
                    
                    .hotkey-input {
                        display: flex;
                        gap: 8px;
                        
                        input {
                            flex: 1;
                        }
                        
                        button {
                            white-space: nowrap;
                            
                            .text-danger {
                                animation: pulse 1s infinite;
                            }
                        }
                    }
                }
            }
            
            .dialog-footer {
                display: flex;
                justify-content: flex-end;
                gap: 8px;
                padding: 16px 20px;
                border-top: 1px solid #e9ecef;
                background: #f8f9fa;
                border-radius: 0 0 8px 8px;
            }
        }
    }
}

@keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
}`
```

### 2. 命令面板Widget - 快速命令执行器

**使用场景**: 为应用提供类似VS Code的命令面板，支持模糊搜索、命令分类和快速执行。

```javascript
/** @odoo-module **/
import { Component } from "@odoo/owl";
import { useHotkey } from "@web/core/hotkeys/hotkey_hook";
import { useService } from "@web/core/utils/hooks";
import { useRef, useState, onMounted } from "@odoo/owl";

export class CommandPaletteWidget extends Component {
    static template = "web.CommandPaletteWidget";
    static props = {
        commands: { type: Array, optional: true },
        maxResults: { type: Number, optional: true },
        placeholder: { type: String, optional: true },
        showCategories: { type: Boolean, optional: true },
    };

    setup() {
        this.actionService = useService("action");
        this.orm = useService("orm");
        this.notification = useService("notification");
        this.router = useService("router");
        
        this.state = useState({
            isOpen: false,
            searchTerm: '',
            selectedIndex: 0,
            filteredCommands: [],
            recentCommands: [],
            loading: false,
        });
        
        this.inputRef = useRef("searchInput");
        this.listRef = useRef("commandList");
        
        // 注册快捷键
        useHotkey("control+shift+p", () => {
            this.togglePalette();
        }, { global: true });
        
        useHotkey("escape", () => {
            if (this.state.isOpen) {
                this.closePalette();
            }
        });
        
        onMounted(() => {
            this.loadRecentCommands();
        });
    }

    get defaultCommands() {
        return [
            // 文件操作
            {
                id: 'file.new',
                category: 'file',
                title: '新建记录',
                description: '创建新的记录',
                icon: 'fa-plus',
                keywords: ['new', 'create', 'add', '新建', '创建', '添加'],
                action: () => this.executeAction('create'),
            },
            {
                id: 'file.save',
                category: 'file',
                title: '保存',
                description: '保存当前记录',
                icon: 'fa-save',
                keywords: ['save', 'commit', '保存', '提交'],
                action: () => this.executeAction('save'),
            },
            {
                id: 'file.duplicate',
                category: 'file',
                title: '复制记录',
                description: '复制当前记录',
                icon: 'fa-copy',
                keywords: ['duplicate', 'copy', 'clone', '复制', '克隆'],
                action: () => this.executeAction('duplicate'),
            },
            {
                id: 'file.delete',
                category: 'file',
                title: '删除记录',
                description: '删除当前记录',
                icon: 'fa-trash',
                keywords: ['delete', 'remove', '删除', '移除'],
                action: () => this.executeAction('delete'),
                dangerous: true,
            },
            
            // 视图操作
            {
                id: 'view.list',
                category: 'view',
                title: '列表视图',
                description: '切换到列表视图',
                icon: 'fa-list',
                keywords: ['list', 'table', '列表', '表格'],
                action: () => this.switchView('list'),
            },
            {
                id: 'view.form',
                category: 'view',
                title: '表单视图',
                description: '切换到表单视图',
                icon: 'fa-wpforms',
                keywords: ['form', 'detail', '表单', '详情'],
                action: () => this.switchView('form'),
            },
            {
                id: 'view.kanban',
                category: 'view',
                title: '看板视图',
                description: '切换到看板视图',
                icon: 'fa-th-large',
                keywords: ['kanban', 'card', '看板', '卡片'],
                action: () => this.switchView('kanban'),
            },
            {
                id: 'view.calendar',
                category: 'view',
                title: '日历视图',
                description: '切换到日历视图',
                icon: 'fa-calendar',
                keywords: ['calendar', 'schedule', '日历', '时间表'],
                action: () => this.switchView('calendar'),
            },
            {
                id: 'view.graph',
                category: 'view',
                title: '图表视图',
                description: '切换到图表视图',
                icon: 'fa-bar-chart',
                keywords: ['graph', 'chart', 'analytics', '图表', '分析'],
                action: () => this.switchView('graph'),
            },
            
            // 导航操作
            {
                id: 'nav.home',
                category: 'navigation',
                title: '首页',
                description: '返回到首页',
                icon: 'fa-home',
                keywords: ['home', 'dashboard', '首页', '仪表板'],
                action: () => this.navigateTo('/web'),
            },
            {
                id: 'nav.apps',
                category: 'navigation',
                title: '应用程序',
                description: '打开应用程序菜单',
                icon: 'fa-th',
                keywords: ['apps', 'applications', 'menu', '应用', '菜单'],
                action: () => this.openAppsMenu(),
            },
            {
                id: 'nav.settings',
                category: 'navigation',
                title: '设置',
                description: '打开系统设置',
                icon: 'fa-cog',
                keywords: ['settings', 'config', 'preferences', '设置', '配置'],
                action: () => this.openSettings(),
            },
            
            // 搜索操作
            {
                id: 'search.global',
                category: 'search',
                title: '全局搜索',
                description: '在所有记录中搜索',
                icon: 'fa-search',
                keywords: ['search', 'find', 'lookup', '搜索', '查找'],
                action: () => this.openGlobalSearch(),
            },
            
            // 工具操作
            {
                id: 'tools.export',
                category: 'tools',
                title: '导出数据',
                description: '导出当前数据',
                icon: 'fa-download',
                keywords: ['export', 'download', '导出', '下载'],
                action: () => this.exportData(),
            },
            {
                id: 'tools.import',
                category: 'tools',
                title: '导入数据',
                description: '导入数据到系统',
                icon: 'fa-upload',
                keywords: ['import', 'upload', '导入', '上传'],
                action: () => this.importData(),
            },
            {
                id: 'tools.debug',
                category: 'tools',
                title: '开发者工具',
                description: '打开开发者调试工具',
                icon: 'fa-bug',
                keywords: ['debug', 'developer', 'dev', '调试', '开发'],
                action: () => this.toggleDebugMode(),
            },
            
            // 帮助操作
            {
                id: 'help.docs',
                category: 'help',
                title: '帮助文档',
                description: '打开帮助文档',
                icon: 'fa-question-circle',
                keywords: ['help', 'docs', 'documentation', '帮助', '文档'],
                action: () => this.openHelp(),
            },
            {
                id: 'help.shortcuts',
                category: 'help',
                title: '快捷键列表',
                description: '显示所有可用快捷键',
                icon: 'fa-keyboard-o',
                keywords: ['shortcuts', 'hotkeys', 'keys', '快捷键', '热键'],
                action: () => this.showShortcuts(),
            },
        ];
    }

    get allCommands() {
        return [...this.defaultCommands, ...(this.props.commands || [])];
    }

    get maxResults() {
        return this.props.maxResults || 10;
    }

    get categoryMap() {
        return {
            'file': { label: '文件', icon: 'fa-file-o', color: '#007bff' },
            'view': { label: '视图', icon: 'fa-eye', color: '#28a745' },
            'navigation': { label: '导航', icon: 'fa-compass', color: '#17a2b8' },
            'search': { label: '搜索', icon: 'fa-search', color: '#ffc107' },
            'tools': { label: '工具', icon: 'fa-wrench', color: '#6f42c1' },
            'help': { label: '帮助', icon: 'fa-question-circle', color: '#fd7e14' },
        };
    }

    togglePalette() {
        if (this.state.isOpen) {
            this.closePalette();
        } else {
            this.openPalette();
        }
    }

    openPalette() {
        this.state.isOpen = true;
        this.state.searchTerm = '';
        this.state.selectedIndex = 0;
        this.updateFilteredCommands();
        
        // 聚焦搜索框
        setTimeout(() => {
            if (this.inputRef.el) {
                this.inputRef.el.focus();
            }
        }, 100);
    }

    closePalette() {
        this.state.isOpen = false;
        this.state.searchTerm = '';
        this.state.selectedIndex = 0;
        this.state.filteredCommands = [];
    }

    onSearch(term) {
        this.state.searchTerm = term;
        this.state.selectedIndex = 0;
        this.updateFilteredCommands();
    }

    updateFilteredCommands() {
        const term = this.state.searchTerm.toLowerCase().trim();
        
        if (!term) {
            // 显示最近使用的命令
            this.state.filteredCommands = this.state.recentCommands
                .slice(0, this.maxResults);
            return;
        }
        
        // 模糊搜索算法
        const commands = this.allCommands.map(cmd => {
            const score = this.calculateMatchScore(cmd, term);
            return { ...cmd, score };
        })
        .filter(cmd => cmd.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, this.maxResults);
        
        this.state.filteredCommands = commands;
    }

    calculateMatchScore(command, term) {
        let score = 0;
        
        // 标题匹配
        if (command.title.toLowerCase().includes(term)) {
            score += 100;
            if (command.title.toLowerCase().startsWith(term)) {
                score += 50; // 前缀匹配额外分数
            }
        }
        
        // 描述匹配
        if (command.description && command.description.toLowerCase().includes(term)) {
            score += 50;
        }
        
        // 关键词匹配
        if (command.keywords) {
            for (const keyword of command.keywords) {
                if (keyword.toLowerCase().includes(term)) {
                    score += 30;
                    if (keyword.toLowerCase() === term) {
                        score += 20; // 精确匹配
                    }
                }
            }
        }
        
        // 分类匹配
        const category = this.categoryMap[command.category];
        if (category && category.label.toLowerCase().includes(term)) {
            score += 20;
        }
        
        // 模糊匹配（支持拼音首字母等）
        if (this.fuzzyMatch(command.title, term)) {
            score += 25;
        }
        
        return score;
    }

    fuzzyMatch(text, pattern) {
        // 简单的模糊匹配实现
        const textLower = text.toLowerCase();
        const patternLower = pattern.toLowerCase();
        
        let textIndex = 0;
        let patternIndex = 0;
        
        while (textIndex < textLower.length && patternIndex < patternLower.length) {
            if (textLower[textIndex] === patternLower[patternIndex]) {
                patternIndex++;
            }
            textIndex++;
        }
        
        return patternIndex === patternLower.length;
    }

    onKeyDown(event) {
        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                this.moveSelection(1);
                break;
            case 'ArrowUp':
                event.preventDefault();
                this.moveSelection(-1);
                break;
            case 'Enter':
                event.preventDefault();
                this.executeSelectedCommand();
                break;
            case 'Tab':
                event.preventDefault();
                if (event.shiftKey) {
                    this.moveSelection(-1);
                } else {
                    this.moveSelection(1);
                }
                break;
        }
    }

    moveSelection(direction) {
        const maxIndex = this.state.filteredCommands.length - 1;
        let newIndex = this.state.selectedIndex + direction;
        
        if (newIndex < 0) {
            newIndex = maxIndex;
        } else if (newIndex > maxIndex) {
            newIndex = 0;
        }
        
        this.state.selectedIndex = newIndex;
        
        // 滚动到可见区域
        setTimeout(() => {
            const selectedElement = this.listRef.el?.querySelector('.command-item.selected');
            if (selectedElement) {
                selectedElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest'
                });
            }
        });
    }

    executeSelectedCommand() {
        const command = this.state.filteredCommands[this.state.selectedIndex];
        if (command) {
            this.executeCommand(command);
        }
    }

    async executeCommand(command) {
        this.closePalette();
        
        try {
            this.state.loading = true;
            
            // 添加到最近使用
            this.addToRecentCommands(command);
            
            // 执行命令
            if (typeof command.action === 'function') {
                await command.action();
            } else if (typeof command.action === 'string') {
                await this.executeAction(command.action);
            }
            
            this.notification.add(
                `已执行命令: ${command.title}`,
                { type: 'success' }
            );
            
        } catch (error) {
            console.error('Command execution failed:', error);
            this.notification.add(
                `命令执行失败: ${error.message}`,
                { type: 'danger' }
            );
        } finally {
            this.state.loading = false;
        }
    }

    addToRecentCommands(command) {
        // 移除已存在的同样命令
        this.state.recentCommands = this.state.recentCommands.filter(
            c => c.id !== command.id
        );
        
        // 添加到开头
        this.state.recentCommands.unshift({
            ...command,
            lastUsed: new Date().toISOString()
        });
        
        // 限制数量
        if (this.state.recentCommands.length > 20) {
            this.state.recentCommands = this.state.recentCommands.slice(0, 20);
        }
        
        this.saveRecentCommands();
    }

    loadRecentCommands() {
        try {
            const stored = localStorage.getItem('odoo_recent_commands');
            if (stored) {
                this.state.recentCommands = JSON.parse(stored);
            }
        } catch (error) {
            console.error('Failed to load recent commands:', error);
        }
    }

    saveRecentCommands() {
        try {
            localStorage.setItem(
                'odoo_recent_commands',
                JSON.stringify(this.state.recentCommands)
            );
        } catch (error) {
            console.error('Failed to save recent commands:', error);
        }
    }

    // 命令实现方法
    async executeAction(action) {
        switch (action) {
            case 'create':
                await this.actionService.doAction({
                    type: 'ir.actions.act_window',
                    res_model: this.getCurrentModel(),
                    views: [[false, 'form']],
                    target: 'current',
                });
                break;
            case 'save':
                this.trigger('save-record');
                break;
            case 'duplicate':
                this.trigger('duplicate-record');
                break;
            case 'delete':
                if (confirm('确定要删除当前记录吗？')) {
                    this.trigger('delete-record');
                }
                break;
        }
    }

    async switchView(viewType) {
        const currentAction = this.actionService.currentController?.action;
        if (currentAction) {
            await this.actionService.doAction({
                ...currentAction,
                views: currentAction.views.map(([id, type]) => 
                    type === viewType ? [id, type] : [false, type]
                ),
                view_mode: viewType,
            });
        }
    }

    navigateTo(path) {
        this.router.navigate(path);
    }

    openAppsMenu() {
        this.trigger('toggle-home-menu');
    }

    openSettings() {
        this.actionService.doAction('base.action_res_config_settings');
    }

    openGlobalSearch() {
        this.trigger('open-global-search');
    }

    exportData() {
        this.trigger('export-data');
    }

    importData() {
        this.trigger('import-data');
    }

    toggleDebugMode() {
        window.location.search = window.location.search.includes('debug') 
            ? window.location.search.replace(/[?&]debug=\w+/, '')
            : (window.location.search ? window.location.search + '&debug=1' : '?debug=1');
    }

    openHelp() {
        window.open('https://www.odoo.com/documentation', '_blank');
    }

    showShortcuts() {
        // 触发快捷键面板显示
        this.trigger('show-shortcuts');
    }

    getCurrentModel() {
        return this.actionService.currentController?.action?.res_model || 'res.partner';
    }
}

// XML模板
`<t t-name="web.CommandPaletteWidget">
    <div class="command-palette-widget">
        <!-- 命令面板覆盖层 -->
        <div t-if="state.isOpen" class="command-palette-overlay">
            <div class="command-palette">
                <!-- 搜索框 -->
                <div class="search-container">
                    <i class="fa fa-search search-icon"/>
                    <input type="text" 
                           class="search-input"
                           t-ref="searchInput"
                           t-model="state.searchTerm"
                           t-on-input="(ev) => this.onSearch(ev.target.value)"
                           t-on-keydown="onKeyDown"
                           t-att-placeholder="props.placeholder || '输入命令...'"
                           autocomplete="off"/>
                    <kbd class="escape-hint">ESC</kbd>
                </div>
                
                <!-- 命令列表 -->
                <div class="commands-container" t-ref="commandList">
                    <div t-if="state.filteredCommands.length === 0 and state.searchTerm" 
                         class="no-results">
                        <i class="fa fa-search"/>
                        <span>没有找到匹配的命令</span>
                        <small>尝试使用不同的关键词</small>
                    </div>
                    
                    <div t-if="state.filteredCommands.length === 0 and !state.searchTerm"
                         class="recent-commands-header">
                        <i class="fa fa-history"/>
                        <span>最近使用的命令</span>
                    </div>
                    
                    <div t-foreach="state.filteredCommands" t-as="command" t-key="command.id"
                         t-att-class="'command-item ' + (command_index === state.selectedIndex ? 'selected' : '') + (command.dangerous ? ' dangerous' : '')"
                         t-on-click="() => this.executeCommand(command)">
                        
                        <div class="command-icon">
                            <i t-att-class="'fa ' + command.icon"
                               t-att-style="props.showCategories and categoryMap[command.category] ? 'color: ' + categoryMap[command.category].color : ''"/>
                        </div>
                        
                        <div class="command-content">
                            <div class="command-title" t-esc="command.title"/>
                            <div class="command-description" t-esc="command.description"/>
                        </div>
                        
                        <div t-if="props.showCategories and categoryMap[command.category]" 
                             class="command-category">
                            <span class="category-badge"
                                  t-att-style="'background-color: ' + categoryMap[command.category].color">
                                <t t-esc="categoryMap[command.category].label"/>
                            </span>
                        </div>
                        
                        <div t-if="command.lastUsed" class="command-meta">
                            <small class="recent-indicator">
                                <i class="fa fa-history"/>
                            </small>
                        </div>
                    </div>
                </div>
                
                <!-- 底部提示 -->
                <div class="palette-footer">
                    <div class="navigation-hints">
                        <span class="hint">
                            <kbd>↑↓</kbd> 导航
                        </span>
                        <span class="hint">
                            <kbd>Enter</kbd> 执行
                        </span>
                        <span class="hint">
                            <kbd>Esc</kbd> 关闭
                        </span>
                    </div>
                    <div class="command-count" t-if="state.filteredCommands.length > 0">
                        <span t-esc="state.filteredCommands.length"/> 个命令
                    </div>
                </div>
            </div>
        </div>
        
        <!-- 加载指示器 -->
        <div t-if="state.loading" class="loading-overlay">
            <div class="loading-spinner">
                <i class="fa fa-spinner fa-spin"/>
                <span>执行中...</span>
            </div>
        </div>
    </div>
</t>`

// SCSS样式
`.command-palette-widget {
    .command-palette-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.6);
        z-index: 1050;
        display: flex;
        align-items: flex-start;
        justify-content: center;
        padding-top: 10vh;
        
        .command-palette {
            background: white;
            border-radius: 12px;
            box-shadow: 0 16px 70px rgba(0, 0, 0, 0.2);
            width: 90%;
            max-width: 640px;
            max-height: 70vh;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            
            .search-container {
                position: relative;
                padding: 20px;
                border-bottom: 1px solid #e9ecef;
                
                .search-icon {
                    position: absolute;
                    left: 32px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #6c757d;
                    font-size: 16px;
                }
                
                .search-input {
                    width: 100%;
                    padding: 12px 80px 12px 50px;
                    border: none;
                    outline: none;
                    font-size: 16px;
                    background: transparent;
                    
                    &::placeholder {
                        color: #adb5bd;
                    }
                }
                
                .escape-hint {
                    position: absolute;
                    right: 20px;
                    top: 50%;
                    transform: translateY(-50%);
                    background: #f8f9fa;
                    border: 1px solid #dee2e6;
                    border-radius: 4px;
                    padding: 4px 8px;
                    font-size: 11px;
                    color: #6c757d;
                }
            }
            
            .commands-container {
                flex: 1;
                overflow-y: auto;
                padding: 8px 0;
                
                .no-results {
                    text-align: center;
                    padding: 40px 20px;
                    color: #6c757d;
                    
                    .fa {
                        font-size: 32px;
                        margin-bottom: 12px;
                        display: block;
                        opacity: 0.5;
                    }
                    
                    span {
                        display: block;
                        font-size: 16px;
                        margin-bottom: 4px;
                    }
                    
                    small {
                        font-size: 12px;
                        opacity: 0.7;
                    }
                }
                
                .recent-commands-header {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 20px;
                    font-size: 12px;
                    color: #6c757d;
                    text-transform: uppercase;
                    font-weight: 600;
                    letter-spacing: 0.5px;
                }
                
                .command-item {
                    display: flex;
                    align-items: center;
                    padding: 12px 20px;
                    cursor: pointer;
                    transition: all 0.15s ease;
                    border-left: 3px solid transparent;
                    
                    &:hover, &.selected {
                        background: #f8f9fa;
                        border-left-color: #007bff;
                    }
                    
                    &.dangerous {
                        &:hover, &.selected {
                            background: #fff5f5;
                            border-left-color: #dc3545;
                        }
                        
                        .command-icon {
                            color: #dc3545;
                        }
                    }
                    
                    .command-icon {
                        width: 32px;
                        text-align: center;
                        font-size: 16px;
                        color: #6c757d;
                        flex-shrink: 0;
                        margin-right: 12px;
                    }
                    
                    .command-content {
                        flex: 1;
                        min-width: 0;
                        
                        .command-title {
                            font-size: 14px;
                            font-weight: 500;
                            color: #212529;
                            margin-bottom: 2px;
                        }
                        
                        .command-description {
                            font-size: 12px;
                            color: #6c757d;
                            line-height: 1.3;
                        }
                    }
                    
                    .command-category {
                        margin-left: 12px;
                        flex-shrink: 0;
                        
                        .category-badge {
                            display: inline-block;
                            padding: 2px 8px;
                            border-radius: 12px;
                            font-size: 10px;
                            color: white;
                            font-weight: 500;
                            text-transform: uppercase;
                            letter-spacing: 0.3px;
                        }
                    }
                    
                    .command-meta {
                        margin-left: 12px;
                        flex-shrink: 0;
                        
                        .recent-indicator {
                            color: #28a745;
                            font-size: 12px;
                        }
                    }
                }
            }
            
            .palette-footer {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 20px;
                border-top: 1px solid #e9ecef;
                background: #f8f9fa;
                
                .navigation-hints {
                    display: flex;
                    gap: 16px;
                    
                    .hint {
                        display: flex;
                        align-items: center;
                        gap: 4px;
                        font-size: 11px;
                        color: #6c757d;
                        
                        kbd {
                            background: #ffffff;
                            border: 1px solid #d6d8db;
                            border-radius: 3px;
                            padding: 2px 4px;
                            font-size: 10px;
                            color: #495057;
                        }
                    }
                }
                
                .command-count {
                    font-size: 11px;
                    color: #6c757d;
                }
            }
        }
    }
    
    .loading-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.9);
        z-index: 1060;
        display: flex;
        align-items: center;
        justify-content: center;
        
        .loading-spinner {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
            
            .fa-spinner {
                font-size: 24px;
                color: #007bff;
            }
            
            span {
                font-size: 14px;
                color: #6c757d;
            }
        }
    }
}`
```

### 3. 快捷导航Widget - 智能键盘导航助手

**使用场景**: 为复杂界面提供键盘导航支持，包括表格导航、表单字段跳转和焦点管理。

```javascript
/** @odoo-module **/
import { Component } from "@odoo/owl";
import { useHotkey } from "@web/core/hotkeys/hotkey_hook";
import { useService } from "@web/core/utils/hooks";
import { useRef, useState, onMounted, onWillUnmount } from "@odoo/owl";

export class KeyboardNavigationWidget extends Component {
    static template = "web.KeyboardNavigationWidget";
    static props = {
        enabled: { type: Boolean, optional: true },
        showIndicators: { type: Boolean, optional: true },
        navigationMode: { type: String, optional: true }, // 'form', 'list', 'grid', 'auto'
        customSelectors: { type: Object, optional: true },
        onNavigate: { type: Function, optional: true },
    };

    setup() {
        this.notification = useService("notification");
        
        this.state = useState({
            enabled: this.props.enabled !== false,
            currentIndex: 0,
            navigableElements: [],
            focusIndicatorVisible: false,
            navigationMode: this.props.navigationMode || 'auto',
            gridPosition: { row: 0, col: 0 },
            gridDimensions: { rows: 0, cols: 0 },
        });
        
        this.containerRef = useRef("container");
        this.focusIndicatorRef = useRef("focusIndicator");
        
        // 注册导航快捷键
        this.registerNavigationHotkeys();
        
        // 生命周期管理
        onMounted(() => {
            this.initializeNavigation();
            this.addEventListeners();
        });
        
        onWillUnmount(() => {
            this.removeEventListeners();
        });
    }

    get defaultSelectors() {
        return {
            form: [
                'input:not([disabled]):not([readonly])',
                'textarea:not([disabled]):not([readonly])',
                'select:not([disabled]):not([readonly])',
                'button:not([disabled])',
                '[contenteditable="true"]',
                '[tabindex]:not([tabindex="-1"])',
                'a[href]',
            ],
            list: [
                '.o_list_table tbody tr',
                '.o_data_row',
                '.o_kanban_record',
            ],
            grid: [
                '.o_list_table tbody tr td',
                '.o_grid_cell',
                '.o_field_cell',
            ],
        };
    }

    get selectors() {
        const mode = this.state.navigationMode;
        const defaultSelectors = this.defaultSelectors[mode] || this.defaultSelectors.form;
        const customSelectors = this.props.customSelectors?.[mode] || [];
        return [...defaultSelectors, ...customSelectors];
    }

    registerNavigationHotkeys() {
        // 基础导航
        useHotkey("tab", (context) => {
            if (!this.state.enabled) return;
            context.target.preventDefault?.();
            this.navigateNext();
        }, { global: true, bypassEditableProtection: true });
        
        useHotkey("shift+tab", (context) => {
            if (!this.state.enabled) return;
            context.target.preventDefault?.();
            this.navigatePrevious();
        }, { global: true, bypassEditableProtection: true });
        
        // 方向键导航
        useHotkey("arrowdown", (context) => {
            if (!this.state.enabled) return;
            if (this.shouldHandleArrowKey(context.target)) {
                context.target.preventDefault?.();
                this.navigateDown();
            }
        }, { global: true });
        
        useHotkey("arrowup", (context) => {
            if (!this.state.enabled) return;
            if (this.shouldHandleArrowKey(context.target)) {
                context.target.preventDefault?.();
                this.navigateUp();
            }
        }, { global: true });
        
        useHotkey("arrowright", (context) => {
            if (!this.state.enabled) return;
            if (this.shouldHandleArrowKey(context.target)) {
                context.target.preventDefault?.();
                this.navigateRight();
            }
        }, { global: true });
        
        useHotkey("arrowleft", (context) => {
            if (!this.state.enabled) return;
            if (this.shouldHandleArrowKey(context.target)) {
                context.target.preventDefault?.();
                this.navigateLeft();
            }
        }, { global: true });
        
        // 快速跳转
        useHotkey("home", (context) => {
            if (!this.state.enabled) return;
            context.target.preventDefault?.();
            this.navigateToFirst();
        }, { global: true });
        
        useHotkey("end", (context) => {
            if (!this.state.enabled) return;
            context.target.preventDefault?.();
            this.navigateToLast();
        }, { global: true });
        
        useHotkey("pageup", (context) => {
            if (!this.state.enabled) return;
            context.target.preventDefault?.();
            this.navigatePageUp();
        }, { global: true });
        
        useHotkey("pagedown", (context) => {
            if (!this.state.enabled) return;
            context.target.preventDefault?.();
            this.navigatePageDown();
        }, { global: true });
        
        // 功能键
        useHotkey("enter", (context) => {
            if (!this.state.enabled) return;
            const currentElement = this.getCurrentElement();
            if (currentElement && this.shouldActivateWithEnter(currentElement)) {
                this.activateElement(currentElement);
            }
        }, { global: true });
        
        useHotkey("space", (context) => {
            if (!this.state.enabled) return;
            const currentElement = this.getCurrentElement();
            if (currentElement && this.shouldActivateWithSpace(currentElement)) {
                context.target.preventDefault?.();
                this.activateElement(currentElement);
            }
        }, { global: true });
        
        // 导航控制
        useHotkey("control+shift+n", () => {
            this.toggleNavigation();
        }, { global: true });
        
        useHotkey("f6", () => {
            this.switchNavigationMode();
        }, { global: true });
    }

    initializeNavigation() {
        this.updateNavigableElements();
        this.detectNavigationMode();
        this.initializeGridNavigation();
    }

    updateNavigableElements() {
        const container = this.containerRef.el || document.body;
        const elements = [];
        
        for (const selector of this.selectors) {
            const found = container.querySelectorAll(selector);
            elements.push(...Array.from(found));
        }
        
        // 过滤可见和可交互元素
        this.state.navigableElements = elements.filter(el => 
            this.isElementNavigable(el)
        );
        
        // 按DOM顺序排序
        this.state.navigableElements.sort((a, b) => {
            const position = a.compareDocumentPosition(b);
            return position & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
        });
        
        // 更新当前索引
        this.updateCurrentIndex();
    }

    isElementNavigable(element) {
        // 检查元素是否可见
        if (!this.isElementVisible(element)) {
            return false;
        }
        
        // 检查元素是否可交互
        if (element.disabled || element.readOnly) {
            return false;
        }
        
        // 检查tabindex
        const tabIndex = element.tabIndex;
        if (tabIndex < 0) {
            return false;
        }
        
        return true;
    }

    isElementVisible(element) {
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        
        return (
            rect.width > 0 &&
            rect.height > 0 &&
            style.visibility !== 'hidden' &&
            style.display !== 'none' &&
            style.opacity !== '0'
        );
    }

    detectNavigationMode() {
        if (this.props.navigationMode && this.props.navigationMode !== 'auto') {
            return;
        }
        
        const container = this.containerRef.el || document.body;
        
        // 检测表格/网格
        if (container.querySelector('.o_list_table, .o_grid')) {
            this.state.navigationMode = 'grid';
        }
        // 检测列表
        else if (container.querySelector('.o_list_view, .o_kanban_view')) {
            this.state.navigationMode = 'list';
        }
        // 默认表单模式
        else {
            this.state.navigationMode = 'form';
        }
    }

    initializeGridNavigation() {
        if (this.state.navigationMode !== 'grid') {
            return;
        }
        
        const container = this.containerRef.el || document.body;
        const table = container.querySelector('.o_list_table tbody');
        
        if (table) {
            const rows = table.querySelectorAll('tr');
            const cols = rows[0]?.querySelectorAll('td').length || 0;
            
            this.state.gridDimensions = {
                rows: rows.length,
                cols: cols
            };
        }
    }

    shouldHandleArrowKey(target) {
        // 不处理输入框中的方向键（除非是单行输入框的上下键）
        if (target.tagName === 'INPUT' && target.type === 'text') {
            return false;
        }
        
        if (target.tagName === 'TEXTAREA') {
            return false;
        }
        
        if (target.isContentEditable) {
            return false;
        }
        
        return true;
    }

    getCurrentElement() {
        return this.state.navigableElements[this.state.currentIndex];
    }

    updateCurrentIndex() {
        const activeElement = document.activeElement;
        const index = this.state.navigableElements.indexOf(activeElement);
        if (index >= 0) {
            this.state.currentIndex = index;
            this.updateGridPosition();
        }
    }

    updateGridPosition() {
        if (this.state.navigationMode !== 'grid') {
            return;
        }
        
        const { cols } = this.state.gridDimensions;
        if (cols > 0) {
            this.state.gridPosition = {
                row: Math.floor(this.state.currentIndex / cols),
                col: this.state.currentIndex % cols
            };
        }
    }

    // 导航方法
    navigateNext() {
        const nextIndex = (this.state.currentIndex + 1) % this.state.navigableElements.length;
        this.navigateToIndex(nextIndex);
    }

    navigatePrevious() {
        const prevIndex = this.state.currentIndex === 0 
            ? this.state.navigableElements.length - 1 
            : this.state.currentIndex - 1;
        this.navigateToIndex(prevIndex);
    }

    navigateDown() {
        if (this.state.navigationMode === 'grid') {
            this.navigateGridDown();
        } else {
            this.navigateNext();
        }
    }

    navigateUp() {
        if (this.state.navigationMode === 'grid') {
            this.navigateGridUp();
        } else {
            this.navigatePrevious();
        }
    }

    navigateRight() {
        if (this.state.navigationMode === 'grid') {
            this.navigateGridRight();
        } else {
            this.navigateNext();
        }
    }

    navigateLeft() {
        if (this.state.navigationMode === 'grid') {
            this.navigateGridLeft();
        } else {
            this.navigatePrevious();
        }
    }

    navigateGridDown() {
        const { row, col } = this.state.gridPosition;
        const { rows, cols } = this.state.gridDimensions;
        
        if (row < rows - 1) {
            const newIndex = (row + 1) * cols + col;
            if (newIndex < this.state.navigableElements.length) {
                this.navigateToIndex(newIndex);
            }
        }
    }

    navigateGridUp() {
        const { row, col } = this.state.gridPosition;
        const { cols } = this.state.gridDimensions;
        
        if (row > 0) {
            const newIndex = (row - 1) * cols + col;
            this.navigateToIndex(newIndex);
        }
    }

    navigateGridRight() {
        const { row, col } = this.state.gridPosition;
        const { cols } = this.state.gridDimensions;
        
        if (col < cols - 1) {
            const newIndex = row * cols + col + 1;
            if (newIndex < this.state.navigableElements.length) {
                this.navigateToIndex(newIndex);
            }
        }
    }

    navigateGridLeft() {
        const { row, col } = this.state.gridPosition;
        const { cols } = this.state.gridDimensions;
        
        if (col > 0) {
            const newIndex = row * cols + col - 1;
            this.navigateToIndex(newIndex);
        }
    }

    navigateToFirst() {
        this.navigateToIndex(0);
    }

    navigateToLast() {
        this.navigateToIndex(this.state.navigableElements.length - 1);
    }

    navigatePageUp() {
        const pageSize = Math.max(1, Math.floor(this.state.navigableElements.length / 10));
        const newIndex = Math.max(0, this.state.currentIndex - pageSize);
        this.navigateToIndex(newIndex);
    }

    navigatePageDown() {
        const pageSize = Math.max(1, Math.floor(this.state.navigableElements.length / 10));
        const newIndex = Math.min(
            this.state.navigableElements.length - 1,
            this.state.currentIndex + pageSize
        );
        this.navigateToIndex(newIndex);
    }

    navigateToIndex(index) {
        if (index < 0 || index >= this.state.navigableElements.length) {
            return;
        }
        
        this.state.currentIndex = index;
        const element = this.state.navigableElements[index];
        
        if (element) {
            element.focus();
            this.scrollIntoViewIfNeeded(element);
            this.showFocusIndicator(element);
            this.updateGridPosition();
            
            if (this.props.onNavigate) {
                this.props.onNavigate({
                    element,
                    index,
                    navigationMode: this.state.navigationMode
                });
            }
        }
    }

    scrollIntoViewIfNeeded(element) {
        const rect = element.getBoundingClientRect();
        const isVisible = (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= window.innerHeight &&
            rect.right <= window.innerWidth
        );
        
        if (!isVisible) {
            element.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'nearest'
            });
        }
    }

    showFocusIndicator(element) {
        if (!this.props.showIndicators) {
            return;
        }
        
        const indicator = this.focusIndicatorRef.el;
        if (!indicator) {
            return;
        }
        
        const rect = element.getBoundingClientRect();
        indicator.style.top = `${rect.top + window.scrollY - 2}px`;
        indicator.style.left = `${rect.left + window.scrollX - 2}px`;
        indicator.style.width = `${rect.width + 4}px`;
        indicator.style.height = `${rect.height + 4}px`;
        indicator.style.display = 'block';
        
        this.state.focusIndicatorVisible = true;
        
        // 自动隐藏指示器
        clearTimeout(this.indicatorTimeout);
        this.indicatorTimeout = setTimeout(() => {
            this.state.focusIndicatorVisible = false;
        }, 2000);
    }

    shouldActivateWithEnter(element) {
        return (
            element.tagName === 'BUTTON' ||
            element.tagName === 'A' ||
            element.role === 'button' ||
            element.onclick
        );
    }

    shouldActivateWithSpace(element) {
        return (
            element.tagName === 'BUTTON' ||
            element.type === 'checkbox' ||
            element.type === 'radio' ||
            element.role === 'button'
        );
    }

    activateElement(element) {
        if (element.click) {
            element.click();
        } else if (element.tagName === 'INPUT' && element.type === 'checkbox') {
            element.checked = !element.checked;
            element.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }

    toggleNavigation() {
        this.state.enabled = !this.state.enabled;
        this.notification.add(
            `键盘导航已${this.state.enabled ? '启用' : '禁用'}`,
            { type: 'info' }
        );
        
        if (this.state.enabled) {
            this.updateNavigableElements();
        }
    }

    switchNavigationMode() {
        const modes = ['form', 'list', 'grid'];
        const currentIndex = modes.indexOf(this.state.navigationMode);
        const nextIndex = (currentIndex + 1) % modes.length;
        
        this.state.navigationMode = modes[nextIndex];
        this.updateNavigableElements();
        this.initializeGridNavigation();
        
        this.notification.add(
            `导航模式切换为: ${this.getModeLabel(this.state.navigationMode)}`,
            { type: 'info' }
        );
    }

    getModeLabel(mode) {
        const labels = {
            'form': '表单',
            'list': '列表',
            'grid': '网格'
        };
        return labels[mode] || mode;
    }

    addEventListeners() {
        // 监听DOM变化
        this.observer = new MutationObserver(() => {
            this.updateNavigableElements();
        });
        
        this.observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['disabled', 'readonly', 'tabindex']
        });
        
        // 监听焦点变化
        document.addEventListener('focusin', this.onFocusChange.bind(this));
    }

    removeEventListeners() {
        if (this.observer) {
            this.observer.disconnect();
        }
        
        document.removeEventListener('focusin', this.onFocusChange.bind(this));
        
        if (this.indicatorTimeout) {
            clearTimeout(this.indicatorTimeout);
        }
    }

    onFocusChange(event) {
        this.updateCurrentIndex();
        if (this.props.showIndicators && event.target) {
            this.showFocusIndicator(event.target);
        }
    }
}

// XML模板
`<t t-name="web.KeyboardNavigationWidget">
    <div class="keyboard-navigation-widget" t-ref="container">
        <!-- 导航状态指示器 -->
        <div t-if="state.enabled and props.showIndicators" class="navigation-status">
            <div class="status-indicator">
                <i class="fa fa-keyboard-o"/>
                <span t-esc="getModeLabel(state.navigationMode)"/>
                <small t-if="state.navigableElements.length > 0">
                    <t t-esc="state.currentIndex + 1"/>/<t t-esc="state.navigableElements.length"/>
                </small>
            </div>
        </div>
        
        <!-- 焦点指示器 -->
        <div t-if="state.focusIndicatorVisible and props.showIndicators"
             class="focus-indicator"
             t-ref="focusIndicator"/>
        
        <!-- 网格位置指示器 -->
        <div t-if="state.enabled and state.navigationMode === 'grid' and props.showIndicators"
             class="grid-position-indicator">
            行 <t t-esc="state.gridPosition.row + 1"/>, 
            列 <t t-esc="state.gridPosition.col + 1"/>
        </div>
        
        <!-- 帮助提示 -->
        <div t-if="state.enabled and props.showIndicators" class="navigation-help">
            <div class="help-toggle" 
                 t-on-click="() => this.state.showHelp = !this.state.showHelp">
                <i class="fa fa-question-circle"/>
            </div>
            
            <div t-if="state.showHelp" class="help-content">
                <div class="help-section">
                    <h6>基础导航</h6>
                    <div class="help-item">
                        <kbd>Tab</kbd> / <kbd>Shift+Tab</kbd>
                        <span>下一个/上一个元素</span>
                    </div>
                    <div class="help-item">
                        <kbd>Home</kbd> / <kbd>End</kbd>
                        <span>第一个/最后一个元素</span>
                    </div>
                </div>
                
                <div class="help-section" t-if="state.navigationMode === 'grid'">
                    <h6>网格导航</h6>
                    <div class="help-item">
                        <kbd>↑↓←→</kbd>
                        <span>方向键导航</span>
                    </div>
                </div>
                
                <div class="help-section">
                    <h6>快捷键</h6>
                    <div class="help-item">
                        <kbd>Enter</kbd> / <kbd>Space</kbd>
                        <span>激活元素</span>
                    </div>
                    <div class="help-item">
                        <kbd>Ctrl+Shift+N</kbd>
                        <span>切换导航</span>
                    </div>
                    <div class="help-item">
                        <kbd>F6</kbd>
                        <span>切换模式</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</t>`

// SCSS样式
`.keyboard-navigation-widget {
    position: relative;
    
    .navigation-status {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 1000;
        
        .status-indicator {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 6px 12px;
            background: rgba(0, 123, 255, 0.9);
            color: white;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 500;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
            
            small {
                opacity: 0.8;
                margin-left: 4px;
            }
        }
    }
    
    .focus-indicator {
        position: absolute;
        pointer-events: none;
        border: 2px solid #007bff;
        border-radius: 4px;
        background: rgba(0, 123, 255, 0.1);
        z-index: 999;
        transition: all 0.2s ease;
        animation: focusPulse 1s ease-out;
    }
    
    .grid-position-indicator {
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 4px 8px;
        background: rgba(0, 0, 0, 0.7);
        color: white;
        border-radius: 4px;
        font-size: 10px;
        z-index: 1000;
    }
    
    .navigation-help {
        position: fixed;
        bottom: 20px;
        left: 20px;
        z-index: 1000;
        
        .help-toggle {
            width: 32px;
            height: 32px;
            background: #6c757d;
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s ease;
            
            &:hover {
                background: #495057;
                transform: scale(1.1);
            }
        }
        
        .help-content {
            position: absolute;
            bottom: 40px;
            left: 0;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
            padding: 16px;
            min-width: 280px;
            max-width: 320px;
            
            .help-section {
                margin-bottom: 12px;
                
                &:last-child {
                    margin-bottom: 0;
                }
                
                h6 {
                    font-size: 11px;
                    font-weight: 600;
                    text-transform: uppercase;
                    color: #6c757d;
                    margin-bottom: 6px;
                    letter-spacing: 0.5px;
                }
                
                .help-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 4px;
                    font-size: 11px;
                    
                    kbd {
                        background: #f8f9fa;
                        border: 1px solid #dee2e6;
                        border-radius: 3px;
                        padding: 2px 4px;
                        font-size: 9px;
                        color: #495057;
                        font-family: monospace;
                    }
                    
                    span {
                        color: #6c757d;
                        margin-left: 8px;
                    }
                }
            }
        }
    }
}

@keyframes focusPulse {
    0% {
        box-shadow: 0 0 0 0 rgba(0, 123, 255, 0.4);
    }
    70% {
        box-shadow: 0 0 0 8px rgba(0, 123, 255, 0);
    }
    100% {
        box-shadow: 0 0 0 0 rgba(0, 123, 255, 0);
    }
}`
```

<function_calls>
<invoke name="TodoWrite">
<parameter name="todos">[{"content": "\u5206\u6790hotkeys\u76ee\u5f55\u7ed3\u6784\u548c\u6587\u4ef6\u5185\u5bb9", "id": "1", "priority": "high", "status": "completed"}, {"content": "\u521b\u5efahotkeys\u7cfb\u7edf\u7684\u4e2d\u6587\u8bf4\u660e\u6587\u6863", "id": "2", "priority": "high", "status": "completed"}, {"content": "\u8bbe\u8ba1\u5e76\u5b9e\u73b03\u4e2a\u5b9e\u7528\u7684widget\u793a\u4f8b", "id": "3", "priority": "medium", "status": "completed"}, {"content": "\u521b\u5efamarkdown\u6587\u6863\u6587\u4ef6\u5230ai_markdown\u76ee\u5f55", "id": "4", "priority": "high", "status": "completed"}]