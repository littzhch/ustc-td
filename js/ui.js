// 本文件由 game.js 拆分而来，保持普通 script 全局加载以兼容 file:// 运行。
function switchOverlay(mode) {
  state.mode = mode;
  screenOverlay.classList.remove("mode-menu", "mode-growth", "mode-guide", "mode-choosing", "mode-gameover", "mode-victory", "mode-paused");
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
  screenOverlay.classList.add(`mode-${mode}`);

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

  const mapsHtml = MAPS.map((map, idx) => `
    <div class="premium-map-card ${idx === mapIndex ? "active" : ""} ${map.locked ? "locked" : ""}" onclick="selectMapNode(${idx})">
      <div class="premium-map-art">
        <img src="${menuMapThumb(map, idx)}" alt="${map.name}">
      </div>
      <h3>${map.name}</h3>
      <span class="premium-map-medal">${idx === mapIndex ? difficulty.label : map.preview}</span>
    </div>
  `).join("");

  const difficultyHtml = Object.entries(DIFFICULTIES).map(([key, item]) => `
    <button class="premium-chip ${difficultyKey === key ? "active" : ""}" onclick="selectDifficulty('${key}')">
      ${item.title}
    </button>
  `).join("");

  screenOverlay.innerHTML = `
    <div class="premium-menu">
      <header class="premium-menu-head">
        <div class="premium-brand-row">
          <img class="premium-crest" src="assets/ui/menu_crest_premium.png" alt="科大校徽">
          <div>
            <p class="premium-kicker">USTC DEFENSE</p>
            <h1>科大守卫战</h1>
          </div>
        </div>
        <div class="premium-top-actions">
          <button class="premium-archive" onclick="switchOverlay('growth')">
            <img src="assets/ui/menu_icon_archive_premium.png" alt="">
            <span>档案</span>
            <strong>${save.credits}</strong>
          </button>
          <button class="premium-round-btn" onclick="switchOverlay('guide')">
            <img src="assets/ui/menu_icon_pause_premium.png" alt="说明">
          </button>
        </div>
      </header>

      <section class="premium-map-deck">${mapsHtml}</section>

      <section class="premium-command-dock">
        <button class="premium-start-btn" onclick="startBattle()">
          <img src="assets/ui/menu_start_medal.png" alt="">
          <span>开始防守</span>
        </button>
        <div class="premium-dock-divider"></div>
        <button class="premium-continue-btn ${runSave ? "" : "disabled"}" ${runSave ? 'onclick="continueSavedRun()"' : "disabled"}>
          <span>继续</span>
        </button>
        <div class="premium-difficulty">${difficultyHtml}</div>
      </section>
    </div>
  `;
}

function menuMapThumb(map, idx) {
  if (map.bitmap === "gaoxinCampus" || idx === 1) return "assets/ui/menu_thumb_gaoxin.png";
  if (map.bitmap === "westCampus" || idx === 2) return "assets/ui/menu_thumb_west.png";
  return "assets/ui/menu_thumb_east.png";
}

const RESEARCH_ICON_ASSETS = {
  library: "assets/ui/research/research_library.png",
  academic: "assets/ui/research/research_academic.png",
  fountain: "assets/ui/research/research_fountain.png",
  radar: "assets/ui/research/research_radar.png",
  tree: "assets/ui/research/research_tree.png",
  bridge: "assets/ui/research/research_bridge.png",
  desk: "assets/ui/research/research_desk.png",
  archive: "assets/ui/research/research_archive.png",
};

const RESEARCH_NODE_ICON_BY_ID = {
  freshman_pack: "archive",
  gpa_buffer: "fountain",
  prestudy: "desk",
  office_firewall: "academic",
  dont_fail: "radar",
  scholarship_edge: "archive",
  final_review: "library",
  math_tutoring: "library",
  formula_burst: "radar",
  physics_team: "fountain",
  quantum_clicker: "radar",
  lab_safety: "academic",
  danger_reagent: "archive",
  coffee_refill: "desk",
  all_nighter: "tree",
  library_seat: "library",
  admin_stamp: "academic",
  canteen_subsidy: "fountain",
  teacher_course: "academic",
  museum_spirit: "archive",
  star_calibration: "radar",
  campus_planning: "bridge",
  golden_seat: "desk",
  deadline_radar: "radar",
  alarm_clock: "fountain",
  ta_intercept: "academic",
  emergency_review: "archive",
  crisis_pr: "bridge",
  reverse_delay: "radar",
  extension_pass: "library",
  advisor_unread: "archive",
  midterm_review: "library",
  no_extra_paper: "archive",
  ddl_filing: "radar",
  lab_prereview: "academic",
  paper_check: "library",
  mentor_signature: "desk",
  committee_archive: "archive",
  interdisciplinary: "bridge",
  reroll_project: "fountain",
  blind_box: "archive",
  mystic_tuning: "radar",
  pressure_group: "tree",
  defense_rehearsal: "academic",
  good_ppt: "desk",
  starcloud_help: "fountain",
};

const RESEARCH_BRANCH_ICON_BY_KEY = {
  survival: "archive",
  tower: "fountain",
  campus: "tree",
  deadline: "radar",
  boss: "bridge",
  weird: "archive",
};

function researchNodeIconSrc(node) {
  return RESEARCH_ICON_ASSETS[RESEARCH_NODE_ICON_BY_ID[node.id] || "archive"];
}

function researchBranchIconSrc(branchKey) {
  return RESEARCH_ICON_ASSETS[RESEARCH_BRANCH_ICON_BY_KEY[branchKey] || "archive"];
}

function renderPauseMenu() {
  screenOverlay.innerHTML = `
    <div class="premium-pause">
      <div class="premium-pause-copy">
        <p class="premium-kicker">TACTICAL PAUSE</p>
        <h1>防线暂停</h1>
      </div>
      <section class="premium-pause-panel">
        <img class="premium-pause-badge" src="assets/ui/menu_pause_badge_premium.png" alt="">
        <button class="premium-pause-action primary" onclick="resumeBattle()">
          <img src="assets/ui/pause_icon_continue_premium.png" alt="">
          <span>继续作战</span>
        </button>
        <button class="premium-pause-action" onclick="savePausedRun()">
          <img src="assets/ui/pause_icon_save_premium.png" alt="">
          <span>保存</span>
        </button>
        <button class="premium-pause-action" onclick="startBattle()">
          <img src="assets/ui/pause_icon_restart_premium.png" alt="">
          <span>重开</span>
        </button>
        <button class="premium-pause-action" onclick="switchOverlay('menu')">
          <img src="assets/ui/pause_icon_home_premium.png" alt="">
          <span>主菜单</span>
        </button>
      </section>
    </div>
  `;
}

function savePausedRun() {
  saveRunSnapshot(false);
  renderPauseMenu();
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
        <img src="${researchBranchIconSrc(item.key)}" alt="">
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
        <img class="research-node-art" src="${researchNodeIconSrc(node)}" alt="">
        <span class="research-node-label">
          <b>${node.name}</b>
          <em>${level}/${max}</em>
        </span>
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
  const totalResearchLevels = RESEARCH_BRANCHES.reduce(
    (sum, item) => sum + item.nodes.reduce((nodeSum, node) => nodeSum + (node.max || 1), 0),
    0,
  );
  const learnedResearchLevels = researchUnlockedCount();
  const allResearchNodes = RESEARCH_BRANCHES.flatMap(item => item.nodes);
  const affordableCount = allResearchNodes.filter(node => {
    const level = researchLevel(node.id);
    return level < (node.max || 1) && researchPrereqsMet(node) && save.credits >= researchCost(node.id);
  }).length;
  const completedCount = allResearchNodes.filter(node => researchLevel(node.id) >= (node.max || 1)).length;
  const completionPct = Math.round((learnedResearchLevels / totalResearchLevels) * 100);
  const selectedIcon = researchNodeIconSrc(selectedNode);

  screenOverlay.innerHTML = `
    <div class="research-page">
      <header class="research-head">
        <div class="research-title-lockup">
          <img class="research-crest" src="assets/ui/menu_crest_premium.png" alt="">
          <div>
            <p class="premium-kicker">ARCHIVE / GROWTH</p>
            <h1>思维变迁档案</h1>
            <p>${branch.motto}</p>
          </div>
        </div>
        <button class="research-manual" onclick="switchOverlay('guide')" aria-label="玩法说明">
          <img src="assets/ui/icon_help.png" alt="">
        </button>
        <div class="research-wallet">
          <img src="assets/ui/icon_coin.png" alt="">
          <span>学分</span>
          <strong>${save.credits}</strong>
        </div>
        <button class="research-close" onclick="switchOverlay('menu')" aria-label="返回主菜单">×</button>
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
        <aside class="research-side" style="--branch:${branch.accent};">
          <section class="research-detail">
            <div class="detail-head">
              <img class="detail-orbit" src="${selectedIcon}" alt="">
              <div>
                <h2>${selectedNode.name}</h2>
                <div class="detail-level">等级 ${selectedLevel} / ${selectedMax}</div>
                <span class="detail-status">${selectedLevel >= selectedMax ? "永久生效" : "可继续研究"}</span>
              </div>
            </div>
            <section class="detail-block">
              <strong>效果</strong>
              <p>${selectedNode.desc}</p>
            </section>
            <section class="detail-block">
              <strong>解锁条件</strong>
              <div class="detail-prereqs">${prereqs}</div>
            </section>
            <section class="detail-block detail-preview">
              <strong>升级预览</strong>
              <div><span>当前等级</span><b>${selectedLevel}</b><i>→</i><b>${Math.min(selectedLevel + 1, selectedMax)}</b></div>
            </section>
            <button class="prime-btn research-buy" ${canBuy ? "" : "disabled"} onclick="buyResearchNode('${selectedNode.id}')">
              ${selectedLevel >= selectedMax ? "课题已完成" : `${blockedText}${Number.isFinite(selectedCost) ? ` · ${selectedCost}` : ""}`}
            </button>
          </section>
          <section class="outside-growth-card">
            <div class="outside-growth-head">
              <img src="assets/ui/icon_upgrade.png" alt="">
              <div>
                <p class="detail-kicker">局外成长</p>
              <h3>长期课题总览</h3>
              </div>
            </div>
            <div class="outside-growth-progress">
              <span>总完成度</span>
              <strong>${completionPct}%</strong>
              <i style="width:${completionPct}%;"></i>
            </div>
            <div class="outside-growth-metrics">
              <div><span>已解锁</span><strong>${learnedResearchLevels}</strong></div>
              <div><span>研究中</span><strong>${affordableCount}</strong></div>
              <div><span>可用学分</span><strong>${save.credits}</strong></div>
            </div>
          </section>
        </aside>
      </div>
      <section class="research-overview">
        <img src="assets/ui/research/research_archive.png" alt="">
        <div>
          <h3>档案总览</h3>
          <p>已解锁 ${learnedResearchLevels} / ${totalResearchLevels}</p>
        </div>
      </section>
      <div class="research-zoom">
        <button aria-label="缩小">−</button>
        <span>100%</span>
        <button aria-label="放大">+</button>
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
    <div class="premium-enhance">
      <div class="premium-enhance-head">
        <p class="premium-kicker">RESEARCH BOOST</p>
        <h1>选择强化</h1>
      </div>
      <div class="enhance-meter">
        <i style="width:${pct}%;"></i>
        <span>${pct}%</span>
      </div>
      <div class="choice-deck">${choicesHtml}</div>
      ${state.enhancementRerolls > 0 ? '<button class="premium-reroll" onclick="rerollEnhancement()">课题重投</button>' : ""}
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
      <p class="subtitle" style="margin-bottom:32px;">最终 GPA 与结算报告已提交教务系统</p>
      <div class="growth-grid" style="grid-template-columns:1fr; margin-bottom:32px;">
        <div class="growth-section" style="text-align:left; font-size:14px; line-height:2;">
          <div>行动级别: <strong style="color:${state.difficultyKey === "topsecret" ? "var(--theme-rose)" : "var(--theme-green)"};">${state.difficulty?.label || "机密"}${state.map?.name || "校园前线"}</strong></div>
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
      <div class="tower-token ${kind}"><img src="assets/ui/tower_card_${kind}.png" alt="${data.name}"></div>
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
