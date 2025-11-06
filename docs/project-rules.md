# 项目特殊规则与约定（moodykeke/Snap）

## 目录与服务
- 预览服务：使用 `utilities/devserver.js`，通过环境变量 `PORT` 控制端口；默认回退到 `snap.html`。
- ServiceWorker：开发模式下可能提示注册失败，忽略即可；不要在本地关闭 SW 逻辑，避免与上游冲突。

## 多语言（i18n）约束
- 所有固定 UI 文本应可被本地化：
  - 首选使用 `localize('...')`；
  - 对弹窗类文本，`DialogBoxMorph.prototype.inform` 已支持本地化，建议将长文本加入对应语言文件。
- 长文本映射：在 `SnapTranslator.dict.<lang>` 中使用英文完整字符串作为键；避免拼接后难以匹配。
- 占位符一致性：`_` 与 `<#n>` 的数量必须与英文保持一致。
- 逐步策略：提取 → 候选 → 应用 → 预览 → 提交；脚本位于 `utilities/i18n/`。

## 文件修改
- 避免直接重构上游核心模块（morphic/objects/gui），仅做最小增量；新增功能优先以扩展或工具实现。
- 新增翻译统一追加到语言文件末尾，使用对象展开语法：
  `SnapTranslator.dict.zh_CN = { ...SnapTranslator.dict.zh_CN, "key": "value" }`。

## 提交与分支
- 需求分支：`feature/<name>`，缺陷分支：`fix/<name>`。
- 提交信息采用约定式：`feat(i18n): ...`、`fix(devserver): ...`；每次应用翻译需附预览验证。