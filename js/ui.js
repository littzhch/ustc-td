// 本文件由 game.js 拆分而来，保持普通 script 全局加载以兼容 file:// 运行。
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
  else if (mode === "guide") renderGameplayGuide();
  else if (mode === "choosing") renderEnhancementMenu();
  else if (mode === "gameover" || mode === "victory") renderResultMenu(mode === "victory");
  else if (mode === "paused") renderPauseMenu();
}

function renderMainMenu() {
  const difficulty = DIFFICULTIES[difficultyKey] || DIFFICULTIES.confidential;
  const runSave = loadRunSave();
  const selectedMap = MAPS[mapIndex] || MAPS[0];
  const savedMap = runSave ? (MAPS[runSave.mapIndex] || MAPS[0]) : null;
  const continueHtml = runSave ? `
    <div class="continue-run">
      <div>
        <strong>${DIFFICULTIES[runSave.difficultyKey]?.label || "机密"}${savedMap.name} · 第 ${runSave.state?.wave || 0} 波</strong>
        <span>上次存档 ${formatSaveTime(runSave.savedAt)}</span>
      </div>
      <button class="prime-btn" onclick="continueSavedRun()">继续存档</button>
      <button class="sub-btn danger-lite" onclick="deleteSavedRun()">删除</button>
    </div>
  ` : "";
  const historyHtml = [...save.history].reverse().slice(0, 4).map(r => `
    <div class="history-item ${r.won ? "win" : "lose"}">
      <div class="meta"><span>${r.won ? "守卫成功" : "防线失守"}</span><span>${r.difficulty || "机密"} 第 ${r.wave} 波</span></div>
      <div style="color:var(--text-muted); font-size:11px;">积分: ${r.score} | 学分: +${r.credits}</div>
    </div>
  `).join("") || '<p style="color:var(--text-muted); font-size:13px;">暂无校园守卫记录。</p>';

  const mapsHtml = MAPS.map((map, idx) => `
    <div class="map-node ${idx === mapIndex ? `active ${difficultyKey}` : ""} ${map.locked ? "locked" : ""}" onclick="selectMapNode(${idx})">
      <h3>${idx === mapIndex && !map.locked ? `${difficulty.label}${map.name}` : map.name}</h3>
      <p>${map.subtitle}</p>
      <span class="map-tag">${map.locked ? map.preview : (idx === mapIndex ? difficulty.title : map.preview)}</span>
    </div>
  `).join("");

  const difficultyHtml = Object.entries(DIFFICULTIES).map(([key, item]) => `
    <button class="difficulty-btn ${difficultyKey === key ? `active ${key}` : ""}" onclick="selectDifficulty('${key}')">
      <span>${item.title}</span>
      <small>${item.desc}</small>
    </button>
  `).join("");

  screenOverlay.innerHTML = `
    <div class="menu-layout">
      <div class="menu-main">
        <div class="brand">
          <p class="eyebrow">USTC Roguelike TD</p>
          <h1>科大守卫战</h1>
          <p class="subtitle">${selectedMap.name}进入布防预览。书本怪物将沿校园道路逼近核心建筑。</p>
        </div>
        ${continueHtml}
        <div class="difficulty-panel ${difficultyKey}">
          <div>
            <div class="sidebar-title">行动级别</div>
            <p>${difficulty.label}${selectedMap.name} · ${difficulty.desc}</p>
          </div>
          <div class="difficulty-switch">${difficultyHtml}</div>
        </div>
        <h2 style="margin-top:20px;">选择校园前线</h2>
        <div class="map-deck">${mapsHtml}</div>
        <div class="action-row">
          <button class="prime-btn" onclick="startBattle()">正式出战</button>
          <button class="sub-btn" style="margin-top:32px;" onclick="switchOverlay('guide')">玩法说明</button>
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

function renderGameplayGuide() {
  screenOverlay.innerHTML = `
    <div class="brand">
      <p class="eyebrow">玩法说明</p>
      <h1>守住目标建筑，保住 GPA</h1>
      <p class="subtitle">怪物会从校园边缘道路涌入，自动绕开建筑前往本张地图的核心目标。你的目标是在它们冲进去前完成拦截。</p>
    </div>
    <div class="guide-grid">
      <section class="guide-card">
        <h3>基础目标</h3>
        <p>GPA 满分为 4.3。怪物到达目标建筑会扣 GPA，GPA 归零则防线失败。击杀怪物获得资源，并积累强化经验。</p>
      </section>
      <section class="guide-card">
        <h3>部署防线</h3>
        <p>左键点击部署点建塔或升级。右键点击已建塔查看详细数值。右键空地可花费资源新增临时部署点，但没有建筑加成。</p>
      </section>
      <section class="guide-card">
        <h3>建筑加成</h3>
        <p>建筑内部部署点带有地图特色加成。例如图书馆加射程，行政楼加攻速，中科大星加伤害和射程，食堂强化咖啡塔收益。</p>
      </section>
      <section class="guide-card">
        <h3>防御塔</h3>
        <p>高数塔高伤单体，物理塔高速拦截，实验塔范围溅射，咖啡塔减速并产出资源。塔最高 Lv.3，每升一级会额外多攻击一个目标。</p>
      </section>
      <section class="guide-card">
        <h3>怪物机制</h3>
        <p>作业怪是基础单位。DDL 怪高速且带 2-7 秒倒计时，击杀会恢复 0.1 GPA，未击杀会自爆并让范围内高等级塔降级。</p>
      </section>
      <section class="guide-card">
        <h3>Boss 波</h3>
        <p>每 5 波出现一个 Boss。期中试卷会加卷，DDL 总负责人会追责降级，实验验收有护甲，毕业论文死亡后会拆分成多种怪物。</p>
      </section>
      <section class="guide-card">
        <h3>强化经验</h3>
        <p>击杀怪物会增长 HUD 上的强化经验条。经验满后暂停战斗并选择一项强化，强化会在本局内持续生效。</p>
      </section>
      <section class="guide-card">
        <h3>难度与存档</h3>
        <p>机密是有限波次，绝密是无尽模式，后期怪物会持续膨胀。战斗中可手动存档，主菜单可继续存档。</p>
      </section>
    </div>
    <div class="action-row">
      <button class="prime-btn" onclick="switchOverlay('menu')">返回主菜单</button>
      <button class="sub-btn" onclick="startBattle()">直接出战</button>
    </div>
  `;
}

function renderGrowthMenu() {
  const branch = RESEARCH_BRANCHES.find(item => item.key === growthBranchKey) || RESEARCH_BRANCHES[0];
  growthBranchKey = branch.key;
  save.selectedResearchBranch = branch.key;
  if (!growthSelectedNodeId || !branch.nodes.some(node => node.id === growthSelectedNodeId)) {
    growthSelectedNodeId = branch.nodes.find(node => researchPrereqsMet(node) && researchLevel(node.id) < (node.max || 1))?.id || branch.nodes[0].id;
  }
  const selectedNode = RESEARCH_NODE_MAP[growthSelectedNodeId] || branch.nodes[0];
  const branchesHtml = RESEARCH_BRANCHES.map(item => {
    const total = item.nodes.reduce((sum, node) => sum + (node.max || 1), 0);
    const learned = item.nodes.reduce((sum, node) => sum + researchLevel(node.id), 0);
    return `
      <button class="research-tab ${item.key === branch.key ? "active" : ""}" style="--branch:${item.accent};" onclick="selectGrowthBranch('${item.key}')">
        <span>${item.title}</span>
        <strong>${learned}/${total}</strong>
      </button>
    `;
  }).join("");
  const edgesHtml = branch.nodes.flatMap(node => (node.requires || []).map(reqId => {
    const req = branch.nodes.find(item => item.id === reqId);
    if (!req) return "";
    const active = hasResearch(req.id) && hasResearch(node.id);
    const ready = hasResearch(req.id) && researchPrereqsMet(node);
    return `<line class="${active ? "active" : ready ? "ready" : ""}" x1="${req.x}" y1="${req.y}" x2="${node.x}" y2="${node.y}" />`;
  })).join("");
  const nodesHtml = branch.nodes.map(node => {
    const level = researchLevel(node.id);
    const max = node.max || 1;
    const locked = !researchPrereqsMet(node);
    const available = !locked && level < max && save.credits >= researchCost(node.id);
    const selected = node.id === selectedNode.id;
    const stateClass = level >= max ? "maxed" : locked ? "locked" : available ? "available" : "open";
    return `
      <button class="research-node ${stateClass} ${selected ? "selected" : ""}" style="left:${node.x}%; top:${node.y}%; --branch:${branch.accent};" onclick="selectResearchNode('${node.id}')">
        <i>${node.icon}</i>
        <span>${level}/${max}</span>
      </button>
    `;
  }).join("");
  const selectedLevel = researchLevel(selectedNode.id);
  const selectedMax = selectedNode.max || 1;
  const selectedCost = researchCost(selectedNode.id);
  const prereqs = selectedNode.requires?.length
    ? selectedNode.requires.map(id => `<span class="${hasResearch(id) ? "done" : ""}">${RESEARCH_NODE_MAP[id]?.name || id}</span>`).join("")
    : '<span class="done">无前置</span>';
  const canBuy = selectedLevel < selectedMax && researchPrereqsMet(selectedNode) && save.credits >= selectedCost;
  const blockedText = selectedLevel >= selectedMax ? "已完成" : (!researchPrereqsMet(selectedNode) ? "前置不足" : (save.credits < selectedCost ? "学分不足" : "投入学分"));

  screenOverlay.innerHTML = `
    <div class="research-page">
      <header class="research-head">
        <div>
          <p class="eyebrow">科研课题树</p>
          <h1>思维变迁档案</h1>
          <p>${branch.motto}</p>
        </div>
        <div class="research-wallet">
          <span>可用学术学分</span>
          <strong>${save.credits}</strong>
          <small>已立项 ${researchUnlockedCount()} 项</small>
        </div>
      </header>
      <div class="research-shell">
        <aside class="research-tabs">${branchesHtml}</aside>
        <section class="research-board" style="--branch:${branch.accent};">
          <div class="research-board-title">
            <span>${branch.title}</span>
            <small>${branch.motto}</small>
          </div>
          <svg class="research-lines" viewBox="0 0 100 100" preserveAspectRatio="none">${edgesHtml}</svg>
          ${nodesHtml}
        </section>
        <aside class="research-detail" style="--branch:${branch.accent};">
          <div class="detail-orbit">${selectedNode.icon}</div>
          <p class="detail-kicker">${branch.title}</p>
          <h2>${selectedNode.name}</h2>
          <div class="detail-level">Lv.${selectedLevel} / ${selectedMax}</div>
          <p class="detail-desc">${selectedNode.desc}</p>
          <div class="detail-prereqs">
            <strong>前置课题</strong>
            <div>${prereqs}</div>
          </div>
          <button class="prime-btn research-buy" ${canBuy ? "" : "disabled"} onclick="buyResearchNode('${selectedNode.id}')">
            ${selectedLevel >= selectedMax ? "课题已完成" : `${blockedText}${Number.isFinite(selectedCost) ? ` · ${selectedCost}` : ""}`}
          </button>
        </aside>
      </div>
      <div class="action-row research-actions">
        <button class="prime-btn" onclick="switchOverlay('menu')">保存并返回主菜单</button>
      </div>
    </div>
  `;
}

function renderEnhancementMenu() {
  const pct = Math.min(100, Math.round((state.enhanceXp / state.enhanceXpNeed) * 100));
  const choicesHtml = state.choices.map(([title, desc, _action, rarity = "普通"], idx) => `
    <div class="choice-box rarity-${rarity}" onclick="pickEnhancement(${idx})">
      <span class="choice-rarity">${rarity}</span>
      <h3>${title}</h3>
      <p>${desc}</p>
      <button class="prime-btn" style="margin-top:0; width:100px; padding:8px 0; font-size:12px;">注入</button>
    </div>
  `).join("");

  screenOverlay.innerHTML = `
    <div class="brand" style="text-align:center;">
      <p class="eyebrow">研修进度 ${state.enhanceXp} / ${state.enhanceXpNeed}</p>
      <h1 style="background: linear-gradient(120deg, #fff, var(--theme-purple)); -webkit-background-clip: text;">提取突破性科研强化</h1>
      <p class="subtitle">击杀课程怪会积累强化经验。当前进度已满载，请选择一项核心突破。</p>
      <div class="enhance-meter">
        <i style="width:${pct}%;"></i>
        <span>${pct}%</span>
      </div>
    </div>
    <div class="choice-deck">${choicesHtml}</div>
    ${state.enhancementRerolls > 0 ? '<div class="action-row" style="justify-content:center;"><button class="sub-btn" onclick="rerollEnhancement()">课题重投</button></div>' : ""}
  `;
}

function renderPauseMenu() {
  screenOverlay.innerHTML = `
    <div style="margin: auto; text-align:center; max-width:400px;">
      <h1 style="font-size:36px; margin-bottom:24px;">战局已暂停</h1>
      <div class="item-shelf" style="gap:16px;">
        <button class="prime-btn" style="width:100%; margin:0;" onclick="resumeBattle()">回到防线</button>
        <button class="sub-btn" style="width:100%;" onclick="savePausedRun()">保存当前战局</button>
        <button class="sub-btn" style="width:100%;" onclick="startBattle()">重构本局防线 (重开)</button>
        <button class="sub-btn" style="width:100%; color:var(--theme-rose);" onclick="switchOverlay('menu')">放弃并返回主菜单</button>
      </div>
    </div>
  `;
}

function savePausedRun() {
  saveRunSnapshot(false);
  renderPauseMenu();
}

function renderResultMenu(won) {
  const mods = state.chosenMods.length ? state.chosenMods.join(" 、 ") : "无核心突破";
  const credits = state.lastCredits || calculateCredits(won);
  screenOverlay.innerHTML = `
    <div style="margin: auto; text-align:center; max-width:600px;">
      <p class="eyebrow">${won ? "SUCCESS GUARDIAN" : "防线溃缩"}</p>
      <h1 style="font-size:48px; background:linear-gradient(135deg, #fff, ${won ? "var(--theme-green)" : "var(--theme-rose)"}); -webkit-background-clip:text;">${won ? "课题组防线坚固如初" : "已被 DDL 怪潮淹没"}</h1>
      <p class="subtitle" style="margin-bottom:32px;">最终 GPA 与结算报告已提交教务系统</p>
      <div class="growth-grid" style="grid-template-columns:1fr; margin-bottom:32px;">
        <div class="growth-section" style="text-align:left; font-size:14px; line-height:2;">
          <div>行动级别: <strong style="color:${state.difficultyKey === "topsecret" ? "var(--theme-rose)" : "var(--theme-green)"};">${state.difficulty?.label || "机密"}郭沫若广场</strong></div>
          <div>阻击波次: <strong style="color:#fff;">${state.wave} / ${state.difficulty?.endless ? "∞" : state.maxWaves}</strong></div>
          <div>剩余 GPA: <strong style="color:var(--theme-green);">${formatGpa(state.life)}</strong></div>
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
  if (MAPS[idx].locked) return;
  mapIndex = idx;
  renderMainMenu();
}

function selectDifficulty(key) {
  if (!(key in DIFFICULTIES)) return;
  difficultyKey = key;
  save.difficulty = key;
  writeSave();
  renderMainMenu();
}

function formatSaveTime(time) {
  const date = new Date(time || Date.now());
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  return `${mm}-${dd} ${hh}:${mi}`;
}

function continueSavedRun() {
  const snapshot = loadRunSave();
  if (!snapshot) {
    renderMainMenu();
    return;
  }
  restoreRunFromSave(snapshot);
}

function deleteSavedRun() {
  clearRunSave();
  renderMainMenu();
}

function startBattle() {
  if (MAPS[mapIndex].locked) return;
  clearRunSave();
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

function selectGrowthBranch(key) {
  if (!RESEARCH_BRANCHES.some(branch => branch.key === key)) return;
  growthBranchKey = key;
  save.selectedResearchBranch = key;
  growthSelectedNodeId = null;
  writeSave();
  renderGrowthMenu();
}

function selectResearchNode(id) {
  if (!RESEARCH_NODE_MAP[id]) return;
  growthSelectedNodeId = id;
  growthBranchKey = RESEARCH_NODE_MAP[id].branch;
  save.selectedResearchBranch = growthBranchKey;
  writeSave();
  renderGrowthMenu();
}

function buyResearchNode(id) {
  const node = RESEARCH_NODE_MAP[id];
  if (!node || !researchPrereqsMet(node)) return;
  const level = researchLevel(id);
  if (level >= (node.max || 1)) return;
  const cost = researchCost(id);
  if (save.credits < cost) return;
  save.credits -= cost;
  save.research[id] = level + 1;
  growthSelectedNodeId = id;
  growthBranchKey = node.branch;
  save.selectedResearchBranch = node.branch;
  writeSave();
  renderGrowthMenu();
}

function rerollEnhancement() {
  if (state.mode !== "choosing" || state.enhancementRerolls <= 0) return;
  state.enhancementRerolls -= 1;
  openEnhancements();
}

function pickEnhancement(idx) {
  const [title, _desc, action] = state.choices[idx];
  action();
  if (title !== "星云热帖") state.lastEnhancementReplay = action;
  state.chosenMods.push(title);
  const overflow = Math.max(0, state.enhanceXp - state.enhanceXpNeed);
  state.enhanceLevel += 1;
  state.enhanceXpNeed = Math.max(60, Math.trunc(nextEnhanceNeed(state.enhanceLevel) * (state.mods.enhanceNeedScale || 1)));
  state.enhanceXp = Math.min(overflow, Math.floor(state.enhanceXpNeed * 0.35));
  state.pendingEnhancement = false;
  resumeBattle();
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
    const cost = towerBuildCost(kind);
    const item = document.createElement("div");
    item.className = `hotbar-item ${hotKeySelectedTower === kind ? "selected" : ""} ${inspectedTowerKind === kind ? "inspecting" : ""}`;
    item.innerHTML = `
      <span class="cost">${cost}</span>
      <div class="tower-token ${kind}">${towerGlyph(kind)}</div>
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

function towerGlyph(kind) {
  if (kind === "math") return "∫";
  if (kind === "physics") return "Φ";
  if (kind === "lab") return "◇";
  if (kind === "coffee") return "C";
  return "T";
}
