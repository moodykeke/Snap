# 开发规则（个人发行分支）

本文件面向在个人发行分支上进行维护与开发的流程约束，旨在保证改动可控、可回滚、可审查，并与上游保持良好同步。

## 分支策略
- 基线分支：从官方发行标签创建的个人分支，例如 `personal/release-v11.0.8`。
- 功能分支：在个人发行分支上切出 `feature/<topic>`；修复类使用 `fix/<topic>`；文档类使用 `docs/<topic>`。
- 开发版分支：本地 `dev` 分支跟踪 `upstream/dev`，用于参考与验证未来改动，避免直接合入发行分支。
- 提升基线：当上游出现新发行标签（如 `v11.0.9`），通过 `rebase --onto` 或在新标签上重建个人发行分支并迁移必要更改。

## 提交与命名规范
- 小步提交，尽量一个提交完成一类改动；避免聚合大而杂的提交。
- 提交信息格式：`<type>(<scope>): <summary>`，常见 type 有：
  - `feat` 新功能；`fix` 缺陷修复；`docs` 文档；`refactor` 重构；`perf` 性能；`test` 测试；`build` 构建；`chore` 其他。
- 范围（scope）使用模块或文件夹名，如：`feat(paint): add adapter for canvas sync`。
- 将 UI 改动、逻辑改动、文档改动分开提交，提升审查与回滚效率。

## 同步上游
- 获取上游更新：`git fetch upstream`；发行标签：`git fetch upstream --tags`。
- 从上游挑拣修复（优选）：`git cherry-pick <commit_sha>`，仅选择必要修复进入发行线。
- 避免直接合并上游 `dev` 的大规模改动到发行分支，保持发行线稳定性。

## 暂存与切换
- 切换分支前如工作区未提交，先暂存：`git stash push -u -m "<reason>"`。
- 应用暂存：`git stash apply`，确认后可 `git stash drop` 清理。
- 常用切换：
  - 个人发行分支：`git switch personal/release-v11.0.8`
  - 开发版分支：`git switch dev`

## 换行符与风格
- Windows 环境可能出现 CRLF/LF 提示，属正常；可通过 `core.autocrlf` 或 `.gitattributes` 规范化（建议在团队共识后再调整）。
- 保持与项目现有风格一致，避免与功能无关的批量格式化变更。

## 测试与预览
- 本地服务器：`http://127.0.0.1:5500/`（已配置），变更后进行冒烟测试：打开 `snap.html`/`index.html`，检查核心交互无报错。
- 如涉及 UI/交互，优先在发行分支自测；需要参考未来行为时切到 `dev` 验证，再决定是否迁移到发行线。

## 版本识别与文档
- 避免将开发版行为误带入发行线；变更后对照 `HISTORY.md` 或项目“关于/版本”页。
- 为重要改动补充说明文档和迁移指南，提升维护可读性。

## 常用指令速查
- 查看状态：`git status -sb`
- 暂存与提交：`git add -A && git commit -m "<message>"`
- 推送当前分支：`git push`
- 查看暂存：`git stash list`
- 应用最近暂存：`git stash apply`
- 拉取上游标签：`git fetch upstream --tags`
- 基线前移示例：`git rebase --onto v11.0.9 v11.0.8 personal/release-v11.0.8`

---
如需在 `.gitattributes` 统一换行符或为二进制文件配置属性，请在团队有共识后实施，以免历史文件大规模漂移。