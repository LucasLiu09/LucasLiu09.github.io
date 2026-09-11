---
title: Odoo 16 OWL Registry 机制
sidebar_label: OWL Registry
description: Odoo 16 前端 Registry 的结构、注册方式、覆盖规则，以及 display_notification 实例。
tags:
    - odoo
    - odoo development
last_update:
  date: 2026/09/11
  author: Lucas
---

:::info[说明]
本文只讲 **OWL 前端** 的 `registry`。不要和后端 `odoo/modules/registry.py`、`_register_hook` 混为一谈。
:::

## 1. 总览

Odoo 16 用 OWL 2。组件不再有 OWL 1 的 `Component.register()`。扩展点靠一份全局插件表：

`addons/web/static/src/core/registry.js` 导出单例 `registry`。

JS 模块加载时，各文件在顶层调用 `registry.category(...).add(...)`。`startWebClient()` 启动后，按名字取出 views / fields / services / actions。

**先注册，后启动。** 文件必须打进对应 assets bundle，`add` 才会执行。

## 2. 对象概览

| 对象 | 路径 | 职责 |
| --- | --- | --- |
| `Registry` | `web/static/src/core/registry.js` | 分类表 + 顺序 + `UPDATE` 事件 |
| `registry` | 同上，单例 | 全站共用入口 |
| `startWebClient` | `web/static/src/start.js` | 建 env、启 service、挂 OWL App |
| `startServices` | `web/static/src/env.js` | 按依赖拓扑启动 `services` |
| `action_service` | `web/static/src/webclient/actions/action_service.js` | 用 `action.tag` 查 `actions` |
| `View` | `web/static/src/views/view.js` | 用 `type` / `js_class` 查 `views` |
| `Field` | `web/static/src/views/fields/field.js` | 按 widget / 视图 / 字段类型查 `fields` |

结构：`category → key → [sequence, value]`。`Registry` 继承 OWL `EventBus`，增删都会 `trigger("UPDATE")`。

## 3. API

```javascript
import { registry } from "@web/core/registry";

const cat = registry.category("fields");

cat.add("char", CharField);                          // 新增
cat.add("char", MyCharField, { force: true });       // 覆盖
cat.add("systray_item", item, { sequence: 10 });     // 排序，默认 50
cat.get("char");                                     // 没有则抛 KeyNotFoundError
cat.get("char", DefaultField);                       // 带默认值
cat.contains("char");
cat.getAll();                                        // 按 sequence 排序的 value
cat.getEntries();                                    // [key, value][]
cat.remove("char");
```

要点：

- 同名再 `add` 且没有 `force: true` → `DuplicatedKeyError`
- `force: true` 且未传 `sequence` → 沿用原 sequence
- `category(name)` 不存在就新建，可嵌套：`registry.category("debug").category("default")`
- `getAll` / `getEntries` 有缓存，`UPDATE` 时清空

## 4. 启动时序

```
assets_backend 加载 JS
  └─ 各模块顶层执行 registry.category().add()
startWebClient()
  ├─ makeEnv()
  ├─ startServices(env)          // 消费 services
  └─ new App(Webclient, { templates }).mount()
之后按需查找
  ├─ View.loadView()             // views
  ├─ Field / widget              // fields / view_widgets
  └─ doAction({ tag })           // actions
```

`startServices` 监听 `services` 的 `UPDATE`：启动后再 `add` 新 service，也会补启动。`main_components`、`systray` 同样听 `UPDATE`，可热挂 UI。

XML 模板不是 registry。`t-name` 由 `assets.js` 合成 `templates` DOM，交给 `new App(..., { templates })`。组件用 `static template = "web.UserMenu"` 取模板。

## 5. 常用分类

| category | 注册内容 | 消费者 |
| --- | --- | --- |
| `services` | `{ start(env, deps), dependencies? }` | `startServices` → `env.services` |
| `views` | `{ type, Controller, Renderer, Model, ... }` | `View`，`js_class` 可换子类型 |
| `fields` | Field 组件 class | `Field` |
| `view_widgets` | `<widget name="..."/>` | 视图 widget |
| `actions` | 函数或 Component | `action_service`，按 `tag` |
| `systray` | `{ Component }` | `NavBar`，靠 sequence |
| `main_components` | `{ Component, props }` | `MainComponentsContainer` |
| `error_handlers` | 处理函数 | 全局错误管道 |
| `user_menuitems` | 工厂函数 | 用户菜单 |

`actions` 里两种值：

- **函数** `(env, action) => nextAction | void`：立刻执行，有返回值则 `doAction(next)`
- **Component**：当页面打开

`fields` 查找顺序：

`jsClass.widget` → `viewType.widget` → `widget` → `viewType.fieldType` → `fieldType`

因此可以只覆盖列表 many2one：`registry.category("fields").add("list.many2one", ListMany2OneField)`。

## 6. 如何注册

文件头必须有 `/** @odoo-module **/`，并加入 `web.assets_backend`（或对应 bundle）。

### 新 field / view / service

```javascript
/** @odoo-module **/
import { registry } from "@web/core/registry";
import { listView } from "@web/views/list/list_view";
import { ListRenderer } from "@web/views/list/list_renderer";

class MyListRenderer extends ListRenderer {}

registry.category("views").add("my_list", {
    ...listView,
    Renderer: MyListRenderer,
});

registry.category("fields").add("my_widget", MyField);
registry.category("services").add("my_svc", {
    dependencies: ["notification"],
    start(env, { notification }) {
        return { ping: () => notification.add("pong") };
    },
});
```

视图 XML 写 `js_class="my_list"` 即可命中。

### 新 client action

```javascript
export function myAction(env, action) {
    env.services.notification.add(action.params?.message || "", {
        type: action.params?.type || "info",
    });
    return action.params?.next;
}

registry.category("actions").add("my_action", myAction);
```

Python：

```python
return {
    "type": "ir.actions.client",
    "tag": "my_action",
    "params": {"type": "success", "message": "完成"},
}
```

### 挂到全局浮层 / 托盘

```javascript
registry.category("main_components").add("MyOverlay", {
    Component: MyOverlay,
    props: {},
});

registry.category("systray").add("my.systray", { Component: MySystray }, { sequence: 20 });
```

## 7. 如何覆盖

同名 key 已存在时，必须 `{ force: true }`。自定义模块在 `web` 之后加载，所以原生先 `add`，你们再覆盖。

### 覆盖 client action（例：`display_notification`）

原生：

```javascript
// addons/web/static/src/webclient/actions/client_actions.js
export function displayNotificationAction(env, action) {
    env.services.notification.add(message, options);
    return params.next;
}
registry.category("actions").add("display_notification", displayNotificationAction);
```

`action_service` 用 `action.tag` 取函数并调用。覆盖后，全站现有 `tag: "display_notification"` 都会走新实现，Python 不用改 tag。

```javascript
/** @odoo-module **/
import { registry } from "@web/core/registry";

function displayNotificationAction(env, action) {
    const params = action.params || {};
    env.services.antdNotification.add(params.message || "", {
        title: params.title,
        type: params.type || "info",
        sticky: params.sticky || false,
    });
    return params.next;
}

registry.category("actions").add("display_notification", displayNotificationAction, {
    force: true,
});
```

### 覆盖 service

只换 action，拦截不到 `useService("notification").add(...)`。要连 JS 调用一起换，覆盖 service：

```javascript
registry.category("services").add("notification", antdNotificationService, { force: true });
```

原生 `display_notification` 调的仍是 `env.services.notification`，实现已被替换，action 可以不改。

| 目标 | 覆盖谁 |
| --- | --- |
| 只改 Python / `doAction({ tag: "display_notification" })` | `actions` 的 `display_notification` |
| 连 `useService("notification")` 一起换 | `services` 的 `notification` |
| 两者都要 | 两个都 `force: true`，或只换 service |

### 覆盖 view / field

```javascript
import { formView } from "@web/views/form/form_view";

registry.category("views").add("form", { ...formView, Renderer: MyFormRenderer }, { force: true });
registry.category("fields").add("char", MyCharField, { force: true });
```

全局换 `form` / `char` 影响面大。更稳妥：新 key + `js_class`，或 `list.char` 这种视图限定名。

## 8. register / patch / 新 tag

| 手段 | 适用 |
| --- | --- |
| `registry.add` 新 key | 新增 view / field / action / service |
| `add(..., { force: true })` | 替换已有 key |
| `patch`（`@web/core/utils/patch`） | 改已有 class / 对象的方法，不换名字 |
| 只注册新 tag | 旧 `display_notification` 不受影响，每个调用方都要改 |

`patch` 导出函数不等于换 registry 里的引用。`action_service` 拿的是表里那份，要换 action 必须 `force: true` 写回 registry。

## 9. 踩坑

- 文件没进 assets → `add` 不执行，运行时 `get` 抛 `KeyNotFoundError`
- 同名不带 `force` → 启动失败
- 覆盖 action 不等于覆盖 service，两条入口要分开看
- `get(key)` 无默认值时找不到就抛错；不确定先 `contains()`
- 改 `addons/web` 源码不可取；用自定义模块 + `force: true`
- 后端 `_register_hook` / Python `Registry` 是另一套，和本文无关

## 10. 参考阅读

| 文件 | 看什么 |
| --- | --- |
| `addons/web/static/src/core/registry.js` | `add` / `get` / `category` / `UPDATE` |
| `addons/web/static/src/start.js` | 启动顺序 |
| `addons/web/static/src/env.js` | service 依赖启动 |
| `addons/web/static/src/webclient/actions/action_service.js` | `_executeClientAction` |
| `addons/web/static/src/webclient/actions/client_actions.js` | 原生 `display_notification` |
| `addons/web/static/src/core/notifications/notification_service.js` | 原生 `notification` service |
| `addons/web/static/src/views/view.js` | `views` 查找与 `js_class` |
| `addons/web/static/src/views/fields/field.js` | `fields` 查找优先级 |
| `addons/web/static/src/core/utils/patch.js` | 与 register 互补的改类方式 |
