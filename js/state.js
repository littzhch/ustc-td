// 本文件由 game.js 拆分而来，保持普通 script 全局加载以兼容 file:// 运行。
let save = loadSave();
let mapIndex = 0;
let difficultyKey = save.difficulty in DIFFICULTIES ? save.difficulty : "confidential";
let state = { mode: "menu" };
let hotKeySelectedTower = null;
let inspectedTowerKind = null;

function repeat(value, count) {
  return Array.from({ length: count }, () => value);
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function loadSave() {
  let loaded = {};
  try {
    loaded = JSON.parse(localStorage.getItem(SAVE_KEY) || "{}");
  } catch (_e) {
    loaded = {};
  }
  const credits = Number(loaded.credits);
  const baseUnlocks = ["math", "physics", "lab", "coffee"];
  return {
    history: Array.isArray(loaded.history) ? loaded.history : [],
    bestWave: Number.isFinite(Number(loaded.bestWave)) ? Math.trunc(Number(loaded.bestWave)) : 0,
    credits: Number.isFinite(credits) ? Math.trunc(credits) : 0,
    unlocks: Array.from(new Set([...(Array.isArray(loaded.unlocks) ? loaded.unlocks : baseUnlocks), ...baseUnlocks])),
    talent: loaded.talent in TALENTS ? loaded.talent : "starter",
    chip: loaded.chip in CHIPS ? loaded.chip : "none",
    chips: Array.isArray(loaded.chips) ? loaded.chips.filter(key => key in CHIPS && key !== "none") : [],
    difficulty: loaded.difficulty in DIFFICULTIES ? loaded.difficulty : "confidential",
  };
}

function writeSave() {
  localStorage.setItem(SAVE_KEY, JSON.stringify(save));
}

function loadRunSave() {
  try {
    const raw = JSON.parse(localStorage.getItem(RUN_SAVE_KEY) || "null");
    if (!raw || raw.version !== 1 || !(raw.difficultyKey in DIFFICULTIES) || !MAPS[raw.mapIndex]) return null;
    return raw;
  } catch (_e) {
    return null;
  }
}

function clearRunSave() {
  localStorage.removeItem(RUN_SAVE_KEY);
}

function sanitizeSlotForSave(slot) {
  return {
    x: slot.x,
    y: slot.y,
    source: slot.source || null,
    custom: Boolean(slot.custom),
    landmark: Boolean(slot.landmark),
    tower: slot.tower ? {
      kind: slot.tower.kind,
      x: slot.tower.x,
      y: slot.tower.y,
      level: slot.tower.level,
      spent: slot.tower.spent,
      cooldownLeft: slot.tower.cooldownLeft || 0,
      incomeLeft: slot.tower.incomeLeft || 0,
      bonus: slot.tower.bonus || null,
    } : null,
  };
}

function sanitizeEnemyForSave(enemy, now) {
  return {
    kind: enemy.kind,
    path: enemy.path,
    progress: enemy.progress,
    hp: enemy.hp,
    maxHp: enemy.maxHp,
    slowLeft: Math.max(0, (enemy.slowUntil || 0) - now),
    slowFactor: enemy.slowFactor || 1,
    firstHit: enemy.firstHit !== false,
    bornAge: Math.max(0, now - (enemy.born || now)),
    blinkTimer: enemy.blinkTimer || 0,
    hitFlash: enemy.hitFlash || 0,
    ddlFuse: enemy.ddlFuse || 0,
    ddlFuseMax: enemy.ddlFuseMax || 0,
    bossTimer: enemy.bossTimer || 0,
  };
}

function saveRunSnapshot(showToast = true) {
  if (!["running", "paused"].includes(state.mode)) return false;
  const now = performance.now() / 1000;
  const snapshot = {
    version: 1,
    savedAt: Date.now(),
    mapIndex,
    difficultyKey,
    state: {
      slots: state.slots.map(sanitizeSlotForSave),
      enemies: state.enemies.map(enemy => sanitizeEnemyForSave(enemy, now)),
      life: state.life,
      resources: state.resources,
      wave: state.wave,
      kills: state.kills,
      score: state.score,
      spawnQueue: [...state.spawnQueue],
      spawnTimer: state.spawnTimer,
      waveWait: state.waveWait,
      waitingNextWave: Boolean(state.waitingNextWave),
      enhanceXp: state.enhanceXp,
      enhanceXpNeed: state.enhanceXpNeed,
      enhanceLevel: state.enhanceLevel,
      pendingEnhancement: false,
      introTime: 0,
      mods: { ...state.mods },
      chosenMods: [...state.chosenMods],
      lastCredits: state.lastCredits || 0,
    },
  };
  localStorage.setItem(RUN_SAVE_KEY, JSON.stringify(snapshot));
  if (showToast) {
    state.floating.push({ x: WIDTH / 2, y: 96, text: "战局已存档", color: THEME_GREEN, life: 1.1 });
  }
  return true;
}

function restoreSlotFromSave(slot) {
  const bonus = slot.source ? (SLOT_BONUSES[slot.source] || null) : null;
  const restored = {
    x: slot.x,
    y: slot.y,
    source: slot.source || undefined,
    custom: Boolean(slot.custom),
    landmark: Boolean(slot.landmark),
    bonus,
    tower: null,
  };
  if (slot.tower && TOWERS[slot.tower.kind]) {
    restored.tower = {
      ...slot.tower,
      x: slot.x,
      y: slot.y,
      bonus: slot.tower.bonus || bonus || null,
    };
  }
  return restored;
}

function restoreRunFromSave(snapshot) {
  mapIndex = snapshot.mapIndex;
  difficultyKey = snapshot.difficultyKey;
  save.difficulty = difficultyKey;
  writeSave();
  const run = resetRun();
  const saved = snapshot.state || {};
  const now = performance.now() / 1000;
  run.slots = Array.isArray(saved.slots) ? saved.slots.map(restoreSlotFromSave) : run.slots;
  run.enemies = Array.isArray(saved.enemies) ? saved.enemies
    .filter(enemy => ENEMIES[enemy.kind] && Array.isArray(enemy.path))
    .map(enemy => ({
      ...enemy,
      slowUntil: now + (enemy.slowLeft || 0),
      born: now - (enemy.bornAge || 0),
    })) : [];
  run.life = Number.isFinite(saved.life) ? saved.life : run.life;
  run.resources = Number.isFinite(saved.resources) ? saved.resources : run.resources;
  run.wave = Number.isFinite(saved.wave) ? saved.wave : run.wave;
  run.kills = Number.isFinite(saved.kills) ? saved.kills : run.kills;
  run.score = Number.isFinite(saved.score) ? saved.score : run.score;
  run.spawnQueue = Array.isArray(saved.spawnQueue) ? saved.spawnQueue.filter(kind => ENEMIES[kind]) : [];
  run.spawnTimer = Number.isFinite(saved.spawnTimer) ? saved.spawnTimer : 0.2;
  run.waveWait = Number.isFinite(saved.waveWait) ? saved.waveWait : 0.8;
  run.waitingNextWave = Boolean(saved.waitingNextWave);
  run.enhanceXp = Number.isFinite(saved.enhanceXp) ? saved.enhanceXp : 0;
  run.enhanceXpNeed = Number.isFinite(saved.enhanceXpNeed) ? saved.enhanceXpNeed : nextEnhanceNeed(0);
  run.enhanceLevel = Number.isFinite(saved.enhanceLevel) ? saved.enhanceLevel : 0;
  run.pendingEnhancement = false;
  run.introTime = 0;
  run.mods = saved.mods && typeof saved.mods === "object" ? { ...run.mods, ...saved.mods } : run.mods;
  run.chosenMods = Array.isArray(saved.chosenMods) ? saved.chosenMods : [];
  run.lastCredits = Number.isFinite(saved.lastCredits) ? saved.lastCredits : 0;
  state = run;
  hotKeySelectedTower = null;
  inspectedTowerKind = null;
  renderHotbar();
  switchOverlay("running");
  state.floating.push({ x: WIDTH / 2, y: 96, text: "已读取存档", color: THEME_BLUE, life: 1.1 });
}

function resetRun() {
  const map = { ...MAPS[mapIndex] };
  const difficulty = DIFFICULTIES[difficultyKey] || DIFFICULTIES.confidential;
  map.routes = buildSpawnRoutes(map);
  map.path = map.routes[0] || [map.spawns?.[0] || [WIDTH - 24, HEIGHT / 2], map.target];
  const run = {
    mode: "running",
    map,
    difficultyKey,
    difficulty,
    slots: map.slots.map(slot => {
      if (Array.isArray(slot)) return { x: slot[0], y: slot[1], tower: null };
      return { ...slot, tower: null };
    }),
    enemies: [],
    projectiles: [],
    effects: [],
    floating: [],
    life: GPA_MAX,
    resources: (save.talent === "starter" ? 145 : 120) + difficulty.startResource,
    wave: 0,
    maxWaves: difficulty.endless ? Infinity : WAVE_TABLE.length,
    kills: 0,
    score: 0,
    spawnQueue: [],
    spawnTimer: 0,
    waveWait: 0.2,
    waitingNextWave: false,
    enhanceXp: 0,
    enhanceXpNeed: nextEnhanceNeed(0),
    enhanceLevel: 0,
    pendingEnhancement: false,
    introTime: 3.6,
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
