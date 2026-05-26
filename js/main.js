// 本文件由 game.js 拆分而来，保持普通 script 全局加载以兼容 file:// 运行。
let last = performance.now();

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  try {
    update(dt);
    draw();
  } catch (error) {
    console.error("游戏循环异常：", error);
  } finally {
    requestAnimationFrame(frame);
  }
}

switchOverlay("menu");
requestAnimationFrame(frame);
