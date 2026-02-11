---
title: Owl Component
description: Owl Component
sidebar_label: Owl Component
keyword:
    - odoo
    - odoo development
tags: [odoo]
last_update:
  date: 2026/02/11
  author: Lucas
---

:::note[文档索引]
- [Owl Framework](https://github.com/odoo/owl)
:::

# 🦉 Owl Component 🦉

## 目录

- [概述](#概述)
- [属性和方法](#属性和方法)
- [静态属性](#静态属性)
- [生命周期](#生命周期)
  - [`setup`](#setup)
  - [`willStart`](#willstart)
  - [`willRender`](#willrender)
  - [`rendered`](#rendered)
  - [`mounted`](#mounted)
  - [`willUpdateProps`](#willupdateprops)
  - [`willPatch`](#willpatch)
  - [`patched`](#patched)
  - [`willUnmount`](#willunmount)
  - [`willDestroy`](#willdestroy)
  - [`onError`](#onerror)
- [子组件](#子组件)
- [动态子组件](#动态子组件)
- [`status` 辅助函数](#status-辅助函数)

## 概述

Owl Component 是代表用户界面某个部分的小型类。它是 Component 树的一部分，拥有一个 [environment](https://github.com/odoo/owl/blob/master/doc/reference/environment.md)（`env`），该环境从父组件传播到子组件。

Owl Component 通过继承 `Component` 类来定义。例如，以下是实现 `Counter` Component 的方式：

```javascript
const { Component, xml, useState } = owl;

class Counter extends Component {
  static template = xml`
    <button t-on-click="increment">
      Click Me! [<t t-esc="state.value"/>]
    </button>`;

  state = useState({ value: 0 });

  increment() {
    this.state.value++;
  }
}
```

在这个示例中，我们使用 `xml` 辅助函数来定义内联 Template，以及 `useState` Hook，它返回其参数的响应式版本（参见响应式页面）。

## 属性和方法

`Component` 类有一个非常小的 API。

- **`env (object)`**：Component 的 [environment](https://github.com/odoo/owl/blob/master/doc/reference/environment.md)

- **`props (object)`**：这是一个对象，包含父组件传递给子 Component 的所有 [props](https://github.com/odoo/owl/blob/master/doc/reference/props.md)

  注意，`props` 由父组件拥有，而不是由 Component 拥有。因此，Component 不应该修改它（否则可能会导致意外效果，因为父组件可能不知道这个变化）！

  `props` 可以由父组件动态修改。在这种情况下，Component 将经历以下生命周期方法：`willUpdateProps`、`willPatch` 和 `patched`。

* **`render(deep[=false])`**：直接调用此方法将导致重新渲染。请注意，使用响应式系统时，应该很少需要手动执行此操作。此外，渲染操作是异步的，因此 DOM 将在稍后更新（在下一个动画帧，如果没有 Component 延迟渲染）。

  默认情况下，如果子 Component 的 props（浅层）相等，则此方法发起的渲染将在每个子 Component 处停止。要强制渲染更新所有子组件，可以使用可选的 `deep` 参数。请注意，`deep` 参数的值需要是布尔值，而不是真值。

## 静态属性

- **`template (string)`**：这是将渲染 Component 的 Template 名称。请注意，有一个 `xml` 辅助函数可以轻松定义内联 Template。

* **`components (object, optional)`**：如果提供，这是一个对象，包含 Template 所需的任何子组件的类。

  ```js
  class ParentComponent extends owl.Component {
    static components = { SubComponent };
  }
  ```

* **`props (object, optional)`**：如果提供，这是一个对象，描述传递给 Component 的（实际）props 的类型和结构。如果 Owl 模式为 `dev`，这将用于在每次创建/更新 Component 时验证 props。有关更多信息，请参阅 [Props Validation](https://github.com/odoo/owl/blob/master/doc/reference/props.md#props-validation)。

  ```js
  class Counter extends owl.Component {
    static props = {
      initialValue: Number,
      optional: true,
    };
  }
  ```

- **`defaultProps (object, optional)`**：如果提供，此对象定义（顶层）props 的默认值。每当给对象提供 `props` 时，它们将被修改以添加默认值（如果缺失）。请注意，它不会更改初始对象，而是创建一个新对象。有关更多信息，请参阅 [default props](https://github.com/odoo/owl/blob/master/doc/reference/props.md#default-props)。

  ```js
  class Counter extends owl.Component {
    static defaultProps = {
      initialValue: 0,
    };
  }
  ```

## 生命周期

![component lifecycle](../../_images/component_lifecycle.svg)

> 图片来源于[Odoo documentation - 01_owl_components](https://www.odoo.com/documentation/18.0/zh_CN/developer/tutorials/discover_js_framework/01_owl_components.html#theory-component-lifecycle-and-hooks).

一个 Owl 组件会经历许多阶段：它可以被实例化(instantiated)、渲染(rendered)、挂载(mounted)、更新(updated)、分离(detached)、销毁(destroyed)……这就是[组件的生命周期](https://github.com/odoo/owl/blob/master/doc/reference/component.md#lifecycle) 。上图展示了组件生命周期中最重要的几个事件（**Hook**函数以紫色显示）。简而言之，一个组件会被创建，然后更新（可能多次更新），最后被销毁。

Owl 提供了多种内置[Hook函数](https://github.com/odoo/owl/blob/master/doc/reference/hooks.md) 。所有这些函数都必须在 `setup` 函数中调用。例如，如果您想在组件挂载时执行一些代码，可以使用 `onMounted` 函数，例如：

```javascript
setup() {
  onMounted(() => {
    // do something here
  });
}
```

一个可靠且健壮的组件系统需要一个完整的生命周期系统来帮助开发者编写组件。以下是 Owl Component 生命周期的完整描述：

| 方法                                  | Hook                | 描述                                                            |
| --------------------------------------- | ------------------- | ---------------------------------------------------------------------- |
| **[setup](#setup)**                     | none                | 设置                                                                  |
| **[willStart](#willstart)**             | `onWillStart`       | 异步，首次渲染之前                                          |
| **[willRender](#willrender)**           | `onWillRender`      | Component 渲染之前                                      |
| **[rendered](#rendered)**               | `onRendered`        | Component 渲染之后                                       |
| **[mounted](#mounted)**                 | `onMounted`         | Component 渲染并添加到 DOM 之后                  |
| **[willUpdateProps](#willupdateprops)** | `onWillUpdateProps` | 异步，props 更新之前                                             |
| **[willPatch](#willpatch)**             | `onWillPatch`       | DOM 打补丁之前                                         |
| **[patched](#patched)**                 | `onPatched`         | DOM 打补丁之后                                          |
| **[willUnmount](#willunmount)**         | `onWillUnmount`     | 从 DOM 移除 Component 之前                                |
| **[willDestroy](#willdestroy)**         | `onWillDestroy`     | Component 销毁之前                                     |
| **[error](#onerror)**                   | `onError`           | 捕获和处理错误（参见[错误处理页面](https://github.com/odoo/owl/blob/master/doc/reference/error_handling.md)） |

### `setup`

_setup_ 在 Component 构造后立即运行。它是一个生命周期方法，非常类似于 _constructor_，不同之处在于它不接收任何参数。

这是调用 Hook 函数的合适位置。请注意，在 Component 生命周期中使用 `setup` Hook 的主要原因之一是使其能够被猴子补丁(monkey patch)。这在 Odoo 生态系统中是常见需求。

```javascript
setup() {
  useSetupAutofocus();
}
```

### `willStart`

`willStart` 是一个异步 Hook，可以实现以在 Component 初始渲染之前执行一些（大多数时候是异步的）操作。

它将在初始渲染之前恰好调用一次。在某些情况下很有用，例如，在渲染 Component 之前加载外部资源（如 JS 库）。另一个用例是从服务器加载数据。

`onWillStart` Hook 用于注册一个将在此时执行的函数：

```javascript
  setup() {
    onWillStart(async () => {
      this.data = await this.loadData()
    });
  }
```

此时，Component 尚未渲染。请注意，缓慢的 `willStart` 代码将减慢用户界面的渲染。因此，应该注意尽可能快地执行此方法。

请注意，如果注册了多个 `onWillStart` 回调，则它们将全部并行运行。

### `willRender`

不常见，但可能需要在 Component 渲染之前（更准确地说，当其编译的 Template 函数执行时）执行代码。为此，可以使用 `onWillRender` Hook：

```javascript
  setup() {
    onWillRender(() => {
      // do something
    });
  }
```

`willRender` Hook 在渲染 Template 之前调用，首先是父组件，然后是子组件。

### `rendered`

不常见，但可能需要在 Component 渲染之后（更准确地说，当其编译的 Template 函数执行时）执行代码。为此，可以使用 `onRendered` Hook：

```javascript
  setup() {
    onRendered(() => {
      // do something
    });
  }
```

`rendered` Hook 在渲染 Template 之后调用，首先是父组件，然后是子组件。请注意，此时实际的 DOM 可能还不存在（如果是首次渲染），或者尚未更新。这将在下一个动画帧中完成，只要所有组件都准备就绪。

### `mounted`

`mounted` Hook 在每次 Component 附加到 DOM 后调用，在初始渲染之后。此时，Component 被视为_活动状态_。这是添加一些监听器或与 DOM 交互的好地方，例如，如果 Component 需要执行一些测量。

它与 `willUnmount` 相反。如果 Component 已挂载，它将来总会在某个时刻被卸载。

mounted 方法将递归地在其每个子组件上调用。首先是子组件，然后是父组件。

允许（但不鼓励）在 `mounted` Hook 中修改 State。这样做将导致重新渲染，用户不会察觉，但会稍微减慢 Component 的速度。

`onMounted` Hook 用于注册一个将在此时执行的函数：

```javascript
  setup() {
    onMounted(() => {
      // do something here
    });
  }
```

### `willUpdateProps`

`willUpdateProps` 是一个异步 Hook，在设置新 props 之前调用。如果 Component 需要执行异步任务（取决于 props），这很有用（例如，假设 props 是某个记录 Id，则获取记录数据）。

`onWillUpdateProps` Hook 用于注册一个将在此时执行的函数：

```javascript
  setup() {
    onWillUpdateProps(nextProps => {
      return this.loadData({id: nextProps.id});
    });
  }
```

请注意，它接收 Component 的下一个 props。

此 Hook 不会在首次渲染期间调用（但会调用 `willStart`，它执行类似的工作）。此外，与大多数 Hook 一样，它按通常的顺序调用：首先是父组件，然后是子组件。

### `willPatch`

willPatch Hook 在 DOM 打补丁过程开始之前调用。它不会在初始渲染时调用。这对于从 DOM 读取信息很有用。例如，滚动条的当前位置。

请注意，这里不允许修改 State。此方法在实际 DOM 打补丁之前调用，仅用于保存一些本地 DOM 状态。此外，如果 Component 不在 DOM 中，它将不会被调用。

`onWillPatch` Hook 用于注册一个将在此时执行的函数：

```javascript
  setup() {
    onWillPatch(() => {
      this.scrollState = this.getScrollSTate();
    });
  }
```

`willPatch` 按通常的父组件->子组件顺序调用。

### `patched`

此 Hook 在 Component 实际更新其 DOM 时调用（最有可能通过其 State/props 或 environment 的更改）。

此方法不会在初始渲染时调用。每当 Component 打补丁时，它对于与 DOM 交互（例如，通过外部库）很有用。请注意，如果 Component 不在 DOM 中，则不会调用此 Hook。

`onPatched` Hook 用于注册一个将在此时执行的函数：

```javascript
  setup() {
    onPatched(() => {
      this.scrollState = this.getScrollSTate();
    });
  }
```

在此 Hook 中更新 Component 的 State 是可能的，但不鼓励。需要小心，因为这里的更新将创建额外的渲染，这反过来将导致对 `patched` 方法的其他调用。因此，我们需要特别小心避免无限循环。

与 `mounted` 一样，`patched` Hook 按以下顺序调用：首先是子组件，然后是父组件。

### `willUnmount`

`willUnmount` 是一个 Hook，在 Component 从 DOM 卸载之前每次调用。这是移除监听器的好地方。

`onWillUnmount` Hook 用于注册一个将在此时执行的函数：

```javascript
  setup() {
    onMounted(() => {
      // add some listener
    });
    onWillUnmount(() => {
      // remove listener
    });
  }
```

这是 `mounted` 的相反方法。请注意，如果 Component 在挂载之前被销毁，则可能不会调用 `willUnmount` 方法。

父组件的 `willUnmount` Hook 将在子组件之前调用。

### `willDestroy`

有时，组件需要在 `setup` 中执行某些操作，并在它们处于非活动状态时清理它。然而，`willUnmount` Hook 不适合清理操作，因为 Component 可能在挂载之前就被销毁了。`willDestroy` Hook 在这种情况下很有用，因为它总是被调用。

`onWillDestroy` Hook 用于注册一个将在此时执行的函数：

```javascript
  setup() {
    onWillDestroy(() => {
      // do some cleanup
    });
  }
```

`willDestroy` Hook 首先在子组件上调用，然后在父组件上调用。

### `onError`

不幸的是，Component 可能在运行时崩溃。这是一个不幸的现实，这就是为什么 Owl 需要提供一种处理这些错误的方法。

当我们需要拦截并正确响应某些子组件中发生的错误时，`onError` Hook 很有用。有关更多详细信息，请参阅[错误处理](https://github.com/odoo/owl/blob/master/doc/reference/error_handling.md)页面。

```javascript
  setup() {
    onError(() => {
      // do something
    });
  }
```

## 子组件

使用其他（子）组件来定义 Component 是很方便的。这称为组合，在实践中非常强大。要在 Owl 中做到这一点，只需在其 Template 中使用以大写字母开头的标签，并在其静态 `components` 对象中注册子 Component 类：

```js
class Child extends Component {
  static template = xml`<div>child component <t t-esc="props.value"/></div>`;
}

class Parent extends Component {
  static template = xml`
    <div>
      <Child value="1"/>
      <Child value="2"/>
    </div>`;

  static components = { Child };
}
```

此示例还展示了如何将信息从父 Component 传递到子 Component，作为 props。有关更多信息，请参阅 [props 部分](https://github.com/odoo/owl/blob/master/doc/reference/props.md)。

## 动态子组件

不常见，但有时我们需要一个动态 Component 名称。在这种情况下，`t-component` 指令也可以用于接受动态值。这应该是一个计算为 Component 类的表达式。例如：

```js
class A extends Component {
  static template = xml`<div>child a</div>`;
}
class B extends Component {
  static template = xml`<span>child b</span>`;
}
class Parent extends Component {
  static template = xml`<t t-component="myComponent"/>`;

  state = useState({ child: "a" });

  get myComponent() {
    return this.state.child === "a" ? A : B;
  }
}
```

## `status` 辅助函数

有时，能够找出 Component 当前处于哪种状态是很方便的。为此，可以使用 `status` 辅助函数：

```js
const { status } = owl;
// assume component is an instance of a Component

console.log(status(component));
// logs either:
// - 'new', if the component is new and has not been mounted yet
// - 'mounted', if the component is currently mounted
// - 'cancelled', if the component has not been mounted yet but will be destroyed soon
// - 'destroyed' if the component is currently destroyed
```
