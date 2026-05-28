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
  const scale = state.nextWaveEnemyScale || 1;
  if (scale > 1) {
    const extras = pattern.filter(kind => !ENEMIES[kind]?.boss);
    pattern.push(...sample(extras, Math.ceil(extras.length * (scale - 1))));
  }
  return pattern;
}

function bossForWave(wave) {
  if (wave <= 0 || wave % 5 !== 0) return null;
  const idx = Math.floor(wave / 5 - 1) % BOSS_SEQUENCE.length;
  return BOSS_SEQUENCE[idx];
}

function nextWave() {
  state.wave += 1;
  if (state.nextWaveHpScale) {
    state.enemyHpScaleWave = state.wave;
    state.enemyHpScale = state.nextWaveHpScale;
    state.nextWaveHpScale = 1;
  }
  grantResearchWaveStart();
  const pattern = buildWavePattern(state.wave);
  state.nextWaveEnemyScale = 1;
  state.spawnQueue = shuffle(pattern);
  state.spawnTimer = 0.2;
  state.waitingNextWave = false;
}

function grantResearchWaveStart() {
  if (researchLevel("mystic_tuning") > 0) {
    const chance = researchLevel("mystic_tuning") * 0.12;
    if (Math.random() < chance) {
      const gain = Math.trunc(randomBetween(10, 26));
      state.resources += gain;
      state.floating.push({ x: WIDTH / 2, y: 118, text: `玄学调参 +${gain}`, color: "#a78bfa", life: 1.0 });
    }
  }
  if (hasResearch("defense_rehearsal") && bossForWave(state.wave)) {
    state.resources += 45;
    state.floating.push({ x: WIDTH / 2, y: 142, text: "答辩彩排 +45", color: "#fbbf24", life: 1.0 });
  }
  if (state.mods?.randomWaveBuff) {
    const picks = [
      ["临场：伤害", () => state.mods.damage += 0.08, THEME_ROSE],
      ["临场：攻速", () => state.mods.speed += 0.08, THEME_GREEN],
      ["临场：射程", () => state.mods.range += 0.08, THEME_BLUE],
    ];
    const [text, action, color] = picks[Math.floor(Math.random() * picks.length)];
    action();
    state.floating.push({ x: WIDTH / 2, y: 166, text, color, life: 0.9 });
  }
  if (state.mods?.waveStartResource) {
    state.resources += state.mods.waveStartResource;
    state.floating.push({ x: WIDTH / 2, y: 190, text: `奖学金到账 +${state.mods.waveStartResource}`, color: "#fbbf24", life: 0.9 });
  }
  if (state.silenceNextWave) {
    state.silenceNextWave = false;
    state.silenceUntil = performance.now() / 1000 + 5;
    state.floating.push({ x: WIDTH / 2, y: 214, text: "组会沉默", color: "#a78bfa", life: 1.0 });
  }
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
    applyWaveClearEnhancements();
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

function applyWaveClearEnhancements() {
  if (state.waveClearHandled === state.wave) return;
  state.waveClearHandled = state.wave;
  if (state.mods.waveGpaLoss) {
    state.life -= state.mods.waveGpaLoss;
    state.floating.push({ x: WIDTH / 2, y: 92, text: `熬夜爆肝 -${formatGpaDelta(state.mods.waveGpaLoss)} GPA`, color: THEME_ROSE, life: 1.0 });
    triggerLowGpaResearch(performance.now() / 1000);
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
  const waveHpScale = state.enemyHpScaleWave === state.wave ? (state.enemyHpScale || 1) : 1;
  const hp = Math.round((hpBase ?? data.hp) * (state.difficulty?.enemyHp || 1) * currentHpGrowth() * waveHpScale);
  const fuseExtra = kind === "ddl" ? researchLevel("alarm_clock") * 0.5 + (state.mods?.ddlFuseBonus || 0) - (state.mods?.ddlFusePenalty || 0) : 0;
  const fuse = kind === "ddl" ? randomBetween(Math.max(0.8, data.fuseMin + fuseExtra), Math.max(1.2, data.fuseMax + fuseExtra)) : 0;
  const timer = bossTimerFor(data);
  const enemy = {
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
  if (kind === "ddl" && hasResearch("extension_pass") && state.ddlAutoSlowWave !== state.wave) {
    enemy.slowFactor = 0.5;
    enemy.slowUntil = performance.now() / 1000 + 2;
    state.ddlAutoSlowWave = state.wave;
  }
  return enemy;
}

function bossTimerFor(data) {
  if (data.summonEvery) return data.summonEvery + (hasResearch("no_extra_paper") ? 1.8 : 0);
  if (data.pulseEvery) return data.pulseEvery + (hasResearch("ddl_filing") ? 1.2 : 0);
  return 0;
}

function updateEnemies(dt, now) {
  const survivors = [];
  for (const enemy of state.enemies) {
    const total = pathLength(enemy.path);
    const data = ENEMIES[enemy.kind];
    let speed = data.speed * (state.difficulty?.enemySpeed || 1) * currentSpeedGrowth();
    if (now < enemy.slowUntil) speed *= enemy.slowFactor;
    if (now < (state.starcloudSlowUntil || 0)) speed *= 0.72;
    if (now < (state.silenceUntil || 0)) speed *= 0.6;
    if (state.mods?.nearOfficeSlow) {
      speed *= 1 - Math.min(state.mods.nearOfficeSlow, (enemy.progress / Math.max(1, total)) * state.mods.nearOfficeSlow);
    }
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
      let damage = data.damage;
      if (data.boss && hasResearch("mentor_signature")) damage = Math.max(1, damage - 1);
      if (!state.firstLeakShieldUsed && hasResearch("office_firewall")) {
        damage *= 0.5;
        state.firstLeakShieldUsed = true;
        state.floating.push({ x: WIDTH / 2, y: 92, text: "教务处防火墙启动", color: THEME_BLUE, life: 1.1 });
      }
      if (state.nextLeakShield) {
        damage = 0;
        state.nextLeakShield = false;
        state.floating.push({ x: WIDTH / 2, y: 118, text: "教务缓冲抵消", color: THEME_BLUE, life: 1.0 });
      }
      state.life -= damage;
      const [x, y] = pointAt(total, enemy.path);
      state.effects.push({ kind: "gpa-hit", x, y, life: 0.6, maxLife: 0.6 });
      state.floating.push({ x, y, text: `-${formatGpaDelta(damage)} GPA`, color: THEME_ROSE, life: 0.9 });
      triggerLowGpaResearch(now);
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
    enemy.bossTimer = bossTimerFor(data) || 5;
    state.effects.push({ kind: "boss-summon", x, y, life: 0.54, maxLife: 0.54 });
    state.floating.push({ x, y: y - 34, text: "加卷", color: "#fbbf24", life: 0.8 });
  } else if (data.pulseEvery) {
    const radius = (data.blastRadius || 110) * (hasResearch("advisor_unread") ? 0.8 : 1);
    const downgraded = downgradeTowersInRadius(x, y, radius);
    enemy.bossTimer = bossTimerFor(data);
    state.effects.push({ kind: "ddl-explode", x, y, radius, life: 0.68, maxLife: 0.68 });
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
        const gain = Math.trunc((5 + tower.level * 2) * towerBonus(tower, "income") * state.mods.coffeeIncome);
        state.resources += gain;
        tower.incomeLeft = TOWERS.coffee.incomeCd;
        state.floating.push({ x: tower.x, y: tower.y - 20, text: `+${gain}`, color: "#fbbf24", life: 0.8 });
      }
    }
    tower.cooldownLeft -= dt;
    if (tower.cooldownLeft > 0) continue;
    const targets = findTargets(tower, now, tower.level);
    if (!targets.length) continue;
    tower.cooldownLeft = (TOWERS[tower.kind].cooldown * Math.pow(0.88, tower.level - 1)) / (state.mods.speed * towerBonus(tower, "speed") * towerSpeedModifier(tower, now));
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
    splash: tower.kind === "lab" ? labSplashRadius() : 0,
  });
  state.effects.push({ kind: "muzzle", tower: tower.kind, x: tower.x, y: tower.y, life: 0.2, maxLife: 0.2 });
  const damage = TOWERS[tower.kind].damage * (1 + 0.28 * (tower.level - 1)) * state.mods.damage * towerBonus(tower, "damage") * towerDamageModifier(tower, target);
  if (tower.kind === "lab") {
    for (const enemy of [...state.enemies]) {
      if (distance(pointAt(enemy.progress, enemy.path), targetPos) <= labSplashRadius()) damageEnemy(enemy, damage * 0.78, tower);
    }
  } else {
    damageEnemy(target, damage, tower);
    if (tower.kind === "physics" && Math.random() < state.mods.physicsDoubleChance && state.enemies.includes(target)) {
      damageEnemy(target, damage * 0.55, tower);
      state.floating.push({ x: tower.x, y: tower.y - 22, text: "连点", color: THEME_BLUE, life: 0.55 });
    }
  }
  const slow = (TOWERS[tower.kind].slow || 0) + state.mods.globalSlow;
  if (slow) {
    target.slowFactor = Math.max(0.3, 1 - slow);
    target.slowUntil = now + 1.8;
  }
}

function damageEnemy(enemy, amount, sourceTower = null) {
  const data = ENEMIES[enemy.kind];
  let finalDamage = amount;
  if (data.firstHitHalf && enemy.firstHit) {
    finalDamage *= enemy.kind === "report" && state.mods?.reportFirstHitFix ? 0.75 : 0.5;
    enemy.firstHit = false;
  }
  if (enemy.kind === "ddl" && hasResearch("ta_intercept") && performance.now() / 1000 < enemy.slowUntil) finalDamage *= 1.15;
  if (enemy.kind === "boss_midterm") finalDamage *= 1 + researchLevel("midterm_review") * 0.08;
  if (ENEMIES[enemy.kind]?.boss) finalDamage *= 1 + (state.mods?.bossDamage || 0);
  else finalDamage *= 1 + (state.mods?.nonBossDamage || 0);
  if (state.mods?.highHpDamage && enemy === highestHpEnemy()) finalDamage *= 1 + state.mods.highHpDamage;
  if (state.mods?.resourceDamage) finalDamage *= 1 + Math.min(state.mods.resourceDamageCap || 0.15, Math.floor(state.resources / 100) * state.mods.resourceDamage);
  if (hasResearch("pressure_group")) {
    const total = Math.max(1, pathLength(enemy.path));
    finalDamage *= 1 + Math.min(0.14, (enemy.progress / total) * 0.14);
  }
  enemy.hitFlash = 0.18;
  const armorReduction = enemy.kind === "boss_lab" ? researchLevel("lab_prereview") * 4 : 0;
  enemy.hp -= Math.max(1, finalDamage - Math.max(0, (data.armor || 0) - armorReduction));
  if (enemy.hp <= 0 && state.enemies.includes(enemy)) killEnemy(enemy, sourceTower);
}

function selfDestructDdl(enemy, x, y) {
  const radius = ENEMIES.ddl.blastRadius;
  let downgraded = 0;
  if (hasResearch("reverse_delay") && !state.firstDdlBlastForgiven) {
    state.firstDdlBlastForgiven = true;
    state.floating.push({ x, y: y - 42, text: "反向延期生效", color: THEME_BLUE, life: 1.0 });
  } else {
    downgraded = downgradeTowersInRadius(x, y, radius);
  }
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
      const immuneChance = researchLevel("emergency_review") * 0.18;
      if (immuneChance > 0 && Math.random() < immuneChance) {
        state.floating.push({ x: tower.x, y: tower.y - 30, text: "免疫降级", color: THEME_BLUE, life: 0.8 });
        continue;
      }
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

function killEnemy(enemy, sourceTower = null) {
  state.enemies.splice(state.enemies.indexOf(enemy), 1);
  const ddlBonus = enemy.kind === "ddl" ? researchLevel("deadline_radar") * 4 : 0;
  const reward = Math.ceil((ENEMIES[enemy.kind].reward + state.mods.killBonus + ddlBonus) * (state.difficulty?.reward || 1));
  if (state.mods.noResourceWave !== state.wave) state.resources += reward;
  if (sourceTower?.kind === "lab" && hasResearch("danger_reagent")) {
    state.resources += 8;
    const [rx, ry] = pointAt(enemy.progress, enemy.path);
    state.floating.push({ x: rx, y: ry - 28, text: "实验事故 +8", color: "#a78bfa", life: 0.8 });
  }
  state.kills += 1;
  state.score += reward * 4 + state.wave * 10;
  gainEnhanceXp(enemy.kind);
  const [x, y] = pointAt(enemy.progress, enemy.path);
  state.effects.push({ kind: "defeat", enemy: enemy.kind, x, y, life: 0.42, maxLife: 0.42 });
  state.floating.push({ x, y, text: `+${reward}`, color: THEME_GREEN, life: 0.8 });
  if (enemy.kind === "ddl") {
    const heal = ENEMIES.ddl.heal + researchLevel("crisis_pr") * 0.3;
    state.life = Math.min(state.maxLife || GPA_MAX, state.life + heal);
    state.effects.push({ kind: "gpa-heal", x, y, life: 0.68, maxLife: 0.68 });
    state.floating.push({ x, y: y - 18, text: `+${formatGpaDelta(heal)} GPA`, color: THEME_GREEN, life: 1.0 });
  }
  if (state.mods.ddlDeathSlow && enemy.kind === "ddl") slowEnemiesAround(x, y, state.mods.ddlDeathSlow, 80, 2);
  if (state.mods.killHealEvery) {
    state.healKillCounter = (state.healKillCounter || 0) + 1;
    if (state.healKillCounter >= state.mods.killHealEvery) {
      state.healKillCounter = 0;
      state.life = Math.min(state.maxLife || GPA_MAX, state.life + 1);
      state.floating.push({ x, y: y - 38, text: "+0.1 GPA", color: THEME_GREEN, life: 0.9 });
    }
  }
  if (ENEMIES[enemy.kind].split) {
    for (const offset of [8, 18]) {
      state.enemies.push(makeEnemy("homework", enemy.path, enemy.progress + offset, Math.round(24 * (state.mods.splitHpScale || 1))));
    }
  }
  if (ENEMIES[enemy.kind].bossSplit) {
    ENEMIES[enemy.kind].bossSplit.forEach((kind, idx) => {
      const hpBase = Math.round(ENEMIES[kind].hp * (1 - researchLevel("paper_check") * 0.12));
      state.enemies.push(makeEnemy(kind, enemy.path, enemy.progress + 18 + idx * 18, hpBase));
    });
    state.effects.push({ kind: "boss-summon", x, y, life: 0.72, maxLife: 0.72 });
    state.floating.push({ x, y: y - 34, text: "论文拆分", color: "#a78bfa", life: 1.0 });
  }
  if (ENEMIES[enemy.kind].boss) {
    state.floating.push({ x, y: y - 46, text: `${ENEMIES[enemy.kind].name} 击破`, color: "#fbbf24", life: 1.2 });
    if (hasResearch("good_ppt") && !state.pendingEnhancement && state.mode === "running") {
      state.enhanceXp = state.enhanceXpNeed;
      openEnhancements();
    }
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
  const xpScale = state.mods.noResourceWave === state.wave ? 2 : 1;
  state.enhanceXp += Math.round((baseXp + waveBonus) * (state.difficulty?.xp || 1) * xpScale);
  if (state.enhanceXp >= state.enhanceXpNeed) {
    state.pendingEnhancement = true;
    openEnhancements();
  }
}

function towerBonus(tower, key) {
  let value = (tower && tower.bonus && tower.bonus[key]) || 1;
  const source = tower?.source || "";
  if (source === "图书馆" && key === "range") value += researchLevel("library_seat") * 0.04;
  if (source === "行政楼" && key === "speed") value += researchLevel("admin_stamp") * 0.04;
  if (source === "第一教学楼" && key === "damage") value += researchLevel("teacher_course") * 0.04;
  if (source === "校史馆" && (key === "damage" || key === "speed")) value += hasResearch("museum_spirit") ? 0.05 : 0;
  if (source === "中科大星" && (key === "damage" || key === "range")) value += hasResearch("star_calibration") ? 0.05 : 0;
  return value;
}

function towerStats(tower) {
  const data = TOWERS[tower.kind];
  const levelScale = 1 + 0.28 * (tower.level - 1);
  return {
    damage: data.damage * levelScale * state.mods.damage * towerBonus(tower, "damage") * towerDamageModifier(tower, null),
    range: data.range * levelScale * state.mods.range * towerBonus(tower, "range"),
    cooldown: (data.cooldown * Math.pow(0.88, tower.level - 1)) / (state.mods.speed * towerBonus(tower, "speed") * towerSpeedModifier(tower, performance.now() / 1000)),
    shots: tower.level,
    income: tower.kind === "coffee" ? Math.trunc((5 + tower.level * 2) * towerBonus(tower, "income") * state.mods.coffeeIncome) : null,
  };
}

function towerDamageModifier(tower, target) {
  if (!tower) return 1;
  let value = 1;
  if (tower.kind === "math") value *= state.mods.mathDamage * (1 + (state.mods.mathExtraDamage || 0));
  if (tower.kind === "physics") value *= 1 + (state.mods.physicsDamage || 0);
  if (tower.kind === "lab") value *= 1 + (state.mods.labDamage || 0);
  if (tower.kind === "coffee") value *= 1 + (state.mods.coffeeDamage || 0);
  if (tower.kind === "math" && target && ENEMIES[target.kind]?.boss) value *= state.mods.mathBossDamage;
  if (tower.sampleProject) value *= 1.2;
  if (state.mods.sameTowerDamage && tower.kind) {
    const same = state.slots.filter(slot => slot.tower?.kind === tower.kind).length;
    value *= 1 + Math.max(0, same - 1) * state.mods.sameTowerDamage;
  }
  if (state.mods.diversityDamage) {
    const kinds = new Set(state.slots.map(slot => slot.tower?.kind).filter(Boolean));
    if (kinds.size >= 4) value *= 1 + state.mods.diversityDamage;
  }
  if (state.mods.lowGpaDamage) {
    const missing = Math.max(0, (state.maxLife || GPA_MAX) - state.life);
    value *= 1 + Math.min(state.mods.lowGpaDamage, missing / Math.max(1, state.maxLife || GPA_MAX) * state.mods.lowGpaDamage * 2);
  }
  return value;
}

function towerSpeedModifier(tower, now) {
  if (!tower) return 1;
  let value = tower.kind === "physics" ? state.mods.physicsSpeed : 1;
  if (tower.kind === "math") value *= 1 + (state.mods.mathSpeed || 0);
  if (tower.kind === "physics") value *= 1 + (state.mods.physicsExtraSpeed || 0);
  if (tower.kind === "coffee") value *= 1 + (state.mods.coffeeSpeed || 0);
  if (state.lowGpaBoostUntil && now < state.lowGpaBoostUntil) value *= 1.18;
  if (state.mods.coffeeAura && tower.kind !== "coffee" && state.slots.some(slot => slot.tower?.kind === "coffee" && distance([slot.x, slot.y], [tower.x, tower.y]) <= TOWERS.coffee.range)) {
    value *= 1 + state.mods.coffeeAura;
  }
  return value;
}

function labSplashRadius() {
  return (TOWERS.lab.splash + (state.mods.labSplashBonus || 0)) * (1 + (state.mods.labSplashScale || 0));
}

function highestHpEnemy() {
  return state.enemies.reduce((best, enemy) => (!best || enemy.hp > best.hp ? enemy : best), null);
}

function slowEnemiesAround(x, y, slow, radius, duration) {
  const now = performance.now() / 1000;
  for (const enemy of state.enemies) {
    const point = pointAt(enemy.progress, enemy.path);
    if (distance([x, y], point) > radius) continue;
    enemy.slowFactor = Math.min(enemy.slowFactor || 1, Math.max(0.25, 1 - slow));
    enemy.slowUntil = Math.max(enemy.slowUntil || 0, now + duration);
  }
}

function upgradeRandomTower() {
  const candidates = state.slots.map(slot => slot.tower).filter(tower => tower && tower.level < 3);
  if (!candidates.length) return false;
  const tower = candidates[Math.floor(Math.random() * candidates.length)];
  tower.level += 1;
  markFirstLv3Bonus(tower);
  state.floating.push({ x: tower.x, y: tower.y - 28, text: "老师点名 Lv+1", color: "#fbbf24", life: 1.0 });
  return true;
}

function markFirstLv3Bonus(tower) {
  if (!state.mods.sampleProject || state.sampleProjectApplied || tower.level < 3) return;
  state.sampleProjectApplied = true;
  tower.sampleProject = true;
  state.floating.push({ x: tower.x, y: tower.y - 34, text: "样板工程", color: THEME_BLUE, life: 1.0 });
}

function triggerLowGpaResearch(now) {
  if (state.life < 10 && hasResearch("dont_fail") && !state.lowGpaBoostUsed) {
    state.lowGpaBoostUsed = true;
    state.lowGpaBoostUntil = now + 12;
    state.floating.push({ x: WIDTH / 2, y: 118, text: "稳住别挂科", color: THEME_GREEN, life: 1.2 });
  }
  if (state.life < 10 && hasResearch("starcloud_help") && !state.starcloudHelpUsed) {
    state.starcloudHelpUsed = true;
    state.starcloudSlowUntil = now + 5;
    state.resources += 60;
    state.floating.push({ x: WIDTH / 2, y: 148, text: "瀚海星云求助 +60", color: "#a78bfa", life: 1.2 });
  }
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
  const choiceCount = hasResearch("interdisciplinary") ? 4 : 3;
  state.choices = sample(buildEnhancementPool(), choiceCount);
  switchOverlay("choosing");
}

function buildEnhancementPool() {
  const heal = amount => {
    state.life = Math.min(state.maxLife || GPA_MAX, state.life + amount);
  };
  const add = (key, value) => {
    state.mods[key] = (state.mods[key] || 0) + value;
  };
  const multiply = (key, value) => {
    state.mods[key] = (state.mods[key] || 1) * value;
  };
  return [
    ["学术经费增援", "立刻拨发 50 点前线调度资源。", () => state.resources += 50, "普通"],
    ["高能公式核定", "全防线炮塔基础伤害 +10%。", () => add("damage", 0.1), "普通"],
    ["运算超频共振", "全防线射击冷却降低，相当于攻速 +10%。", () => add("speed", 0.1), "普通"],
    ["全域学术视界", "全防线攻击范围 +10%。", () => add("range", 0.1), "普通"],
    ["临时助研招募", "击杀每个怪物额外获得 3 资源。", () => add("killBonus", 3), "普通"],
    ["临时补考", "立刻恢复 0.3 GPA。", () => heal(3), "普通"],
    ["报销单通过", "本局所有建塔和升级费用 -10%。", () => { multiply("buildCostScale", 0.9); multiply("upgradeCostScale", 0.9); }, "普通"],
    ["奖学金到账", "每波开始额外获得 20 资源。", () => add("waveStartResource", 20), "普通"],
    ["咖啡赞助", "咖啡塔收益 +25%。", () => add("coffeeIncome", 0.25), "普通"],
    ["实验记录本", "实验报告怪首次受击减伤效果降低。", () => state.mods.reportFirstHitFix = true, "普通"],

    ["集中注意力", "全塔伤害 +18%，但射程 -8%。", () => { add("damage", 0.18); add("range", -0.08); }, "稀有"],
    ["远程旁听", "全塔射程 +20%，但伤害 -8%。", () => { add("range", 0.2); add("damage", -0.08); }, "稀有"],
    ["精准审题", "当前血量最高的敌人受到伤害 +15%。", () => add("highHpDamage", 0.15), "稀有"],
    ["临场发挥", "每波开始随机获得伤害、攻速或射程 +8%。", () => state.mods.randomWaveBuff = true, "稀有"],
    ["资源复利", "当前资源每有 100 点，全塔伤害 +3%，最多 +15%。", () => { add("resourceDamage", 0.03); state.mods.resourceDamageCap = Math.max(state.mods.resourceDamageCap || 0, 0.15); }, "稀有"],
    ["高数竞赛", "高数塔伤害 +25%，但高数塔攻速 -8%。", () => { add("mathExtraDamage", 0.25); add("mathSpeed", -0.08); }, "稀有"],
    ["物理连打", "物理塔攻速 +20%，但单发伤害 -6%。", () => { add("physicsExtraSpeed", 0.2); add("physicsDamage", -0.06); }, "稀有"],
    ["实验爆燃", "实验塔溅射范围 +20%。", () => add("labSplashScale", 0.2), "稀有"],
    ["咖啡因过载", "咖啡塔减速 +10%，但咖啡塔伤害 -50%。", () => { add("globalSlow", 0.1); add("coffeeDamage", -0.5); }, "稀有"],
    ["交叉培养", "四种塔都在场时，全塔伤害 +12%。", () => add("diversityDamage", 0.12), "稀有"],
    ["单科偏执", "同类塔越多，该类塔伤害越高。", () => add("sameTowerDamage", 0.04), "稀有"],
    ["样板工程", "第一个升到 Lv.3 的塔额外伤害 +20%。", () => state.mods.sampleProject = true, "稀有"],
    ["DDL 延期申请", "所有 DDL 怪倒计时 +1 秒。", () => add("ddlFuseBonus", 1), "稀有"],
    ["反向催更", "DDL 怪死亡时小范围减速周围敌人。", () => add("ddlDeathSlow", 0.35), "稀有"],
    ["查重系统", "PPT 怪分裂出来的小怪血量 -30%。", () => multiply("splitHpScale", 0.7), "稀有"],
    ["期中押题", "Boss 受到伤害 +12%。", () => add("bossDamage", 0.12), "稀有"],
    ["教务通缉令", "每个 DDL 怪额外奖励提高。", () => add("killBonus", 4), "稀有"],
    ["群聊提醒", "怪物越接近教务处，移速越低。", () => add("nearOfficeSlow", 0.12), "稀有"],
    ["校医院急救", "每击杀 25 个怪物恢复 0.1 GPA。", () => state.mods.killHealEvery = Math.min(state.mods.killHealEvery || 25, 25), "稀有"],
    ["保底绩点", "GPA 越低，全塔伤害越高，最多 +20%。", () => add("lowGpaDamage", 0.2), "稀有"],
    ["教务缓冲", "下一次怪物进入教务处不扣 GPA。", () => state.nextLeakShield = true, "稀有"],

    ["疯狂星期四", "立刻获得 160 资源，但下一波怪物数量 +25%。", () => { state.resources += 160; state.nextWaveEnemyScale = Math.max(state.nextWaveEnemyScale || 1, 1.25); }, "史诗"],
    ["压线提交", "全塔伤害 +30%，但 DDL 怪倒计时 -1 秒。", () => { add("damage", 0.3); add("ddlFusePenalty", 1); }, "史诗"],
    ["速成班", "随机一个塔立即升 1 级，但之后升级费用 +10%。", () => { upgradeRandomTower(); multiply("upgradeCostScale", 1.1); }, "史诗"],
    ["论文冲刺", "Boss 波伤害 +35%，普通怪伤害 -8%。", () => { add("bossDamage", 0.35); add("nonBossDamage", -0.08); }, "史诗"],
    ["奖励自己", "立刻恢复 0.4 GPA，但资源归零。", () => { heal(4); state.resources = 0; }, "史诗"],
    ["风险投资", "当前资源翻倍，但下一波敌人血量 +20%。", () => { state.resources *= 2; state.nextWaveHpScale = Math.max(state.nextWaveHpScale || 1, 1.2); }, "史诗"],
    ["开摆哲学", "本波内不再获得击杀资源，但强化经验 +100%。", () => state.mods.noResourceWave = state.wave, "史诗"],
    ["盲审通过", "随机获得一个强力增益，也随机获得一个小惩罚。", () => applyBlindReview(), "史诗"],

    ["星云热帖", "复制上一次强化的部分收益；若没有记录，则获得伤害 +8%。", () => replayLastEnhancement(), "整活"],
    ["组会沉默", "下一波前 5 秒所有敌人减速 40%。", () => state.silenceNextWave = true, "整活"],
    ["老师点名", "随机一个未满级的塔立即升 1 级。", () => upgradeRandomTower(), "整活"],
    ["临时换题", "下一次回收塔返还 100% 已投入资源。", () => add("fullRefundCharges", 1), "整活"],
    ["校园广播", "当前场上所有敌人短暂停顿。", () => slowEnemiesAround(WIDTH / 2, HEIGHT / 2, 0.75, 9999, 1.5), "整活"],
    ["摸鱼窗口", "立刻获得 5 秒全塔攻速 +20%。", () => state.lowGpaBoostUntil = performance.now() / 1000 + 5, "整活"],
    ["瀚海求助", "立刻获得 80 资源，并短暂全局减速。", () => { state.resources += 80; state.starcloudSlowUntil = performance.now() / 1000 + 3; }, "整活"],
    ["学术传承", "后续强化经验需求降低 12%。", () => multiply("enhanceNeedScale", 0.88), "整活"],
  ];
}

function applyBlindReview() {
  const good = [
    () => state.mods.damage += 0.22,
    () => state.mods.speed += 0.22,
    () => state.mods.range += 0.22,
    () => state.resources += 140,
  ];
  const bad = [
    () => state.mods.range -= 0.08,
    () => state.mods.damage -= 0.08,
    () => state.nextWaveEnemyScale = Math.max(state.nextWaveEnemyScale || 1, 1.18),
    () => state.nextWaveHpScale = Math.max(state.nextWaveHpScale || 1, 1.15),
  ];
  good[Math.floor(Math.random() * good.length)]();
  bad[Math.floor(Math.random() * bad.length)]();
}

function replayLastEnhancement() {
  if (state.lastEnhancementReplay) {
    state.lastEnhancementReplay();
    return;
  }
  state.mods.damage += 0.08;
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
  const bossArchiveScale = hasResearch("committee_archive") && state.wave >= 5 ? 0.12 : 0;
  const researchScale = 1 + researchLevel("scholarship_edge") * 0.1 + bossArchiveScale;
  const highGpaBonus = won && hasResearch("final_review") && state.life >= 30 ? 60 : 0;
  return Math.trunc(c * difficultyScale * researchScale + highGpaBonus);
}
