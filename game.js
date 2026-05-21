const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const buildPanel = document.getElementById("buildPanel");
const screenOverlay = document.getElementById("screenOverlay");
const hud = document.getElementById("hud");
const hotbar = document.getElementById("hotbar");

const ui = {
  life: document.getElementById("life"),
  resource: document.getElementById("resource"),
  wave: document.getElementById("wave"),
  kills: document.getElementById("kills"),
  score: document.getElementById("score"),
  credits: document.getElementById("credits"),
  pauseBtn: document.getElementById("pauseBtn"),
  abortBtn: document.getElementById("abortBtn"),
};

const WIDTH = 1180;
const HEIGHT = 720;
const SAVE_KEY = "ustc_guardian_web_v2";
const THEME_GREEN = "#34d399";
const THEME_ROSE = "#f43f5e";
const THEME_BLUE = "#38bdf8";

const TOWERS = {
  math: { name: "高数塔", role: "高伤单体", cost: 45, damage: 42, range: 128, cooldown: 1.05, color: "#38bdf8", desc: "单体高伤，适合处理厚血目标。" },
  physics: { name: "物理塔", role: "快速单体", cost: 38, damage: 22, range: 118, cooldown: 0.48, color: "#34d399", desc: "攻速快，稳定清理作业怪和 DDL。" },
  lab: { name: "实验塔", role: "范围溅射", cost: 58, damage: 26, range: 108, cooldown: 1.25, splash: 52, color: "#a78bfa", desc: "命中后爆炸，对小范围敌人造成伤害。" },
  coffee: { name: "咖啡塔", role: "减速产能", cost: 42, damage: 8, range: 112, cooldown: 0.75, slow: 0.35, incomeCd: 7, color: "#fbbf24", desc: "降低敌人速度，并周期产出少量资源。" },
};

const ENEMIES = {
  homework: { name: "作业怪", hp: 54, speed: 70, reward: 8, damage: 1, color: "#f97316" },
  ddl: { name: "DDL 怪", hp: 38, speed: 112, reward: 10, damage: 1, color: "#ef4444", blink: true },
  report: { name: "实验报告怪", hp: 128, speed: 48, reward: 16, damage: 2, armor: 5, firstHitHalf: true, color: "#10b981" },
  ppt: { name: "PPT 怪", hp: 82, speed: 64, reward: 14, damage: 1, split: true, color: "#eab308" },
  bug: { name: "Bug 幼虫", hp: 42, speed: 102, reward: 12, damage: 1, stealth: 1, color: "#6366f1" },
};

const MAPS = [
  {
    name: "东区一教", subtitle: "从教学楼迷雾到校园核心", accent: "#38bdf8",
    landmarks: [["东区一教", 160, 120], ["图书馆", 620, 140], ["郭沫若广场", 720, 560]],
    path: [[40, 360], [200, 360], [200, 200], [420, 200], [420, 500], [680, 500], [680, 320], [1140, 320]],
    slots: [[140, 280], [280, 270], [350, 420], [520, 140], [550, 580], [760, 420], [820, 240], [920, 500]],
  },
  {
    name: "图书馆长廊", subtitle: "书架之间的 DDL 潮汐", accent: "#34d399",
    landmarks: [["西区图书馆", 200, 140], ["少年班学院", 600, 120], ["自习区", 700, 580]],
    path: [[40, 240], [260, 240], [260, 560], [500, 560], [500, 180], [780, 180], [780, 440], [1140, 440]],
    slots: [[150, 160], [160, 360], [340, 480], [400, 280], [620, 120], [640, 340], [860, 280], [900, 540]],
  },
  {
    name: "郭沫若广场", subtitle: "开阔广场上的课程怪物绕行", accent: "#a78bfa",
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
  shield: ["校园护盾", "防线初始生命上限提升 5 点"],
  scholarship: ["特等奖学金", "结算时获得的学分额外提升 15%"],
};

const CHIPS = {
  none: ["未装配", "无外部运算加成", 0],
  amp: ["输出强化芯片", "防御塔基础伤害提升 8%", 80],
  clock: ["超频时钟芯片", "防御塔攻击速率加快 8%", 80],
  survey: ["量子测绘芯片", "防御塔攻击信道范围扩大 8%", 80],
};

const WAVE_TABLE = [
  repeat("homework", 8),
  [...repeat("homework", 7), ...repeat("ddl", 4)],
  [...repeat("report", 3), ...repeat("homework", 8)],
  [...repeat("ddl", 8), ...repeat("homework", 6)],
  [...repeat("ppt", 4), ...repeat("homework", 8)],
];

let save = loadSave();
let mapIndex = 0;
let state = { mode: "menu" };
let hotKeySelectedTower = null;
let inspectedTowerKind = null;

function repeat(value, count) {
  return Array.from({ length: count }, () => value);
}

function loadSave() {
  let loaded = {};
  try {
    loaded = JSON.parse(localStorage.getItem(SAVE_KEY) || "{}");
  } catch (_e) {
    loaded = {};
  }
  const credits = Number(loaded.credits);
  return {
    history: Array.isArray(loaded.history) ? loaded.history : [],
    bestWave: Number.isFinite(Number(loaded.bestWave)) ? Math.trunc(Number(loaded.bestWave)) : 0,
    credits: Number.isFinite(credits) ? Math.trunc(credits) : 0,
    unlocks: Array.from(new Set([...(Array.isArray(loaded.unlocks) ? loaded.unlocks : ["math", "physics"]), "math", "physics"])),
    talent: loaded.talent in TALENTS ? loaded.talent : "starter",
    chip: loaded.chip in CHIPS ? loaded.chip : "none",
    chips: Array.isArray(loaded.chips) ? loaded.chips.filter(key => key in CHIPS && key !== "none") : [],
  };
}

function writeSave() {
  localStorage.setItem(SAVE_KEY, JSON.stringify(save));
}

function resetRun() {
  const map = MAPS[mapIndex];
  const run = {
    mode: "running",
    map,
    slots: map.slots.map(([x, y]) => ({ x, y, tower: null })),
    enemies: [],
    projectiles: [],
    floating: [],
    life: save.talent === "shield" ? 25 : 20,
    resources: save.talent === "starter" ? 120 : 100,
    wave: 0,
    maxWaves: WAVE_TABLE.length,
    kills: 0,
    score: 0,
    spawnQueue: [],
    spawnTimer: 0,
    waveWait: 2.0,
    selectedSlot: null,
    mods: { damage: 1, speed: 1, range: 1, killBonus: 0, globalSlow: 0 },
    chosenMods: [],
    choices: [],
    resultSaved: false,
    lastCredits: 0,
  };
  if (save.chip === "amp") run.mods.damage += 0.08;
  if (save.chip === "clock") run.mods.speed += 0.08;
  if (save.chip === "survey") run.mods.range += 0.08;
  return run;
}

function switchOverlay(mode) {
  state.mode = mode;
  if (mode === "running") {
    screenOverlay.classList.add("hidden");
    hud.classList.remove("hidden");
    hotbar.classList.remove("hidden");
    updateHud();
    return;
  }

  buildPanel.classList.add("hidden");
  hud.classList.add("hidden");
  hotbar.classList.add("hidden");
  screenOverlay.classList.remove("hidden");

  if (mode === "menu") renderMainMenu();
  else if (mode === "growth") renderGrowthMenu();
  else if (mode === "choosing") renderEnhancementMenu();
  else if (mode === "gameover" || mode === "victory") renderResultMenu(mode === "victory");
  else if (mode === "paused") renderPauseMenu();
}

function renderMainMenu() {
  const historyHtml = [...save.history].reverse().slice(0, 4).map(r => `
    <div class="history-item ${r.won ? "win" : "lose"}">
      <div class="meta"><span>${r.won ? "守卫成功" : "防线失守"}</span><span>第 ${r.wave} 波</span></div>
      <div style="color:var(--text-muted); font-size:11px;">积分: ${r.score} | 学分: +${r.credits}</div>
    </div>
  `).join("") || '<p style="color:var(--text-muted); font-size:13px;">暂无校园守卫记录。</p>';

  const mapsHtml = MAPS.map((map, idx) => `
    <div class="map-node ${idx === mapIndex ? "active" : ""}" onclick="selectMapNode(${idx})">
      <h3>${map.name}</h3>
      <p>${map.subtitle}</p>
      ${idx === mapIndex ? '<span class="map-tag">已选定</span>' : ""}
    </div>
  `).join("");

  screenOverlay.innerHTML = `
    <div class="menu-layout">
      <div class="menu-main">
        <div class="brand">
          <p class="eyebrow">USTC Roguelike TD</p>
          <h1>科大守卫战</h1>
          <p class="subtitle">红专并进，理实交融。部署高数与实验防线，用学术咖啡守住核心校园。</p>
        </div>
        <h2 style="margin-top:20px;">选择前线区域</h2>
        <div class="map-deck">${mapsHtml}</div>
        <div class="action-row">
          <button class="prime-btn" onclick="startBattle()">正式出战</button>
          <button class="sub-btn" style="margin-top:32px;" onclick="switchOverlay('growth')">进入局外成长</button>
        </div>
      </div>
      <div class="menu-sidebar">
        <div class="sidebar-title">学术教务档案</div>
        <div style="margin-bottom:20px; font-size:14px;">可用学术学分: <strong style="color:var(--theme-blue); font-size:18px;">${save.credits}</strong></div>
        <div class="sidebar-title">近期守卫战绩</div>
        <div class="history-stream">${historyHtml}</div>
        <button class="sub-btn" style="margin-top:16px; font-size:11px; color:var(--theme-rose);" onclick="resetAllSaves()">重置全部档案</button>
      </div>
    </div>
  `;
}

function renderGrowthMenu() {
  const unlocksHtml = Object.entries(UNLOCKS).map(([kind, [label, cost, desc]]) => {
    const owned = save.unlocks.includes(kind);
    return `
      <div class="shelf-card ${owned ? "selected" : ""}">
        <div class="info"><h4>${label}</h4><p>${desc}</p></div>
        ${owned ? '<span style="color:var(--theme-green); font-size:13px; font-weight:600;">已编入</span>' : `<button class="hud-btn" onclick="buyUnlock('${kind}', ${cost})">${cost} 学分解锁</button>`}
      </div>
    `;
  }).join("");

  const talentsHtml = Object.entries(TALENTS).map(([key, [name, desc]]) => {
    const active = save.talent === key;
    return `
      <div class="shelf-card ${active ? "selected" : ""}" onclick="setTalent('${key}')" style="cursor:pointer;">
        <div class="info"><h4>${active ? "✓ " : ""}${name}</h4><p>${desc}</p></div>
      </div>
    `;
  }).join("");

  const chipsHtml = Object.entries(CHIPS).map(([key, [name, desc, cost]]) => {
    const owned = key === "none" || save.chips.includes(key);
    const active = save.chip === key;
    return `
      <div class="shelf-card ${active ? "selected" : ""}">
        <div class="info"><h4>${active ? "⬢ " : ""}${name}</h4><p>${desc}</p></div>
        ${active ? '<span style="color:var(--theme-blue); font-size:12px;">已装配</span>' : (owned ? `<button class="hud-btn" onclick="equipChip('${key}')">装配</button>` : `<button class="hud-btn" onclick="buyChip('${key}', ${cost})">${cost} 学分</button>`)}
      </div>
    `;
  }).join("");

  screenOverlay.innerHTML = `
    <div class="brand">
      <p class="eyebrow">研究所后勤保障</p>
      <h1>科研课题与局外成长</h1>
      <p class="subtitle">花费在防线守卫中提取的学分，对课题组设备进行更新，可永久影响后续战局。</p>
    </div>
    <div class="growth-grid">
      <div class="growth-section">
        <div class="section-head"><span>特种防线架构解锁</span><span class="currency-badge">剩余学分: ${save.credits}</span></div>
        <div class="item-shelf">${unlocksHtml}</div>
        <div class="section-head" style="margin-top:24px;"><span>研究人员初始资质 (选择一项)</span></div>
        <div class="item-shelf">${talentsHtml}</div>
      </div>
      <div class="growth-section">
        <div class="section-head"><span>计算芯片装配中心</span></div>
        <div class="item-shelf">${chipsHtml}</div>
      </div>
    </div>
    <div class="action-row">
      <button class="prime-btn" onclick="switchOverlay('menu')">保存并返回主菜单</button>
    </div>
  `;
}

function renderEnhancementMenu() {
  const choicesHtml = state.choices.map(([title, desc], idx) => `
    <div class="choice-box" onclick="pickEnhancement(${idx})">
      <h3>${title}</h3>
      <p>${desc}</p>
      <button class="prime-btn" style="margin-top:0; width:100px; padding:8px 0; font-size:12px;">注入</button>
    </div>
  `).join("");

  screenOverlay.innerHTML = `
    <div class="brand" style="text-align:center;">
      <p class="eyebrow">第 ${state.choosingAfterWave} 波攻防闭幕</p>
      <h1 style="background: linear-gradient(120deg, #fff, var(--theme-purple)); -webkit-background-clip: text;">提取突破性科研强化</h1>
      <p class="subtitle">请选择一项核心突破，该加成在当前战局内将永久叠加生效。</p>
    </div>
    <div class="choice-deck">${choicesHtml}</div>
  `;
}

function renderPauseMenu() {
  screenOverlay.innerHTML = `
    <div style="margin: auto; text-align:center; max-width:400px;">
      <h1 style="font-size:36px; margin-bottom:24px;">战局已暂停</h1>
      <div class="item-shelf" style="gap:16px;">
        <button class="prime-btn" style="width:100%; margin:0;" onclick="resumeBattle()">回到防线</button>
        <button class="sub-btn" style="width:100%;" onclick="startBattle()">重构本局防线 (重开)</button>
        <button class="sub-btn" style="width:100%; color:var(--theme-rose);" onclick="switchOverlay('menu')">放弃并返回主菜单</button>
      </div>
    </div>
  `;
}

function renderResultMenu(won) {
  const mods = state.chosenMods.length ? state.chosenMods.join(" 、 ") : "无核心突破";
  const credits = state.lastCredits || calculateCredits(won);
  screenOverlay.innerHTML = `
    <div style="margin: auto; text-align:center; max-width:600px;">
      <p class="eyebrow">${won ? "SUCCESS GUARDIAN" : "防线溃缩"}</p>
      <h1 style="font-size:48px; background:linear-gradient(135deg, #fff, ${won ? "var(--theme-green)" : "var(--theme-rose)"}); -webkit-background-clip:text;">${won ? "课题组防线坚固如初" : "已被 DDL 怪潮淹没"}</h1>
      <p class="subtitle" style="margin-bottom:32px;">最终结算报告已提交教务系统</p>
      <div class="growth-grid" style="grid-template-columns:1fr; margin-bottom:32px;">
        <div class="growth-section" style="text-align:left; font-size:14px; line-height:2;">
          <div>阻击波次: <strong style="color:#fff;">${state.wave} / ${state.maxWaves}</strong></div>
          <div>湮灭课程怪: <strong style="color:#fff;">${state.kills}</strong></div>
          <div>最终安全系数积分: <strong style="color:var(--theme-blue);">${state.score}</strong></div>
          <div>教务评定学术学分: <strong style="color:var(--theme-amber);">+${credits} 学分</strong></div>
          <div style="margin-top:8px; color:var(--text-muted); font-size:12px;">本局研发记录: ${mods}</div>
        </div>
      </div>
      <div class="action-row" style="justify-content:center;">
        <button class="prime-btn" style="margin:0;" onclick="startBattle()">再组一局科研课题</button>
        <button class="sub-btn" onclick="switchOverlay('menu')">回到教务主页</button>
      </div>
    </div>
  `;
}

function selectMapNode(idx) {
  mapIndex = idx;
  renderMainMenu();
}

function startBattle() {
  state = resetRun();
  hotKeySelectedTower = null;
  renderHotbar();
  switchOverlay("running");
}

function resumeBattle() {
  state.mode = "running";
  screenOverlay.classList.add("hidden");
  hud.classList.remove("hidden");
  hotbar.classList.remove("hidden");
  updateHud();
}

function togglePause() {
  if (state.mode === "running") switchOverlay("paused");
  else if (state.mode === "paused") resumeBattle();
}

function buyUnlock(kind, cost) {
  if (save.credits >= cost && !save.unlocks.includes(kind)) {
    save.credits -= cost;
    save.unlocks.push(kind);
    writeSave();
    renderGrowthMenu();
  }
}

function setTalent(key) {
  save.talent = key;
  writeSave();
  renderGrowthMenu();
}

function equipChip(key) {
  save.chip = key;
  writeSave();
  renderGrowthMenu();
}

function buyChip(key, cost) {
  if (save.credits >= cost && !save.chips.includes(key)) {
    save.credits -= cost;
    save.chips.push(key);
    save.chip = key;
    writeSave();
    renderGrowthMenu();
  }
}

function pickEnhancement(idx) {
  const [title, _desc, action] = state.choices[idx];
  action();
  state.chosenMods.push(title);
  resumeBattle();
  nextWave();
}

function resetAllSaves() {
  if (confirm("确定清空全部本地档案吗？")) {
    localStorage.removeItem(SAVE_KEY);
    save = loadSave();
    renderMainMenu();
  }
}

function renderHotbar() {
  const slotsContainer = hotbar.querySelector(".hotbar-slots");
  slotsContainer.innerHTML = "";
  let bindIdx = 1;
  Object.entries(TOWERS).forEach(([kind, data]) => {
    if (!save.unlocks.includes(kind)) return;
    const item = document.createElement("div");
    item.className = `hotbar-item ${hotKeySelectedTower === kind ? "selected" : ""} ${inspectedTowerKind === kind ? "inspecting" : ""}`;
    item.innerHTML = `
      <span class="cost">${data.cost}</span>
      <div style="width:12px; height:12px; border-radius:50%; background:${data.color}"></div>
      <span class="name">${data.name}</span>
      <span class="key-bind">${bindIdx}</span>
    `;
    item.onclick = () => {
      hotKeySelectedTower = hotKeySelectedTower === kind ? null : kind;
      renderHotbar();
    };
    item.oncontextmenu = event => {
      event.preventDefault();
      inspectedTowerKind = inspectedTowerKind === kind ? null : kind;
      renderHotbar();
      if (inspectedTowerKind) showTowerInspectBubble(kind);
      else buildPanel.classList.add("hidden");
    };
    slotsContainer.appendChild(item);
    bindIdx += 1;
  });
}

function nextWave() {
  state.wave += 1;
  const pattern = WAVE_TABLE[Math.min(state.wave - 1, WAVE_TABLE.length - 1)];
  state.spawnQueue = shuffle([...pattern]);
  state.spawnTimer = 0.2;
}

function update(dt) {
  if (state.mode !== "running") return;
  const now = performance.now() / 1000;
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
    saveResult(false);
    switchOverlay("gameover");
  } else if (!state.spawnQueue.length && !state.enemies.length && state.wave > 0) {
    if (state.wave >= state.maxWaves) {
      saveResult(true);
      switchOverlay("victory");
    } else {
      openEnhancements();
    }
  }
}

function updateSpawning(dt) {
  if (!state.spawnQueue.length) return;
  state.spawnTimer -= dt;
  if (state.spawnTimer <= 0) {
    const kind = state.spawnQueue.shift();
    state.enemies.push({
      kind,
      progress: 0,
      hp: ENEMIES[kind].hp,
      maxHp: ENEMIES[kind].hp,
      slowUntil: 0,
      slowFactor: 1,
      firstHit: true,
      born: performance.now() / 1000,
      blinkTimer: 3,
    });
    state.spawnTimer = Math.max(0.35, 0.85 - state.wave * 0.04);
  }
}

function updateEnemies(dt, now) {
  const survivors = [];
  const total = pathLength(state.map.path);
  for (const enemy of state.enemies) {
    const data = ENEMIES[enemy.kind];
    let speed = data.speed * (1 + state.wave * 0.04);
    if (now < enemy.slowUntil) speed *= enemy.slowFactor;
    enemy.blinkTimer -= dt;
    if (data.blink && enemy.blinkTimer <= 0) {
      enemy.blinkTimer = 3;
      if (Math.random() < 0.2) enemy.progress += 38;
    }
    enemy.progress += speed * dt;
    if (enemy.progress >= total) {
      state.life -= data.damage;
      const [x, y] = pointAt(total);
      state.floating.push({ x, y, text: `-${data.damage} HP`, color: THEME_ROSE, life: 0.8 });
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
    if (tower.kind === "coffee") {
      tower.incomeLeft -= dt;
      if (tower.incomeLeft <= 0) {
        const gain = 5 + tower.level * 2;
        state.resources += gain;
        tower.incomeLeft = TOWERS.coffee.incomeCd;
        state.floating.push({ x: tower.x, y: tower.y - 20, text: `+${gain}`, color: "#fbbf24", life: 0.8 });
      }
    }
    tower.cooldownLeft -= dt;
    if (tower.cooldownLeft > 0) continue;
    const target = findTarget(tower, now);
    if (!target) continue;
    tower.cooldownLeft = (TOWERS[tower.kind].cooldown * Math.pow(0.88, tower.level - 1)) / state.mods.speed;
    fireTower(tower, target, now);
  }
}

function fireTower(tower, target, now) {
  const targetPos = pointAt(target.progress);
  state.projectiles.push({ x: tower.x, y: tower.y, tx: targetPos[0], ty: targetPos[1], life: 0.15, color: TOWERS[tower.kind].color });
  const damage = TOWERS[tower.kind].damage * (1 + 0.28 * (tower.level - 1)) * state.mods.damage;
  if (tower.kind === "lab") {
    for (const enemy of [...state.enemies]) {
      if (distance(pointAt(enemy.progress), targetPos) <= TOWERS.lab.splash) damageEnemy(enemy, damage * 0.78);
    }
  } else {
    damageEnemy(target, damage);
  }
  const slow = (TOWERS[tower.kind].slow || 0) + state.mods.globalSlow;
  if (slow) {
    target.slowFactor = Math.max(0.3, 1 - slow);
    target.slowUntil = now + 1.8;
  }
}

function damageEnemy(enemy, amount) {
  const data = ENEMIES[enemy.kind];
  let finalDamage = amount;
  if (data.firstHitHalf && enemy.firstHit) {
    finalDamage *= 0.5;
    enemy.firstHit = false;
  }
  enemy.hp -= Math.max(1, finalDamage - (data.armor || 0));
  if (enemy.hp <= 0 && state.enemies.includes(enemy)) killEnemy(enemy);
}

function killEnemy(enemy) {
  state.enemies.splice(state.enemies.indexOf(enemy), 1);
  const reward = ENEMIES[enemy.kind].reward + state.mods.killBonus;
  state.resources += reward;
  state.kills += 1;
  state.score += reward * 4 + state.wave * 10;
  const [x, y] = pointAt(enemy.progress);
  state.floating.push({ x, y, text: `+${reward}`, color: THEME_GREEN, life: 0.8 });
  if (ENEMIES[enemy.kind].split) {
    for (const offset of [8, 18]) {
      state.enemies.push({
        kind: "homework",
        progress: enemy.progress + offset,
        hp: 24,
        maxHp: 24,
        slowUntil: 0,
        slowFactor: 1,
        firstHit: true,
        born: performance.now() / 1000,
        blinkTimer: 3,
      });
    }
  }
}

function findTarget(tower, now) {
  const range = TOWERS[tower.kind].range * (1 + 0.28 * (tower.level - 1)) * state.mods.range;
  const candidates = state.enemies.filter(e => {
    if (now - e.born <= (ENEMIES[e.kind].stealth || 0)) return false;
    const [x, y] = pointAt(e.progress);
    return distance([tower.x, tower.y], [x, y]) <= range;
  });
  return candidates.length ? candidates.reduce((a, b) => a.progress > b.progress ? a : b) : null;
}

function updateProjectiles(dt) {
  for (const p of state.projectiles) p.life -= dt;
  state.projectiles = state.projectiles.filter(p => p.life > 0);
}

function updateFloaters(dt) {
  for (const f of state.floating) {
    f.y -= 25 * dt;
    f.life -= dt;
  }
  state.floating = state.floating.filter(f => f.life > 0);
}

function openEnhancements() {
  state.mode = "choosing";
  state.choosingAfterWave = state.wave;
  state.choices = sample([
    ["学术经费增援", "立刻拨发 50 点前线调度资源", () => state.resources += 50],
    ["高能公式核定", "全防线炮塔基础伤害增幅 10%", () => state.mods.damage += 0.1],
    ["运算超频共振", "防线射击冷却间隔全面降低 10%", () => state.mods.speed += 0.1],
    ["全域学术视界", "全防线打击信道覆盖半径外扩 10%", () => state.mods.range += 0.1],
  ], 3);
  switchOverlay("choosing");
}

function saveResult(won) {
  if (state.resultSaved) return;
  state.resultSaved = true;
  const creds = calculateCredits(won);
  state.lastCredits = creds;
  save.history.push({ won, wave: state.wave, score: state.score, credits: creds });
  save.history = save.history.slice(-10);
  save.bestWave = Math.max(save.bestWave || 0, state.wave);
  save.credits += creds;
  writeSave();
}

function calculateCredits(won) {
  const c = Math.max(10, state.wave * 8 + (won ? 40 : 0));
  return save.talent === "scholarship" ? Math.trunc(c * 1.15) : c;
}

function draw() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  if (state.mode !== "running" && state.mode !== "paused") {
    ctx.fillStyle = "#111827";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    drawStarfield();
    return;
  }

  ctx.fillStyle = "#1e293b";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  drawGrid();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (let i = 0; i < state.map.path.length - 1; i += 1) {
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 32;
    line(state.map.path[i], state.map.path[i + 1]);
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 20;
    line(state.map.path[i], state.map.path[i + 1]);
    ctx.strokeStyle = `${state.map.accent}44`;
    ctx.lineWidth = 2;
    line(state.map.path[i], state.map.path[i + 1]);
  }

  state.slots.forEach((slot, idx) => {
    ctx.beginPath();
    ctx.arc(slot.x, slot.y, 22, 0, Math.PI * 2);
    if (slot.tower) {
      ctx.fillStyle = TOWERS[slot.tower.kind].color;
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "bold 12px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(slot.tower.level, slot.x, slot.y);
    } else {
      ctx.fillStyle = "rgba(255,255,255,0.05)";
      ctx.fill();
      ctx.strokeStyle = state.selectedSlot === idx ? THEME_BLUE : "rgba(255,255,255,0.2)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  });

  for (const e of state.enemies) {
    const [x, y] = pointAt(e.progress);
    const data = ENEMIES[e.kind];
    ctx.fillStyle = data.color;
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, Math.PI * 2);
    ctx.fill();
    const pct = Math.max(0, e.hp / e.maxHp);
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(x - 16, y - 20, 32, 4);
    ctx.fillStyle = pct < 0.35 ? THEME_ROSE : THEME_GREEN;
    ctx.fillRect(x - 16, y - 20, 32 * pct, 4);
  }

  for (const p of state.projectiles) {
    ctx.strokeStyle = p.color;
    ctx.lineWidth = 3;
    line([p.x, p.y], [p.tx, p.ty]);
  }
  for (const f of state.floating) {
    ctx.fillStyle = f.color;
    ctx.font = "bold 14px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(f.text, f.x, f.y);
  }

  updateHud();
}

function drawGrid() {
  ctx.strokeStyle = "rgba(148, 163, 184, 0.08)";
  ctx.lineWidth = 1;
  for (let x = 40; x < WIDTH; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, HEIGHT);
    ctx.stroke();
  }
  for (let y = 40; y < HEIGHT; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(WIDTH, y);
    ctx.stroke();
  }
}

function drawStarfield() {
  ctx.fillStyle = "rgba(56, 189, 248, 0.22)";
  for (let i = 0; i < 80; i += 1) {
    const x = (i * 137) % WIDTH;
    const y = (i * 89) % HEIGHT;
    ctx.beginPath();
    ctx.arc(x, y, (i % 3) + 0.8, 0, Math.PI * 2);
    ctx.fill();
  }
}

function updateHud() {
  ui.life.textContent = state.life ?? 20;
  ui.resource.textContent = state.resources ?? 0;
  ui.wave.textContent = `${state.wave ?? 0}/${state.maxWaves ?? WAVE_TABLE.length}`;
  ui.kills.textContent = state.kills ?? 0;
  ui.score.textContent = state.score ?? 0;
  ui.credits.textContent = save.credits || 0;
}

canvas.addEventListener("click", ev => {
  if (state.mode !== "running") return;
  const rect = canvas.getBoundingClientRect();
  const x = (ev.clientX - rect.left) * (WIDTH / rect.width);
  const y = (ev.clientY - rect.top) * (HEIGHT / rect.height);
  const idx = state.slots.findIndex(s => distance([x, y], [s.x, s.y]) <= 24);

  if (idx < 0) {
    state.selectedSlot = null;
    buildPanel.classList.add("hidden");
    return;
  }
  state.selectedSlot = idx;

  if (hotKeySelectedTower && !state.slots[idx].tower) {
    executeBuildTower(state.slots[idx], hotKeySelectedTower);
    hotKeySelectedTower = null;
    renderHotbar();
    return;
  }

  popBuildBubble(state.slots[idx], ev.clientX - rect.left, ev.clientY - rect.top);
});

function popBuildBubble(slot, x, y) {
  buildPanel.style.left = `${Math.min(x + 12, canvas.clientWidth - 260)}px`;
  buildPanel.style.top = `${Math.min(y + 12, canvas.clientHeight - 180)}px`;

  if (!slot.tower) {
    buildPanel.innerHTML = `<h3>研发布署防线</h3><p>选择要在当前学术槽位架设的模型：</p><div class="bubble-ops" id="opsG"></div>`;
    const g = buildPanel.querySelector("#opsG");
    Object.entries(TOWERS).forEach(([kind, d]) => {
      if (!save.unlocks.includes(kind)) return;
      const b = document.createElement("button");
      b.className = "hud-btn";
      b.textContent = `${d.name} (${d.cost})`;
      b.disabled = state.resources < d.cost;
      b.onclick = () => {
        executeBuildTower(slot, kind);
        buildPanel.classList.add("hidden");
      };
      g.appendChild(b);
    });
  } else {
    const t = slot.tower;
    const d = TOWERS[t.kind];
    const upCost = Math.trunc(d.cost * (0.75 + t.level * 0.55));
    buildPanel.innerHTML = `
      <h3>${d.name} Lv.${t.level}</h3>
      <p>模型当前运作状态良好。可进行升级或回收课题。</p>
      <div class="bubble-ops">
        <button class="hud-btn" ${t.level >= 3 || state.resources < upCost ? "disabled" : ""} id="bubbleUp">${t.level >= 3 ? "已满级" : `升级 (${upCost})`}</button>
        <button class="hud-btn danger" id="bubbleSell">回收 (+${Math.trunc(t.spent * 0.5)})</button>
      </div>
    `;
    buildPanel.querySelector("#bubbleUp").onclick = () => {
      if (state.resources >= upCost && t.level < 3) {
        state.resources -= upCost;
        t.spent += upCost;
        t.level += 1;
        buildPanel.classList.add("hidden");
      }
    };
    buildPanel.querySelector("#bubbleSell").onclick = () => {
      state.resources += Math.trunc(t.spent * 0.5);
      slot.tower = null;
      buildPanel.classList.add("hidden");
    };
  }
  buildPanel.classList.remove("hidden");
}

function showTowerInspectBubble(kind) {
  const data = TOWERS[kind];
  const rect = hotbar.getBoundingClientRect();
  const host = canvas.getBoundingClientRect();
  buildPanel.style.left = `${Math.max(12, Math.min(rect.left - host.left + 12, canvas.clientWidth - 260))}px`;
  buildPanel.style.top = `${Math.max(12, rect.top - host.top - 246)}px`;
  buildPanel.innerHTML = `
    <h3>${data.name}</h3>
    <div class="tower-role">${data.role}</div>
    <p>${data.desc}</p>
    <div class="tower-stat-grid">
      <div><span>费用</span><strong>${data.cost}</strong></div>
      <div><span>伤害</span><strong>${data.damage}</strong></div>
      <div><span>射程</span><strong>${data.range}</strong></div>
      <div><span>冷却</span><strong>${data.cooldown}s</strong></div>
    </div>
    <div class="tower-tip">${towerSpecialText(kind)}</div>
  `;
  buildPanel.classList.remove("hidden");
}

function towerSpecialText(kind) {
  if (kind === "lab") return `特殊：命中点周围 ${TOWERS.lab.splash} 范围内敌人也会受伤。`;
  if (kind === "coffee") return `特殊：造成 ${Math.round(TOWERS.coffee.slow * 100)}% 减速，并每 ${TOWERS.coffee.incomeCd}s 产出资源。`;
  if (kind === "physics") return "特殊：冷却极短，适合持续拦截高速敌人。";
  return "特殊：单发伤害高，适合压制厚血敌人。";
}

function executeBuildTower(slot, kind) {
  if (!save.unlocks.includes(kind)) return;
  if (state.resources >= TOWERS[kind].cost) {
    state.resources -= TOWERS[kind].cost;
    slot.tower = { kind, x: slot.x, y: slot.y, level: 1, spent: TOWERS[kind].cost, cooldownLeft: 0, incomeLeft: TOWERS[kind].incomeCd || 5 };
  }
}

document.addEventListener("keydown", ev => {
  if (ev.code === "Space") {
    ev.preventDefault();
    togglePause();
  }
  if (ev.code === "Escape") {
    state.selectedSlot = null;
    inspectedTowerKind = null;
    buildPanel.classList.add("hidden");
    renderHotbar();
  }
  if (["Digit1", "Digit2", "Digit3", "Digit4"].includes(ev.code) && state.mode === "running") {
    const idx = Number(ev.code.replace("Digit", "")) - 1;
    const activeTowers = Object.keys(TOWERS).filter(k => save.unlocks.includes(k));
    if (activeTowers[idx]) {
      hotKeySelectedTower = hotKeySelectedTower === activeTowers[idx] ? null : activeTowers[idx];
      renderHotbar();
    }
  }
});

ui.pauseBtn.onclick = togglePause;
ui.abortBtn.onclick = () => {
  if (confirm("确定中途强制中止课题防线撤退吗？本局将无法提取学术学分。")) switchOverlay("menu");
};

function pathLength(p) {
  let total = 0;
  for (let i = 0; i < p.length - 1; i += 1) total += distance(p[i], p[i + 1]);
  return total;
}

function pointAt(progress, p = state.map.path) {
  let rem = progress;
  for (let i = 0; i < p.length - 1; i += 1) {
    const seg = distance(p[i], p[i + 1]);
    if (rem <= seg) {
      const t = seg === 0 ? 0 : rem / seg;
      return [p[i][0] + (p[i + 1][0] - p[i][0]) * t, p[i][1] + (p[i + 1][1] - p[i][1]) * t];
    }
    rem -= seg;
  }
  return p[p.length - 1];
}

function distance(a, b) {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

function line(a, b) {
  ctx.beginPath();
  ctx.moveTo(a[0], a[1]);
  ctx.lineTo(b[0], b[1]);
  ctx.stroke();
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function sample(arr, count) {
  return shuffle([...arr]).slice(0, count);
}

let last = performance.now();

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  update(dt);
  draw();
  requestAnimationFrame(frame);
}

switchOverlay("menu");
requestAnimationFrame(frame);
