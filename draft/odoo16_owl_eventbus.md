
# OWL EventBus

## 1. 什么是EventBus？（基础概念）

`EventBus`（事件总线）是一种观察者模式的实现，允许组件之间进行解耦通信。想象它是一个"消息中转站"：

:::tip
// 最简单的理解：
// 组件A：发送消息 → EventBus → 组件B：接收消息
:::

核心实现（来自Odoo源码）：
```javascript
class EventBus extends EventTarget {
    trigger(name, payload) {
        this.dispatchEvent(new CustomEvent(name, { detail: payload }));
    }
}
```

## 2. 基础用法（入门级）

### 2.1 创建和使用EventBus

```javascript
import { EventBus } from "@odoo/owl";

// 1. 创建事件总线
const bus = new EventBus();

// 2. 监听事件
bus.addEventListener("my-event", (event) => {
    console.log("收到事件:", event.detail);
});

// 3. 触发事件
bus.trigger("my-event", { message: "Hello World!" });
```

### 2.2 在OWL组件中使用

```javascript
import { Component, useBus } from "@odoo/owl";

class MyComponent extends Component {
    setup() {
        // 使用useBus钩子自动管理事件监听
        useBus(this.env.bus, "user-action", this.handleUserAction);
    }

    handleUserAction(event) {
        const data = event.detail;
        console.log("用户执行了操作:", data);
    }

    triggerAction() {
        // 触发事件
        this.env.bus.trigger("user-action", {
            action: "click",
            timestamp: Date.now()
        });
    }
}
```

## 3. 实际应用场景（进阶）

### 3.1 全局应用事件（WebClient示例）

```javascript
// Odoo WebClient中的实际用法
export class WebClient extends Component {
    setup() {
        // 监听路由变化
        useBus(this.env.bus, "ROUTE_CHANGE", this.loadRouterState);

        // 监听UI模式变化
        useBus(this.env.bus, "ACTION_MANAGER:UI-UPDATED", ({ detail: mode }) => {
            if (mode !== "new") {
                this.state.fullscreen = mode === "fullscreen";
            }
        });

        onMounted(() => {
            // 应用准备就绪时通知所有组件
            this.env.bus.trigger("WEB_CLIENT_READY");
        });
    }
}
```

### 3.2 服务间通信（UI服务示例）

```javascript
// UI服务使用EventBus进行状态管理
export const uiService = {
    start(env) {
        const bus = new EventBus();
        let blockCount = 0;

        function block() {
            blockCount++;
            if (blockCount === 1) {
                bus.trigger("BLOCK"); // 通知UI被阻塞
            }
        }

        function unblock() {
            blockCount--;
            if (blockCount === 0) {
                bus.trigger("UNBLOCK"); // 通知UI解除阻塞
            }
        }

        return { bus, block, unblock };
    }
};
```

### 3.3 组件间通信（下拉菜单系统）

```javascript
export class Dropdown extends Component {
    setup() {
        // 监听所有下拉菜单的状态变化
        useBus(Dropdown.bus, "state-changed", ({ detail }) =>
            this.onDropdownStateChanged(detail)
        );
    }

    async changeStateAndNotify(changes) {
        Object.assign(this.state, changes);

        // 通知其他所有下拉菜单
        Dropdown.bus.trigger("state-changed", {
            emitter: this,
            newState: { ...this.state },
        });
    }
}

// 所有下拉菜单共享的静态EventBus
Dropdown.bus = new EventBus();
```

## 4. 高级使用模式（专家级）

### 4.1 请求-响应模式

```javascript
export class DataService {
    constructor() {
        this.bus = new EventBus();
        this.setupRequestHandlers();
    }

    setupRequestHandlers() {
        this.bus.addEventListener("data-request", async (event) => {
            const { requestId, params } = event.detail;
            try {
                const result = await this.fetchData(params);
                this.bus.trigger("data-response", { requestId, result });
            } catch (error) {
                this.bus.trigger("data-error", { requestId, error });
            }
        });
    }

    // 异步请求数据的Promise包装
    requestData(params) {
        const requestId = Math.random().toString(36);
        return new Promise((resolve, reject) => {
            const responseHandler = (event) => {
                if (event.detail.requestId === requestId) {
                    cleanup();
                    resolve(event.detail.result);
                }
            };

            const errorHandler = (event) => {
                if (event.detail.requestId === requestId) {
                    cleanup();
                    reject(event.detail.error);
                }
            };

            const cleanup = () => {
                this.bus.removeEventListener("data-response", responseHandler);
                this.bus.removeEventListener("data-error", errorHandler);
            };

            this.bus.addEventListener("data-response", responseHandler);
            this.bus.addEventListener("data-error", errorHandler);
            this.bus.trigger("data-request", { requestId, params });
        });
    }
}
```

### 4.2 状态管理器

```javascript
// 状态管理器类 - 继承自EventBus以支持事件发布功能
export class StateManager extends EventBus {
  /**
   * 构造函数 - 初始化状态管理器
   * @param {Object} initialState - 初始状态对象，默认为空对象
   */
  constructor(initialState = {}) {
      super(); // 调用父类EventBus的构造函数
      // 使用展开运算符创建状态的副本，避免外部直接修改内部状态
      this.state = { ...initialState };
  }

  /**
   * 更新状态的方法
   * @param {Object} updates - 要更新的状态字段对象
   */
  setState(updates) {
      // 保存更新前的状态快照，用于事件通知和可能的撤销操作
      const prevState = { ...this.state };

      // 使用Object.assign将updates合并到当前状态
      // 这会修改现有的state对象，新字段会被添加，已存在字段会被覆盖
      Object.assign(this.state, updates);

      // 触发状态变化事件，通知所有监听者
      this.trigger("state-changed", {
          prevState,                    // 变更前的状态（完整副本）
          newState: { ...this.state }, // 变更后的状态（新副本，防止外部修改）
          updates                       // 本次具体的更新内容
      });
  }

  /**
   * 获取当前状态的只读副本
   * @returns {Object} 当前状态的副本
   */
  getState() {
      // 返回状态副本而不是直接引用，防止外部意外修改内部状态
      return { ...this.state };
  }
}

/**
* React风格的状态管理钩子 - 在OWL组件中使用状态管理器
* @param {StateManager} stateManager - 状态管理器实例
* @returns {Array} [当前状态, 状态更新函数]
*/
export function useStateManager(stateManager) {
  // 获取当前组件实例，用于绑定事件监听器
  const component = useComponent();

  // 使用OWL的useState钩子管理组件本地状态
  // 初始值为状态管理器的当前状态
  const [state, setState] = useState(stateManager.getState());

  // 使用useBus钩子监听状态管理器的状态变化事件
  // 当状态管理器触发"state-changed"事件时，自动更新组件状态
  useBus(stateManager, "state-changed", (event) => {
      // 从事件详情中提取新状态并更新组件状态
      setState(event.detail.newState);
  });

  // 返回元组：[当前状态, 状态更新函数]
  // 状态更新函数是对stateManager.setState的包装
  return [state, (updates) => stateManager.setState(updates)];
}

使用示例（带注释）：

import { Component } from "@odoo/owl";

// 创建全局状态管理器实例
const globalState = new StateManager({
  user: null,
  isLoading: false,
  notifications: []
});

export class MyComponent extends Component {
  setup() {
      // 在组件中使用状态管理器
      // state: 当前状态的只读副本
      // updateState: 更新状态的函数
      const [state, updateState] = useStateManager(globalState);

      // 将状态和更新函数暴露给模板
      this.state = state;
      this.updateState = updateState;

      // 也可以直接监听特定的状态变化
      useBus(globalState, "state-changed", ({ detail }) => {
          const { updates } = detail;
          // 只在用户信息更新时执行特定逻辑
          if ('user' in updates) {
              console.log('用户信息已更新:', updates.user);
          }
      });
  }

  // 组件方法 - 登录用户
  async loginUser(userData) {
      // 设置加载状态
      this.updateState({ isLoading: true });

      try {
          // 模拟异步登录操作
          const user = await this.authenticateUser(userData);

          // 登录成功，更新用户信息并清除加载状态
          this.updateState({
              user: user,
              isLoading: false,
              notifications: [...this.state.notifications, {
                  type: 'success',
                  message: '登录成功'
              }]
          });
      } catch (error) {
          // 登录失败，清除加载状态并添加错误通知
          this.updateState({
              isLoading: false,
              notifications: [...this.state.notifications, {
                  type: 'error',
                  message: '登录失败: ' + error.message
              }]
          });
      }
  }
}
```

关键设计优点：
1. 不可变性：通过返回状态副本确保数据不被意外修改
2. 事件驱动：状态变化自动通知所有订阅者
3. 类型安全：提供详细的事件载荷信息
4. 调试友好：事件包含前后状态对比信息

### 4.3 事件批处理

```javascript
export class BatchedEventBus extends EventBus {
    constructor() {
        super();
        this.pendingEvents = [];
        this.batchTimeout = null;
    }

    trigger(name, payload) {
        this.pendingEvents.push({ name, payload });

        if (!this.batchTimeout) {
            this.batchTimeout = setTimeout(() => {
                this.flushBatch();
            }, 0);
        }
    }

    flushBatch() {
        const events = [...this.pendingEvents];
        this.pendingEvents = [];
        this.batchTimeout = null;

        // 先发送批处理事件
        super.trigger("batch", events);

        // 再依次发送单个事件
        events.forEach(({ name, payload }) => {
            super.trigger(name, payload);
        });
    }
}
```

## 5. 最佳实践和注意事项

### 5.1 内存管理

```javascript
// ✅ 正确：使用useBus自动清理
useBus(this.env.bus, "my-event", this.handleEvent);

// ❌ 错误：手动管理容易内存泄漏
this.env.bus.addEventListener("my-event", this.handleEvent);
```

### 5.2 事件命名规范

```javascript
// ✅ 使用清晰的命名空间
bus.trigger("USER:LOGIN", userData);
bus.trigger("ORDER:CREATED", orderData);
bus.trigger("NOTIFICATION:SHOW", notification);

// ❌ 避免模糊的事件名
bus.trigger("update", data);
bus.trigger("change", value);

### 5.3 错误处理

class SafeEventBus extends EventBus {
    trigger(name, payload) {
        try {
            super.trigger(name, payload);
        } catch (error) {
            console.error(`EventBus error for event "${name}":`, error);
            // 可以触发错误事件
            super.trigger("EVENT_ERROR", { event: name, payload, error });
        }
    }
}
```

## 6. 调试技巧

```javascript
class DebuggableEventBus extends EventBus {
    constructor(name = "EventBus") {
        super();
        this.name = name;
        this.eventLog = [];
    }

    trigger(name, payload) {
        const timestamp = new Date().toISOString();
        this.eventLog.push({ name, payload, timestamp });

        if (window.DEBUG_EVENTS) {
            console.log(`[${this.name}] Triggered: ${name}`, payload);
        }

        super.trigger(name, payload);
    }

    getEventLog() {
        return [...this.eventLog];
    }
}
```

## 7. 总结

`EventBus`在Odoo 16中的**OWL**框架里扮演着核心通信机制的角色：

优势：
- 🔥 解耦组件：组件不需要直接引用彼此
- 🚀 性能优秀：基于原生EventTarget实现
- 🛡️ 内存安全：useBus钩子自动管理生命周期
- 🔧 灵活扩展：可以轻松实现复杂的通信模式

适用场景：
- 跨组件通信
- 服务间协调
- 状态管理
- 用户交互响应
- 数据流管理

核心思想：
发布-订阅模式让你的应用变得更加模块化和可维护，这正是现代前端架构的精髓所在。
