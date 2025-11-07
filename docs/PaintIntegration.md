# 画笔系统改造与接入方案（提案）

目标
- 增强当前项目的画笔编辑器（位图 paint.js 与矢量 sketch.js），在可用性、性能、扩展性与跨格式导入导出等方面提升。
- 选择成熟开源方案作为矢量编辑内核，以适配现有 `SVG_Costume` 数据模型和项目序列化流程，实现平滑二次开发。

现状梳理
- 位图编辑器：`src/paint.js`，类 `PaintEditorMorph` / `PaintCanvasMorph`。支持笔刷、几何形状、填充、橡皮、拾色、旋转中心等；回调 `ok()` 通过画布与旋转中心返回结果。
- 矢量编辑器：`src/sketch.js`，类 `VectorPaintEditorMorph` / `VectorPaintCanvasMorph`。支持几何形状、选择、移动、缩放、撤销历史等；`getSVG()` 输出 Base64 编码的 SVG，`ok()` 回调更新 `SVG_Costume.contents` 和 `rotationCenter`。
- 服装模型：`src/objects.js` 中 `SVG_Costume`/`Costume`，`SVG_Costume.edit(...)` 打开 `VectorPaintEditorMorph` 并在提交时更新内容。

外部开源方案调研（重点）
- Paper.js（MIT）：场景图/层、路径/段、鼠标键盘工具；原生支持 SVG 导入/导出，API 完整，适合构建矢量编辑器。
  - 参考：Project.importSVG/exportSVG、Item.exportSVG（paperjs.org/reference）[1][2]；许可（MIT）[3]；特性综述[4]。
- Fabric.js（MIT）：对象化 Canvas，交互/控件丰富，支持 JSON/SVG 导出，SVG 导入能力存在差异，路径编辑不如 Paper.js 专业。
  - 参考：Core Concepts（fabricjs.com/docs）[5]。
- Konva.js（Apache-2.0）：面向 Canvas 的 2D 场景库，导出数据 URL（PNG/JPEG）成熟；官方不支持 SVG 导出，需自建转换或第三方[6][7][8][9]。
- SVG-Edit/Method Draw（多许可）：完整 Web SVG 编辑器，可嵌入 IFrame，但 UI 与项目风格差异较大、架构老旧、二次开发耦合成本高[10][11][12]。

候选选择
- 推荐：Paper.js 作为矢量编辑内核，原因：
  - 与 Snap! 现有 `SVG_Costume`/矢量流程高度契合（原生 SVG Import/Export）。
  - 路径几何能力强，易实现高级编辑（锚点、布尔运算可扩展）。
  - API 稳定、文档完备、MIT 许可友好，便于深度定制。

接入策略（分阶段）
1) 原型验证（已完成）
   - 新增 `paint-prototype.html`，以 CDN 引入 Paper.js，演示笔刷/矩形/椭圆/直线/选择、导入 SVG、导出 SVG/PNG、图层管理等能力。
2) 适配层（骨架已添加）
   - 新增 `src/paint-adapter.js` 定义 `PaperAdapter`：统一接口（`setTool`/`importSVG`/`exportSVG`/`exportPNG`/`clear`/`selectAt` 等）。
   - 规划在 `VectorPaintEditorMorph` 中可切换引擎：保持 UI 与 Morphic 交互不变，内部将绘制操作委托给适配器。
3) 数据映射
   - `SVG_Costume` -> Paper：`parseShapes()` 已能解析 `snap` 属性下的 shape 集合；导入时按 `asSVG` -> `importSVG` 建模。
   - Paper -> `SVG_Costume`：`exportSVG({asString:true, bounds:'content'})` 结果赋值到 `contents.src`，保持 `rotationCenter` 计算与现有一致。
4) 逐步替换/增强
   - 在 `sketch.js` 的形状构造与编辑操作中，用适配器提供的路径/形状对象替换或并行维护，首先覆盖自由笔刷/几何形状/选择/撤销等基础功能。
   - 后续扩展：锚点编辑、布尔运算、吸附/对齐、渐变/裁剪、文本高级样式等。

关键接口映射示意
- 打开编辑器：沿用 `SVG_Costume.edit(world, ide, ...)`，在 `VectorPaintEditorMorph.openIn(...)` 内部选择使用 `PaperAdapter`。
- 提交：沿用 `VectorPaintEditorMorph.ok()` 回调签名，改为从 `PaperAdapter.exportSVG()` 产出字符串，保持 `rotationCenter` 与 `shapes` 存储。
- 撤销：可使用适配器层面快照或继续利用现有 `history` 机制。

风险与兼容
- SVG 导入差异：复杂渐变/滤镜在不同库/浏览器渲染存在差异；策略为“渐进增强”，保留不可解析元素为 Raster。
- 事件/工具模型差异：Morphic 事件与 Paper 工具回调需适配，先在适配器内部对齐语义。
- 性能：复杂场景需分层/符号实例化/懒更新；Paper.js 提供良好层与符号机制，适配后评估。

验收标准
- 操作一致：基础工具（笔刷/矩形/椭圆/线/选择/拖动/删除/撤销）在现有 UI 工作流下完成。
- 数据对齐：导入现有 `SVG_Costume` 能正确显示；导出再导入保持形状、颜色、层级与旋转中心。
- 兼容保存：项目序列化/反序列化（`store.js`/`objects.js`）无破坏性变化。

参考链接
1) Paper.js Project 参考：http://paperjs.org/reference/project/
2) Paper.js FAQ（SVG 导入导出）：http://paperjs.org/about/faq/
3) Paper.js 许可（MIT）：http://paperjs.org/license/
4) Paper.js 特性概览：http://paperjs.org/features/
5) Fabric.js 核心概念（支持 JSON/SVG 导出）：https://fabricjs.com/docs/core-concepts/
6) Konva.js 官方站点：https://konvajs.org/
7) Konva 绘制 SVG 到 Canvas 指南：https://konvajs.org/docs/sandbox/SVG_On_Canvas.html
8) Konva SVG 导出（第三方解法/不内置）：https://stackoverflow.com/questions/65577358/export-canvas-from-react-konva-to-svg-pdf
9) Konva 编辑 SVG 路径的限制讨论：https://stackoverflow.com/questions/74399891/how-to-modified-svg-file-import-to-konvajs
10) SVG-Edit 项目与分析：https://github.com/SVG-Edit/svgedit （社区文章综述见 CSDN）
11) Method Draw（SVG-Edit 分支，侧重易用）：https://github.com/methodofaction/Method-Draw
12) SVG-Edit/Method Draw 评述（UI/维护情况）：https://blog.csdn.net/fe_watermelon/article/details/134609223

提交记录
- 新增原型页面：`paint-prototype.html`（Paper.js）
- 新增适配器骨架：`src/paint-adapter.js`

嵌入模式（与 Snap 主界面集成）
- 目标：在 Snap 主界面内以遮罩 + IFrame 嵌入原型编辑器，完成 SVG 导入、编辑、导出与旋转中心传递。
- 启用方式：
  - 主页面 `snap.html` 加载 `src/paint-adapter.js` 并设置 `window.useEmbeddedPaint = true`。
  - `SVG_Costume.edit(...)` 在嵌入开关与桥接存在时，自动转发到 `SVG_Costume.editAlt(...)`。
- 桥接接口：`window.PaperAdapterBridge.openEmbeddedEditor(opts)`
  - 入参 `opts`：
    - `svg`: 初始 SVG 文本（可为 Base64 解码结果）；
    - `center`: `{x, y}` 初始旋转中心；
    - `size`: `{width, height}` 画布尺寸（通常取 `IDE_Morph.stage.dimensions`）；
    - `onSubmit(svgString, center)`: 完成回调，返回 SVG 字符串与旋转中心；
    - `onCancel()`: 取消回调。
  - 工作流：
    1. 创建遮罩与 IFrame（`paint-prototype.html`）；
    2. IFrame `onload` 后向子窗口发送 `postMessage({ type: 'snap-paint-init', svg, center, size })`；
    3. 原型页点击“完成”时向父窗口发送 `postMessage({ type: 'snap-paint-result', svg, center })`；
    4. 父窗口接收后调用 `onSubmit` 并清理遮罩；点击遮罩空白处触发 `onCancel`。
- 消息协议：
  - `snap-paint-init`（父 -> 子）：初始化载荷，设定画布尺寸、导入 SVG、定位旋转中心。
  - `snap-paint-result`（子 -> 父）：返回导出的 SVG 字符串与旋转中心。
- 注意事项：
  - 嵌入模式不改变现有 Morphic 编辑器的类结构；仅在 `SVG_Costume.edit(...)` 层引入选择。
  - 原型页导出函数 `exportSnapSVG()` 会写入 `snap` 与 `prototype` 属性，以便 `parseShapes()` 做解析映射。
  - ServiceWorker 在开发预览下可能报错（无碍功能）；如需禁用可临时注释 `snap.html` 中注册逻辑。

后续任务建议
- 在 `VectorPaintEditorMorph` 接入适配器开关，完成最小替换路径。
- 扩展文本/渐变/裁剪/布尔运算等高级工具。
- 增加单元/集成测试与端到端回归用例（导入/导出一致性）。