# 工作流：需求到提交流程

## 每个需求的标准步骤
1. 准备计划：复制 `docs/plan-template.md` 生成 `docs/plan-YYYYMMDD-<name>.md`。
2. 建分支：`git checkout -b feature/<name>`。
3. 开发与自测：遵循 `docs/dev-rules.md`；记录变更清单。
4. 提交：小步提交；信息包含类型与简要说明。
5. 推送：`git push -u origin feature/<name>`。
6. PR：走评审清单与验收标准；合并后删除分支。

## 与上游同步
```
git checkout master
git fetch upstream
git merge --ff-only upstream/master
git push origin master
```

## 回溯与无用功避免
- 每完成一个子目标即提交；关键点打 Tag 或在计划文档登记里程碑。