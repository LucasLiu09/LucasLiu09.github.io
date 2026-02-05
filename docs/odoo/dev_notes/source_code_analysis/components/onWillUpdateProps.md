---
title: onWillUpdateProps
description: onWillUpdateProps
sidebar_label: onWillUpdateProps
keyword:
    - odoo
    - odoo development
tags: [odoo]
last_update:
  date: 2026/02/05
  author: Lucas
---

# Odoo16 OWL onWillUpdateProps 解析

:::info
本文由AI生成+人工校正。
:::

## 结论

`onWillUpdateProps` 的核心作用是：**在组件接收“新 props”并开始渲染之前，先运行一段可选的（可异步的）准备逻辑**，并且 **会阻塞本次渲染**，直到这些回调完成。

在 Odoo16 Web 里，它通常用来做两件事：

- **同步派生状态**：把“由 props 推导出来但需要缓存到 state 的值”在更新前对齐（避免显示旧状态）。
- **等待外部/模型就绪**：在 props 变化导致依赖数据变化时，先 `await` 模型/服务的 promise，再更新组件内部状态（避免渲染时数据未准备好）。

## 生命周期位置

来自 OWL 官方文档（`willUpdateProps`）：它在 **props 更新之前**触发，可注册为 `onWillUpdateProps(nextProps => ...)`，并且是 **异步 hook**（可返回 Promise），**不会在首次渲染触发**（首次渲染对应 `willStart`）。参考见 [Owl Component 文档 `willUpdateProps`](https://github.com/odoo/owl/blob/master/doc/reference/component.md#willupdateprops)。

## OWL 源码机制

### 先跑 hook 再换 props

在 Odoo16 内置的 OWL 实现里，组件更新会先计算 `nextProps`，**等待所有 `willUpdateProps` 回调完成**，然后才把 `component.props` 设为新值并继续渲染：

```javascript title="2470:2503:odoo-16.0\addons\web\static\lib\owl\owl.js"
        async updateAndRender(props, parentFiber) {
            this.nextProps = props;
            props = Object.assign({}, props);
            // update
            const fiber = makeChildFiber(this, parentFiber);
            this.fiber = fiber;
            const component = this.component;
            const defaultProps = component.constructor.defaultProps;
            if (defaultProps) {
                applyDefaultProps(props, defaultProps);
            }
            currentNode = this;
            for (const key in props) {
                const prop = props[key];
                if (prop && typeof prop === "object" && targets.has(prop)) {
                    props[key] = useState(prop);
                }
            }
            currentNode = null;
            const prom = Promise.all(this.willUpdateProps.map((f) => f.call(component, props)));
            await prom;
            if (fiber !== this.fiber) {
                return;
            }
            component.props = props;
            fiber.render();
            const parentRoot = parentFiber.root;
            if (this.willPatch.length) {
                parentRoot.willPatch.push(fiber);
            }
            if (this.patched.length) {
                parentRoot.patched.push(fiber);
            }
        }
```

这段实现带来三个非常关键的语义：

- **hook 拿到的是 nextProps**：回调参数 `props` 就是“将要成为 props 的对象”（已合并 `defaultProps`，也做了 `useState` 的目标转换）。
- **hook 期间组件仍是旧 props**：因为 `component.props = props` 在 `await` 之后才执行。
- **渲染被阻塞**：`await Promise.all(...)` 期间不会继续 `fiber.render()`。

### 并发安全：旧更新会自动失效

源码在 `await` 后检查 `fiber !== this.fiber` 就直接 `return`，意味着：

- 如果在等待 hook 的过程中又来了新的更新（新的 fiber 覆盖了旧 fiber），**旧的 onWillUpdateProps 结果不会再落到组件上**。
- 这是一种“最后一次更新胜出”的并发保护，Odoo 里很常见（例如快速切换记录/视图时）。

### Dev 模式 3 秒告警

若 `onWillUpdateProps` 返回 Promise 且超过 3 秒未 resolve，Dev 模式会给出 `console.warn`（同样适用于 `onWillStart`），帮助定位“阻塞渲染”的慢逻辑：

```javasctipt title="2603:2654:odoo-16.0\addons\web\static\lib\owl\owl.js"
    const TIMEOUT = Symbol("timeout");
    function wrapError(fn, hookName) {
        const error = new OwlError(`The following error occurred in ${hookName}: `);
        const timeoutError = new OwlError(`${hookName}'s promise hasn't resolved after 3 seconds`);
        const node = getCurrent();
        return (...args) => {
            const onError = (cause) => {
                error.cause = cause;
                if (cause instanceof Error) {
                    error.message += `"${cause.message}"`;
                }
                else {
                    error.message = `Something that is not an Error was thrown in ${hookName} (see this Error's "cause" property)`;
                }
                throw error;
            };
            try {
                const result = fn(...args);
                if (result instanceof Promise) {
                    if (hookName === "onWillStart" || hookName === "onWillUpdateProps") {
                        const fiber = node.fiber;
                        Promise.race([
                            result.catch(() => { }),
                            new Promise((resolve) => setTimeout(() => resolve(TIMEOUT), 3000)),
                        ]).then((res) => {
                            if (res === TIMEOUT && node.fiber === fiber) {
                                console.warn(timeoutError);
                            }
                        });
                    }
                    return result.catch(onError);
                }
                return result;
            }
            catch (cause) {
                onError(cause);
            }
        };
    }
    function onWillUpdateProps(fn) {
        const node = getCurrent();
        const decorate = node.app.dev ? wrapError : (fn) => fn;
        node.willUpdateProps.push(decorate(fn.bind(node.component), "onWillUpdateProps"));
    }
```

## 常见使用时机

### 派生 state 要跟随 props

Odoo16 字段组件里非常典型：组件内部有 `useState`，其中某些字段本质上由 props 推导，但又需要作为本地 UI 状态存在（例如浮动标签、文件名缓存、可用动作集合等）。这时在 props 更新前同步对齐 state，能避免一帧的“旧 UI”闪烁。

例如 `Many2OneField` 根据 `value` 与权限 props 计算 `isFloating` 和 `activeActions`：

```javascript title="odoo-16.0\addons\web\static\src\views\fields\many2one\many2one_field.js"
export class Many2OneField extends Component {
    setup() {
        // ...
        this.state = useState({
            isFloating: !this.props.value,
        });
        this.computeActiveActions(this.props);
        // ...
        onWillUpdateProps(async (nextProps) => {
            this.state.isFloating = !nextProps.value;
            this.computeActiveActions(nextProps);
        });
    }
    // ...
}
```

同类场景在 `BinaryField` 里也很直观：`fileName` 缓存在 state，props 变更时提前刷新 state，确保模板读取的值一致。

### 依赖 promise 的准备工作

Odoo16 的 SearchPanel 需要等 `searchModel.sectionsPromise` 完成后才能正确计算 active 值。首次渲染用 `onWillStart`，后续 props 更新用 `onWillUpdateProps`，两者配合保证“初次 + 更新”都能等数据就绪：

- `onWillStart`: 初始化前等待数据
- `onWillUpdateProps`: 每次更新前等待数据并同步状态

（示例见 `odoo-16.0\addons\web\static\src\search\search_panel\search_panel.js` 的 `setup()`，其中 `onWillUpdateProps(async () => { await sectionsPromise; ... })`）

## 什么时候必须用

下面这些情况属于“必须或几乎必须”，否则容易出现错渲染、闪烁、竞态：

- **必须在渲染前完成异步准备**：例如 props 变化触发要 `await` 某个模型 promise / 远程读取 / 资源加载，而模板或后续逻辑依赖其结果。用 `onWillUpdateProps` 才能让这次渲染“等准备好再继续”。
- **需要在 props 生效前做一致性校验或纠正**：例如 nextProps 会让内部缓存失效，必须先清理/重置某些 state（不然会出现旧缓存配新 props 的不一致）。
- **高频切换场景需要抗竞态**：例如快速切换记录、视图、domain，异步更新很容易“后来的 props 先渲染、先前的异步后回来覆盖”。OWL 的 fiber 检查让旧更新自动失效；你把异步放在 `onWillUpdateProps` 里，能更自然地利用这个机制。

## 什么时候不该用

- **只是 DOM 操作或外部库刷新**：更适合 `onPatched` / `onMounted`（它们发生在 DOM patch 前后，适合读/写 DOM）。
- **不需要阻塞渲染的异步**：如果允许先渲染一个“加载中/占位”，再异步更新 state 触发二次渲染，那就不要用 `onWillUpdateProps` 去阻塞 UI。
- **把它当成“监听 props 的副作用”万能钩子**：只要逻辑不要求“发生在 props 真正切换前”，就应优先考虑更轻量的方式（例如直接在渲染时用 getter 派生、或用其他 hook 做后置同步）。

## 与 onWillStart 的关系

- **首次渲染**：`onWillStart` 会被执行一次，用于初始化前准备。
- **后续更新**：`onWillUpdateProps` 在每次 props 变化时执行，用于更新前准备。

在 Odoo16 里如果你既要覆盖“首次加载”也要覆盖“后续切换”，通常会 **两者都写**，并把公共逻辑抽成函数复用（SearchPanel 就是一个典型结构）。

## 实战建议

- **尽量让回调快**：它会阻塞渲染；Dev 模式 3 秒告警是一个强信号。
- **回调里用 nextProps**：不要依赖 `this.props`（它此时还是旧值）。
- **异步逻辑要可重入**：同一组件可能在上一次还没结束时又来了下一次更新；让“旧请求结果不落地”是目标。

## 参考

- [Owl Component 文档 `willUpdateProps`](https://github.com/odoo/owl/blob/master/doc/reference/component.md#willupdateprops)
- `odoo-16.0\addons\web\static\lib\owl\owl.js`

