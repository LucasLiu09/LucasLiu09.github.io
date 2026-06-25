---
title: Superpowers Skills 手册
sidebar_label: Superpowers Skills手册
sidebar_position: 1
description: 面向真实任务的 Superpowers skills 与 Karpathy Guidelines 选择手册，用于快速判断应该启用哪条 skill 或 rule。
keywords:
  - AI
  - GenAI
tags: [GenAI]
---

# Superpowers Skills 与 Rules 快速选择手册

> 这份手册用于在真实任务中快速判断：应该使用哪一个 `superpowers` skill，是否需要叠加 `karpathy-guidelines`。

当前范围：

- `superpowers` 插件中的流程型 skills
- `andrej-karpathy-skills` 中的 `karpathy-guidelines` skill / Cursor rule

## 先看这张表

| 用户真实需求 | 首选 skill / rule | 典型后续 |
| --- | --- | --- |
| “我想做一个东西 / 新功能 / 组件” | `brainstorming` | `writing-plans` |
| “需求已经清楚，帮我拆计划” | `writing-plans` | `using-git-worktrees`，然后执行 |
| “按这个计划执行” | `subagent-driven-development` 或 `executing-plans` | `requesting-code-review` |
| “这个 bug / 测试 / 构建为什么失败” | `systematic-debugging` | `test-driven-development`，`verification-before-completion` |
| “我要写功能 / 修 bug / 重构” | `test-driven-development` | `verification-before-completion` |
| “这些任务能并行吗？” | `dispatching-parallel-agents` | 整合后跑全量验证 |
| “代码写完了，帮我检查” | `requesting-code-review` | `receiving-code-review` |
| “review 反馈怎么处理？” | `receiving-code-review` | 逐项修复并验证 |
| “可以说完成了吗 / 可以提交了吗？” | `verification-before-completion` | 通过后再收尾 |
| “这个分支做完了，下一步？” | `finishing-a-development-branch` | merge / PR / 保留 / 丢弃 |
| “需要开隔离工作区” | `using-git-worktrees` | 在 worktree 中实施 |
| “创建 / 修改一个 skill” | `writing-skills` | 用场景验证 skill 是否有效 |
| “希望少犯 AI 编码常见错误” | `karpathy-guidelines` | 叠加到编码、review、重构任务 |

## 常见工作流

### 1. 新功能从想法到收尾

用户可能会说：

- “我想做一个东西”
- “帮我设计一个功能”
- “这个需求怎么落地？”

推荐顺序：

1. `brainstorming`：先澄清目标、范围、约束、成功标准。
2. `writing-plans`：设计确认后，拆成可执行计划。
3. `using-git-worktrees`：大任务或计划执行前，隔离工作区。
4. `test-driven-development`：行为变化先写失败测试。
5. `requesting-code-review`：完成主要步骤后 review。
6. `verification-before-completion`：声明完成前必须验证。
7. `finishing-a-development-branch`：决定 merge、PR、保留或丢弃。

叠加：

- `karpathy-guidelines`：防止过度设计、无关改动和未验证的假设。

不要用完整链路的情况：

- 用户只是问概念解释。
- 用户只要快速命令输出。
- 任务明确是一次性草稿或原型，且用户接受不做完整流程。

### 2. Bug、测试失败、构建失败

用户可能会说：

- “测试挂了”
- “构建失败”
- “这个行为不对”
- “刚修完还是不行”

推荐顺序：

1. `systematic-debugging`：先复现、读错误、查最近变更、找根因。
2. `test-driven-development`：需要修改行为时，先写能复现问题的失败测试。
3. `verification-before-completion`：修复后用新鲜证据证明问题已解决。

不要做：

- 不要没找根因就猜修。
- 不要只改测试，除非已经证明测试本身错了。
- 不要用“应该好了”替代验证。

### 3. 多任务与并行 agent

用户可能会说：

- “这些能不能并行？”
- “多个模块都要处理”
- “分几个 agent 做”

选择：

- 有明确计划，任务相互独立：用 `subagent-driven-development`。
- 多个独立调查、独立失败、独立子系统：用 `dispatching-parallel-agents`。
- 有书面计划，但在单独 session 执行：用 `executing-plans`。

不要并行的情况：

- 多个问题可能同一个根因。
- 多个任务会频繁修改同一文件。
- 子任务之间有强顺序依赖。

### 4. Code Review 与反馈处理

用户可能会说：

- “代码写完了，review 一下”
- “这个实现是否符合计划？”
- “review 提了几点，帮我处理”

推荐顺序：

1. `requesting-code-review`：主动请求 review，检查实现是否符合需求。
2. `receiving-code-review`：收到反馈后先理解、验证，再逐项处理。
3. `verification-before-completion`：反馈修复后重新验证。

不要做：

- 不要对 review 反馈进行表演式赞同。
- 不要未经验证就盲目实现外部建议。
- 不要在反馈不清楚时先改一部分再问。

### 5. 声明完成、提交、PR、收尾

用户可能会说：

- “完成了吗？”
- “可以提交了吗？”
- “准备 PR”
- “这个分支下一步怎么处理？”

推荐顺序：

1. `verification-before-completion`：先运行能证明结论的验证命令。
2. `finishing-a-development-branch`：验证通过后，选择集成方式。

强约束：

- 没有新鲜验证证据，不能说测试通过、修复完成、构建成功。
- 验证失败时，应报告真实状态，不进入收尾。

### 6. 写或改 Skill

用户可能会说：

- “写一个 skill”
- “把这个流程沉淀下来”
- “以后遇到这种情况自动按这个做”

推荐顺序：

1. `writing-skills`：用压力场景验证 skill 是否真的改变 agent 行为。
2. 如果需求仍模糊，先用 `brainstorming`。
3. 完成后用 `verification-before-completion` 检查产物和验证记录。

不适合写成 skill 的情况：

- 一次性经验。
- 项目专属约定，更适合写项目 rule。
- 可以用脚本、hook、lint 自动强制的机械约束。

## 单个资源怎么选

### `brainstorming`

用于把模糊想法变成可确认设计。只要用户在“想做什么”阶段，而不是“按已确认方案执行”，优先考虑它。

不要用于纯解释、简单查询或已有明确计划的执行。

### `writing-plans`

用于把已确认的设计或需求拆成实施计划。适合“怎么做、分几步做、哪些文件要改”的问题。

不要用于需求还没澄清、方案还没选定的阶段。

### `using-git-worktrees`

用于开始较大功能或执行计划前隔离工作区，避免污染当前分支和用户未提交改动。

不要用于只读分析、简单小改，或用户明确要求在当前工作区操作的场景。

### `test-driven-development`

用于新功能、bugfix、重构和任何行为变化。核心判断是：是否会改变系统行为。

不要默认用于纯文档、纯配置、生成文件，除非这些内容也有可验证行为。

### `systematic-debugging`

用于任何失败、异常、bug、性能问题、构建问题。它要求先找根因，再提出修复。

不要在还没看错误、没复现、没证据时直接修。

### `dispatching-parallel-agents`

用于多个彼此独立的问题域。重点是并行调查，而不是按计划实施。

不要用于共享根因或共享文件的任务。

### `subagent-driven-development`

用于有书面计划，且计划中的任务可以相对独立执行。适合当前 session 中协调多个子代理逐项完成。

不要用于没有计划或任务高度耦合的情况。

### `executing-plans`

用于读取并执行已经写好的实施计划。适合按计划逐步推进，并在遇到阻塞时停下。

如果平台有可用子代理且任务独立，通常优先考虑 `subagent-driven-development`。

### `requesting-code-review`

用于完成主要功能、重要任务或合并前的主动 review。

不要把普通代码解释请求误判成 review。

### `receiving-code-review`

用于处理 review 反馈。它强调先理解、验证、评估，再实现。

不要在反馈含糊或可能冲突时直接改。

### `verification-before-completion`

用于任何完成声明之前。判断句式包括“完成了”“测试通过了”“修好了”“可以提交了”。

没有刚刚运行过的验证命令，就不能做这些声明。

### `finishing-a-development-branch`

用于实现完成且验证通过后的分支收尾。它负责引导选择 merge、PR、保留或丢弃。

不要在验证失败时使用。

### `writing-skills`

用于创建、修改、验证 skill。它把写 skill 当成流程文档的 TDD：先有失败场景，再写 skill，再验证 agent 是否遵守。

不要把一次性笔记或项目专属规范写成通用 skill。

### `using-superpowers`

用于会话或任务开始时，提醒 agent 先检查是否有适用 skill。它更像元规则，不是用户日常手动选择入口。

### `karpathy-guidelines`

用于减少 AI 编码常见错误：过度设计、无关改动、隐藏假设、没有成功标准。

适合作为通用叠加规则，尤其是：

- 写代码
- 重构
- review
- 处理含糊需求
- 任务范围容易膨胀

## 维护方式

新增 skill/rule 时，按这个模板补充：

```markdown
### `skill-or-rule-name`

用于：

用户可能会说：

- “...”
- “...”

常见组合：

- 前置：
- 后置：
- 可叠加：

不要用于：

- ...
```

维护时优先更新三个位置：

1. “先看这张表”
2. 对应“常见工作流”
3. “单个资源怎么选”

