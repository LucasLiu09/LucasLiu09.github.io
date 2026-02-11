# Examples

## Example 1: 单文件 + 沿 import 深挖

用户输入：

> 分析 `library/odoo-16.0/addons/web/static/src/views/basic_relational_model.js`，解析文件中各个类的逻辑，整理成技术文档；如果遇到当前文件以外的内容，请根据 import 深度解读源码并进一步分析。将分析结果整理成 markdown 输出到 `OdooDocument/`。

期望输出：

- 在 `OdooDocument/` 生成一份中文 Markdown
- 文档包含：
  - 总览（新旧架构桥接）
  - 类概览表（DataPoint/Record/StaticList/RelationalModel）
  - 关键依赖（BasicModel、Model、legacy_utils、evalDomain、concurrency 等）
  - 典型调用链（load/update/save/x2many）
  - 踩坑与扩展点（值映射、mutex、urgentSave、父子同步）

## Example 2: 组件/Hook 源码解析

用户输入：

> 解读 `addons/web/static/src/.../xxx.js` 里 `onWillUpdateProps` 的使用方式，整理成 1 篇文档输出到 `OdooDocument/`，并补充它与渲染更新的关系。

期望输出：

- 明确 hook 的触发时机、参数含义、常见竞态与规避方案
- 给出最小可复用的“结论清单”（何时用、怎么用、不要怎么用）

