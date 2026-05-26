// 本文件由 game.js 拆分而来，保持普通 script 全局加载以兼容 file:// 运行。
function nextEnhanceNeed(level) {
  return 140 + level * 75 + Math.floor(level * level * 10);
}

function buildWavePattern(wave) {
  const base = WAVE_TABLE[Math.min(wave - 1, WAVE_TABLE.length - 1)];
  const pattern = [...base];

  const extraTier = Math.max(0, wave - WAVE_TABLE.length);
  if (state.difficulty?.endless && extraTier > 0) {
    pattern.push(...repeat("homework", Math.min(18, 3 + extraTier * 2)));
    pattern.push(...repeat("ddl", Math.min(12, 1 + Math.floor(extraTier * 0.8))));
    if (extraTier >= 2) pattern.push(...repeat("report", Math.min(7, 1 + Math.floor(extraTier / 2))));
    if (extraTier >= 3) pattern.push(...repeat("ppt", Math.min(7, 1 + Math.floor(extraTier / 3))));
    if (extraTier >= 4) pattern.push(...repeat("bug", Math.min(8, 1 + Math.floor(extraTier / 4))));
  }
  const boss = bossForWave(wave);
  if (boss) pattern.push(boss);
  return pattern;
}

function bossForWave(wave) {
  if (wave <= 0 || wave % 5 !== 0) return null;
  const idx = Math.floor(wave / 5 - 1) % BOSS_SEQUENCE.length;
  return BOSS_SEQUENCE[idx];
}

function nextWave() {
  state.wave += 1;
  const pattern = buildWavePattern(state.wave);
  state.spawnQueue = shuffle(pattern);
  state.spawnTimer = 0.2;
  state.waitingNextWave = false;
}

function update(dt) {
  if (state.mode !== "running") return;
  const now = performance.now() / 1000;
  if ((state.introTime || 0) > 0) {
    state.introTime = Math.max(0, state.introTime - dt);
    updateEffects(dt);
    updateFloaters(dt);
    return;
  }
  if (state.wave === 0 || state.waitingNextWave) {
    state.waveWait -= dt;
    if (state.waveWait <= 0) nextWave();
  }
  updateSpawning(dt);
  updateEnemies(dt, now);
  updateTowers(dt, now);
  updateProjectiles(dt);
  updateEffects(dt);
  updateFloaters(dt);

  if (state.life <= 0) {
    saveResult(false);
    switchOverlay("gameover");
  } else if (!state.spawnQueue.length && !state.enemies.length && state.wave > 0 && !state.waitingNextWave && !state.pendingEnhancement) {
    if (!state.difficulty?.endless && state.wave >= state.maxWaves) {
      saveResult(true);
      switchOverlay("victory");
    } else {
      grantWaveClearSupply();
      state.waitingNextWave = true;
      state.waveWait = state.difficulty?.endless ? 2.0 : 2.4;
    }
  }
}

function grantWaveClearSupply() {
  if (!state.difficulty?.endless || state.wave > 4) return;
  const gain = 16 + state.wave * 4;
  state.resources += gain;
  state.floating.push({ x: WIDTH / 2, y: 118, text: `过渡补给 +${gain}`, color: THEME_GREEN, life: 1.0 });
}

function updateSpawning(dt) {
  if (!state.spawnQueue.length) return;
  state.spawnTimer -= dt;
  if (state.spawnTimer <= 0) {
    const kind = state.spawnQueue.shift();
    const path = pickEnemyPath();
    state.enemies.push(makeEnemy(kind, path));
    const minInterval = state.difficulty?.spawnMin || 0.55;
    state.spawnTimer = Math.max(minInterval, (1.2 - state.wave * 0.06) * (state.difficulty?.spawnInterval || 1));
  }
}

function currentHpGrowth() {
  const wave = Math.max(0, state.wave - 1);
  const late = Math.max(0, state.wave - 8);
  return 1 + wave * (state.difficulty?.hpGrowth || 0) + late * late * (state.difficulty?.hpLateGrowth || 0);
}

function currentSpeedGrowth() {
  const late = Math.max(0, state.wave - 8);
  return 1 + state.wave * (state.difficulty?.speedGrowth || 0.04) + late * (state.difficulty?.speedLateGrowth || 0);
}

function makeEnemy(kind, path, progress = 0, hpBase = null) {
  const data = ENEMIES[kind];
  const hp = Math.round((hpBase ?? data.hp) * (state.difficulty?.enemyHp || 1) * currentHpGrowth());
  const fuse = kind === "ddl" ? randomBetween(data.fuseMin, data.fuseMax) : 0;
  const timer = data.summonEvery || data.pulseEvery || 0;
  return {
    kind,
    path,
    progress,
    hp,
    maxHp: hp,
    slowUntil: 0,
    slowFactor: 1,
    firstHit: true,
    born: performance.now() / 1000,
    blinkTimer: 3,
    hitFlash: 0,
    ddlFuse: fuse,
    ddlFuseMax: fuse,
    bossTimer: timer,
  };
}

function updateEnemies(dt, now) {
  const survivors = [];
  for (const enemy of state.enemies) {
    const total = pathLength(enemy.path);
    const data = ENEMIES[enemy.kind];
    let speed = data.speed * (state.difficulty?.enemySpeed || 1) * currentSpeedGrowth();
    if (now < enemy.slowUntil) speed *= enemy.slowFactor;
    enemy.blinkTimer -= dt;
    enemy.hitFlash = Math.max(0, (enemy.hitFlash || 0) - dt);
    if (enemy.kind === "ddl") {
      enemy.ddlFuse = Math.max(0, (enemy.ddlFuse ?? data.fuseMax) - dt);
      if (enemy.ddlFuse <= 0) {
        const [x, y] = pointAt(enemy.progress, enemy.path);
        selfDestructDdl(enemy, x, y);
        continue;
      }
    }
    updateBossAbility(enemy, data, dt);
    if (data.blink && enemy.blinkTimer <= 0) {
      enemy.blinkTimer = 3;
      if (Math.random() < 0.2) enemy.progress += 38;
    }
    enemy.progress += speed * dt;
    if (enemy.progress >= total) {
      state.life -= data.damage;
      const [x, y] = pointAt(total, enemy.path);
      state.effects.push({ kind: "gpa-hit", x, y, life: 0.6, maxLife: 0.6 });
      state.floating.push({ x, y, text: `-${formatGpaDelta(data.damage)} GPA`, color: THEME_ROSE, life: 0.9 });
    } else {
      survivors.push(enemy);
    }
  }
  state.enemies = survivors;
}

function updateBossAbility(enemy, data, dt) {
  if (!data.boss) return;
  enemy.bossTimer = Math.max(0, (enemy.bossTimer || 0) - dt);
  if (enemy.bossTimer > 0) return;
  const [x, y] = pointAt(enemy.progress, enemy.path);
  if (data.summon) {
    const child = makeEnemy(data.summon, enemy.path, Math.max(0, enemy.progress - 34), Math.round(ENEMIES[data.summon].hp * 0.72));
    state.enemies.push(child);
    enemy.bossTimer = data.summonEvery || 5;
    state.effects.push({ kind: "boss-summon", x, y, life: 0.54, maxLife: 0.54 });
    state.floating.push({ x, y: y - 34, text: "加卷", color: "#fbbf24", life: 0.8 });
  } else if (data.pulseEvery) {
    const downgraded = downgradeTowersInRadius(x, y, data.blastRadius || 110);
    enemy.bossTimer = data.pulseEvery;
    state.effects.push({ kind: "ddl-explode", x, y, radius: data.blastRadius || 110, life: 0.68, maxLife: 0.68 });
    state.floating.push({ x, y: y - 34, text: downgraded ? `DDL 追责 ${downgraded} 塔` : "DDL 追责", color: THEME_ROSE, life: 1.0 });
  }
}

function updateTowers(dt, now) {
  for (const slot of state.slots) {
    const tower = slot.tower;
    if (!tower) continue;
    if (tower.kind === "coffee") {
      tower.incomeLeft -= dt;
      if (tower.incomeLeft <= 0) {
        const gain = Math.trunc((5 + tower.level * 2) * towerBonus(tower, "income"));
        state.resources += gain;
        tower.incomeLeft = TOWERS.coffee.incomeCd;
        state.floating.push({ x: tower.x, y: tower.y - 20, text: `+${gain}`, color: "#fbbf24", life: 0.8 });
      }
    }
    tower.cooldownLeft -= dt;
    if (tower.cooldownLeft > 0) continue;
    const targets = findTargets(tower, now, tower.level);
    if (!targets.length) continue;
    tower.cooldownLeft = (TOWERS[tower.kind].cooldown * Math.pow(0.88, tower.level - 1)) / (state.mods.speed * towerBonus(tower, "speed"));
    targets.forEach(target => fireTower(tower, target, now));
  }
}

function fireTower(tower, target, now) {
  const targetPos = pointAt(target.progress, target.path);
  state.projectiles.push({
    kind: tower.kind,
    x: tower.x,
    y: tower.y,
    tx: targetPos[0],
    ty: targetPos[1],
    life: 0.24,
    maxLife: 0.24,
    color: TOWERS[tower.kind].color,
    splash: tower.kind === "lab" ? TOWERS.lab.splash : 0,
  });
  state.effects.push({ kind: "muzzle", tower: tower.kind, x: tower.x, y: tower.y, life: 0.2, maxLife: 0.2 });
  const damage = TOWERS[tower.kind].damage * (1 + 0.28 * (tower.level - 1)) * state.mods.damage * towerBonus(tower, "damage");
  if (tower.kind === "lab") {
    for (const enemy of [...state.enemies]) {
      if (distance(pointAt(enemy.progress, enemy.path), targetPos) <= TOWERS.lab.splash) damageEnemy(enemy, damage * 0.78);
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
  enemy.hitFlash = 0.18;
  enemy.hp -= Math.max(1, finalDamage - (data.armor || 0));
  if (enemy.hp <= 0 && state.enemies.includes(enemy)) killEnemy(enemy);
}

function selfDestructDdl(enemy, x, y) {
  const radius = ENEMIES.ddl.blastRadius;
  const downgraded = downgradeTowersInRadius(x, y, radius);
  state.effects.push({ kind: "ddl-explode", x, y, radius, life: 0.72, maxLife: 0.72 });
  state.floating.push({ x, y: y - 20, text: downgraded ? `自爆 ${downgraded} 塔降级` : "DDL 自爆", color: THEME_ROSE, life: 1.1 });
  enemy.hp = 0;
}

function downgradeTowersInRadius(x, y, radius) {
  let downgraded = 0;
  for (const slot of state.slots) {
    const tower = slot.tower;
    if (!tower || distance([x, y], [tower.x, tower.y]) > radius) continue;
    if (tower.level > 1) {
      tower.level -= 1;
      tower.cooldownLeft = Math.max(tower.cooldownLeft || 0, 0.9);
      downgraded += 1;
      state.floating.push({ x: tower.x, y: tower.y - 30, text: "降级", color: THEME_ROSE, life: 1.0 });
      state.effects.push({ kind: "tower-downgrade", x: tower.x, y: tower.y, life: 0.62, maxLife: 0.62 });
    } else {
      state.floating.push({ x: tower.x, y: tower.y - 30, text: "Lv.1", color: "#fbbf24", life: 0.7 });
    }
  }
  return downgraded;
}

function killEnemy(enemy) {
  state.enemies.splice(state.enemies.indexOf(enemy), 1);
  const reward = Math.ceil((ENEMIES[enemy.kind].reward + state.mods.killBonus) * (state.difficulty?.reward || 1));
  state.resources += reward;
  state.kills += 1;
  state.score += reward * 4 + state.wave * 10;
  gainEnhanceXp(enemy.kind);
  const [x, y] = pointAt(enemy.progress, enemy.path);
  state.effects.push({ kind: "defeat", enemy: enemy.kind, x, y, life: 0.42, maxLife: 0.42 });
  state.floating.push({ x, y, text: `+${reward}`, color: THEME_GREEN, life: 0.8 });
  if (enemy.kind === "ddl") {
    state.life = Math.min(GPA_MAX, state.life + ENEMIES.ddl.heal);
    state.effects.push({ kind: "gpa-heal", x, y, life: 0.68, maxLife: 0.68 });
    state.floating.push({ x, y: y - 18, text: `+${formatGpaDelta(ENEMIES.ddl.heal)} GPA`, color: THEME_GREEN, life: 1.0 });
  }
  if (ENEMIES[enemy.kind].split) {
    for (const offset of [8, 18]) {
      state.enemies.push(makeEnemy("homework", enemy.path, enemy.progress + offset, 24));
    }
  }
  if (ENEMIES[enemy.kind].bossSplit) {
    ENEMIES[enemy.kind].bossSplit.forEach((kind, idx) => {
      state.enemies.push(makeEnemy(kind, enemy.path, enemy.progress + 18 + idx * 18));
    });
    state.effects.push({ kind: "boss-summon", x, y, life: 0.72, maxLife: 0.72 });
    state.floating.push({ x, y: y - 34, text: "论文拆分", color: "#a78bfa", life: 1.0 });
  }
  if (ENEMIES[enemy.kind].boss) {
    state.floating.push({ x, y: y - 46, text: `${ENEMIES[enemy.kind].name} 击破`, color: "#fbbf24", life: 1.2 });
  }
}

function findTargets(tower, now, count = 1) {
  const range = TOWERS[tower.kind].range * (1 + 0.28 * (tower.level - 1)) * state.mods.range * towerBonus(tower, "range");
  const candidates = state.enemies.filter(e => {
    if (now - e.born <= (ENEMIES[e.kind].stealth || 0)) return false;
    const [x, y] = pointAt(e.progress, e.path);
    return distance([tower.x, tower.y], [x, y]) <= range;
  });
  return candidates.sort((a, b) => b.progress - a.progress).slice(0, count);
}

function findTarget(tower, now) {
  return findTargets(tower, now, 1)[0] || null;
}

function gainEnhanceXp(kind) {
  if (state.pendingEnhancement || state.mode !== "running") return;
  const baseXp = {
    homework: 12,
    ddl: 16,
    report: 28,
    ppt: 22,
    bug: 18,
    boss_midterm: 90,
    boss_ddl: 105,
    boss_lab: 120,
    boss_thesis: 150,
  }[kind] || 12;
  const waveBonus = Math.min(18, Math.floor(state.wave * 1.4));
  state.enhanceXp += Math.round((baseXp + waveBonus) * (state.difficulty?.xp || 1));
  if (state.enhanceXp >= state.enhanceXpNeed) {
    state.pendingEnhancement = true;
    openEnhancements();
  }
}

function towerBonus(tower, key) {
  return (tower && tower.bonus && tower.bonus[key]) || 1;
}

function towerStats(tower) {
  const data = TOWERS[tower.kind];
  const levelScale = 1 + 0.28 * (tower.level - 1);
  return {
    damage: data.damage * levelScale * state.mods.damage * towerBonus(tower, "damage"),
    range: data.range * levelScale * state.mods.range * towerBonus(tower, "range"),
    cooldown: (data.cooldown * Math.pow(0.88, tower.level - 1)) / (state.mods.speed * towerBonus(tower, "speed")),
    shots: tower.level,
    income: tower.kind === "coffee" ? Math.trunc((5 + tower.level * 2) * towerBonus(tower, "income")) : null,
  };
}

function updateProjectiles(dt) {
  const remaining = [];
  for (const p of state.projectiles) {
    p.life -= dt;
    if (p.life <= 0) {
      state.effects.push({ kind: "impact", tower: p.kind, x: p.tx, y: p.ty, radius: p.splash || 0, life: 0.34, maxLife: 0.34 });
    } else {
      remaining.push(p);
    }
  }
  state.projectiles = remaining;
}

function updateEffects(dt) {
  for (const effect of state.effects) effect.life -= dt;
  state.effects = state.effects.filter(effect => effect.life > 0);
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
  state.pendingEnhancement = true;
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
  clearRunSave();
  const creds = calculateCredits(won);
  state.lastCredits = creds;
  save.history.push({ won, wave: state.wave, score: state.score, credits: creds, difficulty: state.difficulty?.label || "机密" });
  save.history = save.history.slice(-10);
  save.bestWave = Math.max(save.bestWave || 0, state.wave);
  save.credits += creds;
  writeSave();
}

function calculateCredits(won) {
  const c = Math.max(10, state.wave * 8 + (won ? 40 : 0));
  const difficultyScale = state.difficulty?.credits || 1;
  const talentScale = save.talent === "scholarship" ? 1.15 : 1;
  return Math.trunc(c * difficultyScale * talentScale);
}
