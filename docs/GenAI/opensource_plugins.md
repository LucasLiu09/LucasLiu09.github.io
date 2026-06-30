---
title: 记录开源的插件库
sidebar_position: 1
sidebar_label: 记录开源的插件库
keywords:
  - AI
  - GenAI
tags: [GenAI]
---

# 记录开源的插件库

- [superpowers](https://github.com/obra/superpowers)
  - Superpowers 是一套完整的软件开发方法论，适用于您的编码代理，它建立在一组可组合的技能和一些初始指令之上，以确保您的代理能够使用这些技能和指令。
- [Skills For Real Engineers](https://github.com/mattpocock/skills)
- [ECC](https://github.com/affaan-m/ECC):
  - 来自 Anthropic 黑客马拉松获胜者的完整 Claude Code 配置集合。
  - 不止是配置文件，而是一整套完整系统：技能体系、本能行为、记忆优化、持续学习、安全扫描，以及研究优先的开发模式。 包含可直接用于生产环境的智能体、技能模块、钩子、规则、MCP 配置，以及兼容传统命令的适配层——所有内容均经过 10 个多月高强度日常使用与真实产品开发迭代打磨而成。
  - 可在 Claude Code、Codex、Cursor、OpenCode、Gemini 及其他 AI 智能体框架中通用。
- [Karpathy-Inspired Claude Code Guidelines](https://github.com/multica-ai/andrej-karpathy-skills)
  - 一个单一的 CLAUDE.md 文件，用于改善 Claude Code 的行为，源自 Andrej Karpathy 的观察 关于 LLM 编码陷阱的总结。
- [PM Skills](https://github.com/phuryn/pm-skills)
  - PM skills：助力更优产品决策的人工智能操作系统
- [gsap-skills](https://github.com/greensock/gsap-skills)
  - GSAP（GreenSock动画平台）官方AI技能。
  - 它们教授代理正确使用GSAP的方法：核心API、时间轴、ScrollTrigger、插件、React/Vue/Svelte、原生JavaScript以及性能优化。
  - 采用代理技能格式，兼容技能CLI（Cursor、Claude Code、Codex、Windsurf、Copilot、40多个代理）。
- [ponytail](https://github.com/DietrichGebert/ponytail)
  - 代码量减少 54%（最高可达 94%）· 成本降低 20% · 速度提升 27% · 100% 安全


## Skills 速查表

下面按 skills 所属资源库分类，便于团队在选型和使用时快速定位来源。

### Superpowers

- `brainstorming`：需求澄清、方案比较和设计确认。
- `writing-plans`：把设计拆成可执行计划。
- `executing-plans`：按计划分步实施并跟踪完成情况。
- `test-driven-development`：为高风险逻辑建立测试先行流程。
- `verification-before-completion`：完成前确认验证是否充分。
- `requesting-code-review`：请求 AI 进行聚焦风险的代码评审。
- `receiving-code-review`：处理评审意见并组织后续修复。

### ECC

- `codebase-onboarding`：快速理解代码库或模块结构。
- `code-tour`：生成面向团队的代码阅读路径。
- `architecture-decision-records`：记录重要架构决策。
- `tdd-workflow`：组织测试驱动开发流程。
- `verification-loop`：循环执行验证、修复和复查。
- `security-review`：检查安全敏感变更。
- `documentation-lookup`：查询外部库、框架或 API 的最新资料。

### Karpathy-Inspired Claude Code Guidelines

- `karpathy-guidelines`：控制范围、保持实现直接、减少过度设计。
