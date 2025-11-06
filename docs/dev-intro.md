# 开发说明（初版）

本说明用于在本 Fork（moodykeke/Snap）中进行二次开发时的快速上手与约束提醒。

## 目标
- 在不破坏上游结构的前提下，以扩展/最小侵入方式迭代功能。
- 每个需求独立分支、小步提交、可回溯与可快速回滚。

## 环境与预览
- 直接打开 `snap.html` 可本地预览；或使用轻量静态服务器。
- 示例：`npx http-server` 后访问 `http://localhost:8080/snap.html`。

## 分支策略（简）
- `feature/<name>` 新功能；`fix/<name>` 缺陷修复；`docs/<name>` 文档。
- 推送命令：`git push -u origin <branch>`。

## 提交规范（简）
- 类型：`feat`/`fix`/`docs`/`chore`；信息简洁、指向明确。
- 模板参考仓库根目录 `.gitmessage.txt`。

## 与上游同步
```
git checkout master
git fetch upstream
git merge --ff-only upstream/master
git push origin master
```

## 扩展开发提醒
- 优先参考 `docs/dev-rules.md` 与 `docs/plan-template.md`。
- 新增积木或模块走扩展接口；避免直接修改核心文件行为。

---
维护者：`moodykeke`；如需补充或更改说明，建议通过 PR 流程更新。