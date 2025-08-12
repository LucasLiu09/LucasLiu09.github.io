# Odoo 16 Timing 工具函数分析文档

## 概述

`@web/core/utils/timing.js` 是 Odoo 16 中提供时间控制和性能优化功能的核心工具模块。该模块主要提供了防抖（debounce）、节流（throttle）、动画帧处理等函数，用于优化用户界面的性能和响应体验。

## 导出函数总览表

| 函数名 | 类型 | 主要用途 | 返回值 | 特点 |
|--------|------|----------|--------|------|
| `throttleForAnimation` | 动画节流 | 将函数调用频率限制为显示器刷新率 | 带cancel方法的函数 | 基于requestAnimationFrame |
| `throttle` | 时间节流 | 限制函数在指定时间间隔内只执行一次 | 节流后的函数 | 已废弃，建议使用lodash的throttle |
| `debounce` | 防抖 | 延迟函数执行直到指定时间后无新调用 | 带cancel方法的Promise函数 | 支持animationFrame模式和immediate模式 |
| `useDebounced` | Hook | OWL组件中使用防抖函数的Hook | 防抖函数 | 自动在组件卸载时清理 |
| `setRecurringAnimationFrame` | 循环动画 | 创建持续的动画帧循环 | 停止函数 | 提供deltaTime参数 |

## 详细函数分析

### 1. throttleForAnimation(func)

#### 功能描述
创建一个函数版本，在两个动画帧之间只执行最后一次调用。这有效地将函数执行频率限制为显示器的刷新率（通常60fps）。

#### 参数
- `func` (Function): 需要节流的函数

#### 返回值
返回一个对象，包含：
- 节流后的函数
- `cancel()` 方法：取消待执行的函数调用

#### 实现原理
```javascript
export function throttleForAnimation(func) {
    let handle = null;
    const funcName = func.name ? `${func.name} (throttleForAnimation)` : "throttleForAnimation";
    return Object.assign(
        {
            [funcName](...args) {
                browser.cancelAnimationFrame(handle);
                handle = browser.requestAnimationFrame(() => {
                    handle = null;
                    func.call(this, ...args);
                });
            },
        }[funcName],
        {
            cancel() {
                browser.cancelAnimationFrame(handle);
            },
        }
    );
}
```

#### 使用示例

**示例1: 位置Hook中的滚动监听**
```javascript
// addons/web/static/src/core/position_hook.js
export function usePosition(reference, options) {
    // ... 其他代码
    if (!(POSITION_BUS in component.env)) {
        useChildSubEnv({ [POSITION_BUS]: bus });
        const throttledUpdate = throttleForAnimation(() => bus.trigger("update"));
        useExternalListener(document, "scroll", throttledUpdate, { capture: true });
        useExternalListener(document, "load", throttledUpdate, { capture: true });
        useExternalListener(window, "resize", throttledUpdate);
        onWillUnmount(throttledUpdate.cancel);
    }
}
```

**应用场景**：
- 滚动事件处理
- 窗口大小调整事件
- 元素位置更新
- DOM元素重新定位

### 2. throttle(func, delay) - 已废弃

#### 功能描述
⚠️ **注意**：此函数已被标记为废弃，因为其行为与函数名不符。建议使用lodash的throttle函数。

创建一个函数，在持续调用期间，每N毫秒触发一次。

#### 参数
- `func` (Function): 要节流的函数
- `delay` (number): 延迟毫秒数

#### 返回值
节流后的函数

#### 实现特点
- 使用`setTimeout`实现
- 第一次调用立即执行
- 后续调用在延迟期间被忽略

### 3. debounce(func, delay, immediate = false)

#### 功能描述
创建函数的防抖版本，将延迟执行直到最后一次调用后经过指定毫秒数。返回Promise，在函数完全执行后解析。

#### 参数
- `func` (Function): 要防抖的函数
- `delay` (number | "animationFrame"): 延迟毫秒数，或使用"animationFrame"
- `immediate` (boolean): 是否在前缘触发函数，默认false（后缘触发）

#### 返回值
返回一个对象，包含：
- 防抖后的函数（返回Promise）
- `cancel()` 方法：取消待执行的函数调用

#### 实现特点
```javascript
export function debounce(func, delay, immediate = false) {
    let handle;
    const funcName = func.name ? func.name + " (debounce)" : "debounce";
    const useAnimationFrame = delay === "animationFrame";
    const setFnName = useAnimationFrame ? "requestAnimationFrame" : "setTimeout";
    const clearFnName = useAnimationFrame ? "cancelAnimationFrame" : "clearTimeout";
    
    return Object.assign(
        {
            [funcName](...args) {
                return new Promise((resolve) => {
                    const callNow = immediate && !handle;
                    browser[clearFnName](handle);
                    handle = browser[setFnName](() => {
                        handle = null;
                        if (!immediate) {
                            Promise.resolve(func.apply(this, args)).then(resolve);
                        }
                    }, delay);
                    if (callNow) {
                        Promise.resolve(func.apply(this, args)).then(resolve);
                    }
                });
            },
        }[funcName],
        {
            cancel() {
                browser[clearFnName](handle);
            },
        }
    );
}
```

#### 使用示例

**示例1: 视图按钮防抖**
```javascript
// addons/web/static/src/views/view_button/view_button.js
export class ViewButton extends Component {
    setup() {
        if (this.props.icon) {
            this.icon = iconFromString(this.props.icon);
        }
        const { debounce } = this.clickParams;
        if (debounce) {
            this.onClick = debounceFn(this.onClick.bind(this), debounce, true);
        }
        // ... 其他代码
    }
}
```

**示例2: 路由服务中的防抖推送**
```javascript
// addons/web/static/src/core/browser/router_service.js
function makeDebouncedPush(mode) {
    return debounce(
        (url, options = {}) => {
            // 实际的路由推送逻辑
        },
        100  // 100ms防抖
    );
}
```

### 4. useDebounced(callback, delay)

#### 功能描述
OWL组件Hook，返回给定函数的防抖版本，并在组件卸载时自动取消待执行的调用。

#### 参数
- `callback` (Function): 要防抖的回调函数
- `delay` (number): 延迟毫秒数

#### 返回值
防抖后的函数

#### 实现原理
```javascript
export function useDebounced(callback, delay) {
    const component = useComponent();
    const debounced = debounce(callback.bind(component), delay);
    onWillUnmount(() => debounced.cancel());
    return debounced;
}
```

#### 使用示例

**示例1: 表单渲染器的窗口大小调整**
```javascript
// addons/web/static/src/views/form/form_renderer.js
export class FormRenderer extends Component {
    setup() {
        // ... 其他代码
        this.uiService = useService("ui");
        this.onResize = useDebounced(this.render, 200);
        onMounted(() => browser.addEventListener("resize", this.onResize));
        onWillUnmount(() => browser.removeEventListener("resize", this.onResize));
    }
}
```

**应用场景**：
- 窗口大小调整事件处理
- 搜索输入框的实时搜索
- 表单字段的自动保存
- API调用的防抖处理

### 5. setRecurringAnimationFrame(callback)

#### 功能描述
创建递归的动画帧请求，用于需要持续重新渲染的功能。提供的回调函数会收到上一帧所花费的时间作为参数。

#### 参数
- `callback` (Function): 动画回调函数，接收deltaTime参数

#### 返回值
停止函数，调用后停止动画循环

#### 实现原理
```javascript
export function setRecurringAnimationFrame(callback) {
    const handler = (timestamp) => {
        callback(timestamp - lastTimestamp);
        lastTimestamp = timestamp;
        handle = browser.requestAnimationFrame(handler);
    };

    const stop = () => {
        browser.cancelAnimationFrame(handle);
    };

    let lastTimestamp = browser.performance.now();
    let handle = browser.requestAnimationFrame(handler);

    return stop;
}
```

#### 使用示例

**示例1: 拖拽边缘滚动**
```javascript
// addons/web/static/src/core/utils/draggable_hook_builder.js
if (
    (ctx.currentScrollParentX || ctx.currentScrollParentY) &&
    ctx.edgeScrolling.enabled
) {
    const cleanupFn = setRecurringAnimationFrame(handleEdgeScrolling);
    cleanups.push(cleanupFn);
}

function handleEdgeScrolling(deltaTime) {
    // 根据deltaTime实现平滑的边缘滚动
    // deltaTime提供了自上一帧以来经过的时间
}
```

**应用场景**：
- 拖拽操作中的边缘滚动
- 平滑动画效果
- 实时数据可视化
- 游戏循环或连续渲染场景

## 性能优化建议

### 1. 选择合适的节流/防抖策略

- **高频DOM事件**（scroll, resize, mousemove）：使用 `throttleForAnimation`
- **用户输入**（搜索框、表单字段）：使用 `debounce`
- **按钮点击**：使用 `debounce` 配合 `immediate: true`
- **API调用**：使用 `debounce` 避免重复请求

### 2. 合理设置延迟时间

```javascript
// 搜索输入 - 300-500ms
const debouncedSearch = debounce(handleSearch, 300);

// 窗口大小调整 - 100-200ms
const debouncedResize = debounce(handleResize, 200);

// 滚动事件 - 使用animationFrame
const throttledScroll = throttleForAnimation(handleScroll);

// 按钮防重复点击 - 1000-2000ms
const debouncedClick = debounce(handleClick, 1000, true);
```

### 3. 内存泄漏防护

在OWL组件中，始终使用 `useDebounced` 而不是直接使用 `debounce`，或确保在适当时机调用 `cancel()` 方法：

```javascript
// 推荐方式
setup() {
    this.debouncedHandler = useDebounced(this.handler, 300);
}

// 手动管理方式
setup() {
    this.debouncedHandler = debounce(this.handler, 300);
    onWillUnmount(() => this.debouncedHandler.cancel());
}
```

## 测试支持

timing.js 模块在测试环境中得到了良好支持：

```javascript
// addons/web/static/tests/core/utils/timing_tests.js
import { debounce, throttleForAnimation } from "@web/core/utils/timing";
import { mockTimeout, mockAnimationFrame } from "../../helpers/utils";

QUnit.test("debounce on an async function", async function (assert) {
    // 测试防抖函数的异步行为
});
```

测试工具提供了 `mockTimeout` 和 `mockAnimationFrame` 来模拟时间控制函数，确保测试的可靠性和速度。

## 总结

Odoo 16 的 timing 工具模块提供了完整的时间控制解决方案，从简单的防抖节流到复杂的动画帧管理。合理使用这些工具可以显著提升应用的性能和用户体验。关键要点：

1. **throttleForAnimation** - 适用于高频DOM事件，与刷新率同步
2. **debounce** - 适用于用户输入和API调用，支持多种模式
3. **useDebounced** - OWL组件中的最佳实践，自动清理
4. **setRecurringAnimationFrame** - 适用于持续动画和实时更新场景

选择合适的函数和参数对于创建响应式、高性能的用户界面至关重要。 