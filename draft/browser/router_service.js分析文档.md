# router_service.js 文件分析文档

## 文件概述

**文件路径**: `C:\Code\Odoo\Demo1\addons\web\static\src\core\browser\router_service.js`

**主要功能**: 提供路由管理服务，处理URL解析、导航状态管理、浏览器历史记录操作，以及URL参数的锁定机制。

## 核心设计理念

该服务实现了一个功能完整的前端路由系统，支持：
- URL的解析和构建
- 浏览器历史记录管理
- URL参数锁定机制
- 防抖的状态推送
- 页面重定向功能

## 主要组件分析

### 1. 类型定义

```javascript
/**
 * @typedef {{ [key: string]: string }} Query
 * @typedef {{ [key: string]: any }} Route
 */
```

**定义说明**:
- `Query`: 键值对形式的查询参数
- `Route`: 路由对象，包含路径和参数信息

### 2. 工具函数

#### cast 函数
```javascript
function cast(value) {
    return !value || isNaN(value) ? value : Number(value);
}
```
**功能**: 智能类型转换，将数字字符串转换为数字类型
**用途**: 确保URL参数的类型正确性

#### parseString 函数
```javascript
function parseString(str) {
    const parts = str.split("&");
    const result = {};
    for (const part of parts) {
        const [key, value] = part.split("=");
        const decoded = decodeURIComponent(value || "");
        result[key] = cast(decoded);
    }
    return result;
}
```
**功能**: 解析URL编码的查询字符串
**处理流程**:
1. 按`&`分割参数对
2. 按`=`分割键值
3. URL解码
4. 自动类型转换

### 3. URL参数锁定机制

#### applyLocking 函数
```javascript
function applyLocking(lockedKeys, hash, currentHash, options = {}) {
    const newHash = {};
    for (const key in hash) {
        if ("lock" in options) {
            options.lock ? lockedKeys.add(key) : lockedKeys.delete(key);
        } else if (lockedKeys.has(key)) {
            continue; // 禁止隐式覆盖已锁定的键
        }
        newHash[key] = hash[key];
    }
    // 保持锁定键的现有值
    for (const key in currentHash) {
        if (lockedKeys.has(key) && !(key in newHash)) {
            newHash[key] = currentHash[key];
        }
    }
    return newHash;
}
```

**功能特性**:
- **键锁定**: 防止特定URL参数被意外修改
- **锁定管理**: 支持动态锁定和解锁
- **值保持**: 锁定的键保持其原有值

**使用场景**: 保护重要的路由参数不被其他组件无意修改

### 4. 路由计算和清理

#### computeNewRoute 函数
```javascript
function computeNewRoute(hash, replace, currentRoute) {
    if (!replace) {
        hash = Object.assign({}, currentRoute.hash, hash);
    }
    hash = sanitizeHash(hash);
    if (!shallowEqual(currentRoute.hash, hash)) {
        return Object.assign({}, currentRoute, { hash });
    }
    return false;
}
```

**功能**: 计算新的路由状态
**处理逻辑**:
1. 根据`replace`模式合并或替换参数
2. 清理无效参数
3. 比较变化，避免无效更新

#### sanitizeHash 函数
```javascript
function sanitizeHash(hash) {
    return Object.fromEntries(
        Object.entries(hash)
            .filter(([, v]) => v !== undefined)
            .map(([k, v]) => [k, cast(v)])
    );
}
```

**功能**: 清理hash参数
- 过滤`undefined`值
- 自动类型转换

### 5. URL解析函数

#### parseHash 函数
```javascript
export function parseHash(hash) {
    return hash && hash !== "#" ? parseString(hash.slice(1)) : {};
}
```

#### parseSearchQuery 函数
```javascript
export function parseSearchQuery(search) {
    return search ? parseString(search.slice(1)) : {};
}
```

#### routeToUrl 函数
```javascript
export function routeToUrl(route) {
    const search = objectToUrlEncodedString(route.search);
    const hash = objectToUrlEncodedString(route.hash);
    return route.pathname + (search ? "?" + search : "") + (hash ? "#" + hash : "");
}
```

**功能**: 将路由对象转换回URL字符串

### 6. 重定向功能

#### redirect 函数
```javascript
async function redirect(env, url, wait = false) {
    if (wait) {
        await new Promise((resolve) => {
            const waitForServer = (delay) => {
                browser.setTimeout(async () => {
                    env.services
                        .rpc("/web/webclient/version_info", {})
                        .then(resolve)
                        .catch(() => waitForServer(250));
                }, delay);
            };
            waitForServer(1000);
        });
    }
    browser.location.assign(url);
}
```

**特性**:
- **等待模式**: 可选的服务器可用性检查
- **重试机制**: 自动重试直到服务器响应
- **渐进延迟**: 250ms的重试间隔

### 7. 路由器核心实现

#### makeRouter 函数

该函数创建路由器实例，包含以下核心功能：

##### 状态管理
```javascript
const bus = env.bus;
const lockedKeys = new Set();
let current = getRoute(browser.location);
let pushTimeout;
```

##### 事件监听
```javascript
browser.addEventListener("hashchange", (ev) => {
    browser.clearTimeout(pushTimeout);
    const loc = new URL(ev.newURL);
    current = getRoute(loc);
    bus.trigger("ROUTE_CHANGE");
});
```

**功能**: 监听浏览器hash变化并触发路由更新事件

##### 防抖推送机制

###### makeDebouncedPush 函数
```javascript
function makeDebouncedPush(mode) {
    let allPushArgs = [];
    function doPush() {
        // 聚合所有推送参数
        const replace = allPushArgs.some(([, options]) => options && options.replace);
        const newHash = allPushArgs.reduce((finalHash, [hash, options]) => {
            hash = applyLocking(lockedKeys, hash, current.hash, options);
            if (finalHash) {
                hash = applyLocking(lockedKeys, hash, finalHash, options);
            }
            return Object.assign(finalHash || {}, hash);
        }, null);
        
        // 计算新路由并更新浏览器状态
        const newRoute = computeNewRoute(newHash, replace, current);
        if (!newRoute) return;
        
        const url = browser.location.origin + routeToUrl(newRoute);
        if (mode === "push") {
            browser.history.pushState({}, "", url);
        } else {
            browser.history.replaceState({}, "", url);
        }
        current = getRoute(browser.location);
    }
    
    return function pushOrReplaceState(hash, options) {
        allPushArgs.push([hash, options]);
        browser.clearTimeout(pushTimeout);
        pushTimeout = browser.setTimeout(() => {
            doPush();
            pushTimeout = null;
            allPushArgs = [];
        });
    };
}
```

**设计优势**:
- **批量处理**: 聚合多个快速连续的推送请求
- **性能优化**: 避免频繁的DOM操作
- **参数合并**: 智能合并多个参数更新

### 8. 服务接口

#### 返回的路由器对象
```javascript
return {
    get current() {
        return current;
    },
    pushState: makeDebouncedPush("push"),
    replaceState: makeDebouncedPush("replace"),
    redirect: (url, wait) => redirect(env, url, wait),
    cancelPushes: () => browser.clearTimeout(pushTimeout),
};
```

**接口说明**:
- `current`: 当前路由状态（只读）
- `pushState`: 添加新的历史记录
- `replaceState`: 替换当前历史记录
- `redirect`: 页面重定向
- `cancelPushes`: 取消待处理的推送操作

### 9. 辅助工具

#### objectToQuery 函数
```javascript
export function objectToQuery(obj) {
    const query = {};
    Object.entries(obj).forEach(([k, v]) => {
        query[k] = v ? String(v) : v;
    });
    return query;
}
```

**功能**: 将对象转换为查询参数格式

## 服务注册

```javascript
export const routerService = {
    start(env) {
        return makeRouter(env);
    },
};

registry.category("services").add("router", routerService);
```

## 使用场景

### 1. 单页应用导航
```javascript
// 导航到新页面
router.pushState({ view: 'form', id: 123 });

// 替换当前URL
router.replaceState({ filter: 'active' });
```

### 2. 参数锁定
```javascript
// 锁定关键参数
router.pushState({ action: 'edit' }, { lock: true });

// 解锁参数
router.pushState({ action: 'view' }, { lock: false });
```

### 3. 条件重定向
```javascript
// 等待服务器就绪后重定向
router.redirect('/dashboard', true);

// 立即重定向
router.redirect('/login');
```

## 技术特点

### 优点
1. **防抖机制**: 优化性能，避免频繁URL更新
2. **参数锁定**: 保护重要路由参数
3. **类型智能**: 自动进行参数类型转换
4. **事件驱动**: 支持路由变化监听
5. **兼容性**: 良好的浏览器API封装

### 设计模式
1. **服务模式**: 作为Odoo服务系统的一部分
2. **观察者模式**: 通过事件总线通知路由变化
3. **策略模式**: 支持push和replace两种历史记录操作模式

### 性能优化
1. **批量更新**: 防抖机制减少DOM操作
2. **浅比较**: 避免不必要的路由更新
3. **延迟处理**: 异步处理重定向逻辑

## 在Odoo架构中的作用

该路由服务是Odoo Web客户端的核心基础设施，为以下功能提供支持：

1. **视图导航**: 在不同视图间切换
2. **状态保持**: 保持应用状态在URL中
3. **书签支持**: 支持URL书签和直接访问
4. **浏览器集成**: 与浏览器前进/后退按钮集成
5. **参数管理**: 统一管理URL参数和路由状态

该服务为Odoo的单页应用架构提供了强大而灵活的路由管理能力。