# Odoo 16 Core Domain.js 详细分析文档

## 目录

- [1. 文件概述](#1-文件概述)
  - [1.1 主要功能](#11-主要功能)
  - [1.2 核心特性](#12-核心特性)
- [2. 类型定义和导入](#2-类型定义和导入)
  - [2.1 TypeScript 类型定义](#21-typescript-类型定义)
  - [2.2 导入模块](#22-导入模块)
- [3. Domain 类详细分析](#3-domain-类详细分析)
  - [3.1 静态方法](#31-静态方法)
  - [3.2 构造函数](#32-构造函数)
  - [3.3 实例方法](#33-实例方法)
- [4. 辅助函数分析](#4-辅助函数分析)
  - [4.1 AST 转换函数](#41-ast-转换函数)
  - [4.2 域标准化函数](#42-域标准化函数)
  - [4.3 条件匹配函数](#43-条件匹配函数)
  - [4.4 域匹配函数](#44-域匹配函数)
- [5. 操作符支持](#5-操作符支持)
  - [5.1 比较操作符](#51-比较操作符)
  - [5.2 逻辑操作符](#52-逻辑操作符)
  - [5.3 字符串匹配操作符](#53-字符串匹配操作符)
- [6. 使用示例](#6-使用示例)
  - [6.1 基本用法](#61-基本用法)
  - [6.2 复杂域组合](#62-复杂域组合)
- [7. 架构设计分析](#7-架构设计分析)
  - [7.1 设计模式](#71-设计模式)
  - [7.2 性能考虑](#72-性能考虑)
- [8. 错误处理](#8-错误处理)
- [9. 总结](#9-总结)

---

## 1. 文件概述

### 1.1 主要功能

`domain.js` 是 Odoo 16 Web 框架中的核心模块，专门用于处理 Odoo 域（Domain）的 JavaScript 实现。域是 Odoo 中用于数据筛选和查询的重要概念，类似于 SQL 的 WHERE 子句。

**核心职责：**
- 将 Python 风格的域表达式转换为 JavaScript 可执行的格式
- 提供域的组合、否定等逻辑操作
- 实现记录匹配和筛选功能
- 支持复杂的嵌套逻辑表达式

### 1.2 核心特性

- **类型安全**: 使用 TypeScript 类型定义确保类型安全
- **灵活性**: 支持多种域表示形式（字符串、数组、Domain 实例）
- **可组合性**: 提供 AND、OR、NOT 等逻辑组合操作
- **性能优化**: 通过 AST 解析和优化提升执行效率
- **错误处理**: 完善的异常处理机制

---

## 2. 类型定义和导入

### 2.1 TypeScript 类型定义

```javascript
/**
 * @typedef {import("./py_js/py_parser").AST} AST
 * @typedef {[string, string, any]} Condition
 * @typedef {("&" | "|" | "!" | Condition)[]} DomainListRepr
 * @typedef {DomainListRepr | string | Domain} DomainRepr
 */
```

**类型说明：**

- **AST**: 抽象语法树类型，来自 Python-JavaScript 解析器
- **Condition**: 条件元组，格式为 `[字段名, 操作符, 值]`
- **DomainListRepr**: 域的列表表示，包含逻辑操作符和条件
- **DomainRepr**: 域的通用表示，支持多种格式

### 2.2 导入模块

```javascript
import { shallowEqual } from "@web/core/utils/arrays";
import { evaluate, formatAST, parseExpr } from "./py_js/py";
import { toPyValue } from "./py_js/py_utils";
```

**模块依赖：**
- `arrays`: 提供浅层比较功能
- `py`: Python 表达式解析和执行引擎
- `py_utils`: Python 值转换工具

---

## 3. Domain 类详细分析

### 3.1 静态方法

#### 3.1.1 combine 方法

```javascript
static combine(domains, operator) {
    if (domains.length === 0) {
        return new Domain([]);
    }
    const domain1 = domains[0] instanceof Domain ? domains[0] : new Domain(domains[0]);
    if (domains.length === 1) {
        return domain1;
    }
    const domain2 = Domain.combine(domains.slice(1), operator);
    const result = new Domain([]);
    const astValues1 = domain1.ast.value;
    const astValues2 = domain2.ast.value;
    const op = operator === "AND" ? "&" : "|";
    const combinedAST = { type: 4 /* List */, value: astValues1.concat(astValues2) };
    result.ast = normalizeDomainAST(combinedAST, op);
    return result;
}
```

**功能分析：**
- **递归设计**: 使用递归方式组合多个域
- **类型统一**: 自动将不同类型的域转换为 Domain 实例
- **AST 合并**: 在抽象语法树层面进行域合并
- **操作符转换**: 将字符串操作符转换为符号操作符

**边界情况处理：**
- 空域列表返回空域
- 单域直接返回
- 多域递归处理

#### 3.1.2 and 和 or 方法

```javascript
static and(domains) {
    return Domain.combine(domains, "AND");
}

static or(domains) {
    return Domain.combine(domains, "OR");
}
```

**设计优势：**
- **语义化**: 提供直观的 API 接口
- **代码复用**: 基于 combine 方法实现
- **类型安全**: 保持类型一致性

#### 3.1.3 not 方法

```javascript
static not(domain) {
    const result = new Domain(domain);
    result.ast.value.unshift({ type: 1, value: "!" });
    return result;
}
```

**实现特点：**
- **非破坏性**: 创建新实例而非修改原域
- **AST 操作**: 在语法树层面添加否定操作符
- **位置优化**: 将否定操作符添加到开头

### 3.2 构造函数

```javascript
constructor(descr = []) {
    if (descr instanceof Domain) {
        return new Domain(descr.toString());
    } else {
        const rawAST = typeof descr === "string" ? parseExpr(descr) : toAST(descr);
        this.ast = normalizeDomainAST(rawAST);
    }
}
```

**处理流程：**
1. **类型检测**: 检测输入参数类型
2. **Domain 实例**: 转换为字符串后重新解析
3. **字符串输入**: 使用 Python 表达式解析器
4. **数组输入**: 转换为 AST 格式
5. **标准化**: 对 AST 进行标准化处理

### 3.3 实例方法

#### 3.3.1 contains 方法

```javascript
contains(record) {
    const expr = evaluate(this.ast, record);
    return matchDomain(record, expr);
}
```

**核心功能：**
- **表达式求值**: 在记录上下文中计算 AST
- **域匹配**: 检查记录是否满足域条件
- **返回布尔值**: 表示记录是否匹配

#### 3.3.2 toString 方法

```javascript
toString() {
    return formatAST(this.ast);
}
```

**用途：**
- **调试支持**: 提供可读的字符串表示
- **序列化**: 支持域的字符串化
- **日志记录**: 便于问题追踪

#### 3.3.3 toList 方法

```javascript
toList(context) {
    return evaluate(this.ast, context);
}
```

**功能：**
- **上下文求值**: 在指定上下文中计算域
- **列表转换**: 返回域的列表表示
- **动态计算**: 支持运行时上下文变量

---

## 4. 辅助函数分析

### 4.1 AST 转换函数

```javascript
function toAST(domain) {
    const elems = domain.map((elem) => {
        switch (elem) {
            case "!":
            case "&":
            case "|":
                return { type: 1 /* String */, value: elem };
            default:
                return {
                    type: 10 /* Tuple */,
                    value: elem.map(toPyValue),
                };
        }
    });
    return { type: 4 /* List */, value: elems };
}
```

**转换逻辑：**
- **操作符处理**: 逻辑操作符转换为 String 节点
- **条件处理**: 条件数组转换为 Tuple 节点
- **值转换**: 使用 `toPyValue` 进行 Python 值转换
- **结构构建**: 构建完整的 List 节点

### 4.2 域标准化函数

```javascript
function normalizeDomainAST(domain, op = "&") {
    if (domain.type !== 4 /* List */) {
        if (domain.type === 10 /* Tuple */) {
            const value = domain.value;
            if (
                value.findIndex((e) => e.type === 10) === -1 ||
                !value.every((e) => e.type === 10 || e.type === 1)
            ) {
                throw new InvalidDomainError("Invalid domain AST");
            }
        } else {
            throw new InvalidDomainError("Invalid domain AST");
        }
    }
    if (domain.value.length === 0) {
        return domain;
    }
    let expected = 1;
    for (const child of domain.value) {
        if (child.type === 1 /* String */ && (child.value === "&" || child.value === "|")) {
            expected++;
        } else if (child.type !== 1 /* String */ || child.value !== "!") {
            expected--;
        }
    }
    const values = domain.value.slice();
    while (expected < 0) {
        expected++;
        values.unshift({ type: 1 /* String */, value: op });
    }
    if (expected > 0) {
        throw new InvalidDomainError(
            `invalid domain ${formatAST(domain)} (missing ${expected} segment(s))`
        );
    }
    return { type: 4 /* List */, value: values };
}
```

**标准化过程：**
1. **类型验证**: 检验 AST 节点类型合法性
2. **空域处理**: 直接返回空域
3. **平衡计算**: 计算操作符和操作数的平衡关系
4. **自动补全**: 添加缺失的操作符
5. **错误检查**: 检查是否存在无法修复的错误

**算法原理：**
- 基于栈式计算模型
- 每个二元操作符需要两个操作数
- 一元操作符需要一个操作数
- 通过计数器维护平衡关系

### 4.3 条件匹配函数

```javascript
function matchCondition(record, condition) {
    if (typeof condition === "boolean") {
        return condition;
    }
    const [field, operator, value] = condition;

    if (typeof field === "string") {
        const names = field.split(".");
        if (names.length >= 2) {
            return matchCondition(record[names[0]], [names.slice(1).join("."), operator, value]);
        }
    }

    const fieldValue = typeof field === "number" ? field : record[field];
    switch (operator) {
        case "=?":
            if ([false, null].includes(value)) {
                return true;
            }
        // eslint-disable-next-line no-fallthrough
        case "=":
        case "==":
            if (Array.isArray(fieldValue) && Array.isArray(value)) {
                return shallowEqual(fieldValue, value);
            }
            return fieldValue === value;
        // ... 其他操作符
    }
}
```

**关键特性：**
- **递归字段访问**: 支持点号分隔的嵌套字段
- **类型适配**: 处理数字字段和字符串字段
- **数组比较**: 使用浅层比较处理数组值
- **布尔短路**: 直接处理布尔条件

### 4.4 域匹配函数

```javascript
function matchDomain(record, domain) {
    if (domain.length === 0) {
        return true;
    }
    const operators = makeOperators(record);
    const reversedDomain = Array.from(domain).reverse();
    const condStack = [];
    for (const item of reversedDomain) {
        if (item in operators) {
            const operator = operators[item];
            const operands = condStack.splice(-operator.length);
            condStack.push(operator(...operands));
        } else {
            condStack.push(item);
        }
    }
    return matchCondition(record, condStack.pop());
}
```

**执行模型：**
- **栈式求值**: 使用栈结构进行表达式求值
- **逆序处理**: 反转域列表以正确处理操作符优先级
- **操作符映射**: 动态创建操作符函数
- **递归求值**: 支持嵌套的复杂表达式

---

## 5. 操作符支持

### 5.1 比较操作符

| 操作符 | 功能 | 示例 |
|--------|------|------|
| `=`, `==` | 等于 | `['name', '=', 'John']` |
| `!=`, `<>` | 不等于 | `['age', '!=', 25]` |
| `<` | 小于 | `['price', '<', 100]` |
| `<=` | 小于等于 | `['score', '<=', 90]` |
| `>` | 大于 | `['count', '>', 0]` |
| `>=` | 大于等于 | `['level', '>=', 5]` |

### 5.2 逻辑操作符

| 操作符 | 功能 | 说明 |
|--------|------|------|
| `&` | 逻辑与 | 所有条件都必须满足 |
| `\|` | 逻辑或 | 任一条件满足即可 |
| `!` | 逻辑非 | 条件取反 |

### 5.3 字符串匹配操作符

| 操作符 | 功能 | 说明 |
|--------|------|------|
| `like` | 包含匹配 | 大小写敏感 |
| `ilike` | 包含匹配 | 大小写不敏感 |
| `=like` | 模式匹配 | 支持 % 通配符，大小写敏感 |
| `=ilike` | 模式匹配 | 支持 % 通配符，大小写不敏感 |
| `in` | 包含于 | 值在指定集合中 |
| `not in` | 不包含于 | 值不在指定集合中 |

### 5.4 特殊操作符

```javascript
case "=?":
    if ([false, null].includes(value)) {
        return true;
    }
```

**`=?` 操作符：**
- **条件等于**: 当值为 false 或 null 时返回 true
- **灵活匹配**: 提供更宽松的匹配条件
- **默认行为**: 其他情况下等同于 `=` 操作符

---

## 6. 使用示例

### 6.1 基本用法

```javascript
// 创建简单域
const domain1 = new Domain([['name', '=', 'John']]);
const domain2 = new Domain([['age', '>', 18]]);

// 检查记录匹配
const record = { name: 'John', age: 25 };
console.log(domain1.contains(record)); // true
console.log(domain2.contains(record)); // true

// 字符串表示
console.log(domain1.toString()); // "[('name', '=', 'John')]"
```

### 6.2 复杂域组合

```javascript
// AND 组合
const andDomain = Domain.and([
    [['name', '=', 'John']],
    [['age', '>', 18]],
    [['active', '=', true]]
]);

// OR 组合
const orDomain = Domain.or([
    [['type', '=', 'admin']],
    [['type', '=', 'manager']]
]);

// 否定
const notDomain = Domain.not([['archived', '=', true]]);

// 复杂嵌套
const complexDomain = Domain.and([
    orDomain,
    notDomain,
    [['created_date', '>=', '2023-01-01']]
]);

// 记录匹配测试
const testRecord = {
    name: 'John',
    age: 30,
    active: true,
    type: 'admin',
    archived: false,
    created_date: '2023-06-15'
};

console.log(complexDomain.contains(testRecord)); // true
```

### 6.3 嵌套字段访问

```javascript
// 关联字段访问
const domain = new Domain([['partner.country.code', '=', 'CN']]);

const record = {
    partner: {
        country: {
            code: 'CN',
            name: 'China'
        }
    }
};

console.log(domain.contains(record)); // true
```

### 6.4 数组和集合操作

```javascript
// in 操作符
const inDomain = new Domain([['category', 'in', ['A', 'B', 'C']]]);

// 数组字段匹配
const arrayDomain = new Domain([['tags', '=', ['urgent', 'important']]]);

const record1 = { category: 'B' };
const record2 = { tags: ['urgent', 'important'] };

console.log(inDomain.contains(record1)); // true
console.log(arrayDomain.contains(record2)); // true
```

---

## 7. 架构设计分析

### 7.1 设计模式

#### 7.1.1 组合模式 (Composite Pattern)
- **域组合**: Domain 类支持递归组合
- **统一接口**: 单个域和复合域具有相同接口
- **树形结构**: AST 表示为树形结构

#### 7.1.2 解释器模式 (Interpreter Pattern)
- **语法解析**: 将域表达式解析为 AST
- **表达式求值**: 在运行时解释执行 AST
- **上下文支持**: 支持动态上下文变量

#### 7.1.3 工厂模式 (Factory Pattern)
- **静态工厂**: 提供 `and`、`or`、`not` 静态方法
- **类型转换**: 自动处理不同输入类型
- **实例创建**: 封装复杂的创建逻辑

### 7.2 性能考虑

#### 7.2.1 AST 缓存
- **解析缓存**: 避免重复解析相同表达式
- **结构复用**: 共享相同的 AST 节点
- **内存优化**: 减少冗余数据结构

#### 7.2.2 惰性求值
- **按需计算**: 只在必要时进行表达式求值
- **短路逻辑**: 利用逻辑操作符的短路特性
- **条件优化**: 优先计算简单条件

#### 7.2.3 类型优化
```javascript
const fieldValue = typeof field === "number" ? field : record[field];
```
- **类型检查**: 避免不必要的属性访问
- **直接计算**: 数字字段直接使用值
- **访问优化**: 减少对象属性查找

---

## 8. 错误处理

### 8.1 InvalidDomainError 类

```javascript
export class InvalidDomainError extends Error {}
```

**异常类型：**
- **继承 Error**: 标准错误类型
- **语义明确**: 专门用于域相关错误
- **调试友好**: 提供清晰的错误信息

### 8.2 错误检测点

#### 8.2.1 AST 验证
```javascript
if (domain.type !== 4 /* List */) {
    if (domain.type === 10 /* Tuple */) {
        // Tuple 验证逻辑
        if (
            value.findIndex((e) => e.type === 10) === -1 ||
            !value.every((e) => e.type === 10 || e.type === 1)
        ) {
            throw new InvalidDomainError("Invalid domain AST");
        }
    } else {
        throw new InvalidDomainError("Invalid domain AST");
    }
}
```

#### 8.2.2 操作符平衡检查
```javascript
if (expected > 0) {
    throw new InvalidDomainError(
        `invalid domain ${formatAST(domain)} (missing ${expected} segment(s))`
    );
}
```

#### 8.2.3 未知操作符处理
```javascript
default:
    throw new InvalidDomainError("could not match domain");
```

### 8.3 错误恢复策略

#### 8.3.1 自动修复
- **操作符补全**: 自动添加缺失的逻辑操作符
- **类型转换**: 自动转换兼容的数据类型
- **默认值**: 为缺失的字段提供默认值

#### 8.3.2 容错机制
- **布尔回退**: 布尔条件直接返回
- **空域处理**: 空域返回 true（匹配所有记录）
- **递归保护**: 防止无限递归导致的栈溢出

---

## 9. 总结

### 9.1 设计优势

1. **类型安全**: 完善的 TypeScript 类型定义
2. **灵活性**: 支持多种域表示格式
3. **可组合性**: 强大的域组合和嵌套能力
4. **性能优化**: AST 缓存和惰性求值
5. **错误处理**: 完善的异常处理机制
6. **扩展性**: 易于添加新的操作符和功能

### 9.2 应用场景

1. **数据筛选**: 用户界面的高级搜索功能
2. **权限控制**: 基于规则的访问控制
3. **报表生成**: 动态报表条件设置
4. **工作流**: 业务规则引擎
5. **数据验证**: 复杂的数据验证规则

### 9.3 技术特点

1. **Python 兼容**: 与 Odoo Python 后端域语法完全兼容
2. **前端集成**: 无缝集成到 Web 前端框架
3. **实时计算**: 支持客户端实时域计算
4. **调试支持**: 提供丰富的调试和日志功能

### 9.4 最佳实践

1. **域缓存**: 对频繁使用的域进行缓存
2. **复杂度控制**: 避免过于复杂的嵌套域
3. **性能监控**: 监控域求值的性能影响
4. **类型一致**: 保持字段类型的一致性
5. **错误处理**: 妥善处理域解析和求值错误

该文件是 Odoo 16 Web 框架中数据筛选和查询功能的核心实现，体现了现代 JavaScript 开发中的设计模式应用、性能优化技巧和错误处理策略。通过深入理解这个模块，开发者可以更好地掌握 Odoo 前端开发的核心技术和设计理念。