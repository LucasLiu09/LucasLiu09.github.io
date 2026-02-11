---
name: odoo-source-to-doc
description: Analyzes Odoo frontend/backend source files and produces Chinese Markdown technical documentation with class-by-class logic, call flows, and deep import-following dependency analysis. Use when the user asks to “分析/解读/解析源码”、to follow imports to other files, or to write docs into OdooDocument/.
---

# Odoo 源码解析 → 技术文档（Markdown）

## 适用范围

- 用户提供一个或多个源码文件路径（JS/TS/PY/XML 等），要求“解析/解读/分析”，并希望输出到 `OdooDocument/` 或指定文档目录。
- 用户要求沿 `import`/依赖继续深挖（跨文件、跨模块），并整理成可读的技术文档。

## 输出目标（文档结构建议）

将结果写成一份中文 Markdown，推荐结构：

- **总览**：文件定位、解决的问题、在体系中的角色（新旧架构关系）
- **类/对象概览表**：类名、职责、关键字段/方法、与其他类关系
- **关键依赖**：按 import/require 列出“必须深挖”的依赖，并说明其作用
- **逐类解析**：每个类的状态、核心方法、重要分支、边界条件
- **典型调用链/时序**：加载、更新、保存、并发、错误处理等
- **扩展点与踩坑**：二次开发时最容易出错的点
- **参考阅读**：建议继续看的文件/关键函数

标题尽量精简（只保留核心名词短语/方法名）。

## 工作流（必须按顺序做）

1. **读取目标文件**
   - 先通读：导出项、类/函数定义、顶层常量、主流程入口。
   - 提取“需要解释”的对象清单：类、关键方法、事件名、关键数据结构字段。

2. **建立依赖图（follow imports）**
   - 解析 `import ... from "..."` / `require("...")` / `odoo.define(...)`。
   - 对每个依赖做分级：
     - **一级必读**：直接影响当前文件核心逻辑（数据结构、并发、RPC、上下文、domain、序列化/反序列化、桥接层）
     - **二级选读**：仅用于辅助（格式化、UI 文案、边缘工具）
   - 对一级必读依赖：定位源码文件并深读关键片段，直到能解释“当前文件为什么这样写”。

3. **定位 import 对应源码的通用方法**
   - `@web/...`：通常在 `addons/web/static/src/...`
   - `web.*` 或 `odoo.define('web.X')`：通常在 `addons/web/static/src/legacy/...`
   - 其他模块：一般在 `addons/<module>/static/src/...`
   - 若同名多处出现：以“被当前文件实际引用的实现”为准（按导出名/模块名/使用点反推）。

4. **整理“事实来源”与“适配层”**
   - 若存在新旧桥接（例如新 Model 包装 legacy Model）：明确指出
     - 哪些行为由 legacy 层真正实现（事实来源）
     - 哪些行为只是包装/映射/同步（适配层）

5. **写文档并落盘**
   - 输出到用户指定目录；若用户明确要 `OdooDocument/`，则默认放到 `OdooDocument/`。
   - 文件名建议：`Odoo16-<主题>-源码解析.md` 或 `Odoo16-<文件名>-源码解析.md`。
   - 若目标文档用于 **Docusaurus（`@docusaurus/plugin-content-docs`）**，则在 Markdown 顶部添加 **front matter**（YAML），参考：`https://docusaurus.io/zh-CN/docs/api/plugins/@docusaurus/plugin-content-docs#markdown-front-matter`。
     - **推荐字段**（按需取用）：`id`、`title`、`sidebar_label`、`description`、`tags`、`slug`
     - **推荐规则**：
       - `id`：稳定且唯一，建议用 `odoo16-<域>-<主题>` 的 kebab-case（例如 `odoo16-web-form-controller`）
       - `title`：中文标题（例如 `Odoo 16 FormController 源码解析`）
       - `sidebar_label`：侧边栏短标题（例如 `FormController`）
       - `description`：一句话摘要（中文）
       - `tags`：数组（如 `odoo16/web/form/controller` 等标签拆分）
       - `slug`：站点路由（如 `/odoo16/web/form/form-controller`）
     - **示例**：
       - ```
         ---
         id: odoo16-web-form-controller
         title: Odoo 16 FormController 源码解析
         sidebar_label: FormController
         description: Odoo 16 Web 表单视图 FormController 源码梳理。
         tags:
           - odoo16
           - web
           - form
           - controller
         slug: /odoo16/web/form/form-controller
         ---
         ```

## 写作要求（质量约束）

- **中文输出**，术语统一（例如：datapoint/数据点、onchange、domain、context、x2many 等）。
- **避免只复述代码**：必须解释“为什么这么做 / 影响是什么 / 与其他模块如何配合”。
- **对关键分支给出判断条件**：例如 “当 viewType=list 且 parentID 存在时走父写回路径”。
- **有表格**：至少包含“类概览表”；如依赖复杂，再加“依赖概览表”。

