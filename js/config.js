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
};

function buildTowerSlots() {
  const slots = [];
  for (const building of CAMPUS_BUILDINGS) {
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
  addLandmarkTowerSlots(slots);
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
    name: "郭沫若广场", subtitle: "图书馆、第一教学楼与水上报告厅之间的校园核心", accent: "#2f7d4f",
    preview: "已接入",
    landmarks: [["图书馆", 228, 467], ["行政楼", 376, 596], ["教务处", 562, 534], ["郭沫若像", 552, 238], ["中科大星", 512, 355], ["第一教学楼", 690, 112], ["少年班", 840, 352], ["水上报告厅", 930, 254], ["食堂", 980, 470]],
    target: [562, 512],
    spawns: [
      [0, 104],
      [270, 0],
      [1136, 0],
      [1180, 416],
      [1168, 720],
      [42, 720],
    ],
    path: [],
    slots: buildTowerSlots(),
  },
  {
    name: "图书馆长廊", subtitle: "后续开放：书架之间的 DDL 潮汐", accent: "#34d399", locked: true, preview: "建设中",
    landmarks: [["西区图书馆", 200, 140], ["少年班学院", 600, 120], ["自习区", 700, 580]],
    path: [[40, 240], [260, 240], [260, 560], [500, 560], [500, 180], [780, 180], [780, 440], [1140, 440]],
    slots: [[150, 160], [160, 360], [340, 480], [400, 280], [620, 120], [640, 340], [860, 280], [900, 540]],
  },
  {
    name: "东区一教", subtitle: "后续开放：从教学楼迷雾到校园核心", accent: "#a78bfa", locked: true, preview: "建设中",
    landmarks: [["郭沫若广场", 345, 110], ["瀚海星云", 780, 115], ["宿舍区", 760, 590]],
    path: [[40, 540], [210, 540], [210, 330], [380, 330], [380, 470], [620, 470], [620, 230], [860, 230], [860, 390], [1140, 390]],
    slots: [[130, 450], [250, 230], [330, 590], [480, 365], [540, 150], [700, 340], [760, 520], [960, 300]],
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
    spawnMin: 0.48,
    hpGrowth: 0.045,
    hpLateGrowth: 0.018,
    speedGrowth: 0.04,
    speedLateGrowth: 0.026,
    xp: 0.92,
    endless: true,
  },
};

const WAVE_TABLE = [
  repeat("homework", 4),
  [...repeat("homework", 4), ...repeat("ddl", 2)],
  [...repeat("report", 1), ...repeat("homework", 5)],
  [...repeat("ddl", 4), ...repeat("homework", 4)],
  [...repeat("ppt", 2), ...repeat("homework", 5)],
];

const BOSS_SEQUENCE = ["boss_midterm", "boss_ddl", "boss_lab", "boss_thesis"];
