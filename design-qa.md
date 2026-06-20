# Product Design QA

source visual truth path: `C:\Users\Administrator\.codex\generated_images\019ee08a-430e-7832-bc66-2241240a2da4\ig_0928fcd17c999ca9016a3563bed7748191806c86ea7e4d8160.png`
implementation screenshot path: `H:\game\qa-shots\archive-growth-redesign-bg-fix-user-values.png`
viewport: `1180 x 720`
state: 档案 / 局外成长页，选中 `校园地形学`
background asset: `H:\game\assets\ui\research\archive_growth_background.png`
cropped node assets: `H:\game\assets\ui\research\research_library.png`, `H:\game\assets\ui\research\research_academic.png`, `H:\game\assets\ui\research\research_fountain.png`, `H:\game\assets\ui\research\research_radar.png`, `H:\game\assets\ui\research\research_tree.png`, `H:\game\assets\ui\research\research_bridge.png`, `H:\game\assets\ui\research\research_desk.png`, `H:\game\assets\ui\research\research_archive.png`

**Findings**
- No actionable P0/P1/P2 findings.

**Required Fidelity Surfaces**
- Layout: 实现保留 1 号图的顶部档案标题带、左侧档案标签、中央地图叠加研究节点、右侧纸质详情面板、底部轻量总览和缩放胶囊。
- Background integration: 页面已改为档案纸 / 校园蓝图质感底图，不再使用战斗地图、道路或河道作为底图。
- Asset fidelity: 研究节点使用 Image Gen 生成的固定 4x2 方格素材表，并按方格中心裁剪为统一 PNG，没有用 CSS 硬画核心节点图标。
- Typography and copy: 中文直接输出，页面保留必要标签和短句，移除了底部大量说明性小字；左侧分支名和中央节点标签经截图检查无明显溢出。
- Interaction: 已验证 `switchOverlay('growth')`、分支切换、右上返回主菜单可用；浏览器无页面 JS 报错。

**Patches Made Since Previous QA Pass**
- 将局外成长页改为地图叠加式档案 UI。
- 为研究节点接入真实 PNG 徽章素材，并为不同课题分配对应图标。
- 将分支栏改为档案夹标签样式，隐藏小进度数字以避免拥挤。
- 将右侧详情改为纸质档案面板，减少长说明和小字堆叠。
- 按用户指出的右下角排版问题，将长期课题总览改为固定三行网格：标题、完成度条、三枚紧凑指标。
- 将档案页底图替换为 Image Gen 生成的无文字档案蓝图背景：`H:\game\assets\ui\research\archive_growth_background.png`。
- 保留最终验证截图：`H:\game\qa-shots\archive-growth-redesign-bg-fix-user-values.png`。

**Follow-up Polish**
- P3: 如果后续要做到和参考图更像，可继续为右上关闭按钮、帮助按钮生成专用金绿 PNG 图标。
- P3: 当前完整保留了 6 个实际研究分支，因此左栏比参考图多两项；这是为了不牺牲现有玩法入口。

final result: passed
