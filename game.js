const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const panel = document.getElementById("buildPanel");
const overlay = document.getElementById("overlay");

const ui = {
  notice: document.getElementById("notice"),
  startBtn: document.getElementById("startBtn"),
  growthBtn: document.getElementById("growthBtn"),
  menuBtn: document.getElementById("menuBtn"),
  pauseBtn: document.getElementById("pauseBtn"),
  restartBtn: document.getElementById("restartBtn"),
  resetSaveBtn: document.getElementById("resetSaveBtn"),
  mapList: document.getElementById("mapList"),
  growthPanel: document.getElementById("growthPanel"),
  history: document.getElementById("history"),
  life: document.getElementById("life"),
  resource: document.getElementById("resource"),
  wave: document.getElementById("wave"),
  kills: document.getElementById("kills"),
  score: document.getElementById("score"),
  credits: document.getElementById("credits"),
  mods: document.getElementById("mods"),
};

const WIDTH = 1180;
const HEIGHT = 720;
const MAP_W = 860;
const PANEL_X = 880;
const SAVE_KEY = "ustc_guardian_web";

const TOWERS = {
  math: {
    name: "高数塔",
    role: "高伤单体",
    cost: 45,
    damage: 42,
    range: 128,
    cooldown: 1.05,
    color: "#2f66d0",
    desc: "单体高伤，适合处理厚血目标。",
  },
  physics: {
    name: "物理塔",
    role: "快速单体",
    cost: 38,
    damage: 22,
    range: 118,
    cooldown: 0.48,
    color: "#1b9aaa",
    desc: "攻速快，稳定清理作业怪和 DDL。",
  },
  lab: {
    name: "实验塔",
    role: "范围输出",
    cost: 58,
    damage: 26,
    range: 108,
    cooldown: 1.25,
    splash: 52,
    color: "#8f5fd7",
    desc: "命中后爆炸，对小范围敌人造成伤害。",
  },
  coffee: {
    name: "咖啡塔",
    role: "减速/资源",
    cost: 42,
    damage: 8,
    range: 112,
    cooldown: 0.75,
    slow: 0.35,
    incomeCd: 7,
    color: "#b46a2c",
    desc: "降低敌人速度，并周期产出少量资源。",
  },
};

const ENEMIES = {
  homework: { name: "作业怪", hp: 54, speed: 70, reward: 8, damage: 1, color: "#f28e2b" },
  ddl: { name: "DDL 怪", hp: 38, speed: 112, reward: 10, damage: 1, color: "#e15759", blink: true },
  report: { name: "实验报告怪", hp: 128, speed: 48, reward: 16, damage: 2, armor: 5, firstHitHalf: true, color: "#59a14f" },
  ppt: { name: "PPT 怪", hp: 82, speed: 64, reward: 14, damage: 1, split: true, color: "#edc948" },
  bug: { name: "Bug 幼虫", hp: 42, speed: 102, reward: 12, damage: 1, stealth: 1, color: "#4e79a7" },
};

const MAPS = [
  {
    name: "东区一教",
    subtitle: "从教学楼迷雾到校园核心",
    accent: "#2f66d0",
    landmarks: [["东区一教", 120, 88], ["图书馆", 590, 108], ["郭沫若广场", 660, 520]],
    path: [[30, 330], [160, 330], [160, 170], [360, 170], [360, 455], [585, 455], [585, 280], [830, 280]],
    slots: [[120, 255], [245, 230], [290, 385], [455, 130], [470, 535], [650, 380], [710, 210], [760, 455]],
  },
  {
    name: "图书馆长廊",
    subtitle: "书架之间的 DDL 潮汐",
    accent: "#1b9aaa",
    landmarks: [["西区图书馆", 160, 105], ["少年班学院", 535, 88], ["自习区", 610, 525]],
    path: [[30, 210], [210, 210], [210, 500], [420, 500], [420, 150], [650, 150], [650, 380], [830, 380]],
    slots: [[130, 145], [135, 320], [285, 430], [335, 235], [505, 95], [525, 290], [705, 250], [730, 470]],
  },
  {
    name: "郭沫若广场",
    subtitle: "开阔广场上的课程怪物绕行",
    accent: "#6b5b95",
    landmarks: [["郭沫若广场", 345, 100], ["瀚海星云", 650, 95], ["宿舍区", 705, 560]],
    path: [[35, 500], [185, 500], [185, 305], [330, 305], [330, 425], [520, 425], [520, 210], [700, 210], [700, 360], [830, 360]],
    slots: [[105, 420], [210, 210], [300, 520], [410, 335], [465, 145], [600, 310], [645, 485], [775, 270]],
  },
];

const UNLOCKS = {
  lab: ["解锁实验塔", 90, "范围输出塔，适合清理密集敌人。"],
  coffee: ["解锁咖啡塔", 120, "减速并周期产出资源，偏运营流。"],
};

const TALENTS = {
  starter: ["新生礼包", "初始资源 +20"],
  shield: ["校园护盾", "初始生命 +5"],
  scholarship: ["奖学金", "结算学分 +15%"],
};

const CHIPS = {
  none: ["未装配", "无芯片加成", 0],
  amp: ["输出芯片", "防御塔伤害 +8%", 80],
  clock: ["时钟芯片", "防御塔攻速 +8%", 80],
  survey: ["测绘芯片", "防御塔射程 +8%", 80],
};

const WAVE_TABLE = [
  repeat("homework", 8),
  [...repeat("homework", 7), ...repeat("ddl", 4)],
  [...repeat("report", 3), ...repeat("homework", 8)],
  [...repeat("ddl", 8), ...repeat("homework", 6)],
  [...repeat("ppt", 4), ...repeat("homework", 8)],
  [...repeat("report", 5), ...repeat("ddl", 6)],
  [...repeat("bug", 8), ...repeat("homework", 8)],
  [...repeat("ppt", 5), ...repeat("report", 4)],
  [...repeat("ddl", 12), ...repeat("bug", 8)],
  [...repeat("report", 7), ...repeat("ppt", 6), ...repeat("bug", 6)],
];

const DEFAULT_SAVE = {
  history: [],
  bestWave: 0,
  credits: 0,
  unlocks: ["math", "physics"],
  talent: "starter",
  chip: "none",
  chips: [],
};

let save = loadSave();
let mapIndex = 0;
let state = resetRun("menu");
let noticeText = "局外成长：结算获得学分，可解锁新塔、选择天赋和芯片。";

function repeat(value, count) {
  return Array.from({ length: count }, () => value);
}

function loadSave() {
  let loaded = {};
  try {
    loaded = JSON.parse(localStorage.getItem(SAVE_KEY) || "{}");
  } catch (_err) {
    loaded = {};
  }
  const data = { ...DEFAULT_SAVE, ...loaded };
  data.history = Array.isArray(data.history) ? [...data.history] : [];
  data.credits = Number.isFinite(Number(data.credits)) ? Math.trunc(Number(data.credits)) : 0;
  data.bestWave = Math.trunc(Number(data.bestWave || data.best_wave || 0));
  data.unlocks = Array.from(new Set([...(Array.isArray(data.unlocks) ? data.unlocks : []), "math", "physics"]));
  data.chips = Array.isArray(data.chips) ? data.chips.filter(key => key in CHIPS && key !== "none") : [];
  if (!(data.talent in TALENTS)) data.talent = "starter";
  if (!(data.chip in CHIPS)) data.chip = "none";
  return data;
}

function writeSave() {
  localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  renderSidebar();
}

function resetRun(mode = state?.mode || "menu") {
  const map = MAPS[mapIndex];
  const run = {
    mode,
    map,
    path: map.path,
    slots: map.slots.map(([x, y]) => ({ x, y, tower: null })),
    enemies: [],
    projectiles: [],
    floating: [],
    life: save.talent === "shield" ? 25 : 20,
    resources: save.talent === "starter" ? 120 : 100,
    wave: 0,
    maxWaves: 10,
    kills: 0,
    score: 0,
    spawnQueue: [],
    spawnTimer: 0,
    waveWait: 1.5,
    selectedSlot: null,
    message: "点击塔位建造防御塔，空格可暂停。",
    messageTimer: 4,
    mods: { damage: 1, speed: 1, range: 1, killBonus: 0, globalSlow: 0 },
    chosenMods: [],
    choices: [],
    choosingAfterWave: 0,
    resultSaved: false,
  };
  if (save.chip === "amp") run.mods.damage += 0.08;
  if (save.chip === "clock") run.mods.speed += 0.08;
  if (save.chip === "survey") run.mods.range += 0.08;
  return run;
}

function startGame() {
  panel.classList.add("hidden");
  overlay.classList.add("hidden");
  state = resetRun("running");
  setNotice(`开始守卫：${state.map.name}`);
  renderSidebar();
}

function toMenu() {
  state.mode = "menu";
  state.selectedSlot = null;
  panel.classList.add("hidden");
  overlay.classList.add("hidden");
  setNotice("已返回主菜单。右侧可选择地图、查看局外成长和最近战绩。");
  renderSidebar();
}

function toGrowth() {
  if (isBattleActive()) {
    setNotice("战斗中不能进入局外成长，重开或返回主菜单后再配置。当前变更只应影响下一局。");
    return;
  }
  state.mode = "growth";
  state.selectedSlot = null;
  panel.classList.add("hidden");
  overlay.classList.add("hidden");
  setNotice("局外成长会影响下一局的初始状态和塔属性。");
  renderSidebar();
}

function setMap(idx) {
  if (isBattleActive()) {
    setNotice("战斗中不能切换地图，重开或返回主菜单后再选择。");
    return;
  }
  mapIndex = idx;
  state = resetRun(state.mode);
  setNotice(`已选择地图：${MAPS[idx].name}`);
  renderSidebar();
}

function nextWave() {
  state.wave += 1;
  const pattern = WAVE_TABLE[Math.min(state.wave - 1, WAVE_TABLE.length - 1)];
  state.spawnQueue = shuffle([...pattern]);
  state.spawnTimer = 0.2;
  state.message = `第 ${state.wave} 波课程怪物出现！`;
  state.messageTimer = 2.5;
  setNotice(state.message);
}

function update(dt) {
  if (state.mode !== "running") return;
  const now = performance.now() / 1000;
  state.messageTimer = Math.max(0, state.messageTimer - dt);
  if (state.wave === 0) {
    state.waveWait -= dt;
    if (state.waveWait <= 0) nextWave();
  }
  updateSpawning(dt);
  updateEnemies(dt, now);
  updateTowers(dt, now);
  updateProjectiles(dt);
  updateFloaters(dt);
  if (state.life <= 0) {
    gameOver();
  } else if (!state.spawnQueue.length && !state.enemies.length && state.wave > 0) {
    if (state.wave >= state.maxWaves) victory();
    else openEnhancements();
  }
}

function updateSpawning(dt) {
  if (!state.spawnQueue.length) return;
  state.spawnTimer -= dt;
  if (state.spawnTimer <= 0) {
    const kind = state.spawnQueue.shift();
    state.enemies.push(makeEnemy(kind, 0));
    state.spawnTimer = Math.max(0.34, 0.82 - state.wave * 0.035);
  }
}

function updateEnemies(dt, now) {
  const survivors = [];
  const total = pathLength(state.path);
  for (const enemy of state.enemies) {
    const data = ENEMIES[enemy.kind];
    let speed = data.speed * (1 + state.wave * 0.035);
    if (now < enemy.slowUntil) speed *= enemy.slowFactor;
    enemy.blinkTimer -= dt;
    if (data.blink && enemy.blinkTimer <= 0) {
      enemy.blinkTimer = 3;
      if (Math.random() < 0.2) {
        enemy.progress += 38;
        floatText(pointAt(enemy.progress), "闪现", "#e15759");
      }
    }
    enemy.progress += speed * dt;
    if (enemy.progress >= total) {
      state.life -= data.damage;
      floatText(state.path[state.path.length - 1], `-${data.damage} 生命`, "#b00020");
    } else {
      survivors.push(enemy);
    }
  }
  state.enemies = survivors;
}

function updateTowers(dt, now) {
  for (const slot of state.slots) {
    const tower = slot.tower;
    if (!tower) continue;
    const data = TOWERS[tower.kind];
    if (tower.kind === "coffee") {
      tower.incomeLeft -= dt;
      if (tower.incomeLeft <= 0) {
        const gain = 5 + tower.level * 2;
        state.resources += gain;
        tower.incomeLeft = data.incomeCd;
        floatText([tower.x, tower.y - 26], `+${gain}`, "#7a4b18");
      }
    }
    tower.cooldownLeft -= dt;
    if (tower.cooldownLeft > 0) continue;
    const target = findTarget(tower, now);
    if (!target) continue;
    tower.cooldownLeft = towerStat(tower, "cooldown") / state.mods.speed;
    fireTower(tower, target, now);
  }
}

function updateProjectiles(dt) {
  for (const projectile of state.projectiles) projectile.life -= dt;
  state.projectiles = state.projectiles.filter(projectile => projectile.life > 0);
}

function updateFloaters(dt) {
  for (const floater of state.floating) {
    floater.y -= 24 * dt;
    floater.life -= dt;
  }
  state.floating = state.floating.filter(floater => floater.life > 0);
}

function makeEnemy(kind, progress = 0) {
  const data = ENEMIES[kind];
  return {
    kind,
    progress,
    hp: data.hp,
    maxHp: data.hp,
    slowUntil: 0,
    slowFactor: 1,
    firstHit: true,
    born: performance.now() / 1000,
    blinkTimer: 3,
  };
}

function findTarget(tower, now) {
  const range = towerStat(tower, "range") * state.mods.range;
  const candidates = state.enemies.filter(enemy => {
    const stealth = ENEMIES[enemy.kind].stealth || 0;
    if (now - enemy.born <= stealth) return false;
    return distance([tower.x, tower.y], pointAt(enemy.progress)) <= range;
  });
  if (!candidates.length) return null;
  return candidates.reduce((best, enemy) => (enemy.progress > best.progress ? enemy : best));
}

function fireTower(tower, target, now) {
  const targetPos = pointAt(target.progress);
  state.projectiles.push({ x: tower.x, y: tower.y, tx: targetPos[0], ty: targetPos[1], life: 0.2, color: TOWERS[tower.kind].color });
  const data = TOWERS[tower.kind];
  const damage = towerStat(tower, "damage") * state.mods.damage;
  if (tower.kind === "lab") {
    for (const enemy of [...state.enemies]) {
      if (distance(pointAt(enemy.progress), targetPos) <= data.splash) damageEnemy(enemy, damage * 0.78);
    }
  } else {
    damageEnemy(target, damage);
  }
  const slow = (data.slow || 0) + state.mods.globalSlow;
  if (slow) {
    target.slowFactor = Math.max(0.35, 1 - slow);
    target.slowUntil = now + 1.8 + tower.level * 0.15;
  }
}

function damageEnemy(enemy, amount) {
  const data = ENEMIES[enemy.kind];
  let finalAmount = amount;
  if (data.firstHitHalf && enemy.firstHit) finalAmount *= 0.5;
  enemy.firstHit = false;
  enemy.hp -= Math.max(1, finalAmount - (data.armor || 0));
  if (enemy.hp <= 0 && state.enemies.includes(enemy)) killEnemy(enemy);
}

function killEnemy(enemy) {
  state.enemies.splice(state.enemies.indexOf(enemy), 1);
  const data = ENEMIES[enemy.kind];
  const reward = data.reward + state.mods.killBonus;
  state.resources += reward;
  state.kills += 1;
  state.score += Math.trunc(reward * 3 + state.wave * 8);
  floatText(pointAt(enemy.progress), `+${reward}`, "#1b7f36");
  if (data.split) {
    for (const offset of [-12, 12]) {
      const child = makeEnemy("homework", Math.max(0, enemy.progress + offset));
      child.hp = 22;
      child.maxHp = 22;
      state.enemies.push(child);
    }
  }
}

function openEnhancements() {
  state.mode = "choosing";
  state.choosingAfterWave = state.wave;
  state.choices = sample([
    ["攻击力 +10%", "所有防御塔伤害提升 10%", () => addMod("damage", 0.1)],
    ["攻速 +10%", "所有防御塔攻击间隔降低", () => addMod("speed", 0.1)],
    ["射程 +10%", "更早覆盖路径关键拐点", () => addMod("range", 0.1)],
    ["击杀 +5 资源", "击败敌人获得额外资源", () => addMod("killBonus", 5)],
    ["咖啡因扩散", "所有塔附带 5% 减速", () => addMod("globalSlow", 0.05)],
    ["紧急经费 +45", "立即获得 45 资源", () => addResource(45)],
  ], 3);
  showChoiceOverlay();
  renderSidebar();
}

function addMod(key, value) {
  state.mods[key] += value;
}

function addResource(value) {
  state.resources += value;
}

function chooseEnhancement(idx) {
  const [title, _desc, action] = state.choices[idx];
  action();
  state.chosenMods.push(title);
  state.mode = "running";
  state.waveWait = 1.2;
  state.message = `获得强化：${title}`;
  state.messageTimer = 2.5;
  setNotice(state.message);
  overlay.classList.add("hidden");
  nextWave();
  renderSidebar();
}

function gameOver() {
  state.mode = "gameover";
  saveResult(false);
  showResultOverlay(false);
  renderSidebar();
}

function victory() {
  state.mode = "victory";
  saveResult(true);
  showResultOverlay(true);
  renderSidebar();
}

function saveResult(won) {
  if (state.resultSaved) return;
  state.resultSaved = true;
  const credits = calculateCredits(won);
  const record = {
    time: new Date().toLocaleString("zh-CN", { hour12: false }),
    map: state.map.name,
    won,
    wave: state.wave,
    kills: state.kills,
    score: state.score,
    credits,
    mods: state.chosenMods,
  };
  save.history.push(record);
  save.history = save.history.slice(-8);
  save.bestWave = Math.max(save.bestWave || 0, state.wave);
  save.credits = Math.trunc((save.credits || 0) + credits);
  writeSave();
}

function calculateCredits(won) {
  let credits = Math.max(8, state.wave * 7 + Math.floor(state.kills / 2) + (won ? 35 : 0));
  if (save.talent === "scholarship") credits = Math.trunc(credits * 1.15);
  return credits;
}

function unlockItem(kind) {
  if (isBattleActive()) {
    setNotice("战斗中不能修改局外成长，结束或返回主菜单后再操作。");
    return;
  }
  if (save.unlocks.includes(kind)) {
    setNotice("该防御塔已经解锁。");
    return;
  }
  const [label, cost] = UNLOCKS[kind];
  if ((save.credits || 0) < cost) {
    setNotice(`学分不足，${label} 需要 ${cost} 学分。`);
    return;
  }
  save.credits -= cost;
  save.unlocks.push(kind);
  setNotice(`${label} 已完成，下一局可以建造。`);
  writeSave();
}

function selectTalent(key) {
  if (isBattleActive()) {
    setNotice("战斗中不能修改初始天赋，结束或返回主菜单后再操作。");
    return;
  }
  save.talent = key;
  setNotice(`已选择初始天赋：${TALENTS[key][0]}。`);
  writeSave();
}

function selectChip(key) {
  if (isBattleActive()) {
    setNotice("战斗中不能修改芯片装配，结束或返回主菜单后再操作。");
    return;
  }
  const [name, _desc, cost] = CHIPS[key];
  const owned = key === "none" || save.chips.includes(key);
  if (!owned) {
    if ((save.credits || 0) < cost) {
      setNotice(`学分不足，购买 ${name} 需要 ${cost} 学分。`);
      return;
    }
    save.credits -= cost;
    save.chips.push(key);
  }
  save.chip = key;
  setNotice(`已装配芯片：${name}。`);
  writeSave();
}

function togglePause() {
  if (state.mode === "running") {
    state.mode = "paused";
    showPauseOverlay();
  } else if (state.mode === "paused") {
    state.mode = "running";
    overlay.classList.add("hidden");
  }
  renderSidebar();
}

function buildTower(slot, kind) {
  const data = TOWERS[kind];
  if (slot.tower) return;
  if (!save.unlocks.includes(kind)) {
    setNotice(`${data.name} 尚未在局外成长中解锁。`);
    return;
  }
  if (state.resources < data.cost) {
    setNotice("资源不足，先撑过这一波或建咖啡塔赚经费。");
    return;
  }
  state.resources -= data.cost;
  slot.tower = {
    kind,
    x: slot.x,
    y: slot.y,
    level: 1,
    spent: data.cost,
    cooldownLeft: 0,
    incomeLeft: data.incomeCd || 5,
  };
  panel.classList.add("hidden");
  state.selectedSlot = null;
}

function upgradeTower(slot) {
  const tower = slot.tower;
  if (!tower || tower.level >= 3) return;
  const cost = upgradeCost(tower);
  if (state.resources < cost) {
    setNotice("升级资源不足。");
    return;
  }
  state.resources -= cost;
  tower.spent += cost;
  tower.level += 1;
  panel.classList.add("hidden");
}

function sellTower(slot) {
  if (!slot.tower) return;
  const refund = Math.trunc(slot.tower.spent * 0.5);
  state.resources += refund;
  slot.tower = null;
  state.selectedSlot = null;
  panel.classList.add("hidden");
}

function towerStat(tower, key) {
  const base = TOWERS[tower.kind][key];
  if (key === "cooldown") return Math.max(0.16, base * Math.pow(0.88, tower.level - 1));
  if (key === "damage" || key === "range") return base * (1 + 0.28 * (tower.level - 1));
  return base || 0;
}

function upgradeCost(tower) {
  return Math.trunc(TOWERS[tower.kind].cost * (0.75 + tower.level * 0.55));
}

function pathLength(path = state.path) {
  let total = 0;
  for (let i = 0; i < path.length - 1; i += 1) total += distance(path[i], path[i + 1]);
  return total;
}

function pointAt(progress, path = state.path) {
  let remain = progress;
  for (let i = 0; i < path.length - 1; i += 1) {
    const a = path[i];
    const b = path[i + 1];
    const segment = distance(a, b);
    if (remain <= segment) {
      const t = segment === 0 ? 0 : remain / segment;
      return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    }
    remain -= segment;
  }
  return path[path.length - 1];
}

function distance(a, b) {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

function isBattleActive() {
  return state.mode === "running" || state.mode === "paused" || state.mode === "choosing";
}

function shuffle(items) {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

function sample(items, count) {
  return shuffle([...items]).slice(0, count);
}

function floatText([x, y], text, color) {
  state.floating.push({ x, y, text, color, life: 0.9 });
}

function setNotice(text) {
  noticeText = text;
  ui.notice.textContent = noticeText;
}

function draw() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  if (state.mode === "menu") {
    drawMenu();
    updateStats();
    return;
  }
  if (state.mode === "growth") {
    drawGrowthScreen();
    updateStats();
    return;
  }
  drawGame();
  updateStats();
}

function drawMenu() {
  ctx.fillStyle = "#f3f7ff";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = "#1d4f9f";
  ctx.fillRect(0, 0, WIDTH, 210);
  fillText("USTC", 74, 56, "18px Arial", "#ffffff", "left", "bold");
  fillText("科大守卫战", 74, 112, "46px Microsoft YaHei", "#ffffff", "left", "bold");
  fillText("红专并进，理实交融。用高数、实验与咖啡守住校园核心。", 78, 166, "15px Microsoft YaHei", "#dbe9ff");
  fillText("地图", 72, 258, "18px Microsoft YaHei", "#24436f", "left", "bold");
  MAPS.forEach((map, idx) => {
    const x = 72 + idx * 255;
    const y = 292;
    ctx.fillStyle = idx === mapIndex ? "#e6f0ff" : "#ffffff";
    ctx.strokeStyle = idx === mapIndex ? "#2f66d0" : "#c8d7ee";
    ctx.lineWidth = 2;
    ctx.fillRect(x, y, 220, 110);
    ctx.strokeRect(x, y, 220, 110);
    fillText(map.name, x + 18, y + 30, "17px Microsoft YaHei", "#16345f", "left", "bold");
    wrapText(map.subtitle, x + 18, y + 64, 180, 18, "10px Microsoft YaHei", "#53657d");
    fillText(idx === mapIndex ? "已选择" : "右侧选择", x + 18, y + 96, "10px Microsoft YaHei", "#1d4f9f", "left", "bold");
  });
  fillText("已实现内容：建造/升级/出售、10 波敌人、随机强化、三张校园地图、局外成长、战绩保存。", 72, 452, "12px Microsoft YaHei", "#384d68");
  fillText(`历史最佳：第 ${save.bestWave || 0} 波    学分：${save.credits || 0}    浏览器存档：LocalStorage`, 72, 486, "11px Microsoft YaHei", "#53657d");
  fillText(noticeText, 72, 516, "10px Microsoft YaHei", "#1d4f9f", "left", "bold");
  drawHistoryOnCanvas(760, 255);
}

function drawGrowthScreen() {
  ctx.fillStyle = "#f3f7ff";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = "#1d4f9f";
  ctx.fillRect(0, 0, WIDTH, 140);
  fillText("局外成长", 72, 54, "36px Microsoft YaHei", "#ffffff", "left", "bold");
  fillText("用每局结算获得的学分，解锁新塔、选择初始天赋，并装配芯片影响下一局。", 74, 104, "13px Microsoft YaHei", "#dbe9ff");
  fillText(noticeText, 72, 158, "11px Microsoft YaHei", "#1d4f9f", "left", "bold");
  drawGrowthOnCanvas(72, 190);
}

function drawGame() {
  ctx.fillStyle = "#edf4ff";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  drawMap();
  drawPanel();
  drawEntities();
}

function drawMap() {
  const map = state.map;
  ctx.fillStyle = "#f8fbff";
  ctx.strokeStyle = "#c9d9ef";
  ctx.lineWidth = 2;
  ctx.fillRect(18, 18, MAP_W - 36, HEIGHT - 36);
  ctx.strokeRect(18, 18, MAP_W - 36, HEIGHT - 36);
  fillText(map.name, 38, 42, "20px Microsoft YaHei", "#16345f", "left", "bold");
  fillText(map.subtitle, 38, 68, "10px Microsoft YaHei", "#6a7890");
  for (const [name, x, y] of map.landmarks) {
    ctx.fillStyle = "#e8f1ff";
    ctx.strokeStyle = "#b8c9e5";
    ctx.fillRect(x - 45, y - 22, 90, 44);
    ctx.strokeRect(x - 45, y - 22, 90, 44);
    fillText(name, x, y + 4, "9px Microsoft YaHei", "#315b91", "center", "bold");
  }
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (let i = 0; i < state.path.length - 1; i += 1) {
    ctx.strokeStyle = "#d7b56d";
    ctx.lineWidth = 28;
    line(state.path[i], state.path[i + 1]);
    ctx.strokeStyle = "#f3d998";
    ctx.lineWidth = 18;
    line(state.path[i], state.path[i + 1]);
  }
  fillText("入口", state.path[0][0] + 4, state.path[0][1] - 34, "10px Microsoft YaHei", "#24436f", "center", "bold");
  const end = state.path[state.path.length - 1];
  fillText("校园核心", end[0] - 12, end[1] - 34, "10px Microsoft YaHei", "#24436f", "center", "bold");
  state.slots.forEach((slot, idx) => drawSlot(slot, idx));
}

function drawSlot(slot, idx) {
  const selected = state.selectedSlot === idx;
  ctx.beginPath();
  if (slot.tower) {
    const tower = slot.tower;
    ctx.arc(slot.x, slot.y, 20, 0, Math.PI * 2);
    ctx.fillStyle = TOWERS[tower.kind].color;
    ctx.fill();
    ctx.strokeStyle = "#112233";
    ctx.lineWidth = 2;
    ctx.stroke();
    fillText(String(tower.level), slot.x, slot.y + 5, "13px Arial", "#ffffff", "center", "bold");
    if (selected) {
      const range = towerStat(tower, "range") * state.mods.range;
      ctx.beginPath();
      ctx.arc(slot.x, slot.y, range, 0, Math.PI * 2);
      ctx.strokeStyle = "#6686bd";
      ctx.setLineDash([5, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    return;
  }
  ctx.arc(slot.x, slot.y, 18, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.strokeStyle = selected ? "#2f66d0" : "#9db3d4";
  ctx.lineWidth = 2;
  ctx.stroke();
  fillText("+", slot.x, slot.y + 7, "18px Arial", ctx.strokeStyle, "center", "bold");
}

function drawEntities() {
  for (const enemy of state.enemies) {
    const [x, y] = pointAt(enemy.progress);
    const data = ENEMIES[enemy.kind];
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, Math.PI * 2);
    ctx.fillStyle = data.color;
    ctx.fill();
    ctx.strokeStyle = "#3c3c3c";
    ctx.stroke();
    fillText(data.name, x, y - 22, "8px Microsoft YaHei", "#25364d", "center");
    ctx.fillStyle = "#e7e7e7";
    ctx.fillRect(x - 17, y + 15, 34, 5);
    ctx.fillStyle = "#d83b3b";
    ctx.fillRect(x - 17, y + 15, 34 * Math.max(0, enemy.hp / enemy.maxHp), 5);
  }
  for (const projectile of state.projectiles) {
    ctx.strokeStyle = projectile.color;
    ctx.lineWidth = 3;
    line([projectile.x, projectile.y], [projectile.tx, projectile.ty]);
  }
  for (const floater of state.floating) {
    fillText(floater.text, floater.x, floater.y, "10px Microsoft YaHei", floater.color, "center", "bold");
  }
}

function drawPanel() {
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#d8e2f2";
  ctx.fillRect(PANEL_X, 0, WIDTH - PANEL_X, HEIGHT);
  ctx.strokeRect(PANEL_X, 0, WIDTH - PANEL_X, HEIGHT);
  fillText("战斗状态", PANEL_X + 24, 34, "18px Microsoft YaHei", "#183b67", "left", "bold");
  const rows = [["生命", state.life], ["资源", state.resources], ["波次", `${state.wave}/${state.maxWaves}`], ["击败", state.kills], ["得分", state.score]];
  rows.forEach(([label, value], idx) => {
    const y = 74 + idx * 36;
    fillText(label, PANEL_X + 28, y, "10px Microsoft YaHei", "#65748a");
    fillText(String(value), WIDTH - 36, y, "14px Microsoft YaHei", "#183b67", "right", "bold");
  });
  fillText("强化", PANEL_X + 24, 344, "15px Microsoft YaHei", "#183b67", "left", "bold");
  if (state.chosenMods.length) {
    state.chosenMods.slice(-6).forEach((mod, idx) => fillText(`• ${mod}`, PANEL_X + 28, 376 + idx * 25, "10px Microsoft YaHei", "#4e6078"));
  } else {
    fillText("每波结束后选择 1 个。", PANEL_X + 28, 376, "10px Microsoft YaHei", "#6f7d90");
  }
  fillText("局外加成", PANEL_X + 24, 500, "15px Microsoft YaHei", "#183b67", "left", "bold");
  fillText(`天赋：${TALENTS[save.talent][0]}`, PANEL_X + 28, 530, "10px Microsoft YaHei", "#4e6078");
  fillText(`芯片：${CHIPS[save.chip][0]}`, PANEL_X + 28, 552, "10px Microsoft YaHei", "#4e6078");
  fillText("提示", PANEL_X + 24, 590, "15px Microsoft YaHei", "#183b67", "left", "bold");
  wrapText(state.messageTimer > 0 ? state.message : "点击空塔位建造；点击已有塔升级或出售。", PANEL_X + 24, 622, 250, 18, "10px Microsoft YaHei", "#4e6078");
}

function drawHistoryOnCanvas(x, y) {
  fillText("最近战绩", x, y, "18px Microsoft YaHei", "#24436f", "left", "bold");
  const history = [...save.history].slice(-5).reverse();
  if (!history.length) {
    fillText("暂无记录，先守一局。", x, y + 46, "11px Microsoft YaHei", "#6f7d90");
    return;
  }
  history.forEach((record, idx) => {
    const yy = y + 42 + idx * 58;
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#d7e1f2";
    ctx.fillRect(x, yy, 330, 46);
    ctx.strokeRect(x, yy, 330, 46);
    fillText(`${record.won ? "胜利" : "失败"} | ${record.map} | 第 ${record.wave} 波`, x + 12, yy + 17, "10px Microsoft YaHei", "#183b67", "left", "bold");
    fillText(`击败 ${record.kills}  得分 ${record.score}  学分 +${record.credits || 0}`, x + 12, yy + 34, "9px Microsoft YaHei", "#65748a");
  });
}

function drawGrowthOnCanvas(x, y) {
  fillText("局外成长", x, y, "18px Microsoft YaHei", "#24436f", "left", "bold");
  fillText(`可用学分 ${save.credits || 0}`, x + 118, y, "11px Microsoft YaHei", "#7a4b18", "left", "bold");
  Object.entries(UNLOCKS).forEach(([kind, [label, cost, desc]], idx) => {
    const xx = x + idx * 245;
    const yy = y + 28;
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#d7e1f2";
    ctx.fillRect(xx, yy, 225, 78);
    ctx.strokeRect(xx, yy, 225, 78);
    fillText(`${label} | ${save.unlocks.includes(kind) ? "已解锁" : `${cost} 学分`}`, xx + 12, yy + 20, "10px Microsoft YaHei", "#183b67", "left", "bold");
    wrapText(desc, xx + 12, yy + 42, 145, 15, "8px Microsoft YaHei", "#65748a");
  });
  fillText("初始天赋", x + 505, y, "15px Microsoft YaHei", "#24436f", "left", "bold");
  Object.entries(TALENTS).forEach(([key, [name, desc]], idx) => {
    const yy = y + 28 + idx * 27;
    fillText(`${save.talent === key ? "✓ " : ""}${name}`, x + 505, yy + 12, "10px Microsoft YaHei", "#183b67", "left", "bold");
    fillText(desc, x + 620, yy + 12, "8px Microsoft YaHei", "#65748a");
  });
  fillText("芯片装配", x + 505, y + 112, "15px Microsoft YaHei", "#24436f", "left", "bold");
  Object.entries(CHIPS).forEach(([key, [name, desc, cost]], idx) => {
    const xx = x + 505 + (idx % 2) * 190;
    const yy = y + 140 + Math.floor(idx / 2) * 50;
    const owned = key === "none" || save.chips.includes(key);
    const tag = save.chip === key ? "已装" : (owned ? "可选" : `${cost} 学分`);
    fillText(tag, xx, yy + 12, "9px Microsoft YaHei", "#2f66d0", "left", "bold");
    fillText(name, xx + 74, yy + 8, "9px Microsoft YaHei", "#183b67", "left", "bold");
    fillText(desc, xx + 74, yy + 24, "8px Microsoft YaHei", "#65748a");
  });
}

function fillText(text, x, y, font, color, align = "left", weight = "") {
  ctx.font = weight ? `${weight} ${font}` : font;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = "alphabetic";
  ctx.fillText(text, x, y);
}

function wrapText(text, x, y, maxWidth, lineHeight, font, color) {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = "left";
  const chars = String(text).split("");
  let line = "";
  let yy = y;
  for (const char of chars) {
    const test = line + char;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, yy);
      line = char;
      yy += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, yy);
}

function line(a, b) {
  ctx.beginPath();
  ctx.moveTo(a[0], a[1]);
  ctx.lineTo(b[0], b[1]);
  ctx.stroke();
}

function showChoiceOverlay() {
  overlay.innerHTML = `<h2>第 ${state.choosingAfterWave} 波结束，选择随机强化</h2><div class="choice-grid"></div>`;
  const grid = overlay.querySelector(".choice-grid");
  state.choices.forEach(([title, desc], idx) => {
    const item = document.createElement("div");
    item.className = "choice";
    item.innerHTML = `<h3>${title}</h3><p>${desc}</p>`;
    const button = document.createElement("button");
    button.textContent = "选择";
    button.onclick = () => chooseEnhancement(idx);
    item.appendChild(button);
    grid.appendChild(item);
  });
  overlay.classList.remove("hidden");
}

function showPauseOverlay() {
  overlay.innerHTML = `<h2>已暂停</h2><p>点击继续或按空格恢复</p><div class="choice-grid"><button id="resumeBtn">继续</button><button id="againBtn">重新开始</button><button id="backBtn">主菜单</button></div>`;
  overlay.querySelector("#resumeBtn").onclick = togglePause;
  overlay.querySelector("#againBtn").onclick = startGame;
  overlay.querySelector("#backBtn").onclick = toMenu;
  overlay.classList.remove("hidden");
}

function showResultOverlay(won) {
  const mods = state.chosenMods.length ? state.chosenMods.join("、") : "无";
  overlay.innerHTML = `<h2>${won ? "守卫成功" : "防线失守"}</h2><p>存活到第 ${state.wave} 波 | 击败 ${state.kills} | 得分 ${state.score}</p><p>本局强化：${mods}</p><div class="choice-grid"><button id="againBtn">再来一局</button><button id="backBtn">主菜单</button></div>`;
  overlay.querySelector("#againBtn").onclick = startGame;
  overlay.querySelector("#backBtn").onclick = toMenu;
  overlay.classList.remove("hidden");
}

function renderSidebar() {
  renderMaps();
  renderGrowthPanel();
  renderHistory();
  updateStats();
  ui.notice.textContent = noticeText;
  ui.pauseBtn.textContent = state.mode === "paused" ? "继续" : "暂停";
}

function renderMaps() {
  ui.mapList.innerHTML = "";
  const locked = isBattleActive();
  MAPS.forEach((map, idx) => {
    const card = document.createElement("div");
    card.className = `map-card${idx === mapIndex ? " selected" : ""}`;
    card.innerHTML = `<h3>${map.name}</h3><p>${map.subtitle}</p>`;
    const button = document.createElement("button");
    button.textContent = locked ? "战斗中" : (idx === mapIndex ? "已选择" : "选择");
    button.disabled = locked || idx === mapIndex;
    button.onclick = () => setMap(idx);
    card.appendChild(button);
    ui.mapList.appendChild(card);
  });
}

function renderGrowthPanel() {
  ui.growthPanel.innerHTML = "";
  const locked = isBattleActive();
  Object.entries(UNLOCKS).forEach(([kind, [label, cost, desc]]) => {
    const owned = save.unlocks.includes(kind);
    const card = document.createElement("div");
    card.className = `growth-card${owned ? " selected" : ""}`;
    card.innerHTML = `<h3>${label} | ${owned ? "已解锁" : `${cost} 学分`}</h3><p>${desc}</p>`;
    if (!owned) {
      const button = document.createElement("button");
      button.textContent = locked ? "战斗中不可操作" : "解锁";
      button.disabled = locked;
      button.onclick = () => unlockItem(kind);
      card.appendChild(button);
    }
    ui.growthPanel.appendChild(card);
  });
  Object.entries(TALENTS).forEach(([key, [name, desc]]) => {
    const card = document.createElement("div");
    card.className = `growth-card${save.talent === key ? " selected" : ""}`;
    card.innerHTML = `<h3>${save.talent === key ? "✓ " : ""}${name}</h3><p>${desc}</p>`;
    const button = document.createElement("button");
    button.textContent = locked ? "战斗中不可操作" : (save.talent === key ? "已选择" : "选择天赋");
    button.disabled = locked || save.talent === key;
    button.onclick = () => selectTalent(key);
    card.appendChild(button);
    ui.growthPanel.appendChild(card);
  });
  Object.entries(CHIPS).forEach(([key, [name, desc, cost]]) => {
    const owned = key === "none" || save.chips.includes(key);
    const selected = save.chip === key;
    const card = document.createElement("div");
    card.className = `growth-card${selected ? " selected" : ""}`;
    card.innerHTML = `<h3>${selected ? "✓ " : ""}${name}</h3><p>${desc}${owned ? "" : `，购买需要 ${cost} 学分`}</p>`;
    const button = document.createElement("button");
    button.textContent = locked ? "战斗中不可操作" : (selected ? "已装配" : (owned ? "装配" : "购买并装配"));
    button.disabled = locked || selected;
    button.onclick = () => selectChip(key);
    card.appendChild(button);
    ui.growthPanel.appendChild(card);
  });
}

function renderHistory() {
  ui.history.innerHTML = "";
  const history = [...save.history].slice(-5).reverse();
  if (!history.length) {
    ui.history.innerHTML = `<p>暂无记录，先守一局。</p>`;
    return;
  }
  history.forEach(record => {
    const card = document.createElement("div");
    card.className = "history-card";
    card.innerHTML = `<h3>${record.won ? "胜利" : "失败"} | ${record.map} | 第 ${record.wave} 波</h3><p>击败 ${record.kills}，得分 ${record.score}，学分 +${record.credits || 0}</p>`;
    ui.history.appendChild(card);
  });
}

function updateStats() {
  ui.life.textContent = state.life;
  ui.resource.textContent = state.resources;
  ui.wave.textContent = `${state.wave}/${state.maxWaves}`;
  ui.kills.textContent = state.kills;
  ui.score.textContent = state.score;
  ui.credits.textContent = save.credits || 0;
  ui.mods.innerHTML = state.chosenMods.length ? state.chosenMods.slice(-6).map(mod => `<li>${mod}</li>`).join("") : "<li>暂无，波次结束后选择。</li>";
}

canvas.addEventListener("click", event => {
  if (state.mode !== "running") return;
  const rect = canvas.getBoundingClientRect();
  const x = (event.clientX - rect.left) * (canvas.width / rect.width);
  const y = (event.clientY - rect.top) * (canvas.height / rect.height);
  const idx = state.slots.findIndex(slot => distance([x, y], [slot.x, slot.y]) <= 24);
  if (idx < 0) {
    state.selectedSlot = null;
    panel.classList.add("hidden");
    return;
  }
  state.selectedSlot = idx;
  showSlotPanel(state.slots[idx], event.clientX - rect.left + 10, event.clientY - rect.top + 10);
});

function showSlotPanel(slot, x, y) {
  panel.style.left = `${Math.min(x, canvas.clientWidth - 300)}px`;
  panel.style.top = `${Math.min(y, canvas.clientHeight - 180)}px`;
  if (!slot.tower) {
    panel.innerHTML = `<h3>建造防御塔</h3><div class="grid"></div>`;
    const grid = panel.querySelector(".grid");
    Object.entries(TOWERS).forEach(([kind, data]) => {
      const button = document.createElement("button");
      const unlocked = save.unlocks.includes(kind);
      button.textContent = unlocked ? `${data.name} ${data.cost}` : `${data.name} 未解锁`;
      button.onclick = () => buildTower(slot, kind);
      grid.appendChild(button);
    });
  } else {
    const tower = slot.tower;
    const data = TOWERS[tower.kind];
    panel.innerHTML = `<h3>${data.name} Lv.${tower.level}</h3><p>${data.desc}</p><div class="grid"></div>`;
    const grid = panel.querySelector(".grid");
    if (tower.level < 3) {
      const up = document.createElement("button");
      up.textContent = `升级 ${upgradeCost(tower)}`;
      up.onclick = () => upgradeTower(slot);
      grid.appendChild(up);
    } else {
      const full = document.createElement("button");
      full.textContent = "已满级";
      full.disabled = true;
      grid.appendChild(full);
    }
    const sell = document.createElement("button");
    sell.textContent = `出售 +${Math.trunc(tower.spent * 0.5)}`;
    sell.onclick = () => sellTower(slot);
    grid.appendChild(sell);
  }
  panel.classList.remove("hidden");
}

ui.startBtn.onclick = startGame;
ui.restartBtn.onclick = startGame;
ui.menuBtn.onclick = toMenu;
ui.growthBtn.onclick = toGrowth;
ui.pauseBtn.onclick = togglePause;
ui.resetSaveBtn.onclick = () => {
  if (!confirm("确定要重置 Web 版本地存档吗？")) return;
  localStorage.removeItem(SAVE_KEY);
  save = loadSave();
  state = resetRun("menu");
  setNotice("Web 版本地存档已重置。");
  renderSidebar();
};

document.addEventListener("keydown", event => {
  if (event.code === "Space") {
    event.preventDefault();
    togglePause();
  }
  if (event.code === "Escape") {
    state.selectedSlot = null;
    panel.classList.add("hidden");
  }
});

let last = performance.now();

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  update(dt);
  draw();
  requestAnimationFrame(frame);
}

renderSidebar();
requestAnimationFrame(frame);
