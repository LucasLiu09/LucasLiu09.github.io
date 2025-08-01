# URLs.js 文件分析文档

## 目录
- [文件概述](#文件概述)
- [导入依赖](#导入依赖)
- [函数详细分析](#函数详细分析)
  - [objectToUrlEncodedString](#objecttourlEncodedstring)
  - [getOrigin](#getorigin)
  - [url](#url)
  - [getDataURLFromFile](#getdataurlfromfile)
- [使用场景](#使用场景)
- [总结](#总结)

## 文件概述

**文件位置**: `addons\web\static\src\core\utils\urls.js`

这是 Odoo 16 Web 模块中的 URL 处理工具文件，提供了一套完整的 URL 操作功能。该文件包含了 URL 编码、源地址处理、完整 URL 构建和文件数据 URL 转换等核心功能，为 Odoo Web 应用的网络请求和资源处理提供基础支持。

## 导入依赖

```javascript
import { browser } from "../browser/browser";
```

**依赖说明**:
- `browser`: 浏览器环境抽象层，提供对 `location` 等浏览器 API 的访问
- 用于获取当前页面的协议和主机信息

## 函数详细分析

### objectToUrlEncodedString

**功能**: 将对象转换为 URL 编码字符串

**位置**: urls.js:12-16

**参数**:
- `obj` (Object): 要转换的键值对对象

**返回值**: string - URL 编码的查询字符串

**功能描述**:
- 将 JavaScript 对象转换为 URL 查询参数格式
- 自动对键和值进行 URI 编码，确保特殊字符的安全传输
- 使用 `&` 符号连接多个参数
- 处理空值或 undefined 值（转换为空字符串）
- 常用于构建 HTTP 请求的查询参数

**算法流程**:
1. 使用 `Object.entries()` 获取对象的键值对数组
2. 对每个键值对进行 `encodeURIComponent` 编码
3. 格式化为 `key=value` 形式
4. 使用 `&` 连接所有参数

**使用示例**:
```javascript
objectToUrlEncodedString({a: "x", b: 2}); // "a=x&b=2"
objectToUrlEncodedString({name: "张三", age: 25}); // "name=%E5%BC%A0%E4%B8%89&age=25"
objectToUrlEncodedString({query: "hello world", page: 1}); // "query=hello%20world&page=1"
objectToUrlEncodedString({empty: null, undefined: undefined}); // "empty=&undefined="
```

### getOrigin

**功能**: 获取或清理源地址 URL

**位置**: urls.js:24-33

**参数**:
- `origin` (string, 可选): 给定的源地址 URL

**返回值**: string - 清理后的源地址 URL

**功能描述**:
- 如果提供了 origin 参数，则清理该 URL（移除尾部斜杠）
- 如果未提供 origin，则从当前浏览器位置构建源地址
- 确保返回的源地址格式一致，便于后续 URL 拼接
- 自动处理协议和主机信息

**处理逻辑**:
1. **有参数时**: 使用正则表达式 `/\/+$/` 移除尾部的所有斜杠
2. **无参数时**: 从 `browser.location` 获取 `protocol` 和 `host`，组合成完整源地址

**使用示例**:
```javascript
getOrigin("https://example.com///"); // "https://example.com"
getOrigin("http://localhost:8069/"); // "http://localhost:8069"
getOrigin(); // 当前页面的源地址，如 "https://odoo.example.com"
```

### url

**功能**: 构建完整的 URL

**位置**: urls.js:41-56

**参数**:
- `route` (string): 相对路由或绝对 URL（CORS URL 情况下）
- `queryParams` (Object, 可选): 要附加为查询字符串的参数
- `options` (Object, 可选): 配置选项
  - `options.origin` (string, 可选): 预计算的源地址

**返回值**: string - 构建的完整 URL

**功能描述**:
- 构建完整的 URL，支持相对路径和绝对路径
- 自动处理查询参数的编码和拼接
- 智能判断是否需要添加源地址前缀
- 支持跨域 URL 的处理

**处理逻辑**:
1. **源地址处理**: 使用 `getOrigin()` 获取源地址
2. **空路由处理**: 如果 route 为空，直接返回源地址
3. **查询参数处理**: 使用 `objectToUrlEncodedString()` 转换参数，添加 `?` 前缀
4. **前缀判断**: 检查路由是否已包含协议前缀（`http://`, `https://`, `//`）
5. **URL 拼接**: 根据判断结果决定是否添加源地址前缀

**URL 前缀判断**:
- 检查路由是否以 `http://`、`https://` 或 `//` 开头
- 如果是，则认为是绝对 URL，不添加源地址前缀
- 如果不是，则添加源地址前缀，构建完整 URL

**使用示例**:
```javascript
// 相对路径
url("/web/home", {debug: 1}); // "https://odoo.example.com/web/home?debug=1"

// 绝对路径
url("https://api.example.com/data", {token: "abc"}); // "https://api.example.com/data?token=abc"

// 协议相对路径
url("//cdn.example.com/assets", {}); // "//cdn.example.com/assets"

// 空路由
url("", {param: "value"}); // "https://odoo.example.com?param=value"

// 自定义源地址
url("/api/data", {id: 123}, {origin: "https://custom.com"}); // "https://custom.com/api/data?id=123"
```

### getDataURLFromFile

**功能**: 从文件或 Blob 对象获取 Data URL

**位置**: urls.js:66-84

**参数**:
- `file` (Blob | File): 文件或 Blob 对象

**返回值**: Promise\<string\> - 解析为 Data URL 的 Promise

**功能描述**:
- 将文件或 Blob 对象转换为 base64 编码的 Data URL
- 使用 Promise 包装 FileReader API，提供现代化的异步接口
- 处理空文件和错误情况
- 修复 Chrome 浏览器对空文件的处理 bug

**异步处理**:
- **成功**: 返回完整的 Data URL (如 `data:image/png;base64,iVBORw0KGgo...`)
- **失败**: 在以下情况下 reject Promise:
  - 文件为空或不存在
  - 文件读取过程中发生错误
  - 用户取消文件读取操作

**Chrome Bug 修复**:
- Chrome 对空文件生成无效的 `data:` URL
- 函数检测到这种情况时，会生成正确的格式：`data:${file.type};base64,`

**事件处理**:
- `load`: 文件读取成功
- `abort`: 文件读取被取消
- `error`: 文件读取发生错误

**使用示例**:
```javascript
// 处理文件上传
const input = document.querySelector('input[type="file"]');
input.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    try {
        const dataURL = await getDataURLFromFile(file);
        console.log('Data URL:', dataURL);
        // 可以用于图片预览: <img src="${dataURL}" />
    } catch (error) {
        console.error('文件读取失败:', error);
    }
});

// 处理 Blob 对象
const blob = new Blob(['Hello World'], {type: 'text/plain'});
getDataURLFromFile(blob)
    .then(dataURL => console.log(dataURL)) // data:text/plain;base64,SGVsbG8gV29ybGQ=
    .catch(error => console.error(error));
```

## 使用场景

### 1. HTTP 请求参数处理
```javascript
// 构建 API 请求 URL
const apiUrl = url('/api/records', {
    model: 'res.partner',
    domain: JSON.stringify([['active', '=', true]]),
    fields: 'name,email'
});
```

### 2. 文件上传和预览
```javascript
// 图片文件预览
async function previewImage(file) {
    const dataURL = await getDataURLFromFile(file);
    document.querySelector('#preview').src = dataURL;
}
```

### 3. 跨域资源访问
```javascript
// 访问外部 API
const externalApi = url('https://api.external.com/data', {
    apikey: 'your-key',
    format: 'json'
});
```

### 4. 动态 URL 构建
```javascript
// 根据环境构建不同的 URL
const isDev = window.location.hostname === 'localhost';
const apiBase = isDev ? 'http://localhost:8069' : 'https://production.odoo.com';
const endpoint = url('/web/dataset/call_kw', params, {origin: apiBase});
```

## 总结

这个 URL 工具文件提供了 4 个核心函数，构成了完整的 URL 处理体系：

1. **数据转换**: `objectToUrlEncodedString()` - 对象到查询字符串的转换
2. **地址标准化**: `getOrigin()` - 源地址的获取和清理
3. **URL 构建**: `url()` - 智能的完整 URL 构建
4. **文件处理**: `getDataURLFromFile()` - 文件到 Data URL 的转换

**设计特点**:
- **安全性**: 所有 URL 组件都经过适当的编码处理
- **灵活性**: 支持相对路径、绝对路径和跨域 URL
- **兼容性**: 处理不同浏览器的特殊情况（如 Chrome 的空文件 bug）
- **现代化**: 使用 Promise 和现代 JavaScript 语法

这些工具函数在 Odoo Web 框架中被广泛使用，为 HTTP 请求、文件上传、资源加载和路由管理提供了可靠的基础支持。它们体现了 Odoo 在 Web 开发中对细节处理的重视和对开发者体验的关注。
