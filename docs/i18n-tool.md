# i18n 开发辅助工具使用说明

位置：`utilities/i18n/audit.js`

## 功能
- 聚合 `src/locale.js` 与 `locale/lang-*.js` 的字典。
- 统计各语言缺失翻译、与英文相同的键数量。
- 校验占位符数量差异（`_` 与 `<#n>`）。
- 可生成补齐缺失键的 overlay stub 文件。

## 使用
- 生成报告：
  - `node utilities/i18n/audit.js`
  - 输出到：`utilities/i18n/report-YYYYMMDD.json`
- 生成缺失键骨架：
  - 所有语言：`node utilities/i18n/audit.js --stub`
  - 指定语言：`node utilities/i18n/audit.js --stub --lang zh_CN`
  - 用英文填充：`node utilities/i18n/audit.js --stub --fill=english`
- 指定输出：
  - `node utilities/i18n/audit.js --out utilities/i18n/report.json`

## 注意
- 仅在开发阶段运行，不影响运行时逻辑。
- 生成的 stub 建议人工审阅并合并到对应 `locale/lang-*.js`。