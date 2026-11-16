// Wiggle Worm's HUD and screens: the top bar (score, best, worm length,
// bed, apples vs target, combo meter) over the garden, and the title,
// level-complete, victory, defeat and pause panels. Drawn after the world.

import { BEDS, COLORS, COMBO_WINDOW, VIEW_H, VIEW_W } from './config.js';
import { drawWorm } from './render.js';
import { SCREEN_LEVEL, SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './world.js';

const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

function text(ctx, value, x, y, size, color, align = 'center', bold = true) {
  ctx.font = `${bold ? 'bold ' : ''}${size}px ${FONT}`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(value, x, y);
}

function panel(ctx, w, h) {
  const x = (VIEW_W - w) / 2;
  const y = (VIEW_H - h) / 2;
  ctx.fillStyle = 'rgba(24, 38, 20, 0.82)';
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 22);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 247, 224, 0.5)';
  ctx.lineWidth = 2;
  ctx.stroke();
  return { x, y };
}

function drawBar(ctx, state) {
  ctx.fillStyle = 'rgba(24, 38, 20, 0.78)';
  ctx.fillRect(0, 0, VIEW_W, 52);
  const bed = BEDS[state.bed - 1];
  text(ctx, `SCORE ${state.score}`, 22, 27, 22, COLORS.cream, 'left');
  text(ctx, `BEST ${Math.max(state.best, state.score)}`, 300, 27, 18, '#b9d99a', 'left', false);
  text(ctx, `BED ${state.bed} / ${BEDS.length}`, VIEW_W / 2, 27, 22, COLORS.cream);
  const goal = state.gate ? 'GATE OPEN!' : `🍎 ${state.eaten} / ${bed.target}`;
  text(ctx, goal, VIEW_W - 300, 27, 22, state.gate ? COLORS.gate : COLORS.cream, 'right');
  text(ctx, `LENGTH ${state.worm.segments.length}`, VIEW_W - 22, 27, 18, '#b9d99a', 'right', false);
  if (state.combo > 1 && state.comboTimer > 0) {
    const cx = VIEW_W / 2;
    text(ctx, `COMBO ×${state.combo}`, cx, 74, 24, COLORS.golden);
    ctx.fillStyle = 'rgba(255,201,60,0.35)';
    ctx.fillRect(cx - 70, 90, 140, 6);
    ctx.fillStyle = COLORS.golden;
    ctx.fillRect(cx - 70, 90, 140 * (state.comboTimer / COMBO_WINDOW), 6);
  }
  if (state.audio.muted) text(ctx, 'MUTED (M)', VIEW_W - 22, 74, 15, '#b9d99a', 'right', false);
}

function drawTitle(ctx, state, alpha) {
  ctx.fillStyle = 'rgba(24, 38, 20, 0.45)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  // The mascot worm again, over the dim, in its true coral pink.
  drawWorm(ctx, state, alpha);
  text(ctx, 'WIGGLE WORM', VIEW_W / 2, 218, 92, COLORS.cream);
  text(ctx, '🍎  Garden Feast  🍎', VIEW_W / 2, 292, 40, COLORS.golden);
  text(ctx, 'Eat apples to grow through 5 garden beds.', VIEW_W / 2, 372, 25, COLORS.cream, 'center', false);
  text(ctx, 'Golden apples are bonus treats — grab them before they fade!', VIEW_W / 2, 408, 25, COLORS.cream, 'center', false);
  text(ctx, 'Fill a bed\'s apple target to open the gate. Dodge rocks, walls and your own tail.', VIEW_W / 2, 444, 25, COLORS.cream, 'center', false);
  text(ctx, 'Steer: Arrow keys or WASD  ·  Pause: P  ·  Mute: M', VIEW_W / 2, 508, 22, '#b9d99a', 'center', false);
  const pulse = 1 + Math.sin(state.time * 4) * 0.03;
  ctx.save();
  ctx.translate(VIEW_W / 2, 578);
  ctx.scale(pulse, pulse);
  text(ctx, 'Press SPACE or click to wiggle!', 0, 0, 30, COLORS.gate);
  ctx.restore();
  if (state.best > 0) text(ctx, `Best score: ${state.best}`, VIEW_W / 2, 636, 22, '#b9d99a');
}

function drawLevel(ctx, state) {
  const { y } = panel(ctx, 560, 330);
  text(ctx, `BED ${state.bed} CLEARED!`, VIEW_W / 2, y + 74, 44, COLORS.gate);
  text(ctx, `Score ${state.score}  ·  Worm length ${state.worm.segments.length}`, VIEW_W / 2, y + 140, 25, COLORS.cream, 'center', false);
  text(ctx, `Next: Bed ${state.bed + 1} — faster, and more rocks!`, VIEW_W / 2, y + 188, 25, COLORS.cream, 'center', false);
  text(ctx, 'Press SPACE or click for the next bed', VIEW_W / 2, y + 268, 24, COLORS.golden);
}

function drawEnd(ctx, state, won) {
  const { y } = panel(ctx, 620, 380);
  const s = state.endStats || { score: state.score, bed: state.bed, eaten: state.totalEaten, length: state.worm.segments.length, time: 0 };
  text(ctx, won ? '🏆 GARDEN CHAMPION!' : 'OUCH! THE FEAST ENDS', VIEW_W / 2, y + 76, won ? 46 : 42, won ? COLORS.golden : '#ff9a8a');
  text(ctx, won ? 'You feasted through all 5 beds!' : `The worm came to grief in Bed ${s.bed}.`, VIEW_W / 2, y + 132, 25, COLORS.cream, 'center', false);
  text(ctx, `Score ${s.score}  ·  Best ${state.best}`, VIEW_W / 2, y + 190, 27, COLORS.cream);
  text(ctx, `Apples eaten ${s.eaten}  ·  Final length ${s.length}  ·  Time ${s.time}s`, VIEW_W / 2, y + 232, 22, '#b9d99a', 'center', false);
  text(ctx, 'Press SPACE or click to play again', VIEW_W / 2, y + 316, 24, COLORS.golden);
}

function drawPaused(ctx) {
  const { y } = panel(ctx, 420, 200);
  text(ctx, 'PAUSED', VIEW_W / 2, y + 78, 42, COLORS.cream);
  text(ctx, 'Press P to keep wiggling', VIEW_W / 2, y + 142, 22, COLORS.golden, 'center', false);
}

export function drawHud(ctx, state, alpha = 1) {
  if (state.screen === SCREEN_TITLE) {
    drawTitle(ctx, state, alpha);
    return;
  }
  drawBar(ctx, state);
  if (state.screen === SCREEN_LEVEL) drawLevel(ctx, state);
  else if (state.screen === SCREEN_WIN) drawEnd(ctx, state, true);
  else if (state.screen === SCREEN_OVER) drawEnd(ctx, state, false);
  else if (state.screen === SCREEN_PLAY && state.paused) drawPaused(ctx);
}
