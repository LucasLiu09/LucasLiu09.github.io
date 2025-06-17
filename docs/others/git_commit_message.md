---
title: Git - Commit 规范
description: Git - Commit 规范
sidebar_label: Git - Commit 规范
keyword:
    - git
tags: [git]
last_update:
  date: 2025/6/17
  author: Lucas
---

# Conventional Commit 规范

:::info[Note]
**[Conventional Commit 规范](https://www.conventionalcommits.org/zh-hans/v1.0.0/)**，包含字段详解、类型说明及示例

:::

## 提交消息结构
```plaintext
<type>[optional scope]: <description>

[optional body]

[optional footer]
```

## 字段说明
| 字段          | 是否必需 | 描述                                                                 |
|---------------|----------|----------------------------------------------------------------------|
| **`type`**    | 是       | 提交类型（如 `feat`, `fix`），表明改动的性质。                        |
| **`scope`**   | 否       | 说明改动的影响范围（如模块、组件或文件名），用括号包裹（例：`(auth)`）。 |
| **`description`** | 是 | 简短描述（**动词开头，首字母小写，无句号**，使用现在时态）。          |
| **`body`**    | 否       | 详细说明改动背景或实现细节（可多行）。                                |
| **`footer`**  | 否       | 关联 Issue（如 `Closes #123`）或标注破坏性变更（`BREAKING CHANGE:`）。 |

---

## 提交类型（`type`）详解

| 类型          | 描述                       |
|---------------|--------------------------|
| `feat`        | 新功能                      |
| `fix`         | 修复 Bug                   |
| `docs`        | 文档更新                     |
| `style`       | 代码风格，格式调整（如空格、分号等，不改变逻辑） |
| `refactor`    | 代码重构（既非新增功能，也非修复 Bug）    |
| `perf`        | 性能优化                     |
| `test`        | 添加或修改测试用例                |
| `chore`       | 维护性任务，构建或辅助工具变动（如依赖更新、配置文件修改等）                   |
| `ci`          | 持续集成                     |
| `build`       | 构建系统或外部依赖的改动             |
| `revert`      | 撤销某次提交                   |


### 1. `feat` - 新增功能
**使用场景**：添加新功能、特性或用户可见的改进。  
**示例**：
```plaintext
feat(checkout): add gift wrapping option

- Add UI toggle in checkout page
- Update order schema to include giftWrap field

Closes #102
```

---

### 2. `fix` - 修复 Bug
**使用场景**：修复代码中的错误或意外行为。  
**示例**：
```plaintext
fix(login): handle empty password submission

Prevent form crash when password field is empty.
Fixes #45
```

---

### 3. `docs` - 文档更新
**使用场景**：修改文档、注释或 README 文件。  
**示例**：
```plaintext
docs(API): add authentication example
```

---

### 4. `style` - 代码风格
**使用场景**：调整代码格式（如缩进、空格、引号），不影响逻辑。  
**示例**：
```plaintext
style: reformat CSS with 2-space indentation
```

---

### 5. `refactor` - 代码重构
**使用场景**：代码结构优化（非功能新增或 Bug 修复）。  
**示例**：
```plaintext
refactor(utils): simplify date formatting function
```

---

### 6. `perf` - 性能优化
**使用场景**：提升性能的代码改动。  
**示例**：
```plaintext
perf(db): add index to optimize user queries
```

---

### 7. `test` - 测试相关
**使用场景**：添加、修改或修复测试代码。  
**示例**：
```plaintext
test(component): add unit tests for button states
```

---

### 8. `chore` - 维护性任务
**使用场景**：构建工具、依赖管理或配置文件的杂项更新。  
**示例**：
```plaintext
chore: update eslint to v8.0
```

---

### 9. `ci` - 持续集成
**使用场景**：CI/CD 流水线或自动化脚本的改动。  
**示例**：
```plaintext
ci: add GitHub Actions for automated deploys
```

---

### 10. `build` - 构建系统
**使用场景**：影响构建结果或外部依赖的更改。  
**示例**：
```plaintext
build: upgrade Webpack to v5
```

---

### 11. `revert` - 回滚提交
**使用场景**：撤销之前的某次提交。  
**示例**：
```plaintext
revert: "feat(api): add experimental endpoint"

This reverts commit 1a2b3c4d.
```

---

## 特殊标记

### 1. 关联 Issue
**格式**：`Closes #123` 或 `Fixes #45, #67`  
**示例**：
```plaintext
fix: resolve memory leak in cache module

Fixes #89
```

### 2. 破坏性变更（Breaking Change）
**格式**：以 `BREAKING CHANGE:` 开头，说明变动和迁移方式。  
**示例**：
```plaintext
feat(config): rename `port` to `serverPort`

BREAKING CHANGE: Configuration file must update `port` to `serverPort`.
```

---

## 完整示例
```plaintext
feat(auth): implement OAuth2 login

- Add Google OAuth2 integration
- Update login page UI

Closes #112
BREAKING CHANGE: Legacy login API is deprecated.
```

---


:::tip[Tips]
如果有使用项目管理工具，通常会创建对应的任务，并附有流水号(任务号)，在这种情况下就可以以流水号开头，更方便我们追溯任务。例如：

```plaintext
Task0103 - feat(auth): implement OAuth2 login
```

:::
