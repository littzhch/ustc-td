// 本文件由 game.js 拆分而来，保持普通 script 全局加载以兼容 file:// 运行。
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
  enhanceXpBar: document.getElementById("enhanceXpBar"),
  enhanceXpText: document.getElementById("enhanceXpText"),
  kills: document.getElementById("kills"),
  score: document.getElementById("score"),
  credits: document.getElementById("credits"),
  saveBtn: document.getElementById("saveBtn"),
  pauseBtn: document.getElementById("pauseBtn"),
  abortBtn: document.getElementById("abortBtn"),
};

const WIDTH = 1180;
const HEIGHT = 720;
const SAVE_KEY = "ustc_guardian_web_v2";
const RUN_SAVE_KEY = `${SAVE_KEY}_run`;
const GPA_MAX = 43;
const CUSTOM_SLOT_COST = 35;
const THEME_GREEN = "#34d399";
const THEME_ROSE = "#f43f5e";
const THEME_BLUE = "#38bdf8";

const artAssets = {
  maps: {
    eastCampus: new Image(),
    gaoxinCampus: new Image(),
    westCampus: new Image(),
  },
  towers: {
    math: [new Image(), new Image(), new Image()],
    physics: [new Image(), new Image(), new Image()],
    lab: [new Image(), new Image(), new Image()],
    coffee: [new Image(), new Image(), new Image()],
  },
  enemies: {
    homework: new Image(),
    report: new Image(),
    ddl: new Image(),
    ppt: new Image(),
    bug: new Image(),
    boss_midterm: new Image(),
    boss_ddl: new Image(),
    boss_lab: new Image(),
    boss_thesis: new Image(),
  },
  effects: {
    bulletBlue: new Image(),
    bulletOrange: new Image(),
    bulletGreen: new Image(),
    slowWave: new Image(),
    hitSpark: new Image(),
  },
};

artAssets.maps.eastCampus.src = "assets/maps/map_east_campus_01.png";
artAssets.maps.gaoxinCampus.src = "assets/maps/map_gaoxin_campus_01.png";
artAssets.maps.westCampus.src = "assets/maps/map_west_campus_02.png";
artAssets.towers.math[0].src = "assets/towers/tower_math_lv1.png";
artAssets.towers.math[1].src = "assets/towers/tower_math_lv2.png";
artAssets.towers.math[2].src = "assets/towers/tower_math_lv3.png";
artAssets.towers.physics[0].src = "assets/towers/tower_physics_lv1.png";
artAssets.towers.physics[1].src = "assets/towers/tower_physics_lv2.png";
artAssets.towers.physics[2].src = "assets/towers/tower_physics_lv3.png";
artAssets.towers.lab[0].src = "assets/towers/tower_lab_lv1.png";
artAssets.towers.lab[1].src = "assets/towers/tower_lab_lv2.png";
artAssets.towers.lab[2].src = "assets/towers/tower_lab_lv3.png";
artAssets.towers.coffee[0].src = "assets/towers/tower_coffee_lv1.png";
artAssets.towers.coffee[1].src = "assets/towers/tower_coffee_lv2.png";
artAssets.towers.coffee[2].src = "assets/towers/tower_coffee_lv3.png";
artAssets.enemies.homework.src = "assets/enemies/enemy_homework.png";
artAssets.enemies.report.src = "assets/enemies/enemy_report.png";
artAssets.enemies.ddl.src = "assets/enemies/enemy_ddl.png";
artAssets.enemies.ppt.src = "assets/enemies/enemy_ppt.png";
artAssets.enemies.bug.src = "assets/enemies/enemy_bug.png";
artAssets.enemies.boss_midterm.src = "assets/enemies/enemy_boss_midterm.png";
artAssets.enemies.boss_ddl.src = "assets/enemies/enemy_boss_ddl.png";
artAssets.enemies.boss_lab.src = "assets/enemies/enemy_boss_lab.png";
artAssets.enemies.boss_thesis.src = "assets/enemies/enemy_boss_thesis.png";
artAssets.effects.bulletBlue.src = "assets/effects/fx_bullet_blue.png";
artAssets.effects.bulletOrange.src = "assets/effects/fx_bullet_orange.png";
artAssets.effects.bulletGreen.src = "assets/effects/fx_bullet_green.png";
artAssets.effects.slowWave.src = "assets/effects/fx_slow_wave.png";
artAssets.effects.hitSpark.src = "assets/effects/fx_hit_spark.png";

function repeat(value, count) {
  return Array.from({ length: count }, () => value);
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function distance(a, b) {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}
