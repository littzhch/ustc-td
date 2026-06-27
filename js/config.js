// 本文件由 game.js 拆分而来，保持普通 script 全局加载以兼容 file:// 运行。
const TOWERS = {
  math: { name: "高数塔", role: "高伤单体", cost: 45, damage: 42, range: 128, cooldown: 1.05, color: "#38bdf8", desc: "单体高伤，适合处理厚血目标。" },
  physics: { name: "物理塔", role: "快速单体", cost: 38, damage: 22, range: 118, cooldown: 0.48, color: "#34d399", desc: "攻速快，稳定清理作业怪和 DDL。" },
  lab: { name: "实验塔", role: "范围溅射", cost: 58, damage: 26, range: 108, cooldown: 1.25, splash: 52, color: "#a78bfa", desc: "命中后爆炸，对小范围敌人造成伤害。" },
  coffee: { name: "咖啡塔", role: "减速产能", cost: 42, damage: 8, range: 112, cooldown: 0.75, slow: 0.35, incomeCd: 7, color: "#fbbf24", desc: "降低敌人速度，并周期产出少量资源。" },
};

const ENEMIES = {
  homework: { name: "作业怪", hp: 54, speed: 70, reward: 8, damage: 1, color: "#f97316" },
  ddl: { name: "DDL 怪", hp: 38, speed: 132, reward: 10, damage: 1, color: "#ef4444", blink: true, fuseMin: 2, fuseMax: 7, blastRadius: 88, heal: 1 },
  report: { name: "实验报告怪", hp: 128, speed: 48, reward: 16, damage: 2, armor: 5, firstHitHalf: true, color: "#10b981" },
  ppt: { name: "PPT 怪", hp: 82, speed: 64, reward: 14, damage: 1, split: true, color: "#eab308" },
  bug: { name: "Bug 幼虫", hp: 42, speed: 102, reward: 12, damage: 1, stealth: 1, color: "#6366f1" },
  boss_midterm: { name: "期中试卷 Boss", hp: 500, speed: 32, reward: 90, damage: 3, color: "#9b5b34", boss: true, summon: "homework", summonEvery: 7.2 },
  boss_ddl: { name: "DDL 总负责人", hp: 560, speed: 44, reward: 105, damage: 4, color: "#b91c1c", boss: true, pulseEvery: 6.8, blastRadius: 112 },
  boss_lab: { name: "实验验收 Boss", hp: 840, speed: 30, reward: 125, damage: 5, color: "#0f766e", boss: true, armor: 14, firstHitHalf: true },
  boss_thesis: { name: "毕业论文 Boss", hp: 1020, speed: 27, reward: 155, damage: 6, color: "#4c1d95", boss: true, bossSplit: ["ppt", "report", "ddl"] },
};

const CAMPUS_BUILDINGS = [
  { kind: "building", x: 120, y: 404, w: 216, h: 94, color: "#cf7441", label: "图书馆" },
  { kind: "building", x: 284, y: 558, w: 184, h: 72, color: "#c64f3c", label: "行政楼" },
  { kind: "office", x: 510, y: 520, w: 104, h: 58, label: "教务处" },
  { kind: "building", x: 542, y: 70, w: 316, h: 94, color: "#c66a3d", label: "第一教学楼" },
  { kind: "building", x: 812, y: 330, w: 150, h: 100, color: "#e8eceb", label: "少年班" },
  { kind: "building", x: 878, y: 218, w: 108, h: 68, color: "#f4f8f7", label: "水上报告厅" },
  { kind: "building", x: 900, y: 470, w: 160, h: 88, color: "#e0ddd2", label: "食堂" },
  { kind: "building", x: 56, y: 604, w: 146, h: 66, color: "#dbd9cd", label: "校史馆" },
];

const CAMPUS_BLOCKERS = [
  { kind: "circle", x: 512, y: 355, r: 54 },
  { kind: "circle", x: 552, y: 238, r: 48 },
  { kind: "rect", x: 404, y: 266, w: 150, h: 92 },
];

const GAOXIN_BUILDINGS = [
  { kind: "building", x: 222, y: 72, w: 250, h: 108, color: "#c9553d", label: "3号学科楼" },
  { kind: "building", x: 168, y: 270, w: 190, h: 108, color: "#d9e1de", label: "图书教育中心" },
  { kind: "office", x: 960, y: 172, w: 104, h: 58, label: "教务处" },
  { kind: "building", x: 732, y: 160, w: 150, h: 82, color: "#d8e2df", label: "师生活动中心" },
  { kind: "building", x: 914, y: 316, w: 142, h: 76, color: "#e7e3d7", label: "学生食堂" },
  { kind: "building", x: 944, y: 456, w: 104, h: 120, color: "#e8eceb", label: "5号学生公寓" },
  { kind: "building", x: 606, y: 486, w: 216, h: 76, color: "#c85f46", label: "体育馆" },
  { kind: "building", x: 52, y: 482, w: 142, h: 88, color: "#d55c42", label: "人才公寓" },
  { kind: "building", x: 76, y: 620, w: 166, h: 70, color: "#d7ded9", label: "教工食堂" },
];

const GAOXIN_BLOCKERS = [
  { kind: "circle", x: 482, y: 392, r: 108 },
  { kind: "circle", x: 556, y: 478, r: 118 },
  { kind: "circle", x: 430, y: 528, r: 82 },
  { kind: "rect", x: 372, y: 332, w: 278, h: 244 },
];

const WEST_BUILDINGS = [
  { kind: "building", x: 898, y: 256, w: 150, h: 118, color: "#d7d2bd", label: "图书馆" },
  { kind: "building", x: 430, y: 52, w: 224, h: 82, color: "#d7ded9", label: "学生公寓" },
  { kind: "building", x: 250, y: 72, w: 142, h: 70, color: "#dfd8c7", label: "食堂" },
  { kind: "building", x: 58, y: 180, w: 172, h: 82, color: "#dcd8c8", label: "西区学生生活动中心" },
  { kind: "building", x: 70, y: 324, w: 160, h: 94, color: "#c86a48", label: "特种实验楼" },
  { kind: "building", x: 252, y: 556, w: 172, h: 72, color: "#d9d3c3", label: "教三楼" },
  { kind: "building", x: 456, y: 574, w: 176, h: 68, color: "#d4e0dc", label: "电三楼" },
  { kind: "building", x: 700, y: 524, w: 220, h: 82, color: "#d6cfba", label: "力一楼" },
];

const WEST_TOWER_BUILDINGS = WEST_BUILDINGS.filter(building => !["图书馆", "电三楼"].includes(building.label));

const WEST_BLOCKERS = [
  { kind: "circle", x: 486, y: 330, r: 102 },
  { kind: "circle", x: 620, y: 372, r: 126 },
  { kind: "circle", x: 492, y: 470, r: 90 },
  { kind: "rect", x: 392, y: 266, w: 318, h: 220 },
];

const SLOT_BONUSES = {
  "图书馆": { name: "图书馆馆藏", desc: "射程 +12%", range: 1.12, color: "#2f6be8" },
  "行政楼": { name: "行政调度", desc: "攻速 +10%", speed: 1.1, color: "#b64d3f" },
  "教务处": { name: "教务核心", desc: "伤害 +8%，射程 +6%", damage: 1.08, range: 1.06, color: "#82372f" },
  "第一教学楼": { name: "一教授课", desc: "伤害 +12%", damage: 1.12, color: "#c66a3d" },
  "少年班": { name: "少年班速算", desc: "攻速 +14%", speed: 1.14, color: "#2f7d68" },
  "水上报告厅": { name: "报告厅扩音", desc: "射程 +14%", range: 1.14, color: "#2f6be8" },
  "食堂": { name: "食堂补给", desc: "咖啡塔收益 +40%", income: 1.4, color: "#c88022" },
  "校史馆": { name: "校史鼓舞", desc: "伤害 +6%，攻速 +6%", damage: 1.06, speed: 1.06, color: "#55714b" },
  "中科大星": { name: "中科大星", desc: "伤害 +10%，射程 +10%", damage: 1.1, range: 1.1, color: "#d7b83f" },
  "郭沫若像": { name: "郭沫若像", desc: "攻速 +8%，射程 +8%", speed: 1.08, range: 1.08, color: "#8a6a42" },
  "3号学科楼": { name: "高新学科群", desc: "伤害 +10%，攻速 +4%", damage: 1.1, speed: 1.04, color: "#c9553d" },
  "图书教育中心": { name: "图教检索", desc: "射程 +10%，伤害 +5%", range: 1.1, damage: 1.05, color: "#2f6be8" },
  "师生活动中心": { name: "活动中心调度", desc: "攻速 +12%", speed: 1.12, color: "#2f7d68" },
  "学生食堂": { name: "高新食堂补给", desc: "咖啡塔收益 +45%", income: 1.45, color: "#c88022" },
  "5号学生公寓": { name: "宿舍熬夜灯", desc: "攻速 +8%，射程 +5%", speed: 1.08, range: 1.05, color: "#7d66aa" },
  "体育馆": { name: "体测爆发", desc: "伤害 +8%，攻速 +8%", damage: 1.08, speed: 1.08, color: "#2f7d4f" },
  "人才公寓": { name: "人才引进", desc: "伤害 +12%", damage: 1.12, color: "#c9553d" },
  "教工食堂": { name: "教工餐补", desc: "咖啡塔收益 +35%，射程 +4%", income: 1.35, range: 1.04, color: "#c88022" },
  "思佩桥": { name: "思佩桥瓶颈", desc: "射程 +16%，伤害 +6%", range: 1.16, damage: 1.06, color: "#38bdf8" },
  "学生公寓": { name: "宿舍熬夜灯", desc: "攻速 +8%，射程 +5%", speed: 1.08, range: 1.05, color: "#7d66aa" },
  "西区学生生活动中心": { name: "活动中心调度", desc: "攻速 +12%", speed: 1.12, color: "#2f7d68" },
  "特种实验楼": { name: "实验楼溅射", desc: "伤害 +8%，射程 +6%", damage: 1.08, range: 1.06, color: "#c9553d" },
  "教三楼": { name: "教三讲台", desc: "伤害 +6%，射程 +8%", damage: 1.06, range: 1.08, color: "#b96f42" },
  "电三楼": { name: "电三超频", desc: "攻速 +12%", speed: 1.12, color: "#2f7d68" },
  "力一楼": { name: "力一推导", desc: "伤害 +12%", damage: 1.12, color: "#c66a3d" },
  "芦花映雪": { name: "芦花映雪", desc: "射程 +14%", range: 1.14, color: "#38bdf8" },
  "严济慈铜像": { name: "严济慈铜像", desc: "伤害 +8%，攻速 +8%", damage: 1.08, speed: 1.08, color: "#8a6a42" },
};

function buildTowerSlots(buildings = CAMPUS_BUILDINGS, extraSlots = []) {
  const slots = [];
  for (const building of buildings) {
    const { x, y, w, h } = building;
    const candidates = [
      [x + w * 0.5, y + h * 0.48],
      [x + w * 0.28, y + h * 0.36],
      [x + w * 0.72, y + h * 0.36],
      [x + w * 0.28, y + h * 0.68],
      [x + w * 0.72, y + h * 0.68],
    ];
    let placed = 0;
    const limit = w > 220 ? 3 : (w > 150 ? 2 : 1);
    for (const point of candidates) {
      if (placed >= limit) break;
      if (!isValidTowerSlot(point, slots, building)) continue;
      slots.push(makeTowerSlot(point, building.label));
      placed += 1;
    }
  }
  for (const { point, source, landmark = true } of extraSlots) {
    if (isValidLandmarkSlot(point, slots)) slots.push(makeTowerSlot(point, source, landmark));
  }
  return slots;
}

function addLandmarkTowerSlots(slots) {
  const landmarkSlots = [
    { point: [512, 355], source: "中科大星" },
    { point: [552, 238], source: "郭沫若像" },
    { point: [472, 352], source: "中科大星" },
    { point: [594, 252], source: "郭沫若像" },
  ];
  for (const { point, source } of landmarkSlots) {
    if (isValidLandmarkSlot(point, slots)) slots.push(makeTowerSlot(point, source, true));
  }
}

function makeTowerSlot(point, source, landmark = false) {
  const bonus = SLOT_BONUSES[source] || null;
  return { x: Math.round(point[0]), y: Math.round(point[1]), tower: null, source, bonus, landmark };
}

function isValidLandmarkSlot(point, existing) {
  const [x, y] = point;
  if (x < 34 || x > WIDTH - 34 || y < 34 || y > HEIGHT - 34) return false;
  if (distance(point, [562, 512]) < 52) return false;
  return !existing.some(slot => distance(slotPoint(slot), point) < 46);
}

function isValidTowerSlot(point, existing, building) {
  const [x, y] = point;
  if (x < 34 || x > WIDTH - 34 || y < 34 || y > HEIGHT - 34) return false;
  const inset = 18;
  if (
    !building ||
    x < building.x + inset ||
    x > building.x + building.w - inset ||
    y < building.y + inset ||
    y > building.y + building.h - inset
  ) return false;
  if (distance(point, [562, 512]) < 52) return false;
  return !existing.some(slot => distance(slotPoint(slot), point) < 46);
}

function slotPoint(slot) {
  return Array.isArray(slot) ? slot : [slot.x, slot.y];
}

const MAPS = [
  {
    name: "东区一教", subtitle: "怪潮从右下角主干道进入，沿校园大路冲向一教入口", accent: "#2f7d4f",
    preview: "已接入",
    bitmap: "eastCampus",
    landmarks: [["一教入口", 455, 210], ["主干道", 430, 600], ["喷泉广场", 864, 190], ["进攻入口", 930, 650]],
    target: [455, 210],
    spawns: [
      [930, 720],
    ],
    routes: [
      [[930, 720], [930, 610], [455, 610], [455, 505], [455, 395], [455, 300], [455, 210]],
    ],
    routeWeights: [1],
    path: [],
    buildings: [],
    blockers: [],
    slots: [
      { ...makeTowerSlot([326, 454], "第一教学楼", false), marker: "mapPad", radius: 50, bonus: { name: "主路联防", desc: "射程 +35%，覆盖校园主干道。", range: 1.35, color: "#2f7d4f" } },
      { ...makeTowerSlot([740, 480], "食堂", false), marker: "mapPad", radius: 50, bonus: { name: "主路联防", desc: "射程 +35%，覆盖校园主干道。", range: 1.35, color: "#2f7d4f" } },
    ],
  },
  {
    name: "高新校区", subtitle: "永怀湖两岸防线，思佩桥是左右侧怪潮汇合的唯一通道", accent: "#38bdf8", preview: "已接入",
    bitmap: "gaoxinCampus",
    style: "gaoxin",
    landmarks: [["三号学科楼", 250, 94], ["图书教育中心", 196, 315], ["高新教务处", 1062, 92], ["思佩桥", 536, 420], ["永怀湖", 560, 332], ["学生食堂", 930, 430], ["体育馆", 812, 594], ["西侧入口", 38, 420]],
    target: [1062, 92],
    spawns: [
      [0, 176],
      [0, 402],
      [0, 615],
    ],
    routes: [
      [[0, 176], [338, 176], [338, 308], [390, 350], [448, 354], [536, 354], [628, 354], [704, 356], [770, 340], [846, 308], [924, 286], [990, 226], [1038, 150], [1062, 92]],
      [[0, 402], [286, 402], [348, 376], [390, 350], [448, 354], [536, 354], [628, 354], [704, 356], [770, 340], [846, 308], [924, 286], [990, 226], [1038, 150], [1062, 92]],
      [[0, 615], [172, 615], [286, 535], [336, 452], [348, 376], [390, 350], [448, 354], [536, 354], [628, 354], [704, 356], [770, 340], [846, 308], [924, 286], [990, 226], [1038, 150], [1062, 92]],
    ],
    routeWeights: [1, 1, 1],
    choke: [536, 354],
    passages: [
      { kind: "rect", x: 390, y: 326, w: 314, h: 58 },
      { kind: "circle", x: 536, y: 354, r: 54 },
    ],
    path: [],
    buildings: [],
    blockers: [],
    slots: [
      { ...makeTowerSlot([230, 134], "3号学科楼", false), marker: "mapPad", radius: 42 },
      { ...makeTowerSlot([246, 345], "图书教育中心", false), marker: "mapPad", radius: 42 },
      { ...makeTowerSlot([230, 545], "人才公寓", false), marker: "mapPad", radius: 42 },
      { ...makeTowerSlot([342, 320], "思佩桥", true), marker: "mapPad", radius: 44 },
      { ...makeTowerSlot([380, 440], "思佩桥", true), marker: "mapPad", radius: 44 },
      { ...makeTowerSlot([720, 314], "思佩桥", true), marker: "mapPad", radius: 44 },
      { ...makeTowerSlot([830, 396], "学生食堂", false), marker: "mapPad", radius: 42 },
      { ...makeTowerSlot([970, 206], "教务处", false), marker: "mapPad", radius: 42 },
    ],
  },
  {
    name: "也西湖", subtitle: "西区环湖三线防守，南侧教学区与湖畔卡点共同收束到图书馆", accent: "#0ea5b7", preview: "已接入",
    bitmap: "westCampus",
    style: "west",
    landmarks: [["西区北门", 1068, 58], ["学生公寓", 690, 118], ["食堂", 232, 102], ["西区学生生活动中心", 152, 270], ["特种实验楼", 150, 472], ["也西湖", 552, 336], ["严济慈铜像", 780, 470], ["教三楼", 520, 642], ["电三楼", 704, 640], ["力一楼", 884, 640], ["图书馆", 958, 316]],
    target: [1068, 58],
    spawns: [
      [0, 178],
      [0, 352],
      [0, 620],
    ],
    routes: [
      [[0, 178], [292, 178], [318, 212], [318, 350], [318, 514], [372, 548], [526, 520], [654, 490], [744, 424], [808, 322], [872, 246], [984, 178], [1056, 128], [1068, 58]],
      [[0, 352], [248, 352], [318, 350], [318, 514], [372, 548], [526, 520], [654, 490], [744, 424], [808, 322], [872, 246], [984, 178], [1056, 128], [1068, 58]],
      [[0, 620], [152, 616], [286, 560], [318, 514], [372, 548], [526, 520], [654, 490], [744, 424], [808, 322], [872, 246], [984, 178], [1056, 128], [1068, 58]],
    ],
    routeWeights: [1, 1, 1],
    choke: [744, 424],
    passages: [
      { kind: "circle", x: 744, y: 424, r: 58 },
      { kind: "rect", x: 690, y: 360, w: 170, h: 120 },
    ],
    path: [],
    buildings: [],
    blockers: [],
    slots: [
      { ...makeTowerSlot([208, 128], "食堂", false), marker: "mapPad", radius: 42 },
      { ...makeTowerSlot([214, 286], "西区学生生活动中心", false), marker: "mapPad", radius: 42 },
      { ...makeTowerSlot([222, 506], "特种实验楼", false), marker: "mapPad", radius: 42 },
      { ...makeTowerSlot([466, 612], "教三楼", false), marker: "mapPad", radius: 42 },
      { ...makeTowerSlot([638, 584], "电三楼", false), marker: "mapPad", radius: 42 },
      { ...makeTowerSlot([704, 354], "芦花映雪", true), marker: "mapPad", radius: 44 },
      { ...makeTowerSlot([860, 414], "严济慈铜像", true), marker: "mapPad", radius: 44 },
      { ...makeTowerSlot([948, 228], "图书馆", false), marker: "mapPad", radius: 42 },
    ],
  },
];

const UNLOCKS = {
  lab: ["解锁实验塔", 90, "范围输出塔，击中后产生高爆水花。"],
  coffee: ["解锁咖啡塔", 120, "减速防线并提供周期性经费保障。"],
};

const TALENTS = {
  starter: ["新生礼包", "初始资源增加 20 点"],
  shield: ["校园护盾", "教务处终点受到首次冲击时额外缓冲"],
  scholarship: ["特等奖学金", "结算时获得的学分额外提升 15%"],
};

const CHIPS = {
  none: ["未装配", "无外部运算加成", 0],
  amp: ["输出强化芯片", "防御塔基础伤害提升 8%", 80],
  clock: ["超频时钟芯片", "防御塔攻击速率加快 8%", 80],
  survey: ["量子测绘芯片", "防御塔攻击信道范围扩大 8%", 80],
};

const RESEARCH_BRANCHES = [
  {
    key: "survival",
    title: "本科生求生手册",
    motto: "先别挂科，别的都能再说。",
    accent: "#34d399",
    nodes: [
      { id: "freshman_pack", name: "新生礼包", icon: "包", x: 8, y: 48, max: 3, costs: [35, 70, 115], desc: "初始资源每级 +20。" },
      { id: "gpa_buffer", name: "绩点缓冲", icon: "绩", x: 22, y: 28, max: 3, costs: [45, 90, 145], requires: ["freshman_pack"], desc: "最大 GPA 每级 +0.2。" },
      { id: "prestudy", name: "预习三分钟", icon: "预", x: 22, y: 68, max: 1, costs: [95], requires: ["freshman_pack"], desc: "每局开始时额外获得 30 资源。" },
      { id: "office_firewall", name: "教务处防火墙", icon: "盾", x: 42, y: 48, max: 1, costs: [135], requires: ["gpa_buffer", "prestudy"], desc: "每局第一次怪物冲进教务处时，GPA 伤害降低 50%。" },
      { id: "dont_fail", name: "稳住别挂科", icon: "稳", x: 62, y: 28, max: 1, costs: [160], requires: ["office_firewall"], desc: "GPA 低于 1.0 时，全塔攻速短暂提高 18%，每局一次。" },
      { id: "scholarship_edge", name: "保研边缘人", icon: "奖", x: 62, y: 68, max: 2, costs: [150, 230], requires: ["office_firewall"], desc: "通关奖励学分每级 +10%。" },
      { id: "final_review", name: "期末复盘", icon: "复", x: 82, y: 48, max: 1, costs: [260], requires: ["dont_fail", "scholarship_edge"], desc: "守卫成功时，如果 GPA 大于 3.0，额外获得 60 学分。" },
    ],
  },
  {
    key: "tower",
    title: "塔防课题组",
    motto: "把每座塔都培养成离谱方向的专家。",
    accent: "#38bdf8",
    nodes: [
      { id: "math_tutoring", name: "高数补课", icon: "∫", x: 7, y: 35, max: 3, costs: [45, 90, 150], desc: "高数塔伤害每级 +5%。" },
      { id: "formula_burst", name: "偏科战神", icon: "爆", x: 25, y: 20, max: 1, costs: [150], requires: ["math_tutoring"], desc: "高数塔对 Boss 额外造成 16% 伤害。" },
      { id: "physics_team", name: "物理竞赛队", icon: "Φ", x: 25, y: 50, max: 2, costs: [55, 120], requires: ["math_tutoring"], desc: "物理塔攻速每级 +6%。" },
      { id: "quantum_clicker", name: "量子连点器", icon: "连", x: 43, y: 50, max: 1, costs: [180], requires: ["physics_team"], desc: "物理塔有 18% 概率额外打出一次伤害。" },
      { id: "lab_safety", name: "实验室安全规范", icon: "◇", x: 43, y: 78, max: 2, costs: [65, 135], requires: ["physics_team"], desc: "实验塔溅射范围每级 +8。" },
      { id: "danger_reagent", name: "实验事故", icon: "危", x: 61, y: 78, max: 1, costs: [210], requires: ["lab_safety"], desc: "实验塔击杀敌人时，额外获得 8 资源。" },
      { id: "coffee_refill", name: "咖啡续杯", icon: "C", x: 61, y: 30, max: 2, costs: [60, 130], requires: ["quantum_clicker"], desc: "咖啡塔产出每级 +20%。" },
      { id: "all_nighter", name: "通宵自习室", icon: "夜", x: 82, y: 50, max: 1, costs: [260], requires: ["coffee_refill", "danger_reagent"], desc: "咖啡塔附近的其他塔攻速 +8%。" },
    ],
  },
  {
    key: "campus",
    title: "校园地形学",
    motto: "不是乱摆塔，是严谨的校园风水学。",
    accent: "#fbbf24",
    nodes: [
      { id: "library_seat", name: "图书馆占座", icon: "书", x: 8, y: 26, max: 2, costs: [40, 95], desc: "图书馆部署点射程加成每级额外 +4%。" },
      { id: "admin_stamp", name: "行政楼盖章", icon: "章", x: 8, y: 66, max: 2, costs: [40, 95], desc: "行政楼部署点攻速加成每级额外 +4%。" },
      { id: "canteen_subsidy", name: "食堂补贴", icon: "饭", x: 28, y: 18, max: 1, costs: [110], requires: ["library_seat"], desc: "在食堂部署咖啡塔时，建造费用 -20%。" },
      { id: "teacher_course", name: "一教授课", icon: "教", x: 28, y: 48, max: 2, costs: [50, 110], requires: ["library_seat", "admin_stamp"], desc: "第一教学楼部署点伤害加成每级额外 +4%。" },
      { id: "museum_spirit", name: "校史馆精神", icon: "史", x: 28, y: 78, max: 1, costs: [120], requires: ["admin_stamp"], desc: "校史馆部署点伤害、攻速加成额外 +5%。" },
      { id: "star_calibration", name: "中科大星校准", icon: "星", x: 52, y: 34, max: 1, costs: [180], requires: ["teacher_course"], desc: "中科大星部署点伤害与射程额外 +5%。" },
      { id: "campus_planning", name: "校园规划办", icon: "规", x: 52, y: 68, max: 2, costs: [90, 170], requires: ["museum_spirit"], desc: "新增临时部署点费用每级 -5。" },
      { id: "golden_seat", name: "黄金自习位", icon: "金", x: 78, y: 50, max: 1, costs: [260], requires: ["star_calibration", "campus_planning"], desc: "每局随机一个空部署点变为黄金点位，获得混合加成。" },
    ],
  },
  {
    key: "deadline",
    title: "DDL 应急管理",
    motto: "让死线也学会排队。",
    accent: "#f43f5e",
    nodes: [
      { id: "deadline_radar", name: "死线雷达", icon: "警", x: 8, y: 48, max: 1, costs: [50], desc: "击杀 DDL 怪获得的资源 +4。" },
      { id: "alarm_clock", name: "早八闹钟", icon: "钟", x: 25, y: 28, max: 2, costs: [70, 140], requires: ["deadline_radar"], desc: "DDL 怪自爆倒计时每级 +0.5 秒。" },
      { id: "ta_intercept", name: "助教拦截", icon: "助", x: 25, y: 68, max: 1, costs: [120], requires: ["deadline_radar"], desc: "被减速的 DDL 怪受到 15% 额外伤害。" },
      { id: "emergency_review", name: "紧急撤稿", icon: "撤", x: 45, y: 28, max: 2, costs: [110, 190], requires: ["alarm_clock"], desc: "塔被 DDL 降级时，每级有 18% 概率免疫。" },
      { id: "crisis_pr", name: "危机公关", icon: "公", x: 45, y: 68, max: 2, costs: [95, 170], requires: ["ta_intercept"], desc: "击杀 DDL 怪恢复 GPA 每级 +0.03。" },
      { id: "reverse_delay", name: "反向延期", icon: "延", x: 65, y: 28, max: 1, costs: [230], requires: ["emergency_review"], desc: "每局第一次 DDL 自爆不会降级塔。" },
      { id: "extension_pass", name: "延期申请通过", icon: "批", x: 65, y: 68, max: 1, costs: [220], requires: ["crisis_pr"], desc: "每波第一个 DDL 怪出现时自动被强力减速 2 秒。" },
      { id: "advisor_unread", name: "导师已读不回", icon: "读", x: 84, y: 48, max: 1, costs: [280], requires: ["reverse_delay", "extension_pass"], desc: "DDL 总负责人的追责范围降低 20%。" },
    ],
  },
  {
    key: "boss",
    title: "Boss 答辩委员会",
    motto: "把每次大考都拆成可复习的题型。",
    accent: "#fb7185",
    nodes: [
      { id: "midterm_review", name: "期中复习", icon: "中", x: 8, y: 34, max: 2, costs: [70, 145], desc: "对期中试卷 Boss 伤害每级 +8%。" },
      { id: "no_extra_paper", name: "拒绝加卷", icon: "拒", x: 26, y: 20, max: 1, costs: [150], requires: ["midterm_review"], desc: "期中试卷召唤作业怪的间隔延长。" },
      { id: "ddl_filing", name: "DDL 备案", icon: "备", x: 26, y: 52, max: 1, costs: [150], requires: ["midterm_review"], desc: "DDL 总负责人追责间隔延长。" },
      { id: "lab_prereview", name: "实验预审", icon: "验", x: 46, y: 34, max: 2, costs: [95, 185], requires: ["no_extra_paper", "ddl_filing"], desc: "实验验收 Boss 护甲每级降低 4。" },
      { id: "paper_check", name: "论文查重", icon: "查", x: 46, y: 72, max: 2, costs: [95, 185], requires: ["ddl_filing"], desc: "毕业论文 Boss 拆分小怪血量每级 -12%。" },
      { id: "mentor_signature", name: "导师签字", icon: "签", x: 66, y: 52, max: 1, costs: [240], requires: ["lab_prereview", "paper_check"], desc: "Boss 冲进教务处造成的 GPA 伤害 -0.1。" },
      { id: "committee_archive", name: "答辩归档", icon: "档", x: 84, y: 52, max: 1, costs: [300], requires: ["mentor_signature"], desc: "抵达过 Boss 波后，结算学术学分 +12%。" },
    ],
  },
  {
    key: "weird",
    title: "奇怪但有用的科研",
    motto: "正经不一定赢，有趣通常有解。",
    accent: "#a78bfa",
    nodes: [
      { id: "interdisciplinary", name: "交叉学科", icon: "叉", x: 7, y: 48, max: 1, costs: [130], desc: "局内强化从 3 选 1 变成 4 选 1。" },
      { id: "reroll_project", name: "课题重投", icon: "刷", x: 24, y: 28, max: 1, costs: [160], requires: ["interdisciplinary"], desc: "每局第一次局内强化可以刷新一次。" },
      { id: "blind_box", name: "学术盲盒", icon: "盒", x: 24, y: 68, max: 1, costs: [150], requires: ["interdisciplinary"], desc: "开局随机获得一个小型全局增益。" },
      { id: "mystic_tuning", name: "玄学调参", icon: "玄", x: 44, y: 28, max: 2, costs: [100, 185], requires: ["reroll_project"], desc: "每波开始时有概率获得 10-25 资源。" },
      { id: "pressure_group", name: "组会压迫感", icon: "压", x: 44, y: 68, max: 1, costs: [170], requires: ["blind_box"], desc: "敌人越接近教务处，受到的伤害越高。" },
      { id: "defense_rehearsal", name: "答辩彩排", icon: "辩", x: 64, y: 28, max: 1, costs: [210], requires: ["mystic_tuning"], desc: "Boss 波开始时获得 45 资源补给。" },
      { id: "good_ppt", name: "优秀答辩 PPT", icon: "P", x: 64, y: 68, max: 1, costs: [260], requires: ["pressure_group"], desc: "击破 Boss 后立刻获得一次局内强化选择。" },
      { id: "starcloud_help", name: "瀚海星云求助", icon: "云", x: 84, y: 48, max: 1, costs: [300], requires: ["defense_rehearsal", "good_ppt"], desc: "GPA 低于 1.0 时自动获得资源并全局减速一次。" },
    ],
  },
];

const RESEARCH_NODE_MAP = {};
for (const branch of RESEARCH_BRANCHES) {
  for (const node of branch.nodes) {
    RESEARCH_NODE_MAP[node.id] = { ...node, branch: branch.key };
  }
}

const DIFFICULTIES = {
  confidential: {
    label: "机密",
    title: "机密行动",
    desc: "标准教务危机，适合熟悉地图与建筑加成。",
    enemyHp: 1,
    enemySpeed: 1,
    reward: 1,
    credits: 1,
    startResource: 0,
    spawnInterval: 1,
    hpGrowth: 0,
    speedGrowth: 0.04,
    xp: 1,
    endless: false,
  },
  topsecret: {
    label: "绝密",
    title: "绝密行动",
    desc: "无尽高压题海，怪物逐波成长，撤退后按坚守波次结算。",
    enemyHp: 1.1,
    enemySpeed: 1.02,
    reward: 1.2,
    credits: 1.45,
    startResource: 45,
    spawnInterval: 1.05,
    spawnMin: 0.44,
    hpGrowth: 0.05,
    hpLateGrowth: 0.024,
    speedGrowth: 0.04,
    speedLateGrowth: 0.03,
    xp: 0.92,
    endless: true,
  },
};

const WAVE_TABLE = [
  repeat("homework", 4),
  [...repeat("homework", 4), ...repeat("ddl", 2)],
  [...repeat("report", 1), ...repeat("homework", 5)],
  [...repeat("ddl", 4), ...repeat("report", 1), ...repeat("homework", 4)],
  [...repeat("ppt", 2), ...repeat("report", 1), ...repeat("ddl", 1), ...repeat("homework", 5)],
];

const BOSS_SEQUENCE = ["boss_midterm", "boss_ddl", "boss_lab", "boss_thesis"];
