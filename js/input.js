// 本文件由 game.js 拆分而来，保持普通 script 全局加载以兼容 file:// 运行。
function updateHud() {
  ui.life.textContent = formatGpa(state.life ?? GPA_MAX);
  ui.resource.textContent = state.resources ?? 0;
  const maxWaveText = state.difficulty?.endless ? "∞" : (state.maxWaves ?? WAVE_TABLE.length);
  ui.wave.textContent = `${state.wave ?? 0}/${maxWaveText}`;
  const xp = state.enhanceXp ?? 0;
  const xpNeed = state.enhanceXpNeed ?? nextEnhanceNeed(0);
  const xpPct = Math.max(0, Math.min(100, (xp / xpNeed) * 100));
  if (ui.enhanceXpBar) ui.enhanceXpBar.style.width = `${xpPct}%`;
  if (ui.enhanceXpText) ui.enhanceXpText.textContent = `${Math.floor(xp)}/${xpNeed}`;
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

canvas.addEventListener("contextmenu", ev => {
  if (state.mode !== "running") return;
  ev.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const x = (ev.clientX - rect.left) * (WIDTH / rect.width);
  const y = (ev.clientY - rect.top) * (HEIGHT / rect.height);
  const existingIdx = state.slots.findIndex(s => distance([x, y], [s.x, s.y]) <= 28);
  if (existingIdx >= 0) {
    state.selectedSlot = existingIdx;
    if (state.slots[existingIdx].tower) {
      showPlacedTowerBubble(state.slots[existingIdx], ev.clientX - rect.left, ev.clientY - rect.top);
    } else {
      state.floating.push({ x, y: y - 10, text: "左键建造", color: THEME_GREEN, life: 0.8 });
    }
    return;
  }
  const result = addCustomBuildSlot(x, y);
  state.floating.push({
    x,
    y: y - 10,
    text: result.ok ? "新增部署点" : result.reason,
    color: result.ok ? THEME_GREEN : THEME_ROSE,
    life: 0.9,
  });
});

canvas.addEventListener("mousemove", () => {});

function addCustomBuildSlot(x, y) {
  const point = [x, y];
  if (x < 34 || x > WIDTH - 34 || y < 34 || y > HEIGHT - 34) return { ok: false, reason: "边界太近" };
  if (state.resources < CUSTOM_SLOT_COST) return { ok: false, reason: `需要 ${CUSTOM_SLOT_COST} 资源` };
  if (pointBlocked(x, y, state.map.target)) return { ok: false, reason: "此处不可部署" };
  if (state.map.target && distance(point, state.map.target) < 58) return { ok: false, reason: "离教务处太近" };
  if (state.slots.some(slot => distance([slot.x, slot.y], point) < 48)) return { ok: false, reason: "距离太近" };
  state.resources -= CUSTOM_SLOT_COST;
  state.slots.push({ x: Math.round(x), y: Math.round(y), tower: null, custom: true });
  state.selectedSlot = state.slots.length - 1;
  return { ok: true };
}

function slotBonusHtml(slot) {
  if (slot.bonus) {
    return `<div class="tower-tip"><strong>${slot.bonus.name}</strong>：${slot.bonus.desc}</div>`;
  }
  if (slot.custom) {
    return `<div class="tower-tip"><strong>临时部署点</strong>：无建筑加成，已花费 ${CUSTOM_SLOT_COST} 资源开设。</div>`;
  }
  return "";
}

function popBuildBubble(slot, x, y) {
  buildPanel.classList.remove("hover-bubble");
  buildPanel.style.left = `${Math.min(x + 12, canvas.clientWidth - 260)}px`;
  buildPanel.style.top = `${Math.min(y + 12, canvas.clientHeight - 180)}px`;

  if (!slot.tower) {
    buildPanel.innerHTML = `
      <h3>研发布署防线</h3>
      <p>选择要在当前学术槽位架设的模型：</p>
      ${slotBonusHtml(slot)}
      <div class="bubble-ops" id="opsG"></div>
    `;
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
      ${slotBonusHtml(slot)}
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

function showPlacedTowerBubble(slot, x, y) {
  buildPanel.classList.remove("hover-bubble");
  const tower = slot.tower;
  const data = TOWERS[tower.kind];
  const stats = towerStats(tower);
  buildPanel.style.left = `${Math.min(x + 16, canvas.clientWidth - 270)}px`;
  buildPanel.style.top = `${Math.min(y + 16, canvas.clientHeight - 230)}px`;
  buildPanel.innerHTML = `
    <h3>${data.name} Lv.${tower.level}</h3>
    <div class="tower-role">${data.role}</div>
    ${slotBonusHtml(slot)}
    <div class="tower-stat-grid">
      <div><span>实际伤害</span><strong>${stats.damage.toFixed(1)}</strong></div>
      <div><span>实际射程</span><strong>${Math.round(stats.range)}</strong></div>
      <div><span>冷却</span><strong>${stats.cooldown.toFixed(2)}s</strong></div>
      <div><span>每轮发射</span><strong>${stats.shots} 发</strong></div>
      ${stats.income ? `<div><span>补给收益</span><strong>+${stats.income}</strong></div>` : ""}
      <div><span>已投入</span><strong>${tower.spent}</strong></div>
    </div>
    <div class="tower-tip">${towerSpecialText(tower.kind)}</div>
  `;
  buildPanel.classList.remove("hidden");
}

function showTowerInspectBubble(kind) {
  buildPanel.classList.remove("hover-bubble");
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
      <div class="tower-tip">升级：每升一级额外发射 1 发攻击。${towerSpecialText(kind)}</div>
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
    slot.tower = { kind, x: slot.x, y: slot.y, level: 1, spent: TOWERS[kind].cost, cooldownLeft: 0, incomeLeft: TOWERS[kind].incomeCd || 5, bonus: slot.bonus || null };
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

ui.saveBtn.onclick = () => saveRunSnapshot(true);
ui.pauseBtn.onclick = togglePause;
ui.abortBtn.onclick = () => {
  if (confirm("确定中途强制中止课题防线撤退吗？本局将无法提取学术学分。")) switchOverlay("menu");
};

window.addEventListener("beforeunload", () => {
  if (state.mode === "running" || state.mode === "paused") saveRunSnapshot(false);
});

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
