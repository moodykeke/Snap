# 本地开发与工作流（moodykeke）

本 Fork 主要用于 Snap! 的二次开发与实验。遵循上游规则，尽量以扩展/非侵入方式实现需求。

## 初始化
- 远端：`origin = moodykeke/Snap`，`upstream = jmoenig/Snap`
- 同步主分支：`git checkout master && git fetch upstream && git merge --ff-only upstream/master`

## 分支策略
- `feature/<name>` 新功能
- `fix/<name>` 缺陷修复
- `docs/<name>` 文档/规则

## 每个需求的流程
1. 计划：使用 `docs/plan-template.md` 拆解范围与验收。
2. 建分支：`git checkout -b feature/<name>`。
3. 开发：按 `docs/dev-rules.md` 的约束进行。
4. 提交：使用约定式信息（见 `.gitmessage.txt`）。
5. 推送：`git push -u origin feature/<name>`。
6. 发起 PR：合并到 `master`（或目标分支）。

## 本地预览
Snap! 为静态站点，可直接打开 `snap.html` 或使用轻量服务器（如 `npx http-server`）。