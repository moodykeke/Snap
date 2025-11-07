# 画笔编辑器布局方案（备选原型）

目标风格
- 参考 Scratch Costume 编辑器与 Win11 画图，统一简洁、轻量、可扩展的工具栏与面板布局。
- 先交付占位与交互骨架，不绑定具体引擎；确定方案后再逐步接入功能。

页面分区
- 顶部工具栏（TopBar）
  - 左侧：`文件`（打开/导入/导出）、`编辑`（撤销/重做）、`视图`（缩放/网格/标尺）占位
  - 中部：分组操作区
    - 选择相关：`Group`/`Ungroup`、`Forward`/`Backward`、`Front`/`Back`
    - 常用：`Copy`/`Paste`、`Delete`、`Flip Horizontal`/`Flip Vertical`
  - 右侧：图层快捷入口（显示/锁定/新建/删除）占位
- 颜色与样式（StyleBar）
  - `Fill`（填充颜色块 + 透明开关）、`Outline`（描边颜色块）、`Width`（线宽数值/滑块）
  - 常用形状样式占位（端点/拐角：round/miter/bevel）
- 左侧工具栏（Toolbox）
  - `Select`（选择/移动）
  - `Subselect`（锚点编辑，占位）
  - `Brush`（笔刷/自由绘制）
  - `Eraser`（橡皮，占位）
  - `Bucket`（填充，占位）
  - `Text`（文本）
  - `Line`（直线）
  - `Rectangle`、`Ellipse`、`Polygon`（多边形，占位）
- 画布区（CanvasPane）
  - 中心栅格背景，支持缩放/拖拽；后续接入旋转中心显示
- 右侧面板（RightPane）
  - `Layers`（图层列表，占位）：显示/锁定/重命名/排序
  - `Properties`（属性占位）：位置/尺寸/旋转/不透明度/混合模式
- 底部状态栏（StatusBar）
  - 显示坐标（x,y）、尺寸（w×h）、缩放比例、选中数量

交互约定（占位）
- 工具切换：单选高亮，支持 `Shift` 辅助约束（正方/圆/直线水平垂直）
- 拖拽移动：选择后拖动；Delete 删除；Ctrl+C/V 复制粘贴（后续实现）
- 层/属性变更：暂用 UI 占位，具体交互在接入阶段实现

开发阶段划分
1) 骨架搭建：HTML/CSS 布局与控件占位（已开始）
2) 基础工具接入：选择/笔刷/矩形/椭圆/直线/文本（先使用纸.js原型）
3) 面板联动：图层/属性与画布绑定
4) 增强工具：锚点编辑、橡皮、填充、多边形、布尔运算
5) 导入导出：SVG/PNG/项目序列化对齐（与 `SVG_Costume` 映射）

注意事项
- 保持与现有 `VectorPaintEditorMorph` 兼容的提交签名，以便平滑替换
- UI 颜色与图标遵循 Snap! 主题；占位按钮可以先用文字/简易图标，后续替换
- 无障碍：关键控件添加 `aria-label` 与键盘导航占位

文件
- 原型页：`paint-prototype.html`（将逐步承载上述布局与占位控件）
- 适配器：`src/paint-adapter.js`（工具与导入导出接口封装，逐步接入）