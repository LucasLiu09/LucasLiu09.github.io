# JavaScript Promise 完整技术文档

## 目录

1. [Promise 基础概念](#1-promise-基础概念)
2. [Promise 的三种状态](#2-promise-的三种状态)
3. [Promise 实例方法详解](#3-promise-实例方法详解)
4. [Promise 静态方法](#4-promise-静态方法)
5. [async/await 与 Promise 的关系](#5-asyncawait-与-promise-的关系)
6. [Promise 参数与函数调用详解](#6-promise-参数与函数调用详解)
7. [实际应用场景和最佳实践](#7-实际应用场景和最佳实践)

---

## 1. Promise 基础概念

### 什么是 Promise？

Promise 是 JavaScript 中处理异步操作的一种机制，它代表一个可能现在、将来或永远不会完成的操作结果。

### 异步操作对比

```javascript
// 同步操作 - 立即执行
console.log("开始");
console.log("结束");

// 异步操作 - 延迟执行
console.log("开始");
setTimeout(() => {
    console.log("延迟执行");
}, 1000);
console.log("结束");
// 输出: 开始 -> 结束 -> 延迟执行
```

### Promise 基本语法

```javascript
const promise = new Promise((resolve, reject) => {
    // 异步操作
    if (/* 操作成功 */) {
        resolve("成功的结果");
    } else {
        reject("失败的原因");
    }
});
```

---

## 2. Promise 的三种状态

Promise 有三种状态，一旦状态改变就不会再变：

### 2.1 pending (等待中)

```javascript
const pendingPromise = new Promise((resolve, reject) => {
    // 还没有调用 resolve 或 reject
    console.log("Promise 创建中...");
});
console.log(pendingPromise); // Promise { <pending> }
```

### 2.2 fulfilled (已完成)

```javascript
const fulfilledPromise = new Promise((resolve, reject) => {
    resolve("操作成功！");
});
console.log(fulfilledPromise); // Promise { "操作成功！" }
```

### 2.3 rejected (已拒绝)

```javascript
const rejectedPromise = new Promise((resolve, reject) => {
    reject("操作失败！");
});
console.log(rejectedPromise); // Promise { <rejected> "操作失败！" }
```

### 实际示例

```javascript
function simulateAsyncOperation(shouldSucceed) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (shouldSucceed) {
                resolve("数据加载成功");
            } else {
                reject("网络错误");
            }
        }, 1000);
    });
}
```

---

## 3. Promise 实例方法详解

### 3.1 then() 方法

用于处理 Promise 成功的情况：

```javascript
const promise = new Promise((resolve, reject) => {
    resolve("成功的数据");
});

promise.then((result) => {
    console.log("收到结果:", result); // 收到结果: 成功的数据
});
```

### 3.2 catch() 方法

用于处理 Promise 失败的情况：

```javascript
const promise = new Promise((resolve, reject) => {
    reject("出现错误");
});

promise.catch((error) => {
    console.log("捕获错误:", error); // 捕获错误: 出现错误
});
```

### 3.3 同时使用 then() 和 catch()

```javascript
function fetchUserData(userId) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (userId > 0) {
                resolve({ id: userId, name: "张三" });
            } else {
                reject("用户ID无效");
            }
        }, 1000);
    });
}

fetchUserData(1)
    .then((user) => {
        console.log("用户信息:", user);
    })
    .catch((error) => {
        console.log("获取失败:", error);
    });
```

### 3.4 then() 的第二个参数

```javascript
promise.then(
    (result) => console.log("成功:", result),
    (error) => console.log("失败:", error)
);

// 等同于
promise
    .then((result) => console.log("成功:", result))
    .catch((error) => console.log("失败:", error));
```

### 3.5 finally() 方法

```javascript
promise
    .then((value) => {
        console.log("成功处理:", value);
        return value;
    })
    .catch((reason) => {
        console.log("错误处理:", reason);
        throw reason; // 重新抛出错误
    })
    .finally(() => {
        // 无论成功还是失败都会执行
        console.log("清理工作");
    });
```

---

## 4. Promise 静态方法

### 4.1 Promise.resolve()

```javascript
// 创建已解决的 Promise
const p1 = Promise.resolve("值");
const p2 = Promise.resolve(); // 解决为 undefined

// 传递另一个 Promise（返回原 Promise）
const originalPromise = Promise.resolve("原始值");
const p3 = Promise.resolve(originalPromise);
console.log(p3 === originalPromise); // true

// 传递 thenable 对象
const thenable = {
    then(onFulfilled, onRejected) {
        onFulfilled("thenable 值");
    }
};
Promise.resolve(thenable).then(value => {
    console.log(value); // "thenable 值"
});
```

### 4.2 Promise.reject()

```javascript
// 创建已拒绝的 Promise
const p1 = Promise.reject("错误");
const p2 = Promise.reject(new Error("错误对象"));

// 注意：reject 不会等待 Promise，直接作为拒绝原因
const resolvedPromise = Promise.resolve("成功");
const p3 = Promise.reject(resolvedPromise);
p3.catch(reason => {
    console.log(reason === resolvedPromise); // true
});
```

### 4.3 Promise.all()

等待所有 Promise 完成，如果有一个失败则全部失败：

```javascript
const promise1 = Promise.resolve(3);
const promise2 = new Promise(resolve => setTimeout(() => resolve('foo'), 1000));
const promise3 = Promise.resolve(42);

Promise.all([promise1, promise2, promise3])
    .then((values) => {
        console.log(values); // [3, "foo", 42]
    });

// 如果有一个失败
const failPromise = Promise.reject('出错了');
Promise.all([promise1, failPromise, promise3])
    .catch((error) => {
        console.log(error); // "出错了"
    });
```

### 4.4 Promise.allSettled()

等待所有 Promise 完成，不论成功还是失败：

```javascript
const promises = [
    Promise.resolve('成功1'),
    Promise.reject('失败1'),
    Promise.resolve('成功2')
];

Promise.allSettled(promises)
    .then((results) => {
        console.log(results);
        // [
        //   { status: 'fulfilled', value: '成功1' },
        //   { status: 'rejected', reason: '失败1' },
        //   { status: 'fulfilled', value: '成功2' }
        // ]
    });
```

### 4.5 Promise.race()

返回第一个完成的 Promise 结果：

```javascript
const slowPromise = new Promise(resolve => setTimeout(() => resolve('慢'), 2000));
const fastPromise = new Promise(resolve => setTimeout(() => resolve('快'), 1000));

Promise.race([slowPromise, fastPromise])
    .then((value) => {
        console.log(value); // "快"
    });
```

### 4.6 Promise.any()

返回第一个成功的 Promise，如果全部失败才失败：

```javascript
const promises = [
    Promise.reject('错误1'),
    Promise.reject('错误2'),
    Promise.resolve('成功')
];

Promise.any(promises)
    .then((value) => {
        console.log(value); // "成功"
    });

// 如果全部失败，返回 AggregateError
const allRejectPromises = [
    Promise.reject('错误1'),
    Promise.reject('错误2')
];

Promise.any(allRejectPromises).catch(error => {
    console.log(error instanceof AggregateError); // true
    console.log(error.errors); // ['错误1', '错误2']
});
```

---

## 5. async/await 与 Promise 的关系

async/await 是 Promise 的语法糖，让异步代码看起来更像同步代码：

### 5.1 Promise 方式 vs async/await 方式

```javascript
// 使用 Promise
function fetchUserData() {
    return fetch('/api/user')
        .then(response => response.json())
        .then(user => {
            console.log('用户信息:', user);
            return fetch(`/api/user/${user.id}/posts`);
        })
        .then(response => response.json())
        .then(posts => {
            console.log('用户帖子:', posts);
            return posts;
        })
        .catch(error => {
            console.error('获取失败:', error);
        });
}

// 使用 async/await
async function fetchUserData() {
    try {
        const response = await fetch('/api/user');
        const user = await response.json();
        console.log('用户信息:', user);
        
        const postsResponse = await fetch(`/api/user/${user.id}/posts`);
        const posts = await postsResponse.json();
        console.log('用户帖子:', posts);
        
        return posts;
    } catch (error) {
        console.error('获取失败:', error);
    }
}
```

### 5.2 async 函数返回 Promise

```javascript
async function getMessage() {
    return "Hello World"; // 等同于 return Promise.resolve("Hello World");
}

getMessage().then(msg => console.log(msg)); // "Hello World"

// async 函数抛出错误
async function getError() {
    throw new Error("出错了"); // 等同于 return Promise.reject(new Error("出错了"));
}

getError().catch(err => console.log(err.message)); // "出错了"
```

### 5.3 并行处理

```javascript
// 串行处理 - 慢
async function serialProcess() {
    const result1 = await asyncOperation1(); // 等待 1 秒
    const result2 = await asyncOperation2(); // 等待 1 秒
    return [result1, result2]; // 总共等待 2 秒
}

// 并行处理 - 快
async function parallelProcess() {
    const [result1, result2] = await Promise.all([
        asyncOperation1(), // 同时开始
        asyncOperation2()  // 同时开始
    ]);
    return [result1, result2]; // 总共等待 1 秒
}
```

---

## 6. Promise 参数与函数调用详解

### 6.1 Promise 构造函数的 executor 参数

#### executor 函数签名
```javascript
new Promise(executor)
// executor: (resolve, reject) => void
```

#### executor 详细解析
```javascript
const promise = new Promise((resolve, reject) => {
    // executor 函数会立即同步执行
    console.log("executor 立即执行");
    
    // resolve 和 reject 是 Promise 内部提供的函数
    // 它们的类型签名：
    // resolve: (value?: any) => void
    // reject: (reason?: any) => void
});

console.log("Promise 创建完成");
// 输出顺序：
// executor 立即执行
// Promise 创建完成
```

#### executor 函数特性
```javascript
const promise = new Promise((resolve, reject) => {
    // 1. executor 只能调用一次 resolve 或 reject，后续调用无效
    resolve("第一次调用");
    resolve("第二次调用"); // 无效
    reject("第三次调用");  // 无效
    
    // 2. executor 中的同步错误会自动转为 reject
    throw new Error("同步错误"); // 等同于 reject(new Error("同步错误"))
});
```

### 6.2 resolve 和 reject 函数详细说明

#### resolve 函数
```javascript
// resolve 函数签名：resolve(value?: any) => void

// 1. 传递普通值
const promise1 = new Promise((resolve) => {
    resolve("字符串值");      // 传递字符串
    resolve(42);            // 传递数字
    resolve({ id: 1 });     // 传递对象
    resolve([1, 2, 3]);     // 传递数组
    resolve(null);          // 传递 null
    resolve(undefined);     // 传递 undefined
});

// 2. 传递另一个 Promise
const innerPromise = Promise.resolve("内部 Promise 的值");
const outerPromise = new Promise((resolve) => {
    resolve(innerPromise); // resolve 会等待 innerPromise 完成
});

outerPromise.then(value => {
    console.log(value); // "内部 Promise 的值"
});

// 3. 传递 thenable 对象
const thenable = {
    then(onFulfilled, onRejected) {
        setTimeout(() => onFulfilled("thenable 的值"), 1000);
    }
};

const promise2 = new Promise((resolve) => {
    resolve(thenable); // resolve 会调用 thenable.then
});
```

#### reject 函数
```javascript
// reject 函数签名：reject(reason?: any) => void

const promise = new Promise((resolve, reject) => {
    // 1. 传递 Error 对象（推荐）
    reject(new Error("发生错误"));
    
    // 2. 传递字符串
    reject("错误信息");
    
    // 3. 传递其他类型
    reject(404);
    reject({ code: 500, message: "服务器错误" });
    
    // 注意：reject 不会等待 Promise，直接作为拒绝原因
    reject(Promise.resolve("这不会被等待"));
});
```

### 6.3 实例方法的函数参数

#### then() 方法参数详解
```javascript
// then 方法签名：
// promise.then(onFulfilled?, onRejected?) => Promise

const promise = Promise.resolve("成功值");

// 1. 只传递 onFulfilled 回调
promise.then((value) => {
    // onFulfilled: (value: any) => any
    console.log("接收到值:", value);
    return "处理后的值"; // 返回值传递给下一个 then
});

// 2. 传递两个回调函数
promise.then(
    (value) => {
        // onFulfilled: 处理成功情况
        console.log("成功:", value);
        return value * 2;
    },
    (reason) => {
        // onRejected: 处理失败情况
        console.log("失败:", reason);
        return "默认值"; // 可以返回恢复值
    }
);
```

#### catch() 方法参数详解
```javascript
// catch 方法签名：
// promise.catch(onRejected) => Promise
// 等同于 promise.then(null, onRejected)

const rejectedPromise = Promise.reject("错误原因");

rejectedPromise.catch((reason) => {
    // onRejected: (reason: any) => any
    console.log("捕获错误:", reason);
    
    // catch 也可以返回值进行恢复
    return "错误已处理";
}).then((value) => {
    console.log("继续执行:", value); // "继续执行: 错误已处理"
});
```

### 6.4 回调函数的参数传递机制

#### 参数传递的详细流程
```javascript
// 1. 基本参数传递
const promise = new Promise((resolve, reject) => {
    // resolve/reject 调用时传递的参数
    resolve({ data: "用户数据", timestamp: Date.now() });
});

promise.then((result) => {
    // result 参数接收 resolve 传递的完整对象
    console.log("数据:", result.data);       // "用户数据"
    console.log("时间:", result.timestamp);  // 时间戳
    
    // 返回值成为下一个 then 的参数
    return result.data.toUpperCase();
});
```

#### 多参数处理模式
```javascript
// Promise 只能传递一个值，多参数需要用对象或数组包装
function multipleResults() {
    return new Promise(resolve => {
        // 方式1: 使用对象
        resolve({
            userId: 123,
            userName: "张三",
            userEmail: "zhangsan@example.com"
        });
        
        // 方式2: 使用数组
        // resolve([123, "张三", "zhangsan@example.com"]);
    });
}

multipleResults().then(({ userId, userName, userEmail }) => {
    // 解构赋值获取多个值
    console.log(`用户 ${userName}(${userId}): ${userEmail}`);
});
```

---

## 7. 实际应用场景和最佳实践

### 7.1 Promise 链式调用

Promise 最强大的特性之一是可以链式调用，避免回调地狱：

#### 回调地狱示例
```javascript
// 传统回调方式 - 容易形成回调地狱
getUserId((userId) => {
    getUserInfo(userId, (userInfo) => {
        getUserPosts(userInfo.id, (posts) => {
            getPostComments(posts[0].id, (comments) => {
                console.log("获取到评论:", comments);
            });
        });
    });
});
```

#### Promise 链式调用
```javascript
// 使用 Promise 链式调用 - 代码更清晰
getUserId()
    .then((userId) => getUserInfo(userId))
    .then((userInfo) => getUserPosts(userInfo.id))
    .then((posts) => getPostComments(posts[0].id))
    .then((comments) => {
        console.log("获取到评论:", comments);
    })
    .catch((error) => {
        console.log("任何一步出错都会被捕获:", error);
    });
```

### 7.2 网络请求处理

```javascript
// 带重试机制的请求
async function fetchWithRetry(url, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
    }
}
```

### 7.3 文件上传进度

```javascript
function uploadFile(file) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const formData = new FormData();
        formData.append('file', file);
        
        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
                const progress = (event.loaded / event.total) * 100;
                console.log(`上传进度: ${progress.toFixed(2)}%`);
            }
        };
        
        xhr.onload = () => {
            if (xhr.status === 200) {
                resolve(JSON.parse(xhr.responseText));
            } else {
                reject(new Error(`上传失败: ${xhr.status}`));
            }
        };
        
        xhr.onerror = () => reject(new Error('网络错误'));
        xhr.open('POST', '/upload');
        xhr.send(formData);
    });
}
```

### 7.4 缓存机制

```javascript
class PromiseCache {
    constructor() {
        this.cache = new Map();
    }
    
    async get(key, fetcher) {
        if (this.cache.has(key)) {
            return this.cache.get(key);
        }
        
        const promise = fetcher().catch(error => {
            this.cache.delete(key); // 失败时清除缓存
            throw error;
        });
        
        this.cache.set(key, promise);
        return promise;
    }
}

const cache = new PromiseCache();

// 使用缓存
async function getUserData(userId) {
    return cache.get(`user-${userId}`, () => 
        fetch(`/api/users/${userId}`).then(r => r.json())
    );
}
```

### 7.5 并行请求多个 API

```javascript
async function fetchUserProfile(userId) {
    const [userInfo, userPosts, userFriends] = await Promise.all([
        fetch(`/api/users/${userId}`).then(r => r.json()),
        fetch(`/api/users/${userId}/posts`).then(r => r.json()),
        fetch(`/api/users/${userId}/friends`).then(r => r.json())
    ]);
    
    return { userInfo, userPosts, userFriends };
}
```

### 7.6 超时处理

```javascript
function withTimeout(promise, ms) {
    const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('超时')), ms)
    );
    
    return Promise.race([promise, timeout]);
}
```

## 最佳实践总结

### 1. 优先使用 async/await
代码更readable，错误处理更直观。

### 2. 合理使用 Promise.all()
并行处理提高性能，但要注意错误处理。

### 3. 始终处理错误
使用 try/catch 或 .catch() 处理可能的错误。

### 4. 避免 Promise 构造函数反模式

```javascript
// 错误
async function badExample() {
    return new Promise(async (resolve) => {
        const result = await someAsyncFunction();
        resolve(result);
    });
}

// 正确
async function goodExample() {
    return await someAsyncFunction();
}
```

### 5. 注意并行 vs 串行

```javascript
// 需要串行时
const result1 = await operation1();
const result2 = await operation2(result1);

// 可以并行时
const [result1, result2] = await Promise.all([
    operation1(),
    operation2()
]);
```

### 6. 统一异步处理解决执行顺序问题

```javascript
// 问题：某些分支有 await，某些没有，导致执行顺序混乱
async function problematicFunction(condition) {
    if (condition === 'async') {
        await someAsyncOperation(); // 这里有await
        console.log('async branch completed');
    } else {
        console.log('sync branch completed'); // 这里没有await，立即执行
    }
}

// 解决方案：统一异步处理
async function fixedFunction(condition) {
    if (condition === 'async') {
        await someAsyncOperation();
        console.log('async branch completed');
    } else {
        await Promise.resolve(); // 确保同步分支也是异步的
        console.log('sync branch completed');
    }
}
```

### 7. 使用配置对象简化复杂参数

```javascript
function createUser(config) {
    const defaultConfig = {
        name: '',
        email: '',
        role: 'user',
        sendWelcomeEmail: true
    };
    
    const finalConfig = { ...defaultConfig, ...config };
    
    return new Promise((resolve, reject) => {
        // 处理逻辑
    });
}
```

---

## 总结

Promise 是 JavaScript 异步编程的核心概念，通过理解其状态机制、方法链式调用、参数传递机制以及与 async/await 的关系，可以帮助你编写更清晰、可维护的异步代码。

### 核心要点：
- Promise 有三种状态：pending、fulfilled、rejected
- 使用 then/catch/finally 处理异步结果
- 利用 Promise 静态方法处理多个异步操作
- async/await 提供更直观的异步编程体验
- 理解参数传递机制对于复杂异步逻辑至关重要
- 遵循最佳实践可以避免常见陷阱和提高代码质量

通过本文档的学习和实践，你应该能够熟练运用 Promise 解决各种异步编程场景。