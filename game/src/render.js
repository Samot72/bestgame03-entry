// Wiggle Worm's world renderer: the garden bed (checkerboard grass, a
// wooden fence, flowers), rocks, apples, the golden gate, and the worm
// itself — drawn tail to head as overlapping coral-pink circles sliding
// smoothly between grid ticks, a darker red band at every segment joint,
// a lighter sheen along the top, and a face on the head: one big eye
// riding on top, a friendly smile, and blush. Pure canvas, no assets.

import { CELL, COLORS, COLS, ROWS } from './config.js';
import { segmentPixel } from './worm.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawGarden(ctx, state) {
  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      ctx.fillStyle = (x + y) % 2 === 0 ? COLORS.grassA : COLORS.grassB;
      ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
    }
  }
  // Flowers: little five-petal dots scattered by the bed's own seed.
  const petalColors = ['#ff8fb2', '#fff3f6', '#ffd94d'];
  for (const f of state.flowers) {
    const cx = (f.x + 0.5) * CELL + Math.sin(f.phase) * 6;
    const cy = (f.y + 0.5) * CELL + Math.cos(f.phase) * 6;
    ctx.fillStyle = petalColors[f.kind];
    for (let p = 0; p < 5; p += 1) {
      const a = (p / 5) * Math.PI * 2 + f.phase;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * 5, cy + Math.sin(a) * 5, 3.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#f5a623';
    ctx.beginPath();
    ctx.arc(cx, cy, 2.6, 0, Math.PI * 2);
    ctx.fill();
  }
  // The fence around the bed: posts along every edge.
  ctx.fillStyle = COLORS.fence;
  ctx.fillRect(0, 0, COLS * CELL, 7);
  ctx.fillRect(0, ROWS * CELL - 7, COLS * CELL, 7);
  ctx.fillRect(0, 0, 7, ROWS * CELL);
  ctx.fillRect(COLS * CELL - 7, 0, 7, ROWS * CELL);
  ctx.fillStyle = COLORS.fenceDark;
  for (let x = 0; x < COLS; x += 2) {
    ctx.fillRect(x * CELL + 3, 0, 5, 10);
    ctx.fillRect(x * CELL + 3, ROWS * CELL - 10, 5, 10);
  }
  for (let y = 0; y < ROWS; y += 2) {
    ctx.fillRect(0, y * CELL + 3, 10, 5);
    ctx.fillRect(COLS * CELL - 10, y * CELL + 3, 10, 5);
  }
}

function drawRock(ctx, x, y) {
  const cx = (x + 0.5) * CELL;
  const cy = (y + 0.5) * CELL;
  ctx.fillStyle = COLORS.rockDark;
  ctx.beginPath();
  ctx.ellipse(cx, cy + 9, 16, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.rock;
  ctx.beginPath();
  ctx.moveTo(cx - 15, cy + 8);
  ctx.lineTo(cx - 10, cy - 9);
  ctx.lineTo(cx - 2, cy - 14);
  ctx.lineTo(cx + 9, cy - 11);
  ctx.lineTo(cx + 15, cy + 6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.ellipse(cx - 4, cy - 8, 6, 3.4, -0.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawApple(ctx, cell, color, dark, t, bobPhase) {
  const cx = (cell.x + 0.5) * CELL;
  const cy = (cell.y + 0.5) * CELL + Math.sin(t * 3 + bobPhase) * 2;
  // Stem and leaf.
  ctx.strokeStyle = '#6d4420';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx, cy - 10);
  ctx.quadraticCurveTo(cx + 2, cy - 16, cx + 5, cy - 17);
  ctx.stroke();
  ctx.fillStyle = '#3f9e4d';
  ctx.beginPath();
  ctx.ellipse(cx + 9, cy - 15, 7, 3.6, 0.5, 0, Math.PI * 2);
  ctx.fill();
  // Body: two overlapping circles for the apple silhouette.
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx - 6, cy + 2, 11.5, 0, Math.PI * 2);
  ctx.arc(cx + 6, cy + 2, 11.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = dark;
  ctx.beginPath();
  ctx.ellipse(cx, cy + 11, 9, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.beginPath();
  ctx.ellipse(cx - 7, cy - 3, 4.4, 6.4, -0.4, 0, Math.PI * 2);
  ctx.fill();
}

function drawGate(ctx, state) {
  const gate = state.gate;
  if (!gate) return;
  const cx = (gate.x + 0.5) * CELL;
  const cy = (gate.y + 0.5) * CELL;
  const pulse = 1 + Math.sin(state.time * 6) * 0.07;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(pulse, pulse);
  ctx.fillStyle = 'rgba(255,217,77,0.3)';
  ctx.beginPath();
  ctx.arc(0, 0, 21, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.gate;
  roundRect(ctx, -15, -15, 30, 30, 8);
  ctx.fill();
  ctx.fillStyle = '#b8860b';
  ctx.font = 'bold 19px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('➜', 0, 1);
  ctx.restore();
}

export function drawWorm(ctx, state, alpha) {
  const worm = state.worm;
  const n = worm.segments.length;
  const pts = [];
  for (let i = 0; i < n; i += 1) pts.push(segmentPixel(worm, i, alpha));
  // Tail first so the head sits on top.
  for (let i = n - 1; i >= 0; i -= 1) {
    const { x, y } = pts[i];
    const frac = n <= 1 ? 0 : i / (n - 1); // 0 head → 1 tail
    const r = CELL * (0.48 - 0.12 * frac) * (i === 0 ? 1.14 : 1);
    // This segment's local heading, from its neighbours, so the band can
    // sit across the body at the joint like a ring on an earthworm.
    const ahead = pts[Math.max(0, i - 1)];
    const behind = pts[Math.min(n - 1, i + 1)];
    let dx = ahead.x - behind.x;
    let dy = ahead.y - behind.y;
    const len = Math.hypot(dx, dy) || 1;
    dx /= len;
    dy /= len;
    ctx.fillStyle = COLORS.wormA;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    if (i > 0) {
      // The darker red band at this segment's tail-side joint.
      ctx.save();
      ctx.translate(x - dx * r * 0.55, y - dy * r * 0.55);
      ctx.rotate(Math.atan2(dy, dx));
      ctx.fillStyle = COLORS.wormBand;
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.26, r * 0.97, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    // A lighter coral sheen along the top, the reference's flat shading.
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = COLORS.wormB;
    ctx.beginPath();
    ctx.ellipse(x, y - r * 0.36, r * 0.56, r * 0.32, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  drawFace(ctx, state, alpha);
}

function drawFace(ctx, state, alpha) {
  const worm = state.worm;
  const { x, y } = segmentPixel(worm, 0, alpha);
  const dir = worm.dir;
  const r = CELL * 0.48 * 1.14; // the head's radius, as drawn in drawWorm
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.atan2(dir.y, dir.x));
  // One big eye riding on top of the head: a white ball with a dark pupil
  // looking the way the worm wiggles, and a tiny glint.
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(r * 0.18, -r * 0.52, r * 0.40, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.ink;
  ctx.beginPath();
  ctx.arc(r * 0.31, -r * 0.52, r * 0.20, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(r * 0.37, -r * 0.61, r * 0.07, 0, Math.PI * 2);
  ctx.fill();
  // The friendly smile, low on the snout.
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = 2.4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(r * 0.34, r * 0.14, r * 0.34, Math.PI * 0.15, Math.PI * 0.85);
  ctx.stroke();
  // Blush on the cheek.
  ctx.fillStyle = COLORS.blush;
  ctx.beginPath();
  ctx.ellipse(-r * 0.30, r * 0.36, r * 0.30, r * 0.17, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawFx(ctx, state) {
  for (const p of state.fx.particles) {
    const k = 1 - p.age / p.life;
    ctx.globalAlpha = Math.max(0, k);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * k + 0.6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const f of state.fx.floaters) {
    const k = 1 - f.age / f.life;
    ctx.globalAlpha = Math.max(0, k);
    ctx.font = 'bold 21px system-ui, sans-serif';
    ctx.fillStyle = f.color;
    ctx.strokeStyle = 'rgba(32,48,28,0.7)';
    ctx.lineWidth = 3.5;
    ctx.strokeText(f.text, f.x, f.y);
    ctx.fillText(f.text, f.x, f.y);
  }
  ctx.globalAlpha = 1;
}

export function drawWorld(ctx, state, alpha) {
  ctx.save();
  if (state.shake > 0) {
    const s = state.shake * 14;
    ctx.translate((Math.sin(state.time * 91) * s) | 0, (Math.cos(state.time * 83) * s) | 0);
  }
  drawGarden(ctx, state);
  for (const key of state.rocks) {
    drawRock(ctx, key % COLS, Math.floor(key / COLS));
  }
  drawGate(ctx, state);
  if (state.apple) drawApple(ctx, state.apple, COLORS.apple, COLORS.appleDark, state.time, 0);
  if (state.golden) {
    drawApple(ctx, state.golden, COLORS.golden, COLORS.goldenDark, state.time, 2);
    // A shrinking ring shows the golden apple's remaining seconds.
    const cx = (state.golden.x + 0.5) * CELL;
    const cy = (state.golden.y + 0.5) * CELL;
    ctx.strokeStyle = 'rgba(255,201,60,0.85)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(cx, cy, 17, -Math.PI / 2, -Math.PI / 2 + (state.golden.life / 5) * Math.PI * 2);
    ctx.stroke();
  }
  drawWorm(ctx, state, alpha);
  drawFx(ctx, state);
  ctx.restore();
}
