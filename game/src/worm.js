// The worm itself: a list of grid cells, head first, plus the previous
// tick's cells so render.js can slide the body smoothly between ticks
// instead of hopping cell to cell.

import { CELL, START_LENGTH } from './config.js';

/** A fresh worm of START_LENGTH cells, heading right from (x, y). */
export function makeWorm(x, y) {
  const segments = [];
  for (let i = 0; i < START_LENGTH; i += 1) segments.push({ x: x - i, y });
  return {
    segments,
    prev: segments.map((s) => ({ ...s })),
    dir: { x: 1, y: 0 },
    pendingDir: { x: 1, y: 0 },
    growPending: 0,
  };
}

/** Reset the worm in place for a new bed, keeping the object identity. */
export function resetWorm(worm, x, y) {
  const fresh = makeWorm(x, y);
  worm.segments = fresh.segments;
  worm.prev = fresh.prev;
  worm.dir = fresh.dir;
  worm.pendingDir = fresh.pendingDir;
  worm.growPending = 0;
}

/**
 * Try to steer toward `dir` ({x, y}). A reversal into the worm's own neck
 * is refused (unless the worm is a single step long). Returns true when the
 * heading actually changed.
 */
export function steer(worm, dir) {
  if (worm.segments.length > 1 && dir.x === -worm.dir.x && dir.y === -worm.dir.y) return false;
  if (dir.x === worm.pendingDir.x && dir.y === worm.pendingDir.y) return false;
  worm.pendingDir = { x: dir.x, y: dir.y };
  return true;
}

/**
 * Advance one grid tick. Returns the new head cell; the caller checks it
 * for walls, rocks, food and the worm's own tail before/after as needed.
 * The tail cell is vacated unless the worm is growing.
 */
export function tickWorm(worm) {
  worm.prev = worm.segments.map((s) => ({ ...s }));
  worm.dir = { ...worm.pendingDir };
  const head = worm.segments[0];
  const next = { x: head.x + worm.dir.x, y: head.y + worm.dir.y };
  worm.segments.unshift(next);
  if (worm.growPending > 0) worm.growPending -= 1;
  else worm.segments.pop();
  return next;
}

/** Interpolated pixel centre of segment i at blend alpha in [0, 1). */
export function segmentPixel(worm, i, alpha) {
  const cur = worm.segments[i];
  const prev = worm.prev[Math.min(i, worm.prev.length - 1)] || cur;
  const x = (prev.x + (cur.x - prev.x) * alpha + 0.5) * CELL;
  const y = (prev.y + (cur.y - prev.y) * alpha + 0.5) * CELL;
  return { x, y };
}
