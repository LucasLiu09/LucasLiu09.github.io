# Strings.js 文件分析文档

## 目录
- [文件概述](#文件概述)
- [常量和变量](#常量和变量)
  - [nbsp](#nbsp)
  - [diacriticsMap](#diacriticsmap)
- [函数详细分析](#函数详细分析)
  - [escape](#escape)
  - [escapeRegExp](#escaperegexp)
  - [intersperse](#intersperse)
  - [sprintf](#sprintf)
  - [capitalize](#capitalize)
  - [unaccent](#unaccent)
- [总结](#总结)

## 文件概述

**文件位置**: `addons\web\static\src\core\utils\strings.js`

这是 Odoo 16 Web 模块中的字符串处理工具文件，包含了一系列用于字符串操作、格式化、转义和国际化处理的实用函数。该文件提供了HTML转义、正则表达式转义、字符串格式化、大小写转换和音调符号处理等功能。

## 常量和变量

### nbsp

**位置**: strings.js:3

**类型**: string

**值**: `"\u00a0"`

**功能描述**:
- 定义了不间断空格(Non-Breaking Space)的Unicode字符
- 常用于HTML和文本处理中保持单词或元素之间的空格不被折断

**使用示例**:
```javascript
import { nbsp } from "@web/core/utils/strings";
const text = `单词1${nbsp}单词2`; // 确保两个单词之间不会换行
```

### diacriticsMap

**位置**: strings.js:115-304

**类型**: Object

**功能描述**:
- 包含全面的音调符号字符到ASCII字符的映射表
- 涵盖拉丁文、西里尔文、希腊文等多种语言的重音字符
- 用于字符串标准化和搜索功能中的音调符号移除
- 包含单个字符映射和多字符组合映射(如 'æ' -> 'ae')

**特点**:
- 包含数千个字符映射
- 支持大小写字符
- 包含特殊的字符组合(如连字)

## 函数详细分析

### escape

**功能**: HTML字符转义

**位置**: strings.js:12-22

**参数**:
- `str` (string | number | undefined): 要转义的字符串或数字

**返回值**: string - 转义后的HTML安全字符串

**功能描述**:
- 将字符串中的HTML特殊字符转义为HTML实体
- 防止XSS攻击和HTML注入
- 使用DOM API的`textContent`特性进行安全转义
- 自动处理`undefined`值（返回空字符串）
- 自动将数字转换为字符串

**注意事项**: 
- 该函数仅适用于转义HTML内容，不适用于HTML属性值的转义

**使用示例**:
```javascript
escape('<script>alert("xss")</script>'); // "&lt;script&gt;alert("xss")&lt;/script&gt;"
escape(123); // "123"
escape(undefined); // ""
```

### escapeRegExp

**功能**: 正则表达式字符转义

**位置**: strings.js:31-33

**参数**:
- `str` (string): 要转义的字符串

**返回值**: string - 转义后可安全用于正则表达式的字符串

**功能描述**:
- 转义字符串中所有具有正则表达式特殊含义的字符
- 使字符串可以安全地用作正则表达式的字面量部分
- 转义的字符包括: `. * + ? ^ $ { } ( ) | [ ] \`
- 基于MDN文档的标准实现

**使用示例**:
```javascript
const userInput = "hello.world?";
const regex = new RegExp(escapeRegExp(userInput)); // 匹配字面量 "hello.world?"
```

### intersperse

**功能**: 在字符串中按指定位置插入分隔符

**位置**: strings.js:56-81

**参数**:
- `str` (string): 源字符串
- `indices` (number[]): 插入位置数组（相对偏移量）
- `separator` (string, 可选): 分隔符，默认为空字符串

**返回值**: string - 插入分隔符后的字符串

**功能描述**:
- 从字符串末尾开始，按照`indices`数组指定的相对偏移量插入分隔符
- 支持特殊值：
  - `-1`: 停止格式化
  - `0`: 重复前一个模式直到字符串开头
- 常用于数字格式化（如千位分隔符）

**算法特点**:
- 从右到左处理字符串
- 支持模式重复功能
- 灵活的停止机制

**使用示例**:
```javascript
intersperse("1234567", [3, 3, 0], ","); // "1,234,567"
intersperse("abcdefgh", [2, 3, -1], "-"); // "abc-de-fgh"
```

### sprintf

**功能**: 字符串格式化

**位置**: strings.js:93-101

**参数**:
- `s` (string): 格式化模板字符串
- `...values` (...string): 要插入的值

**返回值**: string - 格式化后的字符串

**功能描述**:
- 提供类似C语言`sprintf`的字符串格式化功能
- 支持两种格式化模式：
  1. 对象模式：`%(key)s` - 从对象中获取对应键的值
  2. 顺序模式：`%s` - 按顺序替换参数
- 如果没有提供参数，返回原字符串

**格式化模式**:
- `%(key)s`: 使用对象的属性值
- `%s`: 使用按顺序传入的参数

**使用示例**:
```javascript
sprintf("Hello %s", "World"); // "Hello World"
sprintf("Hello %(name)s", {name: "Alice"}); // "Hello Alice"
sprintf("Hello %s, you are %s", "Bob", "welcome"); // "Hello Bob, you are welcome"
```

### capitalize

**功能**: 字符串首字母大写

**位置**: strings.js:109-111

**参数**:
- `s` (string): 输入字符串

**返回值**: string - 首字母大写的字符串

**功能描述**:
- 将字符串的第一个字符转换为大写
- 保持其余字符不变
- 安全处理空字符串和`undefined`值

**使用示例**:
```javascript
capitalize("hello world"); // "Hello world"
capitalize(""); // ""
capitalize("a"); // "A"
```

### unaccent

**功能**: 移除字符串中的重音符号

**位置**: strings.js:313-318

**参数**:
- `str` (string): 包含重音符号的字符串
- `caseSensitive` (boolean): 是否区分大小写，默认为false

**返回值**: string - 移除重音符号后的ASCII字符串

**功能描述**:
- 将字符串中的重音字符替换为对应的ASCII字符
- 使用预定义的`diacriticsMap`进行字符映射
- 支持大小写敏感模式控制
- 常用于搜索和排序功能中的文本标准化
- 只处理非ASCII字符（Unicode范围外的字符）

**处理特点**:
- 自动处理各种语言的重音字符
- 保留无法映射的字符
- 可选的大小写转换

**使用示例**:
```javascript
unaccent("café", true); // "cafe"
unaccent("naïve", false); // "naive"
unaccent("Zürich"); // "zurich" (默认小写)
unaccent("Müller", true); // "Muller" (保持大小写)
```

## 总结

这个字符串工具文件提供了 6 个核心函数和 2 个重要常量，涵盖了 Web 开发中常见的字符串处理需求：

1. **安全性**: `escape` - HTML转义防止XSS攻击，`escapeRegExp` - 正则表达式安全
2. **格式化**: `intersperse` - 灵活的字符串分段，`sprintf` - 模板字符串格式化
3. **转换**: `capitalize` - 大小写处理，`unaccent` - 国际化字符标准化
4. **常量**: `nbsp` - 不间断空格，`diacriticsMap` - 全面的字符映射表

这些工具函数在 Odoo Web 框架中广泛使用，为用户界面、数据处理、搜索功能和国际化支持提供了坚实的基础。特别是`unaccent`函数和`diacriticsMap`映射表体现了Odoo对多语言环境的深度支持。
