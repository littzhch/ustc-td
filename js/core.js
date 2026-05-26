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

function repeat(value, count) {
  return Array.from({ length: count }, () => value);
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function distance(a, b) {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}
