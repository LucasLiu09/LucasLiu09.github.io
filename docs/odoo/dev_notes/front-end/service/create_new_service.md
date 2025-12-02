---
title: 创建Service
description: Odoo 16 前端 Service 创建教程
sidebar_label: 创建Service
keyword:
  - odoo
  - odoo development
tags:
  - odoo
last_update:
  date: 2025/12/2
  author: Lucas
---

# 创建Service

:::note[说明]
Service 是 Odoo 16 前端架构中的核心组件，用于管理应用状态、处理业务逻辑和提供可复用功能。
:::

## 概述

Odoo 16 使用 OWL (Odoo Web Library) 框架构建前端应用。Service 作为单例模式运行，在应用生命周期内持续存在，为组件提供共享功能和状态管理。

## Service 基本结构

### 1. 定义 Service

```javascript
/** @odoo-module **/

import { registry } from "@web/core/registry";

const myService = {
    dependencies: ["rpc", "notification"],

    start(env, { rpc, notification }) {
        // Service 初始化逻辑
        const state = reactive({
            data: [],
            loading: false
        });

        // Service 公开的 API
        return {
            state,
            async loadData() {
                state.loading = true;
                try {
                    state.data = await rpc("/web/dataset/call_kw", {
                        model: "res.partner",
                        method: "search_read",
                        args: [[], ["name", "email"]],
                        kwargs: {}
                    });
                } finally {
                    state.loading = false;
                }
            },
            clearData() {
                state.data = [];
            }
        };
    }
};

// 注册 Service
registry.category("services").add("myService", myService);
```

### 2. Service 属性说明

| 属性 | 类型 | 描述 |
|-----|------|------|
| `dependencies` | Array | 依赖的其他 Service 名称列表 |
| `start` | Function | Service 初始化函数，返回 Service API |
| `async` | Boolean | 是否异步启动（可选） |

## 在组件中使用 Service

### 使用 useService Hook

```javascript
/** @odoo-module **/

import { Component } from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";

export class MyComponent extends Component {
    setup() {
        this.myService = useService("myService");

        // 访问 Service 状态
        console.log(this.myService.state.data);

        // 调用 Service 方法
        onWillStart(() => this.myService.loadData());
    }
}

MyComponent.template = xml`
    <div>
        <t t-if="myService.state.loading">Loading...</t>
        <t t-else="">
            <ul>
                <li t-foreach="myService.state.data" t-as="item"
                    t-key="item.id">
                    <t t-esc="item.name"/>
                </li>
            </ul>
        </t>
    </div>
`;
```

## 高级特性

### 1. 异步 Service

处理需要异步初始化的 Service：

```javascript
const asyncService = {
    dependencies: ["rpc"],
    async: true,

    async start(env, { rpc }) {
        // 异步初始化
        const config = await rpc("/web/dataset/call_kw", {
            model: "ir.config_parameter",
            method: "get_param",
            args: ["my_module.config_key"],
            kwargs: {}
        });

        return {
            config,
            isEnabled: () => config === "enabled"
        };
    }
};
```

### 2. Service 间通信

Service 可以依赖并调用其他 Service：

```javascript
const dataService = {
    dependencies: ["rpc", "notification", "user"],

    start(env, { rpc, notification, user }) {
        return {
            async saveData(data) {
                if (!user.hasGroup("base.group_user")) {
                    notification.add("权限不足", { type: "danger" });
                    return false;
                }

                try {
                    await rpc("/web/dataset/call_kw", {
                        model: "my.model",
                        method: "create",
                        args: [data],
                        kwargs: {}
                    });
                    notification.add("保存成功", { type: "success" });
                    return true;
                } catch (error) {
                    notification.add("保存失败", { type: "danger" });
                    return false;
                }
            }
        };
    }
};
```

### 3. 响应式状态管理

使用 `reactive` 创建响应式状态：

```javascript
import { reactive } from "@odoo/owl";

const stateService = {
    start() {
        const state = reactive({
            counter: 0,
            items: [],
            filters: {
                search: "",
                active: true
            }
        });

        return {
            state,
            increment() {
                state.counter++;
            },
            updateFilter(key, value) {
                state.filters[key] = value;
            },
            get filteredItems() {
                return state.items.filter(item =>
                    item.name.includes(state.filters.search) &&
                    item.active === state.filters.active
                );
            }
        };
    }
};
```

通常也可以搭配`setInterval`定时更新数据。

## 常用内置 Service

| Service | 用途 |
|---------|------|
| `rpc` | 与后端通信 |
| `notification` | 显示通知消息 |
| `dialog` | 打开对话框 |
| `user` | 用户信息和权限 |
| `router` | 路由管理 |
| `orm` | ORM 操作封装 |
| `action` | 执行 Action |

### 示例：使用内置 Service

```javascript
const customService = {
    dependencies: ["rpc", "notification", "dialog", "action"],

    start(env, { rpc, notification, dialog, action }) {
        return {
            async processRecord(recordId) {
                try {
                    const result = await rpc("/web/dataset/call_kw", {
                        model: "sale.order",
                        method: "action_confirm",
                        args: [[recordId]],
                        kwargs: {}
                    });

                    notification.add("处理成功", { type: "success" });

                    // 打开记录
                    action.doAction({
                        type: "ir.actions.act_window",
                        res_model: "sale.order",
                        res_id: recordId,
                        views: [[false, "form"]],
                        target: "current"
                    });
                } catch (error) {
                    dialog.add(AlertDialog, {
                        title: "错误",
                        body: error.message
                    });
                }
            }
        };
    }
};
```

## 最佳实践

### 1. Service 命名规范
- 使用驼峰命名法：`myCustomService`
- 名称应描述功能：`productDataService`、`cartService`

### 2. 状态管理
- 使用 `reactive` 确保状态响应式
- 避免直接修改状态，提供方法封装

### 3. 错误处理
```javascript
start(env, { rpc, notification }) {
    return {
        async fetchData() {
            try {
                return await rpc("/api/endpoint");
            } catch (error) {
                console.error("Service error:", error);
                notification.add("加载失败", { type: "danger" });
                throw error;
            }
        }
    };
}
```

### 4. 模块化组织
将复杂 Service 拆分为多个文件：

```javascript
// services/cart/state.js
export const createCartState = () => reactive({
    items: [],
    total: 0
});

// services/cart/methods.js
export const createCartMethods = (state, rpc) => ({
    addItem(product) {
        state.items.push(product);
        state.total += product.price;
    },
    async checkout() {
        return rpc("/api/checkout", { items: state.items });
    }
});

// services/cart/index.js
import { createCartState } from "./state";
import { createCartMethods } from "./methods";

export const cartService = {
    dependencies: ["rpc"],
    start(env, { rpc }) {
        const state = createCartState();
        const methods = createCartMethods(state, rpc);
        return { state, ...methods };
    }
};
```

## 调试技巧

### 1. Service 检查
```javascript
// 在浏览器控制台
const services = odoo.__WOWL_DEBUG__.root.env.services;
console.log(Object.keys(services)); // 查看所有已注册 Service
```

### 2. 添加调试日志
```javascript
start(env, deps) {
    console.log("Service starting with deps:", deps);
    const api = {
        // Service API
    };
    console.log("Service initialized:", api);
    return api;
}
```

## 总结

Service 是 Odoo 16 前端架构的关键组件，提供：
- **单例模式**：全局唯一实例
- **依赖注入**：自动管理依赖关系
- **响应式状态**：与 OWL 组件无缝集成
- **生命周期管理**：随应用启动和销毁

通过合理使用 Service，可以构建可维护、可扩展的前端应用架构。
