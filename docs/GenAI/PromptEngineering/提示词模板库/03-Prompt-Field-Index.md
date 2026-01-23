---
title: Odoo OWL字段组件Prompt索引
sidebar_position: 103
sidebar_label: Odoo OWL字段组件Prompt索引
keywords:
  - AI
  - GenAI
tags: [GenAI]
---

# Odoo OWL 字段组件 Prompt 索引

> **版本**: v1.0  
> **最后更新**: 2026-01-23  
> **Prompt总数**: 6个专用模板

---

## 📖 使用指南

本索引帮助您快速找到适合您需求的Prompt模板。每个模板都针对特定类型的字段组件进行了优化。

### 🎯 如何选择合适的Prompt？

1. **确定字段类型**：查看您要开发的字段类型
2. **查看复杂度**：评估是否符合您的开发能力
3. **阅读模板**：打开对应的Prompt文件
4. **填写占位符**：根据实际需求填写【】内容
5. **生成代码**：将完整Prompt提交给AI助手

---

## 📊 Prompt 分类总览

| 编号 | Prompt名称 | 适用字段类型 | 复杂度 | 文件名 |
|------|-----------|------------|--------|--------|
| 1.1 | 基础字段组件 | Integer, Float, Char, Text, Date, Datetime, Boolean | ⭐⭐ | [Prompt_Field_Basic.md](./Prompt_Field_Basic) |
| 1.2 | 关系型字段组件 | Many2one, One2many, Many2many | ⭐⭐⭐⭐⭐ | [Prompt_Field_Relational.md](./Prompt_Field_Relational) |
| 1.3 | 选择类字段组件 | Selection, Radio, Badge, State Selection | ⭐⭐⭐ | [Prompt_Field_Selection.md](./Prompt_Field_Selection) |
| 1.4 | 二进制字段组件 | Binary, Image, File, Many2many Binary | ⭐⭐⭐⭐ | [Prompt_Field_Binary.md](./Prompt_Field_Binary) |
| 1.5 | 富媒体字段组件 | Html, Signature, PDF Viewer, Ace Editor | ⭐⭐⭐⭐ | [Prompt_Field_RichMedia.md](./Prompt_Field_RichMedia) |
| 1.6 | 特殊字段组件 | Monetary, Progress Bar, Priority, Handle, Domain | ⭐⭐⭐⭐ | [Prompt_Field_Special.md](./Prompt_Field_Special) |

---

## 🗂️ 详细分类

### 1.1 基础字段组件 ⭐⭐

**文件**: [Prompt_Field_Basic.md](./Prompt_Field_Basic)

**适用场景**：
- 数字输入（整数、浮点数）
- 文本输入（单行、多行）
- 日期/时间选择
- 布尔值切换

**支持的字段类型**：
- `Integer` - 整数字段
- `Float` - 浮点数字段
- `Char` - 字符字段
- `Text` - 多行文本字段
- `Date` - 日期字段
- `Datetime` - 日期时间字段
- `Boolean` - 布尔字段

**核心特点**：
- ✅ 简单的值输入/输出
- ✅ 使用 `useInputField` hook
- ✅ 格式化和解析
- ✅ 轻量级验证

**何时使用**：
- 字段主要关注数据输入和格式化
- 不需要复杂的交互逻辑
- 不依赖其他字段或服务
- 开发时间紧张，需要快速实现

**示例场景**：
- 带千分位的整数字段
- 百分比浮点数字段
- 带格式验证的文本字段
- 自定义日期选择器

---

### 1.2 关系型字段组件 ⭐⭐⭐⭐⭐

**文件**: [Prompt_Field_Relational.md](./Prompt_Field_Relational)

**适用场景**：
- 多对一关联（选择单个记录）
- 一对多关联（管理子记录列表）
- 多对多关联（管理关联记录列表）

**支持的字段类型**：
- `Many2one` - 多对一关系
- `One2many` - 一对多关系
- `Many2many` - 多对多关系

**核心特点**：
- ✅ 自动补全和搜索
- ✅ 记录创建、编辑、打开
- ✅ 多服务依赖（ORM、Action、Dialog）
- ✅ 复杂的数据格式处理

**何时使用**：
- 需要关联其他模型的记录
- 需要自动补全搜索功能
- 需要快速创建关联记录
- 需要管理子记录列表

**示例场景**：
- 带头像的客户选择字段
- 可排序的订单行字段
- 多标签选择器
- 内联编辑的子记录列表

---

### 1.3 选择类字段组件 ⭐⭐⭐

**文件**: [Prompt_Field_Selection.md](./Prompt_Field_Selection)

**适用场景**：
- 固定选项的单选
- 不同视觉呈现的选择器
- 状态和分类字段

**支持的字段类型**：
- `Selection` - 下拉选择框
- `Radio` - 单选按钮组
- `Badge Selection` - 徽章选择
- `State Selection` - 状态选择（带颜色）

**核心特点**：
- ✅ 固定选项列表
- ✅ 多种视觉样式
- ✅ 颜色和图标支持
- ✅ 简单的交互逻辑

**何时使用**：
- 字段值来自预定义的选项列表
- 需要特殊的视觉呈现（徽章、按钮）
- 需要根据值显示不同颜色
- 状态和分类字段

**示例场景**：
- 彩色状态徽章
- 优先级星级选择
- 单选按钮组
- 图标+文字的选择器

---

### 1.4 二进制字段组件 ⭐⭐⭐⭐

**文件**: [Prompt_Field_Binary.md](./Prompt_Field_Binary)

**适用场景**：
- 文件上传和下载
- 图片预览和编辑
- 多文件管理

**支持的字段类型**：
- `Binary` - 通用二进制字段
- `Image` - 图片字段
- `File` - 文件字段（带文件名）
- `Many2many Binary` - 多文件字段

**核心特点**：
- ✅ 文件上传下载
- ✅ 图片预览和裁剪
- ✅ 拖拽上传
- ✅ 文件验证

**何时使用**：
- 需要上传文件或图片
- 需要图片预览和编辑
- 需要多文件管理
- 需要文件类型和大小验证

**示例场景**：
- 产品图片上传（带裁剪）
- 多文件附件上传
- PDF文档上传
- 用户头像上传

---

### 1.5 富媒体字段组件 ⭐⭐⭐⭐

**文件**: [Prompt_Field_RichMedia.md](./Prompt_Field_RichMedia)

**适用场景**：
- 富文本编辑
- 手写签名
- PDF查看
- 代码编辑

**支持的字段类型**：
- `Html` - 富文本字段
- `Signature` - 签名字段
- `PDF Viewer` - PDF查看器
- `Ace Editor` - 代码编辑器
- 其他需要第三方库的复杂编辑器

**核心特点**：
- ✅ 集成第三方编辑器
- ✅ 复杂的内容编辑
- ✅ 特殊的内容渲染
- ✅ 工具栏和快捷键

**何时使用**：
- 需要富文本编辑功能
- 需要手写签名输入
- 需要显示和编辑PDF
- 需要代码编辑器（语法高亮）
- 需要集成特殊的第三方组件

**示例场景**：
- 产品描述编辑器（WYSIWYG）
- 合同电子签名
- Python代码编辑器
- Markdown编辑器

---

### 1.6 特殊字段组件 ⭐⭐⭐⭐

**文件**: [Prompt_Field_Special.md](./Prompt_Field_Special)

**适用场景**：
- 货币金额显示
- 进度和状态显示
- 拖拽排序
- 特定业务逻辑

**支持的字段类型**：
- `Monetary` - 货币字段
- `Progress Bar` - 进度条字段
- `Priority` - 优先级字段（星级）
- `Handle` - 拖拽手柄
- `Domain` - 域构建器
- `Status Bar` - 状态栏

**核心特点**：
- ✅ 特定业务场景
- ✅ 可能依赖其他字段
- ✅ 复杂的交互逻辑
- ✅ 特殊的视觉呈现

**何时使用**：
- 需要显示货币金额（多币种）
- 需要进度条或百分比显示
- 需要星级评分
- 需要拖拽排序功能
- 需要可视化构建搜索域
- 需要工作流状态显示

**示例场景**：
- 销售订单金额字段
- 任务完成进度
- 工单优先级
- 列表拖拽排序
- 搜索条件构建器

---

## 🔍 字段类型快速查找

### 数字类型
- **Integer** → 使用 [1.1 基础字段](./Prompt_Field_Basic)
- **Float** → 使用 [1.1 基础字段](./Prompt_Field_Basic)
- **Monetary** → 使用 [1.6 特殊字段](./Prompt_Field_Special)

### 文本类型
- **Char** → 使用 [1.1 基础字段](./Prompt_Field_Basic)
- **Text** → 使用 [1.1 基础字段](./Prompt_Field_Basic)
- **Html** → 使用 [1.5 富媒体字段](./Prompt_Field_RichMedia)

### 日期时间
- **Date** → 使用 [1.1 基础字段](./Prompt_Field_Basic)
- **Datetime** → 使用 [1.1 基础字段](./Prompt_Field_Basic)

### 布尔和选择
- **Boolean** → 使用 [1.1 基础字段](./Prompt_Field_Basic)
- **Selection** → 使用 [1.3 选择类字段](./Prompt_Field_Selection)

### 关系型
- **Many2one** → 使用 [1.2 关系型字段](./Prompt_Field_Relational)
- **One2many** → 使用 [1.2 关系型字段](./Prompt_Field_Relational)
- **Many2many** → 使用 [1.2 关系型字段](./Prompt_Field_Relational)

### 二进制
- **Binary** → 使用 [1.4 二进制字段](./Prompt_Field_Binary)
- **Image** → 使用 [1.4 二进制字段](./Prompt_Field_Binary)

### 特殊类型
- **进度条** → 使用 [1.6 特殊字段](./Prompt_Field_Special)
- **优先级** → 使用 [1.6 特殊字段](./Prompt_Field_Special)
- **签名** → 使用 [1.5 富媒体字段](./Prompt_Field_RichMedia)
- **代码编辑器** → 使用 [1.5 富媒体字段](./Prompt_Field_RichMedia)
- **域构建器** → 使用 [1.6 特殊字段](./Prompt_Field_Special)

---

## 📋 使用流程

### Step 1: 确定需求
```
问自己以下问题：
- 字段存储什么类型的数据？
- 需要什么样的交互方式？
- 是否依赖其他字段？
- 是否需要特殊的视觉效果？
```

### Step 2: 选择Prompt
```
根据上述答案，在索引表中找到对应的Prompt文件
```

### Step 3: 阅读Prompt
```
完整阅读Prompt模板，了解：
- 适用场景和限制
- 需要填写的信息
- 技术要求
- 参考示例
```

### Step 4: 填写Prompt
```
按照模板要求填写所有【】占位符：
- 组件名称和信息
- 功能需求
- Props配置
- 交互逻辑
- 样式需求
```

### Step 5: 生成代码
```
将完整的Prompt提交给AI助手（如Claude、ChatGPT）
```

### Step 6: 集成测试
```
将生成的代码集成到项目中：
1. 复制JS/XML/SCSS文件到对应目录
2. 在assets.xml中注册资源
3. 在视图中使用widget
4. 测试功能
```

---

## ⚡ 快速决策树

```
开始
  │
  ├─ 是简单的输入字段？（数字、文本、日期等）
  │    └─ 是 → 使用 [1.1 基础字段]
  │
  ├─ 是关联其他模型的记录？
  │    └─ 是 → 使用 [1.2 关系型字段]
  │
  ├─ 是从固定选项中选择？
  │    └─ 是 → 使用 [1.3 选择类字段]
  │
  ├─ 涉及文件或图片？
  │    └─ 是 → 使用 [1.4 二进制字段]
  │
  ├─ 需要富文本编辑器或第三方组件？
  │    └─ 是 → 使用 [1.5 富媒体字段]
  │
  └─ 有特定的业务逻辑（货币、进度、优先级等）？
       └─ 是 → 使用 [1.6 特殊字段]
```

---

## 💡 最佳实践

### 开发前
- [ ] 确认字段类型和业务需求
- [ ] 查看Odoo标准字段的实现
- [ ] 选择最合适的Prompt模板
- [ ] 准备好所有需要的配置信息

### 使用Prompt时
- [ ] 完整填写所有占位符
- [ ] 提供清晰的功能描述
- [ ] 明确交互逻辑和样式需求
- [ ] 说明特殊要求和约束

### 代码生成后
- [ ] 检查生成的代码质量
- [ ] 测试所有功能和边界情况
- [ ] 优化性能和用户体验
- [ ] 添加单元测试

### 维护和优化
- [ ] 记录自定义配置
- [ ] 保持代码风格一致
- [ ] 定期更新依赖
- [ ] 收集用户反馈

---

## 🔧 故障排查

### 如何选择？我的字段很特殊

**问题**: 字段不完全符合某个分类

**解决方案**:
1. 找到最接近的Prompt模板
2. 使用该模板生成基础代码
3. 根据特殊需求修改生成的代码
4. 或者组合多个模板的特性

### 生成的代码不符合需求

**问题**: AI生成的代码与预期不符

**解决方案**:
1. 检查Prompt填写是否完整和清晰
2. 提供更详细的功能描述和示例
3. 明确指出不想要的功能
4. 分步骤让AI生成代码

### 如何扩展生成的代码？

**问题**: 需要在生成代码基础上添加功能

**解决方案**:
1. 阅读生成代码的结构
2. 参考Odoo标准字段的扩展方式
3. 使用继承或混入模式
4. 遵循OWL组件的最佳实践

---

## 📚 相关资源

### Odoo 官方文档
- [OWL框架文档](https://github.com/odoo/owl)
- [Odoo Web字段实现](https://github.com/odoo/odoo/tree/16.0/addons/web/static/src/views/fields)
- [Odoo开发者文档](https://www.odoo.com/documentation/16.0/developer.html)

### 学习资源
- [OWL组件开发教程](https://www.odoo.com/slides/owl-framework-102)
- [Odoo前端开发指南](https://www.odoo.com/documentation/16.0/developer/reference/frontend.html)

### 工具和库
- [OWL Playground](https://odoo.github.io/owl/playground/)
- [Odoo代码生成器](https://github.com/odoo/odoo-dev-tools)

---

## 🤝 贡献和反馈

### 发现问题？
- 如果Prompt模板有误或不清晰，请提出改进建议
- 如果缺少某种字段类型的Prompt，请告知需求

### 分享经验
- 成功案例可以添加到示例中
- 最佳实践可以补充到文档

### 持续改进
- Prompt模板会根据Odoo版本更新
- 新的字段类型会持续添加

---

## 📊 版本信息

**当前版本**: v1.0  
**发布日期**: 2026-01-23  
**适用Odoo版本**: 16.0+  
**OWL版本**: 2.0+

**版本历史**:
- v1.0 (2026-01-23): 初始版本，包含6个专用Prompt模板

---

## 📞 快速联系

**需要帮助？**
1. 查看各Prompt文件中的"常见问题"章节
2. 参考Odoo标准字段实现
3. 查阅OWL框架文档

**准备开始了吗？**

👉 **立即选择适合您的Prompt模板，开始开发！**

---

**让字段开发更高效、更规范！**

*本索引持续维护更新*
