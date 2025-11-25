---
title: Git - 常用指令速查
description: Git -常用指令速查
sidebar_label: Git - 常用指令速查
keyword:
  - git
tags:
  - git
last_update:
  date: 2025/11/25
  author: Lucas
---
# Git 常用指令速查手册

这份文档旨在提供最实用、最高频的 Git 指令，按**开发场景**分类，便于快速查找。

## 目录
1. [初始化与配置](#1-初始化与配置)
2. [日常工作流 (暂存与提交)](#2-日常工作流-暂存与提交)
3. [查看状态与日志](#3-查看状态与日志)
4. [分支管理 (Branch)](#4-分支管理-branch)
5. [远程同步 (Remote)](#5-远程同步-remote)
6. [后悔药 (撤销与回滚)](#6-后悔药-撤销与回滚-⚠️-重点)
7. [暂存工作现场 (Stash)](#7-暂存工作现场-stash)
8. [进阶：整理提交记录 (Rebase)](#8-进阶整理提交记录-rebase)
9. [多任务并行 (Worktree)](#9-多任务并行-worktree)
10. [定向采集 (Cherry-pick)](#10-定向采集-cherry-pick)
11. [高效技巧与总结](#11--高效技巧与总结)

---

## 1. 初始化与配置

| 指令 | 说明 |
| :--- | :--- |
| `git init` | 在当前目录初始化一个新的 Git 仓库 |
| `git clone <url>` | 克隆远程仓库到本地 |
| `git config --global user.name "Your Name"` | 设置全局用户名 |
| `git config --global user.email "email@example.com"` | 设置全局邮箱 |
| `git config --list` | 查看当前所有的 Git 配置 |

---

## 2. 日常工作流 (暂存与提交)

| 指令 | 说明 |
| :--- | :--- |
| `git add .` | 将当前目录下所有修改添加到暂存区 (常用) |
| `git add <file>` | 仅将指定文件添加到暂存区 |
| `git commit -m "说明"` | 提交暂存区的内容，并附带提交说明 |
| `git commit --amend -m "新说明"` | **修改最后一次提交**（用于修正写错的 commit message 或补漏文件），不产生新记录 |

---

## 3. 查看状态与日志

| 指令 | 说明 |
| :--- | :--- |
| `git status` | **最常用**。查看当前工作区状态（哪些文件被修改、哪些在暂存区） |
| `git diff` | 查看工作区与暂存区的具体代码差异 |
| `git log` | 查看完整的提交历史 |
| `git log --oneline` | **简洁模式**。每条日志只显示一行（Hash + 说明），方便概览 |
| `git log --oneline --graph` | 以图形化方式查看分支合并历史 |

---

## 4. 分支管理 (Branch)

| 指令 | 说明 |
| :--- | :--- |
| `git branch` | 列出本地所有分支，`*` 标记当前所在分支 |
| `git branch -a` | 列出本地和远程的所有分支 |
| `git branch <branch-name>` | 创建新分支（但不切换过去） |
| `git checkout <branch-name>` | 切换到指定分支 |
| `git switch <branch-name>` | 切换分支（新版本 Git 推荐用法，语义更清晰） |
| `git checkout -b <branch-name>` | **创建并立即切换**到新分支 (常用) |
| `git merge <branch-name>` | 将指定分支合并到**当前**分支 |
| `git branch -d <branch-name>` | 删除已合并的本地分支 |
| `git branch -D <branch-name>` | **强制删除**未合并的分支 |

---

## 5. 远程同步 (Remote)

| 指令 | 说明 |
| :--- | :--- |
| `git remote -v` | 查看远程仓库地址 |
| `git pull` | 拉取远程代码并自动合并 (相当于 fetch + merge) |
| `git pull --rebase` | 拉取远程代码并使用变基方式合并（保持提交记录是一条直线，**推荐**） |
| `git push` | 推送本地代码到远程仓库 |
| `git push -u origin <branch-name>` | 推送新分支并建立追踪关系（第一次推送新分支时使用） |
| `git fetch` | 仅下载远程更新，不合并到本地代码（安全操作） |

---

## 6. "后悔药" (撤销与回滚) ⚠️ 重点

这些指令在出错时非常有用，但请**谨慎使用**。

| 场景 | 指令 | 说明 |
| :--- | :--- | :--- |
| **放弃工作区的修改** | `git checkout -- <file>` | 丢弃某个文件的修改，恢复到最近一次 commit 的状态（不可逆！） |
| **暂存区退回工作区** | `git reset HEAD <file>` | `git add` 之后后悔了，想把文件从暂存区拿出来，但**保留修改** |
| **回退版本 (保留修改)** | `git reset --soft HEAD^` | 撤销最近一次 commit，但**保留代码修改**在暂存区（软重置） |
| **回退版本 (彻底重置)** | `git reset --hard HEAD^` | 撤销最近一次 commit，**彻底删除**修改（**危险操作**，慎用！） |
| **回退到指定版本** | `git reset --hard <commit-hash>` | 强制将当前分支重置到指定的 Commit ID |

---

## 7. 暂存工作现场 (Stash)

当你正在修 Bug，突然要切换分支处理紧急任务，但当前代码又不想 Commit 时使用。

| 指令 | 说明 |
| :--- | :--- |
| `git stash` | 将当前未提交的修改（工作区和暂存区）保存到堆栈中，让工作区变干净 |
| `git stash save "备注"` | 带备注的暂存，方便以后查找 |
| `git stash list` | 查看所有暂存记录 |
| `git stash pop` | 恢复最近一次暂存的内容，并从堆栈中删除 |
| `git stash apply` | 恢复最近一次暂存的内容，但**不删除**记录 |
| `git stash clear` | 清空所有暂存记录 |

---

## 8. 进阶：整理提交记录 (Rebase)

Rebase（变基）能让你的提交历史像一条直线一样干净，但需要谨慎使用。

| 指令 | 说明 |
| :--- | :--- |
| `git rebase <branch>` | 将当前分支变基到目标分支上（移动“基底”），常用于保持分支历史整洁 |
| `git rebase -i HEAD~n` | **交互式变基**（n为数量）。进入编辑器界面，可自由定制最近 n 次提交 |
| `git rebase --continue` | 解决冲突后，继续变基过程 |
| `git rebase --abort` | 放弃变基，恢复原状 |

### 交互式变基指令详解
执行 `git rebase -i` 后会进入编辑器，每一行代表一次提交。修改行首单词即可操作：

| 命令 | 简写 | 功能说明 |
| :--- | :--- | :--- |
| `pick` | `p` | **保留**该提交（默认） |
| `reword` | `r` | 保留代码，但**修改提交说明** (Commit Message) |
| `edit` | `e` | **暂停变基**。允许你停下来修改文件或追加内容，完成后执行 `git rebase --continue` |
| `squash` | `s` | **合并**该提交到**上一个**（更早的）提交中，需手动合并提交说明 |
| `fixup` | `f` | 类似 squash，但**直接丢弃**当前提交的说明（常用于纯粹的代码修补） |
| `drop` | `d` | **删除**该提交（对应的代码修改也会消失！） |

> **⚠️ 黄金法则**：永远不要在**公共分支**（如 master/main/develop）上使用 Rebase，只在自己**私有的功能分支**上使用。否则会给队友带来巨大的麻烦。

---

## 9. 多任务并行 (Worktree)

当你需要在同一个仓库中同时处理多个分支（例如：正在开发功能 A，突然要修 Bug B），除了 `stash`，你还可以使用 `worktree` 创建一个关联的**独立工作目录**。

| 指令 | 说明 |
| :--- | :--- |
| `git worktree add <path> <branch>` | 在指定路径创建一个新的工作树，并检出**已有**分支 |
| `git worktree add -b <new-branch> <path> <base-branch>` | 在指定路径创建一个新的工作树，并**新建**分支 |
| `git worktree list` | 查看所有工作树 |
| `git worktree remove <path>` | 删除指定路径的工作树 |
| `git worktree prune` | 清理已不存在的工作树记录（例如手动删除了文件夹后使用） |

**使用场景示例**：
假设你在 `project/` 目录下开发新功能，突然需要修紧急 Bug：
1. 执行 `git worktree add ../project-hotfix hotfix/login-bug`
2. Git 会在 `project` 同级目录创建一个 `project-hotfix` 文件夹。
3. 你可以同时打开两个编辑器窗口，一边继续开发新功能，一边在 `project-hotfix` 里修 Bug，互不干扰。

---

## 10. 定向采集 (Cherry-pick)

当你只需要**某个特定的提交**（比如修复了一个 Bug），而不需要合并整个分支时，Cherry-pick 是最佳选择。

| 指令 | 说明 |
| :--- | :--- |
| `git cherry-pick <commit-hash>` | 将指定的提交复制并应用到当前分支（生成一个新的 Commit ID） |
| `git cherry-pick <hash-A> <hash-B>` | 挑选多个非连续的提交 |
| `git cherry-pick <hash-A>..<hash-B>` | 挑选连续的提交区间（**不包含** A，**包含** B） |
| `git cherry-pick --abort` | 发生冲突时，放弃拣选，恢复原状 |
| `git cherry-pick --continue` | 解决冲突后，继续拣选过程 |

---

## 11. 🚀 高效技巧与总结

### 常用简写 (Alias)
配置别名可以大幅提升手速：
```bash
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
git config --global alias.st status
git config --global alias.lg "log --color --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit"
```

### 救命稻草 Reflog
如果你不小心 `reset --hard` 弄丢了代码，或者误删了分支，不要慌：
1. 输入 `git reflog` 查看所有操作记录（包括被回退的）。
2. 找到之前的 Commit Hash。
3. 用 `git reset --hard <commit-hash>` 穿梭回去。

### 保持整洁
- **清理分支**：`git fetch -p` (prune) 可以清理掉本地缓存的、但远程已经被删除的分支引用。
- **忽略文件**：务必维护好 `.gitignore`，不要把 `node_modules`、`.env` 等临时或敏感文件提交上去。


