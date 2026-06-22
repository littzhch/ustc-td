// 本文件由 game.js 拆分而来，保持普通 script 全局加载以兼容 file:// 运行。
function draw() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  if (state.mode !== "running" && state.mode !== "paused") {
    drawCampusMap(MAPS[0], 0.72);
    drawSampleUnits();
    return;
  }

  drawCampusMap(state.map, 1);
  drawRouteTarget(state.map.target[0], state.map.target[1]);

  state.slots.forEach((slot, idx) => {
    if (slot.tower) {
      drawTowerVisual(slot.tower.kind, slot.x, slot.y, slot.tower.level);
    } else {
      drawBuildSlot(slot.x, slot.y, state.selectedSlot === idx || state.hoverSlot === idx || Boolean(hotKeySelectedTower), slot);
    }
  });

  for (const e of state.enemies) {
    const [x, y] = pointAt(e.progress, e.path);
    drawBookEnemy(e.kind, x, y, performance.now() / 260, e);
    const pct = Math.max(0, e.hp / e.maxHp);
    const status = enemyStatusLayout(e.kind, y);
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(x - status.barW / 2, status.barY, status.barW, status.barH);
    ctx.fillStyle = pct < 0.35 ? THEME_ROSE : THEME_GREEN;
    ctx.fillRect(x - status.barW / 2, status.barY, status.barW * pct, status.barH);
    if (status.boss) {
      ctx.fillStyle = "#fff8ed";
      ctx.font = "900 11px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(ENEMIES[e.kind].name, x, status.labelY);
    }
  }

  drawProjectiles();
  drawEffects();
  for (const f of state.floating) {
    ctx.fillStyle = f.color;
    ctx.font = "bold 14px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(f.text, f.x, f.y);
  }

  drawIntroBriefing();
  updateHud();
}

function drawCampusMap(map, alpha = 1) {
  if (map?.bitmap) {
    drawBitmapMap(map, alpha);
    return;
  }
  if (map?.style === "west") {
    drawWestMap(map, alpha);
    return;
  }
  if (map?.style === "gaoxin") {
    drawGaoxinMap(map, alpha);
    return;
  }
  ctx.save();
  ctx.globalAlpha = alpha;
  const sky = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  sky.addColorStop(0, "#d8e7ca");
  sky.addColorStop(0.45, "#8fb36c");
  sky.addColorStop(1, "#557c4b");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  drawGrassPatches();
  drawWater(855, 28, 270, 124);
  drawWater(934, 168, 154, 84);
  drawRoad([[0, 84], [184, 84], [220, 0]], 38);
  drawRoad([[1140, 0], [1030, 160], [1038, 338], [1178, 338]], 36);
  drawRoad([[676, 720], [704, 562], [728, 378], [754, 236]], 34);
  drawRoad([[0, 628], [250, 602], [468, 590], [710, 562], [1180, 582]], 36);
  drawWalkway([[526, 354], [674, 354], [822, 332], [948, 260]], 10);

  for (const building of map.buildings || CAMPUS_BUILDINGS) {
    if (building.kind === "office") drawAcademicOffice(building.x, building.y);
    else drawBuilding(building.x, building.y, building.w, building.h, building.color, building.label);
  }

  drawPlaza();
  drawStatue(552, 238);
  drawStarMark(512, 355);
  drawTrees();
  drawLandmarkLabels(map.landmarks);
  ctx.restore();
}

function drawBitmapMap(map, alpha = 1) {
  const image = artAssets.maps[map.bitmap];
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "#95c96d";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  if (image && image.complete && image.naturalWidth > 0) {
    drawImageCoverTop(image, 0, 0, WIDTH, HEIGHT);
  }
  ctx.restore();
}

function drawImageCoverTop(image, x, y, w, h) {
  const scale = Math.max(w / image.naturalWidth, h / image.naturalHeight);
  const sw = w / scale;
  const sh = h / scale;
  const sx = Math.max(0, (image.naturalWidth - sw) / 2);
  const sy = 0;
  ctx.drawImage(image, sx, sy, sw, sh, x, y, w, h);
}

function drawGaoxinMap(map, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  const sky = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  sky.addColorStop(0, "#dfe8e9");
  sky.addColorStop(0.42, "#95b978");
  sky.addColorStop(1, "#47733e");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  drawGaoxinGrassBands();
  drawGaoxinLake();
  drawRoad([[0, 70], [280, 58], [560, 66], [850, 62], [1180, 76]], 32);
  drawRoad([[0, 420], [150, 420], [286, 420]], 28);
  drawRoad([[760, 420], [850, 360], [944, 282], [1012, 210]], 28);
  drawRoad([[902, 352], [930, 486], [906, 720]], 24);
  drawSipeiBridge();
  drawGaoxinSportsField();

  for (const building of map.buildings || []) {
    if (building.kind === "office") drawAcademicOffice(building.x, building.y);
    else drawBuilding(building.x, building.y, building.w, building.h, building.color, building.label);
  }

  drawTrees();
  drawLandmarkLabels(map.landmarks);
  ctx.restore();
}

function drawWestMap(map, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  const sky = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  sky.addColorStop(0, "#dcead7");
  sky.addColorStop(0.38, "#9bc47e");
  sky.addColorStop(1, "#4f7f48");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  drawWestGrassBands();
  drawRoad([[0, 50], [270, 42], [520, 32], [815, 30], [1180, 40]], 32);
  drawRoad([[0, 294], [190, 290], [318, 320]], 26);
  drawRoad([[1180, 210], [1062, 254], [980, 316], [914, 346]], 24);
  drawRoad([[128, 684], [238, 646], [446, 654], [650, 634], [810, 582], [914, 346]], 28);
  drawRoad([[232, 292], [330, 250], [452, 194], [704, 114], [1000, 36]], 20);
  drawWestLake();
  drawWestWalkways();

  for (const building of map.buildings || []) {
    drawBuilding(building.x, building.y, building.w, building.h, building.color, building.label);
  }

  drawWestLandmarks();
  drawWestTrees();
  drawLandmarkLabels(map.landmarks);
  ctx.restore();
}

function drawWestGrassBands() {
  ctx.save();
  for (let i = 0; i < 20; i += 1) {
    const x = (i * 91 + 34) % WIDTH;
    const y = (i * 127 + 78) % HEIGHT;
    ctx.fillStyle = i % 2 ? "rgba(61, 137, 70, 0.18)" : "rgba(205, 227, 148, 0.22)";
    ctx.beginPath();
    ctx.ellipse(x, y, 118 + (i % 4) * 22, 38 + (i % 3) * 13, -0.45 + i * 0.11, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawWestLake() {
  ctx.save();
  const water = ctx.createLinearGradient(368, 246, 720, 512);
  water.addColorStop(0, "#73c8d8");
  water.addColorStop(0.52, "#2f9bb4");
  water.addColorStop(1, "#176f88");
  ctx.fillStyle = water;
  ctx.beginPath();
  ctx.ellipse(486, 330, 126, 94, -0.22, 0, Math.PI * 2);
  ctx.ellipse(620, 372, 154, 116, 0.18, 0, Math.PI * 2);
  ctx.ellipse(492, 470, 112, 78, -0.18, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(236, 255, 255, 0.42)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(486, 330, 112, 80, -0.22, 0, Math.PI * 2);
  ctx.ellipse(620, 372, 140, 102, 0.18, 0, Math.PI * 2);
  ctx.ellipse(492, 470, 96, 64, -0.18, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "rgba(255,255,255,0.2)";
  for (let i = 0; i < 6; i += 1) {
    ctx.fillRect(430 + i * 44, 360 + (i % 3) * 18, 56, 4);
  }
  ctx.restore();
}

function drawWestWalkways() {
  drawWalkway([[344, 298], [414, 240], [548, 216], [704, 250], [806, 330], [862, 394], [806, 478], [650, 528], [450, 520], [352, 434], [344, 298]], 9);
  drawWalkway([[760, 452], [810, 420], [862, 394], [922, 350]], 12);
  drawWalkway([[352, 482], [382, 512], [438, 512]], 8);
}

function drawWestEnemyPaths() {
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const routes = [
    [[1138, 44], [1000, 72], [780, 88], [704, 150], [724, 230], [828, 272], [910, 310], [976, 352]],
    [[0, 330], [232, 328], [322, 364], [350, 456], [438, 548], [612, 558], [774, 514], [862, 430], [914, 382], [976, 352]],
    [[132, 720], [246, 686], [446, 694], [648, 674], [806, 620], [850, 536], [854, 450], [914, 382], [976, 352]],
  ];
  ctx.strokeStyle = "rgba(139, 64, 43, 0.34)";
  ctx.lineWidth = 15;
  for (const route of routes) polyline(route);
  ctx.strokeStyle = "rgba(255, 232, 174, 0.78)";
  ctx.lineWidth = 8;
  for (const route of routes) polyline(route);
  ctx.setLineDash([15, 14]);
  ctx.strokeStyle = "rgba(205, 73, 48, 0.86)";
  ctx.lineWidth = 3;
  for (const route of routes) polyline(route);
  ctx.restore();
}

function drawWestLandmarks() {
  ctx.save();
  drawStatue(382, 512);
  ctx.fillStyle = "rgba(241, 247, 235, 0.92)";
  for (let i = 0; i < 7; i += 1) {
    ctx.beginPath();
    ctx.ellipse(790 + i * 9, 384 - i * 3, 4, 18, -0.55, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "#d7c9a6";
  roundedRect(842, 380, 64, 18, 9, true, false);
  ctx.restore();
}

function drawWestTrees() {
  ctx.save();
  for (let i = 0; i < 135; i += 1) {
    const x = (i * 73 + 30) % WIDTH;
    const y = (i * 109 + 42) % HEIGHT;
    if (pointInWestLakeShape(x, y)) continue;
    if ((x > 240 && x < 1040 && y > 48 && y < 680 && i % 4 === 0)) continue;
    ctx.fillStyle = i % 10 === 0 ? "#d47792" : (i % 3 ? "#2f7c3e" : "#4b9b48");
    ctx.beginPath();
    ctx.arc(x, y, 8 + (i % 4) * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(45, 67, 35, 0.45)";
    ctx.fillRect(x - 1, y + 6, 2, 7);
  }
  ctx.restore();
}

function pointInWestLakeShape(x, y) {
  return pointInEllipse(x, y, 486, 330, 142, 108, -0.22)
    || pointInEllipse(x, y, 620, 372, 170, 130, 0.18)
    || pointInEllipse(x, y, 492, 470, 128, 92, -0.18);
}

function pointInEllipse(x, y, cx, cy, rx, ry, rotation = 0) {
  const cos = Math.cos(-rotation);
  const sin = Math.sin(-rotation);
  const dx = x - cx;
  const dy = y - cy;
  const px = dx * cos - dy * sin;
  const py = dx * sin + dy * cos;
  return (px * px) / (rx * rx) + (py * py) / (ry * ry) <= 1;
}

function drawGaoxinGrassBands() {
  ctx.save();
  for (let i = 0; i < 18; i += 1) {
    const x = (i * 83 + 28) % WIDTH;
    const y = (i * 137 + 84) % HEIGHT;
    ctx.fillStyle = i % 2 ? "rgba(74, 142, 64, 0.18)" : "rgba(190, 219, 137, 0.22)";
    ctx.beginPath();
    ctx.ellipse(x, y, 130 + (i % 4) * 24, 42 + (i % 3) * 14, -0.25 + i * 0.09, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawGaoxinLake() {
  ctx.save();
  const water = ctx.createLinearGradient(338, 320, 682, 600);
  water.addColorStop(0, "#68bdd0");
  water.addColorStop(1, "#1f7890");
  ctx.fillStyle = water;
  ctx.beginPath();
  ctx.ellipse(482, 392, 130, 96, -0.1, 0, Math.PI * 2);
  ctx.ellipse(556, 478, 154, 112, 0.12, 0, Math.PI * 2);
  ctx.ellipse(430, 528, 102, 76, -0.12, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(230, 255, 255, 0.38)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(482, 392, 118, 84, -0.1, 0, Math.PI * 2);
  ctx.ellipse(556, 478, 140, 98, 0.12, 0, Math.PI * 2);
  ctx.ellipse(430, 528, 88, 64, -0.12, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  for (let i = 0; i < 5; i += 1) {
    ctx.fillRect(400 + i * 44, 502 + i * 8, 58, 4);
  }
  ctx.restore();
}

function drawSipeiBridge() {
  ctx.save();
  const deck = [[304, 382], [764, 382], [786, 420], [760, 458], [304, 458], [282, 420]];
  ctx.shadowColor = "rgba(30, 45, 42, 0.34)";
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 8;
  ctx.fillStyle = "#d7c8aa";
  ctx.beginPath();
  deck.forEach(([x, y], idx) => idx ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.closePath();
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.strokeStyle = "rgba(95, 76, 48, 0.5)";
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#f7efe0";
  ctx.lineWidth = 22;
  polyline([[316, 420], [760, 420]]);
  ctx.strokeStyle = "#9bb0a5";
  ctx.lineWidth = 4;
  polyline([[316, 390], [750, 390]]);
  polyline([[316, 450], [750, 450]]);
  ctx.strokeStyle = "rgba(68, 91, 87, 0.35)";
  ctx.lineWidth = 2;
  for (let i = 0; i < 14; i += 1) {
    const x = 330 + i * 30;
    line([x, 392], [x + 18, 448]);
  }
  ctx.fillStyle = "rgba(47, 107, 232, 0.88)";
  roundedRect(494, 366, 84, 24, 4, true, false);
  ctx.strokeStyle = "rgba(255,255,255,0.72)";
  ctx.lineWidth = 2;
  roundedRect(494, 366, 84, 24, 4, false, true);
  ctx.fillStyle = "#fff";
  ctx.font = "bold 13px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("思佩桥", 536, 378);
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  roundedRect(296, 406, 30, 22, 4, true, false);
  roundedRect(746, 406, 30, 22, 4, true, false);
  ctx.fillStyle = "#6f7f77";
  ctx.fillRect(305, 414, 12, 6);
  ctx.fillRect(755, 414, 12, 6);
  ctx.fillStyle = "#2f6be8";
  ctx.restore();
}

function drawGaoxinPaths() {
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const mainPaths = [
    [[26, 230], [26, 420], [282, 420], [536, 420]],
    [[0, 420], [282, 420], [536, 420]],
    [[28, 610], [260, 590], [316, 540], [316, 420], [536, 420]],
    [[536, 420], [760, 420], [850, 360], [884, 312], [944, 282], [1008, 240], [1012, 210]],
  ];
  const bypassPaths = [
    [[26, 230], [160, 236], [340, 236], [540, 252], [720, 318], [850, 300], [944, 282], [1008, 240], [1012, 210]],
    [[28, 610], [180, 594], [340, 608], [520, 624], [720, 620], [862, 610], [900, 540], [900, 420], [884, 340], [896, 292], [944, 282], [1008, 240], [1012, 210]],
  ];
  ctx.strokeStyle = "rgba(138, 67, 57, 0.34)";
  ctx.lineWidth = 16;
  for (const path of mainPaths) polyline(path);
  ctx.strokeStyle = "rgba(244, 238, 221, 0.72)";
  ctx.lineWidth = 8;
  for (const path of mainPaths) polyline(path);
  ctx.strokeStyle = "rgba(138, 67, 57, 0.22)";
  ctx.lineWidth = 12;
  for (const path of bypassPaths) polyline(path);
  ctx.strokeStyle = "rgba(244, 238, 221, 0.56)";
  ctx.lineWidth = 6;
  for (const path of bypassPaths) polyline(path);
  ctx.restore();
}

function drawGaoxinSportsField() {
  ctx.save();
  ctx.fillStyle = "#b94c3f";
  roundedRect(826, 590, 282, 118, 48, true, false);
  ctx.fillStyle = "#4f9f54";
  roundedRect(856, 610, 222, 72, 12, true, false);
  ctx.strokeStyle = "rgba(255,255,255,0.68)";
  ctx.lineWidth = 2;
  for (let i = 0; i < 5; i += 1) {
    ctx.strokeRect(876 + i * 34, 618, 24, 56);
  }
  ctx.restore();
}

function drawGaoxinDormCourts() {
  ctx.save();
  ctx.fillStyle = "rgba(64, 169, 231, 0.68)";
  roundedRect(1038, 284, 92, 54, 8, true, false);
  roundedRect(1044, 548, 94, 58, 8, true, false);
  ctx.strokeStyle = "rgba(255,255,255,0.72)";
  ctx.lineWidth = 2;
  ctx.strokeRect(1052, 296, 64, 30);
  ctx.strokeRect(1058, 560, 62, 34);
  ctx.restore();
}

function drawGrassPatches() {
  for (let i = 0; i < 46; i += 1) {
    const x = (i * 97) % WIDTH;
    const y = (i * 151) % HEIGHT;
    ctx.fillStyle = i % 2 ? "rgba(50, 124, 56, 0.16)" : "rgba(192, 217, 119, 0.18)";
    ctx.beginPath();
    ctx.ellipse(x, y, 96 + (i % 5) * 18, 38 + (i % 4) * 12, (i % 7) * 0.42, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawWater(x, y, w, h) {
  const g = ctx.createLinearGradient(x, y, x + w, y + h);
  g.addColorStop(0, "#5fb3c8");
  g.addColorStop(1, "#23758e");
  ctx.fillStyle = g;
  roundedRect(x, y, w, h, 28, true, false);
  ctx.strokeStyle = "rgba(232, 255, 255, 0.36)";
  ctx.lineWidth = 3;
  roundedRect(x + 6, y + 6, w - 12, h - 12, 22, false, true);
}

function drawRoad(points, width) {
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#5b625e";
  ctx.lineWidth = width + 10;
  polyline(points);
  ctx.strokeStyle = "#303633";
  ctx.lineWidth = width;
  polyline(points);
  ctx.setLineDash([22, 20]);
  ctx.strokeStyle = "rgba(255,255,255,0.45)";
  ctx.lineWidth = 3;
  polyline(points);
  ctx.restore();
}

function drawWalkway(points, width) {
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "rgba(83, 71, 50, 0.28)";
  ctx.lineWidth = width + 5;
  polyline(points);
  ctx.strokeStyle = "#e8dcc4";
  ctx.lineWidth = width;
  polyline(points);
  ctx.restore();
}

function drawBuilding(x, y, w, h, color, label) {
  ctx.save();
  ctx.shadowColor = "rgba(36, 48, 31, 0.34)";
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 8;
  ctx.fillStyle = color;
  roundedRect(x, y, w, h, 6, true, false);
  ctx.shadowColor = "transparent";
  ctx.fillStyle = "rgba(255,255,255,0.68)";
  roundedRect(x + 10, y - 14, w - 20, 24, 4, true, false);
  ctx.fillStyle = "rgba(111, 128, 124, 0.35)";
  for (let ix = x + 18; ix < x + w - 16; ix += 34) {
    for (let iy = y + 18; iy < y + h - 12; iy += 24) {
      ctx.fillRect(ix, iy, 14, 10);
    }
  }
  ctx.fillStyle = "rgba(40, 49, 39, 0.68)";
  ctx.font = "bold 14px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(label, x + w / 2, y + h / 2 + 5);
  ctx.restore();
}

function drawAcademicOffice(x, y) {
  ctx.save();
  ctx.shadowColor = "rgba(36, 48, 31, 0.34)";
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 8;
  ctx.fillStyle = "#f0ead9";
  roundedRect(x, y, 104, 58, 6, true, false);
  ctx.shadowColor = "transparent";
  ctx.fillStyle = "#b64d3f";
  ctx.beginPath();
  ctx.moveTo(x - 8, y + 8);
  ctx.lineTo(x + 52, y - 18);
  ctx.lineTo(x + 112, y + 8);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#41513f";
  ctx.fillRect(x + 45, y + 31, 14, 27);
  ctx.fillStyle = "rgba(71, 91, 74, 0.42)";
  for (let ix = x + 16; ix < x + 92; ix += 26) {
    ctx.fillRect(ix, y + 18, 13, 11);
  }
  ctx.fillStyle = "#82372f";
  roundedRect(x + 24, y - 1, 56, 20, 4, true, false);
  ctx.fillStyle = "#fff7e8";
  ctx.font = "bold 13px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("教务处", x + 52, y + 9);
  ctx.restore();
}

function drawPlaza() {
  ctx.fillStyle = "#d9ceb3";
  ctx.beginPath();
  ctx.moveTo(414, 258);
  ctx.lineTo(592, 220);
  ctx.lineTo(686, 326);
  ctx.lineTo(556, 430);
  ctx.lineTo(392, 390);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(122, 94, 70, 0.28)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.24)";
  for (let i = 0; i < 7; i += 1) {
    ctx.fillRect(430 + i * 30, 332 - i * 8, 18, 110);
  }
}

function drawStatue(x, y) {
  ctx.fillStyle = "#d8c09a";
  ctx.beginPath();
  ctx.arc(x, y + 28, 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#7f6c52";
  roundedRect(x - 10, y - 6, 20, 40, 8, true, false);
  ctx.fillStyle = "#574d3f";
  ctx.beginPath();
  ctx.arc(x, y - 13, 10, 0, Math.PI * 2);
  ctx.fill();
}

function drawStarMark(x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "#f0d76d";
  ctx.beginPath();
  for (let i = 0; i < 10; i += 1) {
    const r = i % 2 ? 12 : 28;
    const a = -Math.PI / 2 + i * Math.PI / 5;
    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawTrees() {
  for (let i = 0; i < 120; i += 1) {
    const x = (i * 67 + 40) % WIDTH;
    const y = (i * 113 + 30) % HEIGHT;
    if ((x > 150 && x < 1060 && y > 80 && y < 640 && i % 5 === 0)) continue;
    ctx.fillStyle = i % 9 === 0 ? "#d47792" : (i % 3 ? "#2e7b3d" : "#3f9b4f");
    ctx.beginPath();
    ctx.arc(x, y, 8 + (i % 4) * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(37, 65, 36, 0.45)";
    ctx.fillRect(x - 1, y + 6, 2, 7);
  }
}

function drawLandmarkLabels(labels) {
  ctx.font = "bold 13px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (const [name, x, y] of labels) {
    const w = ctx.measureText(name).width + 20;
    ctx.fillStyle = "#2f6be8";
    roundedRect(x - w / 2, y - 28, w, 24, 4, true, false);
    ctx.fillStyle = "#fff";
    ctx.fillText(name, x, y - 16);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 5, y - 4);
    ctx.lineTo(x, y + 4);
    ctx.lineTo(x + 5, y - 4);
    ctx.stroke();
  }
}

function pickEnemyPath() {
  const routes = state.map.routes && state.map.routes.length ? state.map.routes : [state.map.path];
  const base = pickWeightedRoute(routes, state.map.routeWeights);
  return varyRoute(base, state.map.target, state.map);
}

function pickWeightedRoute(routes, weights) {
  if (!Array.isArray(weights) || weights.length !== routes.length) {
    return routes[Math.floor(Math.random() * routes.length)];
  }
  const total = weights.reduce((sum, weight) => sum + Math.max(0, Number(weight) || 0), 0);
  if (total <= 0) return routes[Math.floor(Math.random() * routes.length)];
  let roll = Math.random() * total;
  for (let i = 0; i < routes.length; i += 1) {
    roll -= Math.max(0, Number(weights[i]) || 0);
    if (roll <= 0) return routes[i];
  }
  return routes[routes.length - 1];
}

function varyRoute(route, target, map = state?.map) {
  if (!route || route.length <= 2) return route || [target];
  return route.map((point, idx) => {
    if (idx === 0 || idx === route.length - 1) return point;
    if (map?.choke && distance(point, map.choke) < 70) return point;
    if (map?.passages?.some(passage => pointInPassage(point[0], point[1], passage))) return point;
    for (let tries = 0; tries < 6; tries += 1) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 5 + Math.random() * 14;
      const candidate = [point[0] + Math.cos(angle) * radius, point[1] + Math.sin(angle) * radius];
      if (!pointBlocked(candidate[0], candidate[1], target, map)) return candidate;
    }
    return point;
  });
}

function buildSpawnRoutes(map) {
  if (map.routes && map.routes.length) return map.routes.map(route => route.map(point => [...point]));
  const spawns = map.spawns || [map.spawn || (map.path && map.path[0]) || [WIDTH - 24, HEIGHT / 2]];
  return spawns.map(spawn => buildMapRoute(map, spawn)).filter(route => route && route.length > 1);
}

function buildMapRoute(map, spawn) {
  const start = spawn || map.spawn || (map.path && map.path[0]) || [WIDTH - 24, HEIGHT / 2];
  const target = map.target || (map.path && map.path[map.path.length - 1]) || [WIDTH / 2, HEIGHT / 2];
  if (map.choke && distance(start, map.choke) > 8 && distance(target, map.choke) > 8) {
    const first = buildMapRouteSegment(map, start, map.choke);
    const second = buildMapRouteSegment(map, map.choke, target);
    if (first.length > 1 && second.length > 1) return [...first.slice(0, -1), ...second];
  }
  return buildMapRouteSegment(map, start, target);
}

function buildMapRouteSegment(map, start, target) {
  const cell = 24;
  const cols = Math.ceil(WIDTH / cell);
  const rows = Math.ceil(HEIGHT / cell);
  const startNode = pointToNode(start, cell, cols, rows);
  const endNode = pointToNode(target, cell, cols, rows);
  const open = [startNode];
  const cameFrom = new Map();
  const gScore = new Map([[nodeKey(startNode), 0]]);
  const fScore = new Map([[nodeKey(startNode), nodeHeuristic(startNode, endNode)]]);
  const closed = new Set();

  while (open.length) {
    open.sort((a, b) => (fScore.get(nodeKey(a)) ?? Infinity) - (fScore.get(nodeKey(b)) ?? Infinity));
    const current = open.shift();
    const currentKey = nodeKey(current);
    if (current.x === endNode.x && current.y === endNode.y) {
      const route = reconstructRoute(cameFrom, current).map(node => nodeToPoint(node, cell));
      route[0] = start;
      route[route.length - 1] = target;
      return simplifyRoute(route, target, map);
    }
    closed.add(currentKey);

    for (const next of routeNeighbors(current, cols, rows)) {
      const nextKey = nodeKey(next);
      if (closed.has(nextKey)) continue;
      const nextPoint = nodeToPoint(next, cell);
      if (pointBlocked(nextPoint[0], nextPoint[1], target, map)) continue;
      if (next.x !== current.x && next.y !== current.y) {
        const horizontal = nodeToPoint({ x: next.x, y: current.y }, cell);
        const vertical = nodeToPoint({ x: current.x, y: next.y }, cell);
        if (pointBlocked(horizontal[0], horizontal[1], target, map) || pointBlocked(vertical[0], vertical[1], target, map)) continue;
      }
      const stepCost = next.x !== current.x && next.y !== current.y ? 1.42 : 1;
      const tentative = (gScore.get(currentKey) ?? Infinity) + stepCost;
      if (tentative >= (gScore.get(nextKey) ?? Infinity)) continue;
      cameFrom.set(nextKey, current);
      gScore.set(nextKey, tentative);
      fScore.set(nextKey, tentative + nodeHeuristic(next, endNode));
      if (!open.some(node => node.x === next.x && node.y === next.y)) open.push(next);
    }
  }

  return map.path && map.path.length ? map.path : [start, target];
}

function pointToNode(point, cell, cols, rows) {
  return {
    x: Math.max(0, Math.min(cols - 1, Math.round(point[0] / cell))),
    y: Math.max(0, Math.min(rows - 1, Math.round(point[1] / cell))),
  };
}

function nodeToPoint(node, cell) {
  return [node.x * cell, node.y * cell];
}

function nodeKey(node) {
  return `${node.x},${node.y}`;
}

function nodeHeuristic(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function routeNeighbors(node, cols, rows) {
  const result = [];
  for (let dx = -1; dx <= 1; dx += 1) {
    for (let dy = -1; dy <= 1; dy += 1) {
      if (dx === 0 && dy === 0) continue;
      const x = node.x + dx;
      const y = node.y + dy;
      if (x >= 0 && x < cols && y >= 0 && y < rows) result.push({ x, y });
    }
  }
  return result;
}

function reconstructRoute(cameFrom, current) {
  const route = [current];
  let key = nodeKey(current);
  while (cameFrom.has(key)) {
    current = cameFrom.get(key);
    route.unshift(current);
    key = nodeKey(current);
  }
  return route;
}

function simplifyRoute(route, target, map) {
  if (route.length <= 2) return route;
  const simplified = [route[0]];
  let anchor = 0;
  while (anchor < route.length - 1) {
    let next = route.length - 1;
    while (next > anchor + 1 && !lineWalkable(route[anchor], route[next], target, map)) next -= 1;
    simplified.push(route[next]);
    anchor = next;
  }
  return softenedRoute(simplified, target, map);
}

function softenedRoute(route, target, map) {
  if (route.length <= 2) return route;
  const result = [route[0]];
  for (let i = 1; i < route.length - 1; i += 1) {
    const prev = route[i - 1];
    const current = route[i];
    const next = route[i + 1];
    const inPoint = [current[0] * 0.72 + prev[0] * 0.28, current[1] * 0.72 + prev[1] * 0.28];
    const outPoint = [current[0] * 0.72 + next[0] * 0.28, current[1] * 0.72 + next[1] * 0.28];
    if (lineWalkable(result[result.length - 1], inPoint, target, map)) result.push(inPoint);
    result.push(current);
    if (lineWalkable(current, outPoint, target, map)) result.push(outPoint);
  }
  result.push(route[route.length - 1]);
  return result.filter((point, idx) => idx === 0 || distance(point, result[idx - 1]) > 4);
}

function lineWalkable(a, b, target, map) {
  const steps = Math.max(2, Math.ceil(distance(a, b) / 8));
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const x = a[0] + (b[0] - a[0]) * t;
    const y = a[1] + (b[1] - a[1]) * t;
    if (pointBlocked(x, y, target, map)) return false;
  }
  return true;
}

function pointBlocked(x, y, target, map = state?.map || MAPS[mapIndex] || MAPS[0]) {
  if (target && distance([x, y], target) < 32) return false;
  if (map?.choke && distance([x, y], map.choke) < 34) return false;
  if (map?.passages?.some(passage => pointInPassage(x, y, passage))) return false;
  if (x < 16 || x > WIDTH - 8 || y < 18 || y > HEIGHT - 18) return false;
  const padding = 12;
  const buildings = map?.buildings || CAMPUS_BUILDINGS;
  const blockers = map?.blockers || CAMPUS_BLOCKERS;
  if (buildings.some(building => (
    x >= building.x - padding &&
    x <= building.x + building.w + padding &&
    y >= building.y - padding &&
    y <= building.y + building.h + padding
  ))) return true;
  return blockers.some(blocker => {
    if (blocker.kind === "circle") return distance([x, y], [blocker.x, blocker.y]) <= blocker.r;
    return (
      x >= blocker.x - padding &&
      x <= blocker.x + blocker.w + padding &&
      y >= blocker.y - padding &&
      y <= blocker.y + blocker.h + padding
    );
  });
}

function pointInPassage(x, y, passage) {
  if (passage.kind === "circle") return distance([x, y], [passage.x, passage.y]) <= passage.r;
  return x >= passage.x && x <= passage.x + passage.w && y >= passage.y && y <= passage.y + passage.h;
}

function drawEnemyRoute(path, target) {
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "rgba(55, 41, 30, 0.28)";
  ctx.lineWidth = 18;
  polyline(path);
  ctx.strokeStyle = "rgba(255, 239, 188, 0.82)";
  ctx.lineWidth = 12;
  polyline(path);
  ctx.setLineDash([16, 14]);
  ctx.strokeStyle = "rgba(190, 70, 58, 0.82)";
  ctx.lineWidth = 3;
  polyline(path);
  ctx.setLineDash([]);

  const total = pathLength(path);
  ctx.fillStyle = "rgba(190, 70, 58, 0.9)";
  for (let d = 70; d < total - 40; d += 110) {
    const [x, y] = pointAt(d, path);
    const [nx, ny] = pointAt(Math.min(total, d + 12), path);
    const angle = Math.atan2(ny - y, nx - x);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(9, 0);
    ctx.lineTo(-6, -6);
    ctx.lineTo(-3, 0);
    ctx.lineTo(-6, 6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  if (target) drawRouteTarget(target[0], target[1]);
  ctx.restore();
}

function drawRouteTarget(x, y) {
  const pulse = Math.sin(performance.now() / 220) * 0.5 + 0.5;
  ctx.save();
  ctx.strokeStyle = `rgba(198, 69, 62, ${0.5 + pulse * 0.28})`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, 18 + pulse * 8, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "rgba(198, 69, 62, 0.14)";
  ctx.beginPath();
  ctx.arc(x, y, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#c6453e";
  ctx.beginPath();
  ctx.moveTo(x, y - 18);
  ctx.lineTo(x + 12, y + 12);
  ctx.lineTo(x, y + 6);
  ctx.lineTo(x - 12, y + 12);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawIntroBriefing() {
  if (!state.introTime || state.introTime <= 0 || state.wave > 0) return;
  const alpha = Math.min(1, state.introTime / 0.8);
  const targetName = state.map?.name === "也西湖" ? "图书馆" : "教务处";
  const warningTitle = targetName === "图书馆" ? "紧急图书馆预警" : "紧急教务预警";
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "rgba(238, 248, 228, 0.26)";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  const panel = ctx.createLinearGradient(258, 216, 922, 470);
  panel.addColorStop(0, "rgba(255, 253, 239, 0.94)");
  panel.addColorStop(0.58, "rgba(239, 248, 226, 0.9)");
  panel.addColorStop(1, "rgba(255, 246, 216, 0.92)");
  ctx.fillStyle = panel;
  roundedRect(272, 220, 636, 218, 26, true, false);
  ctx.strokeStyle = "rgba(190, 170, 98, 0.58)";
  ctx.lineWidth = 2;
  roundedRect(284, 232, 612, 194, 20, false, true);
  ctx.fillStyle = "#17492f";
  ctx.font = "900 40px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(warningTitle, WIDTH / 2, 286);
  ctx.strokeStyle = "rgba(216, 179, 78, 0.7)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(WIDTH / 2 - 120, 326);
  ctx.lineTo(WIDTH / 2 + 120, 326);
  ctx.stroke();
  ctx.font = "900 24px sans-serif";
  ctx.fillStyle = "#1d6c45";
  ctx.fillText(`怪潮正逼近${targetName}`, WIDTH / 2, 362);
  ctx.font = "16px sans-serif";
  ctx.fillStyle = "rgba(35, 55, 33, 0.72)";
  ctx.fillText("提示消失后开始防守", WIDTH / 2, 398);
  ctx.restore();
}

function drawSampleUnits() {
  drawTowerVisual("math", 186, 280, 2);
  drawTowerVisual("lab", 248, 314, 1);
  drawBookEnemy("homework", 930, 344, performance.now() / 260);
  drawBookEnemy("ddl", 878, 344, performance.now() / 260 + 1.6);
}

function drawBuildSlot(x, y, active, slot = {}) {
  if (slot.marker === "mapPad") {
    drawMapPadSlot(x, y, active, slot);
    return;
  }
  ctx.save();
  ctx.translate(x, y);
  const accent = (slot.bonus && slot.bonus.color) || (slot.custom ? "#7b8a43" : "#2f7d4f");
  ctx.shadowColor = active ? "rgba(47, 125, 79, 0.38)" : "rgba(39, 53, 33, 0.22)";
  ctx.shadowBlur = active ? 12 : 6;
  ctx.shadowOffsetY = 3;
  ctx.fillStyle = active ? "rgba(250, 238, 176, 0.82)" : "rgba(239, 230, 184, 0.7)";
  roundedRect(-16, -13, 32, 26, 6, true, false);
  ctx.shadowColor = "transparent";
  ctx.strokeStyle = active ? accent : "rgba(71, 93, 61, 0.68)";
  ctx.lineWidth = active ? 2.2 : 1.6;
  roundedRect(-16, -13, 32, 26, 6, false, true);
  ctx.fillStyle = active ? accent : "#55714b";
  ctx.beginPath();
  ctx.arc(0, 0, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = active ? "rgba(255, 255, 240, 0.92)" : "rgba(255, 255, 240, 0.62)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-9, 0);
  ctx.lineTo(9, 0);
  ctx.moveTo(0, -9);
  ctx.lineTo(0, 9);
  ctx.stroke();
  ctx.strokeStyle = active ? "rgba(47, 125, 79, 0.36)" : "rgba(47, 125, 79, 0.16)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-20, -9);
  ctx.lineTo(-20, -17);
  ctx.lineTo(-12, -17);
  ctx.moveTo(20, -9);
  ctx.lineTo(20, -17);
  ctx.lineTo(12, -17);
  ctx.moveTo(-20, 9);
  ctx.lineTo(-20, 17);
  ctx.lineTo(-12, 17);
  ctx.moveTo(20, 9);
  ctx.lineTo(20, 17);
  ctx.lineTo(12, 17);
  ctx.stroke();
  if (active) {
    ctx.strokeStyle = "rgba(47, 125, 79, 0.28)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, 25, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawMapPadSlot(x, y, active, slot = {}) {
  const reveal = active || Boolean(hotKeySelectedTower);
  if (!reveal) return;
  ctx.save();
  ctx.translate(x, y);
  const accent = (slot.bonus && slot.bonus.color) || "#2f7d4f";
  const radius = Math.max(38, slot.radius || 44);
  const strong = active;
  ctx.globalAlpha = strong ? 0.9 : 0.28;
  ctx.fillStyle = strong ? "rgba(255, 255, 245, 0.08)" : "rgba(255, 255, 245, 0.03)";
  roundedRect(-radius, -radius * 0.7, radius * 2, radius * 1.4, 14, true, false);
  ctx.strokeStyle = strong ? accent : "rgba(255, 255, 245, 0.65)";
  ctx.lineWidth = strong ? 2 : 1.5;
  ctx.setLineDash([8, 8]);
  roundedRect(-radius, -radius * 0.7, radius * 2, radius * 1.4, 14, false, true);
  ctx.setLineDash([]);
  if (active) {
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "rgba(255, 255, 245, 0.92)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawTowerVisual(kind, x, y, level = 1) {
  const towerImage = towerImageForLevel(kind, level);
  if (towerImage && towerImage.complete && towerImage.naturalWidth > 0) {
    drawTowerSprite(towerImage, kind, x, y, level);
    return;
  }

  ctx.save();
  ctx.translate(x, y);
  const pulse = Math.sin(performance.now() / 240 + x * 0.01) * 0.5 + 0.5;
  ctx.shadowColor = "rgba(28, 35, 24, 0.34)";
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 5;
  ctx.fillStyle = "rgba(58, 49, 33, 0.22)";
  ctx.beginPath();
  ctx.ellipse(0, 22, 32, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowColor = "transparent";

  if (kind === "math") {
    ctx.fillStyle = "#785637";
    roundedRect(-27, 6, 54, 22, 5, true, false);
    ctx.fillStyle = "#213d34";
    roundedRect(-28, -25, 56, 38, 4, true, false);
    ctx.strokeStyle = "#e7d5ad";
    ctx.lineWidth = 3;
    roundedRect(-28, -25, 56, 38, 4, false, true);
    ctx.strokeStyle = "#e8f0dc";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-19, -7);
    ctx.lineTo(-11, -14);
    ctx.lineTo(-2, -2);
    ctx.lineTo(8, -16);
    ctx.moveTo(13, -5);
    ctx.lineTo(21, -5);
    ctx.stroke();
    ctx.fillStyle = "#f5f1df";
    ctx.font = "bold 10px serif";
    ctx.fillText("dx", 15, 6);
    ctx.fillRect(7, 17, 18, 4);
    ctx.fillStyle = "#d46b4a";
    ctx.fillRect(-24, 17, 12, 5);
  } else if (kind === "physics") {
    ctx.fillStyle = "#5e6470";
    roundedRect(-22, 6, 44, 22, 5, true, false);
    ctx.strokeStyle = "#215e72";
    ctx.lineWidth = 4;
    for (let i = -2; i <= 2; i += 1) {
      ctx.beginPath();
      ctx.ellipse(i * 7, -7, 7, 22, 0.35, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.strokeStyle = "#b9f4ff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-28, -3);
    ctx.lineTo(-12, -10);
    ctx.lineTo(3, -3);
    ctx.lineTo(18, -12);
    ctx.lineTo(30, -5);
    ctx.stroke();
    ctx.fillStyle = `rgba(185,244,255,${0.28 + pulse * 0.32})`;
    ctx.beginPath();
    ctx.arc(0, -6, 24 + pulse * 5, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === "lab") {
    ctx.fillStyle = "#695d4e";
    roundedRect(-24, 14, 48, 14, 4, true, false);
    ctx.strokeStyle = "#5b6470";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-17, -23);
    ctx.lineTo(17, -23);
    ctx.moveTo(0, -23);
    ctx.lineTo(0, 20);
    ctx.stroke();
    ctx.fillStyle = "#dff4fb";
    roundedRect(-17, -4, 34, 32, 8, true, false);
    ctx.fillStyle = "rgba(143, 80, 180, 0.78)";
    ctx.fillRect(-12, 10, 24, 14);
    ctx.fillStyle = `rgba(236, 196, 255, ${0.35 + pulse * 0.28})`;
    ctx.beginPath();
    ctx.arc(0, -5, 7 + pulse * 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#8f50b4";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-18, -3);
    ctx.lineTo(-28, -20);
    ctx.stroke();
  } else if (kind === "coffee") {
    ctx.fillStyle = "#7a4727";
    roundedRect(-22, -18, 44, 46, 9, true, false);
    ctx.fillStyle = "#c08343";
    roundedRect(-16, -11, 30, 30, 6, true, false);
    ctx.fillStyle = "#fff4dc";
    roundedRect(-7, -2, 23, 20, 4, true, false);
    ctx.strokeStyle = "#fff4dc";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(17, 8, 8, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();
    ctx.strokeStyle = `rgba(255,244,220,${0.45 + pulse * 0.4})`;
    ctx.lineWidth = 2;
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.moveTo(i * 8 - 2, -18);
      ctx.bezierCurveTo(i * 8 + 6, -27, i * 8 - 9, -31, i * 8 + 1, -39);
      ctx.stroke();
    }
  }

  ctx.fillStyle = "#2b2b25";
  ctx.font = "bold 11px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`Lv.${level}`, 0, 43);
  ctx.restore();
}

function drawTowerSprite(image, kind, x, y, level = 1) {
  ctx.save();
  ctx.translate(x, y);
  const size = towerSpriteSize(kind, level);
  ctx.fillStyle = "rgba(38, 45, 32, 0.24)";
  ctx.beginPath();
  ctx.ellipse(0, 28, size * 0.36, size * 0.13, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowColor = "rgba(28, 35, 24, 0.26)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 5;
  ctx.drawImage(image, -size / 2, -size * 0.58, size, size);
  ctx.shadowColor = "transparent";

  ctx.fillStyle = "rgba(255, 255, 245, 0.92)";
  roundedRect(-20, 36, 40, 16, 8, true, false);
  ctx.fillStyle = "#263024";
  ctx.font = "900 10px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(`Lv.${level}`, 0, 44);
  ctx.restore();
}

function towerImageForLevel(kind, level = 1) {
  const images = artAssets.towers?.[kind];
  if (Array.isArray(images)) {
    const index = Math.max(0, Math.min(images.length - 1, Math.floor(level || 1) - 1));
    return images[index] || images[0];
  }
  return images;
}

function towerSpriteSize(kind, level = 1) {
  const base = kind === "coffee" ? 74 : kind === "lab" ? 72 : 78;
  return base + Math.min(2, level - 1) * 4;
}

function drawBookEnemy(kind, x, y, tick = 0, enemy = {}) {
  const hit = enemy.hitFlash || 0;
  const bob = Math.sin(tick) * 2;
  const shake = hit > 0 ? Math.sin(tick * 12) * 3 : 0;
  ctx.save();
  ctx.translate(x + shake, y + bob);
  ctx.lineCap = "round";

  if (enemy.slowUntil && enemy.slowUntil > performance.now() / 1000) {
    ctx.strokeStyle = "rgba(74, 142, 220, 0.55)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 4, 28 + Math.sin(tick * 2) * 2, 0, Math.PI * 2);
    ctx.stroke();
  }

  const enemyImage = artAssets.enemies?.[kind];
  if (enemyImage && enemyImage.complete && enemyImage.naturalWidth > 0) {
    drawEnemySprite(enemyImage, kind, tick, enemy);
  } else if (ENEMIES[kind]?.boss) {
    drawBossBook(kind, tick, enemy);
  } else if (kind === "ddl") {
    drawDdlBook(tick, enemy);
  } else if (kind === "report") {
    drawReportBook(tick);
  } else if (kind === "ppt") {
    drawPptDeck(tick);
  } else if (kind === "bug") {
    drawBugBook(tick);
  } else {
    drawHomeworkBook(tick);
  }

  if (hit > 0) {
    ctx.globalAlpha = Math.min(0.75, hit * 4);
    ctx.fillStyle = "#fff";
    roundedRect(-25, -23, 50, 44, 8, true, false);
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

function drawEnemySprite(image, kind, tick, enemy = {}) {
  const size = enemySpriteSize(kind);
  ctx.save();
  ctx.fillStyle = "rgba(33, 30, 24, 0.22)";
  ctx.beginPath();
  ctx.ellipse(0, 20, size * 0.24, size * 0.09, 0, 0, Math.PI * 2);
  ctx.fill();

  if (kind === "ddl") {
    const fuse = Math.max(0, enemy.ddlFuse ?? 1);
    const fuseMax = Math.max(1, enemy.ddlFuseMax ?? 1);
    const danger = 1 - Math.min(1, fuse / fuseMax);
    ctx.fillStyle = `rgba(255, 74, 64, ${0.12 + danger * 0.18 + Math.sin(tick * 5) * 0.04})`;
    ctx.beginPath();
    ctx.arc(0, 1, size * (0.32 + danger * 0.08), 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.shadowColor = "rgba(33, 30, 24, 0.24)";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 4;
  ctx.drawImage(image, -size / 2, -size * 0.64, size, size);
  ctx.shadowColor = "transparent";

  if (kind === "ddl") {
    const fuse = Math.max(0, enemy.ddlFuse ?? 1);
    const fuseMax = Math.max(1, enemy.ddlFuseMax ?? 1);
    const danger = 1 - Math.min(1, fuse / fuseMax);
    ctx.fillStyle = danger > 0.65 ? "#f43f5e" : "#fbbf24";
    ctx.beginPath();
    ctx.arc(18, -28, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(88, 40, 24, 0.36)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = "#fff8ed";
    ctx.font = "900 9px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(Math.ceil(fuse), 18, -28);
  }
  ctx.restore();
}

function enemySpriteSize(kind) {
  if (ENEMIES[kind]?.boss) return 96;
  if (kind === "report") return 62;
  if (kind === "ddl") return 68;
  if (kind === "ppt") return 58;
  if (kind === "bug") return 54;
  return 54;
}

function enemyStatusLayout(kind, y) {
  const boss = Boolean(ENEMIES[kind]?.boss);
  const image = artAssets.enemies?.[kind];
  const hasSprite = image && image.complete && image.naturalWidth > 0;
  const size = hasSprite ? enemySpriteSize(kind) : boss ? 76 : 42;
  const barW = boss ? Math.max(76, size * 0.84) : 36;
  const barH = boss ? 7 : 5;
  const barY = hasSprite ? y - size * 0.64 - (boss ? 14 : 7) : boss ? y - 50 : y - 29;
  return {
    boss,
    barW,
    barH,
    barY,
    labelY: barY - 8,
  };
}

function drawBossBook(kind, tick, enemy = {}) {
  const data = ENEMIES[kind];
  const palette = {
    boss_midterm: ["#9b5b34", "#5f321f", "期中", "#f6d096"],
    boss_ddl: ["#b91c1c", "#5f1616", "总DDL", "#fee2e2"],
    boss_lab: ["#0f766e", "#134e4a", "验收", "#ccfbf1"],
    boss_thesis: ["#5b35a5", "#31205f", "论文", "#ddd6fe"],
  }[kind] || [data.color, "#3b2a24", "BOSS", "#fff8ed"];
  const pulse = Math.sin(tick * 2.2) * 0.5 + 0.5;
  ctx.save();
  ctx.scale(1.42, 1.42);
  drawLimbs(tick * 0.72, palette[1], 0.55);
  ctx.shadowColor = "rgba(33, 24, 16, 0.38)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 5;
  ctx.fillStyle = palette[0];
  roundedRect(-28, -28, 56, 54, 9, true, false);
  ctx.shadowColor = "transparent";
  ctx.fillStyle = palette[3];
  roundedRect(-20, -22, 40, 38, 5, true, false);
  ctx.fillStyle = palette[1];
  ctx.fillRect(-28, -28, 9, 54);
  ctx.strokeStyle = `rgba(255, 248, 237, ${0.38 + pulse * 0.34})`;
  ctx.lineWidth = 2;
  roundedRect(-31, -31, 62, 60, 11, false, true);
  ctx.fillStyle = palette[1];
  ctx.font = "900 11px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(palette[2], 2, -6);
  if (kind === "boss_midterm") {
    ctx.fillText("A/B", 2, 9);
  } else if (kind === "boss_ddl") {
    const left = Math.max(0, enemy.bossTimer || 0);
    ctx.fillText(formatFuse(left), 2, 10);
  } else if (kind === "boss_lab") {
    ctx.fillRect(-8, 7, 18, 5);
    ctx.fillStyle = "#8ff0d4";
    ctx.beginPath();
    ctx.arc(0, 11, 6, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === "boss_thesis") {
    ctx.fillText("终稿", 2, 10);
    ctx.strokeStyle = "#31205f";
    ctx.beginPath();
    ctx.moveTo(16, -26);
    ctx.lineTo(28, -36);
    ctx.lineTo(35, -30);
    ctx.stroke();
  }
  drawFace(0, 20, true);
  ctx.restore();
}

function drawHomeworkBook(tick) {
  drawLimbs(tick, "#5c3b27", 0.75);
  ctx.rotate(-0.08);
  ctx.fillStyle = "#e7a65b";
  roundedRect(-22, -20, 42, 39, 7, true, false);
  ctx.fillStyle = "#f6d096";
  roundedRect(-14, -17, 30, 33, 5, true, false);
  ctx.strokeStyle = "rgba(108, 68, 38, 0.38)";
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 4; i += 1) {
    ctx.beginPath();
    ctx.moveTo(-8, -8 + i * 6);
    ctx.quadraticCurveTo(1, -10 + i * 6, 10, -7 + i * 6);
    ctx.stroke();
  }
  ctx.fillStyle = "#7a3f22";
  ctx.fillRect(-22, -20, 7, 39);
  drawFace(-2, 1, false);
  ctx.strokeStyle = "#2f342d";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(12, -24);
  ctx.lineTo(27, -8);
  ctx.stroke();
  ctx.fillStyle = "#f3c45b";
  ctx.beginPath();
  ctx.moveTo(27, -8);
  ctx.lineTo(31, -4);
  ctx.lineTo(25, -2);
  ctx.closePath();
  ctx.fill();
}

function drawDdlBook(tick, enemy = {}) {
  drawLimbs(tick * 1.8, "#5c1e21", 1.25);
  const fuse = Math.max(0, enemy.ddlFuse ?? 1);
  const fuseMax = Math.max(1, enemy.ddlFuseMax ?? 1);
  const danger = 1 - Math.min(1, fuse / fuseMax);
  ctx.fillStyle = `rgba(255, 78, 67, ${0.16 + danger * 0.18 + Math.sin(tick * 5) * 0.08})`;
  ctx.beginPath();
  ctx.arc(0, 0, 31 + danger * 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.rotate(0.05);
  ctx.fillStyle = "#e9574f";
  roundedRect(-20, -22, 42, 42, 5, true, false);
  ctx.fillStyle = "#fff1e4";
  roundedRect(-15, -15, 31, 29, 3, true, false);
  ctx.fillStyle = "#7b1f28";
  ctx.fillRect(-20, -22, 42, 8);
  ctx.fillStyle = "#7b1f28";
  ctx.font = "900 14px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(formatFuse(fuse), 1, 5);
  drawFace(0, 12, true);
  ctx.fillStyle = danger > 0.65 ? "#f43f5e" : "#fbbf24";
  ctx.beginPath();
  ctx.arc(21, -22, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff8ed";
  ctx.font = "900 9px sans-serif";
  ctx.fillText(Math.ceil(fuse), 21, -18.5);
  ctx.strokeStyle = "rgba(123,31,40,0.55)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-35, -11);
  ctx.lineTo(-48, -11);
  ctx.moveTo(-33, 2);
  ctx.lineTo(-46, 5);
  ctx.stroke();
}

function drawReportBook(tick) {
  drawLimbs(tick * 0.65, "#244934", 0.45);
  ctx.fillStyle = "#245b3c";
  roundedRect(-25, -22, 50, 44, 8, true, false);
  ctx.fillStyle = "#68b48a";
  roundedRect(-18, -20, 37, 40, 5, true, false);
  ctx.fillStyle = "#eef5d8";
  roundedRect(-11, -15, 25, 12, 2, true, false);
  ctx.fillStyle = "#bb4d4b";
  ctx.fillRect(6, -14, 5, 10);
  ctx.fillStyle = "#2a6748";
  ctx.font = "bold 10px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("报告", 2, 13);
  ctx.strokeStyle = "#173626";
  ctx.lineWidth = 3;
  roundedRect(-28, -25, 56, 50, 9, false, true);
  drawFace(0, -3, false);
}

function drawPptDeck(tick) {
  drawLimbs(tick, "#6f5919", 0.8);
  ctx.save();
  ctx.rotate(Math.sin(tick) * 0.08);
  for (let i = 3; i >= 0; i -= 1) {
    ctx.fillStyle = i % 2 ? "#f5d96a" : "#e1c44f";
    roundedRect(-22 + i * 3, -20 - i * 3, 42, 34, 5, true, false);
    ctx.strokeStyle = "rgba(120,95,24,0.32)";
    ctx.lineWidth = 1;
    roundedRect(-22 + i * 3, -20 - i * 3, 42, 34, 5, false, true);
  }
  ctx.fillStyle = "#785f18";
  ctx.fillRect(-12, -11, 22, 5);
  ctx.fillRect(-12, -2, 14, 4);
  ctx.fillStyle = "#fff5bc";
  ctx.beginPath();
  ctx.arc(11, 4, 7, 0, Math.PI * 2);
  ctx.fill();
  drawFace(0, 13, false);
  ctx.restore();
}

function drawBugBook(tick) {
  ctx.globalAlpha = 0.72 + Math.sin(tick * 3) * 0.12;
  drawLimbs(tick * 1.4, "#242143", 0.95);
  ctx.rotate(-0.12);
  ctx.fillStyle = "#22202c";
  roundedRect(-21, -20, 42, 38, 6, true, false);
  ctx.fillStyle = "#5f58bc";
  ctx.fillRect(-21, -20, 7, 38);
  ctx.fillStyle = "#9ef0cb";
  ctx.font = "bold 8px monospace";
  ctx.textAlign = "left";
  ctx.fillText("{ }", -8, -8);
  ctx.fillText("err", -8, 2);
  ctx.fillText("404", -8, 12);
  ctx.fillStyle = "#9ef0cb";
  ctx.beginPath();
  ctx.arc(-5, -3, 2, 0, Math.PI * 2);
  ctx.arc(9, -3, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#9ef0cb";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-5, 8);
  ctx.lineTo(9, 8);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function drawLimbs(tick, color, stride = 1) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-15, 12);
  ctx.lineTo(-23, 20 + Math.sin(tick) * 4 * stride);
  ctx.moveTo(14, 12);
  ctx.lineTo(23, 20 - Math.sin(tick) * 4 * stride);
  ctx.moveTo(-17, -2);
  ctx.lineTo(-28, -11 - Math.sin(tick * 1.1) * 3);
  ctx.moveTo(17, -2);
  ctx.lineTo(28, -9 + Math.sin(tick * 1.1) * 3);
  ctx.stroke();
}

function drawFace(x, y, angry) {
  ctx.fillStyle = "#26221b";
  ctx.beginPath();
  ctx.arc(x - 7, y - 5, 2.2, 0, Math.PI * 2);
  ctx.arc(x + 7, y - 5, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#26221b";
  ctx.lineWidth = 1.7;
  ctx.beginPath();
  if (angry) {
    ctx.moveTo(x - 7, y + 6);
    ctx.lineTo(x + 7, y + 3);
  } else {
    ctx.arc(x, y + 1, 7, 0.15, Math.PI - 0.15);
  }
  ctx.stroke();
}

function drawProjectiles() {
  for (const p of state.projectiles) {
    const t = 1 - p.life / p.maxLife;
    const impactPoint = projectileImpactPoint(p);
    const head = [p.x + (impactPoint[0] - p.x) * t, p.y + (impactPoint[1] - p.y) * t];
    if (p.kind === "math") drawMathProjectile(p, head, t, impactPoint);
    else if (p.kind === "physics") drawPhysicsProjectile(p, head, t, impactPoint);
    else if (p.kind === "lab") drawLabProjectile(p, head, t, impactPoint);
    else if (p.kind === "coffee") drawCoffeeProjectile(p, head, t, impactPoint);
  }
}

function drawMathProjectile(p, head, t, impactPoint) {
  drawProjectileTrail(p, head, t, impactPoint, "56, 189, 248", 2.5);
  drawProjectileSprite(artAssets.effects?.bulletBlue, p, head, impactPoint, 34, 0.95, 0, "#38bdf8");
  ctx.fillStyle = "rgba(245, 251, 255, 0.88)";
  ctx.font = "bold 13px serif";
  ctx.textAlign = "center";
  const glyphs = ["∫", "Σ", "dx"];
  glyphs.forEach((g, i) => {
    const k = Math.min(1, Math.max(0, t - i * 0.12));
    ctx.fillText(g, p.x + (impactPoint[0] - p.x) * k, p.y + (impactPoint[1] - p.y) * k - 12 + i * 7);
  });
}

function drawPhysicsProjectile(p, head, t, impactPoint) {
  drawProjectileTrail(p, head, t, impactPoint, "251, 146, 60", 3.2, 0.9);
  drawProjectileSprite(artAssets.effects?.bulletOrange, p, head, impactPoint, 34, 0.96, 0, "#fb923c");
}

function drawLabProjectile(p, head, t, impactPoint) {
  drawProjectileTrail(p, head, t, impactPoint, "52, 211, 153", 4.8, 0.52);
  drawProjectileSprite(artAssets.effects?.bulletGreen, p, head, impactPoint, 30, 0.98, Math.sin(t * Math.PI) * 0.16, "#34d399");
}

function drawCoffeeProjectile(p, head, t, impactPoint) {
  ctx.strokeStyle = "rgba(128,76,38,0.72)";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(p.x, p.y - 14);
  ctx.quadraticCurveTo((p.x + impactPoint[0]) / 2, p.y - 42, head[0], head[1]);
  ctx.stroke();
  drawEffectSprite(artAssets.effects?.slowWave, head[0], head[1], 34 + Math.sin(t * Math.PI) * 6, 0.82, 0);
}

function drawProjectileTrail(p, head, t, impactPoint, rgb, width, alpha = 0.72) {
  const start = [p.x, p.y - 10];
  const tail = [
    p.x + (impactPoint[0] - p.x) * Math.max(0, t - 0.24),
    p.y + (impactPoint[1] - p.y) * Math.max(0, t - 0.24),
  ];
  ctx.save();
  ctx.strokeStyle = `rgba(${rgb},${alpha})`;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(start[0], start[1]);
  ctx.lineTo(tail[0], tail[1]);
  ctx.lineTo(head[0], head[1]);
  ctx.stroke();
  ctx.strokeStyle = `rgba(255,255,245,${Math.min(0.7, alpha)})`;
  ctx.lineWidth = Math.max(1.2, width * 0.34);
  ctx.beginPath();
  ctx.moveTo(tail[0], tail[1]);
  ctx.lineTo(head[0], head[1]);
  ctx.stroke();
  ctx.restore();
}

function drawProjectileSprite(image, p, head, impactPoint, size, alpha = 1, extraRotate = 0, fallbackColor = "#fff8ed") {
  const angle = Math.atan2(impactPoint[1] - p.y, impactPoint[0] - p.x);
  if (drawEffectSprite(image, head[0], head[1], size, alpha, angle + extraRotate)) return;
  ctx.save();
  ctx.fillStyle = fallbackColor;
  ctx.beginPath();
  ctx.arc(head[0], head[1], size * 0.18, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawEffectSprite(image, x, y, size, alpha = 1, rotation = 0) {
  if (!image || !image.complete || image.naturalWidth <= 0) return false;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.globalAlpha *= alpha;
  ctx.drawImage(image, -size / 2, -size / 2, size, size);
  ctx.restore();
  return true;
}

function drawTowerImpact(effect, t) {
  const fade = 1 - t;
  const radius = effect.radius || 24;
  if (effect.tower === "lab") {
    drawEffectSprite(artAssets.effects?.bulletGreen, effect.x, effect.y, 26 + t * 18, 0.86 * fade, -t * 0.8);
    ctx.strokeStyle = `rgba(52, 211, 153, ${0.78 * fade})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(effect.x, effect.y, 10 + t * Math.max(34, radius), 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = `rgba(52, 211, 153, ${0.12 * fade})`;
    ctx.beginPath();
    ctx.arc(effect.x, effect.y, 8 + t * Math.max(30, radius), 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  if (effect.tower === "coffee") {
    drawEffectSprite(artAssets.effects?.slowWave, effect.x, effect.y, 34 + t * 42, 0.82 * fade, 0);
    ctx.strokeStyle = `rgba(128, 76, 38, ${0.55 * fade})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(effect.x, effect.y, 12 + t * 30, 0, Math.PI * 2);
    ctx.stroke();
    return;
  }

  if (effect.tower === "math") {
    drawEffectSprite(artAssets.effects?.bulletBlue, effect.x, effect.y, 24 + t * 14, 0.78 * fade, -Math.PI / 4);
    ctx.strokeStyle = `rgba(56, 189, 248, ${0.72 * fade})`;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(effect.x, effect.y, 8 + t * 24, 0, Math.PI * 2);
    ctx.stroke();
    return;
  }

  drawEffectSprite(artAssets.effects?.hitSpark, effect.x, effect.y, 38 + t * 18, 0.92 * fade, t * 0.8);
  ctx.strokeStyle = `rgba(251, 146, 60, ${0.55 * fade})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(effect.x, effect.y, 6 + t * 22, 0, Math.PI * 2);
  ctx.stroke();
}

function drawTowerBuildEffect(effect, t) {
  const fade = 1 - t;
  drawEffectSprite(artAssets.effects?.hitSpark, effect.x, effect.y - 8, 34 + t * 12, 0.55 * fade, t * 0.6);
  ctx.fillStyle = `rgba(255, 244, 190, ${0.38 * fade})`;
  for (let i = 0; i < 6; i += 1) {
    const a = i * Math.PI * 2 / 6;
    ctx.beginPath();
    ctx.arc(effect.x + Math.cos(a) * (12 + t * 18), effect.y + 18 + Math.sin(a) * 7, 3.2 * fade, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawTowerUpgradeEffect(effect, t) {
  const fade = 1 - t;
  const color = towerEffectColor(effect.tower);
  ctx.save();
  ctx.strokeStyle = `rgba(${color}, ${0.7 * fade})`;
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  for (let i = 0; i < 3; i += 1) {
    const x = effect.x + (i - 1) * 13;
    const y = effect.y + 22 - t * (34 + i * 5);
    ctx.beginPath();
    ctx.moveTo(x, y + 10);
    ctx.lineTo(x, y - 4);
    ctx.lineTo(x - 5, y + 2);
    ctx.moveTo(x, y - 4);
    ctx.lineTo(x + 5, y + 2);
    ctx.stroke();
  }
  ctx.fillStyle = `rgba(255, 255, 245, ${0.45 * fade})`;
  ctx.beginPath();
  ctx.arc(effect.x, effect.y - 16 - t * 18, 5 * fade, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawTowerSellEffect(effect, t) {
  const fade = 1 - t;
  ctx.fillStyle = `rgba(92, 86, 76, ${0.42 * fade})`;
  for (let i = 0; i < 8; i += 1) {
    const a = i * Math.PI * 2 / 8;
    const dist = 10 + t * 24;
    ctx.beginPath();
    ctx.arc(effect.x + Math.cos(a) * dist, effect.y + Math.sin(a) * dist * 0.62, 3.4 * fade, 0, Math.PI * 2);
    ctx.fill();
  }
}

function towerEffectColor(kind) {
  if (kind === "math") return "56, 189, 248";
  if (kind === "physics") return "251, 146, 60";
  if (kind === "lab") return "52, 211, 153";
  if (kind === "coffee") return "251, 191, 36";
  return "255, 244, 190";
}

function drawEffects() {
  for (const effect of state.effects || []) {
    const t = 1 - effect.life / effect.maxLife;
    if (effect.kind === "muzzle") {
      ctx.strokeStyle = effect.tower === "coffee" ? "rgba(255,244,220,0.8)" : "rgba(255,255,255,0.75)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, 12 + t * 18, 0, Math.PI * 2);
      ctx.stroke();
    } else if (effect.kind === "impact") {
      drawTowerImpact(effect, t);
    } else if (effect.kind === "defeat") {
      ctx.fillStyle = `rgba(255, 244, 198, ${0.55 * (1 - t)})`;
      for (let i = 0; i < 7; i += 1) {
        const a = i * Math.PI * 2 / 7;
        ctx.beginPath();
        ctx.arc(effect.x + Math.cos(a) * t * 34, effect.y + Math.sin(a) * t * 24, 4 * (1 - t), 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (effect.kind === "gpa-hit") {
      ctx.strokeStyle = `rgba(198, 69, 62, ${0.9 * (1 - t)})`;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, 22 + t * 34, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = `rgba(198, 69, 62, ${0.2 * (1 - t)})`;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, 16 + t * 22, 0, Math.PI * 2);
      ctx.fill();
    } else if (effect.kind === "gpa-heal") {
      ctx.strokeStyle = `rgba(52, 211, 153, ${0.85 * (1 - t)})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, 18 + t * 28, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = `rgba(52, 211, 153, ${0.18 * (1 - t)})`;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, 12 + t * 18, 0, Math.PI * 2);
      ctx.fill();
    } else if (effect.kind === "ddl-explode") {
      const radius = effect.radius || 88;
      ctx.fillStyle = `rgba(239, 68, 68, ${0.22 * (1 - t)})`;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, 18 + t * radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = `rgba(255, 244, 198, ${0.9 * (1 - t)})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, 12 + t * radius, 0, Math.PI * 2);
      ctx.stroke();
      for (let i = 0; i < 8; i += 1) {
        const a = i * Math.PI * 2 / 8 + t;
        ctx.fillStyle = `rgba(198, 69, 62, ${0.85 * (1 - t)})`;
        ctx.beginPath();
        ctx.arc(effect.x + Math.cos(a) * t * radius * 0.82, effect.y + Math.sin(a) * t * radius * 0.82, 4 * (1 - t), 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (effect.kind === "tower-downgrade") {
      ctx.strokeStyle = `rgba(244, 63, 94, ${0.9 * (1 - t)})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, 18 + t * 18, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = `rgba(244, 63, 94, ${0.12 * (1 - t)})`;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, 26, 0, Math.PI * 2);
      ctx.fill();
    } else if (effect.kind === "tower-build") {
      drawTowerBuildEffect(effect, t);
    } else if (effect.kind === "tower-upgrade") {
      drawTowerUpgradeEffect(effect, t);
    } else if (effect.kind === "tower-sell") {
      drawTowerSellEffect(effect, t);
    } else if (effect.kind === "boss-summon") {
      ctx.strokeStyle = `rgba(251, 191, 36, ${0.86 * (1 - t)})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, 18 + t * 38, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = `rgba(251, 191, 36, ${0.16 * (1 - t)})`;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, 12 + t * 26, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/*
function drawBookEnemy(kind, x, y, tick = 0) {
  const palette = {
    homework: ["#f1b15f", "#7a3f22", "习题"],
    ddl: ["#ef5f57", "#7b1f28", "DDL"],
    report: ["#68b48a", "#245b3c", "报告"],
    ppt: ["#e1c44f", "#785f18", "PPT"],
    bug: ["#7a73d1", "#2d2b68", "BUG"],
  }[kind] || ["#f1b15f", "#7a3f22", "书本"];
  const bob = Math.sin(tick) * 2;
  ctx.save();
  ctx.translate(x, y + bob);
  ctx.lineCap = "round";
  ctx.strokeStyle = "#4b3128";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-14, 12);
  ctx.lineTo(-22, 20 + Math.sin(tick) * 3);
  ctx.moveTo(14, 12);
  ctx.lineTo(22, 20 - Math.sin(tick) * 3);
  ctx.moveTo(-16, -2);
  ctx.lineTo(-27, -10 - Math.sin(tick) * 2);
  ctx.moveTo(16, -2);
  ctx.lineTo(27, -8 + Math.sin(tick) * 2);
  ctx.stroke();

  ctx.shadowColor = "rgba(33, 24, 16, 0.35)";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 4;
  ctx.fillStyle = palette[0];
  roundedRect(-20, -20, 40, 38, 7, true, false);
  ctx.shadowColor = "transparent";
  ctx.fillStyle = "rgba(255,255,255,0.42)";
  roundedRect(-16, -16, 30, 30, 4, true, false);
  ctx.fillStyle = palette[1];
  ctx.fillRect(-20, -20, 7, 38);
  ctx.fillStyle = "#26221b";
  ctx.beginPath();
  ctx.arc(-6, -4, 2.2, 0, Math.PI * 2);
  ctx.arc(8, -4, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#26221b";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(1, 5, 7, 0.15, Math.PI - 0.15);
  ctx.stroke();
  ctx.fillStyle = palette[1];
  ctx.font = "bold 10px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(palette[2], 3, -12);
  ctx.restore();
}
    ctx.fillStyle = "#f5f1df";
    ctx.fillRect(9, 16, 16, 4);
  } else if (kind === "lab") {
    ctx.strokeStyle = "#5b6470";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-14, -18);
    ctx.lineTo(14, -18);
    ctx.moveTo(0, -18);
    ctx.lineTo(0, 20);
    ctx.stroke();
    ctx.fillStyle = "#a8d8ee";
    roundedRect(-14, -2, 28, 30, 8, true, false);
    ctx.fillStyle = "rgba(143, 80, 180, 0.75)";
    ctx.fillRect(-10, 12, 20, 12);
  } else if (kind === "coffee") {
    ctx.fillStyle = "#c08343";
    roundedRect(-18, -16, 36, 42, 9, true, false);
    ctx.fillStyle = "#fff4dc";
    roundedRect(-8, -6, 22, 20, 4, true, false);
    ctx.strokeStyle = "#fff4dc";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(15, 5, 8, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();
  } else {
    ctx.fillStyle = "#2f7d68";
    ctx.beginPath();
    ctx.arc(0, 0, 23, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#d6fff4";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 1.6);
    ctx.stroke();
  }

  ctx.fillStyle = "#2b2b25";
  ctx.font = "bold 11px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`Lv.${level}`, 0, 40);
  ctx.restore();
}

function drawBookEnemy(kind, x, y, tick = 0) {
  const palette = {
    homework: ["#f1b15f", "#7a3f22", "习题"],
    ddl: ["#ef5f57", "#7b1f28", "DDL"],
    report: ["#68b48a", "#245b3c", "报告"],
    ppt: ["#e1c44f", "#785f18", "PPT"],
    bug: ["#7a73d1", "#2d2b68", "BUG"],
  }[kind] || ["#f1b15f", "#7a3f22", "书本"];
  const bob = Math.sin(tick) * 2;
  ctx.save();
  ctx.translate(x, y + bob);
  ctx.lineCap = "round";
  ctx.strokeStyle = "#4b3128";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-14, 12);
  ctx.lineTo(-22, 20 + Math.sin(tick) * 3);
  ctx.moveTo(14, 12);
  ctx.lineTo(22, 20 - Math.sin(tick) * 3);
  ctx.moveTo(-16, -2);
  ctx.lineTo(-27, -10 - Math.sin(tick) * 2);
  ctx.moveTo(16, -2);
  ctx.lineTo(27, -8 + Math.sin(tick) * 2);
  ctx.stroke();

  ctx.shadowColor = "rgba(33, 24, 16, 0.35)";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 4;
  ctx.fillStyle = palette[0];
  roundedRect(-20, -20, 40, 38, 7, true, false);
  ctx.shadowColor = "transparent";
  ctx.fillStyle = "rgba(255,255,255,0.42)";
  roundedRect(-16, -16, 30, 30, 4, true, false);
  ctx.fillStyle = palette[1];
  ctx.fillRect(-20, -20, 7, 38);
  ctx.fillStyle = "#26221b";
  ctx.beginPath();
  ctx.arc(-6, -4, 2.2, 0, Math.PI * 2);
  ctx.arc(8, -4, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#26221b";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(1, 5, 7, 0.15, Math.PI - 0.15);
  ctx.stroke();
  ctx.fillStyle = palette[1];
  ctx.font = "bold 10px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(palette[2], 3, -12);
  ctx.restore();
}

function polyline(points) {
*/
function polyline(points) {
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i][0], points[i][1]);
  ctx.stroke();
}

function roundedRect(x, y, w, h, r, fill, stroke) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

function formatGpa(value) {
  return (Math.max(0, value) / 10).toFixed(1);
}

function formatGpaDelta(value) {
  return (value / 10).toFixed(1);
}

function formatFuse(value) {
  const seconds = Math.max(0, Math.ceil(value));
  return `00:${String(seconds).padStart(2, "0")}`;
}
