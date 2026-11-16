// Wiggle Worm's rules: the run's state, the five beds, apples and golden
// apples, the combo clock, the gate that opens when a bed's target is met,
// and every way the feast ends. No drawing and no DOM here — step() advances
// the world one fixed step and the renderers read the state back out.

import {
  APPLE_SCORE, BEDS, COLS, COMBO_MAX, COMBO_WINDOW, GOLDEN_LIFE, GOLDEN_SCORE, ROWS,
} from './config.js';
import { DIRS } from './input.js';
import { createFx } from './particles.js';
import { mulberry32 } from './random.js';
import { makeWorm, resetWorm, steer, tickWorm } from './worm.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_LEVEL = 'level';
export const SCREEN_WIN = 'win';
export const SCREEN_OVER = 'over';

const START_X = 8;
const START_Y = 9;

function cellKey(x, y) {
  return y * COLS + x;
}

export function createWorld(audio, seed = (Math.random() * 1e9) | 0) {
  const rng = mulberry32(seed);
  const state = {
    screen: SCREEN_TITLE,
    paused: false,
    time: 0,
    runTime: 0,
    score: 0,
    best: 0,
    bed: 1, // 1..5
    eaten: 0, // normal apples eaten in this bed
    totalEaten: 0,
    combo: 0,
    comboTimer: 0,
    worm: makeWorm(START_X, START_Y),
    rocks: new Set(),
    flowers: [],
    apple: null,
    golden: null, // {x, y, life}
    gate: null, // {x, y} once the bed's target is met
    moveTimer: 0,
    shake: 0,
    fx: createFx(rng),
    endStats: null,
    rng,
    audio,
  };

  function occupied(x, y, { ignoreTail = false } = {}) {
    const segs = state.worm.segments;
    const n = ignoreTail ? segs.length - 1 : segs.length;
    for (let i = 0; i < n; i += 1) if (segs[i].x === x && segs[i].y === y) return true;
    return false;
  }

  function freeCell() {
    for (let tries = 0; tries < 400; tries += 1) {
      const x = (rng() * COLS) | 0;
      const y = (rng() * ROWS) | 0;
      if (state.rocks.has(cellKey(x, y))) continue;
      if (occupied(x, y)) continue;
      if (state.apple && state.apple.x === x && state.apple.y === y) continue;
      if (state.golden && state.golden.x === x && state.golden.y === y) continue;
      if (state.gate && state.gate.x === x && state.gate.y === y) continue;
      return { x, y };
    }
    return null;
  }

  function placeRocksAndFlowers() {
    const bed = BEDS[state.bed - 1];
    const levelRng = mulberry32(seed * 31 + state.bed * 1000 + 7);
    state.rocks = new Set();
    let placed = 0;
    let guard = 0;
    while (placed < bed.rocks && guard < 2000) {
      guard += 1;
      const x = (levelRng() * COLS) | 0;
      const y = (levelRng() * ROWS) | 0;
      // Keep the worm's starting lane clear so every bed opens fairly.
      if (Math.abs(y - START_Y) <= 1 && x <= START_X + 3) continue;
      if (state.rocks.has(cellKey(x, y))) continue;
      state.rocks.add(cellKey(x, y));
      placed += 1;
    }
    state.flowers = [];
    for (let i = 0; i < 26; i += 1) {
      const x = (levelRng() * COLS) | 0;
      const y = (levelRng() * ROWS) | 0;
      if (state.rocks.has(cellKey(x, y))) continue;
      state.flowers.push({ x, y, kind: i % 3, phase: levelRng() * Math.PI * 2 });
    }
  }

  function spawnApple() {
    state.apple = freeCell();
  }

  function maybeSpawnGolden() {
    if (state.golden || state.gate) return;
    if (rng() < 0.3) {
      const cell = freeCell();
      if (cell) state.golden = { ...cell, life: GOLDEN_LIFE };
    }
  }

  function startBed() {
    placeRocksAndFlowers();
    resetWorm(state.worm, START_X, START_Y);
    state.eaten = 0;
    state.combo = 0;
    state.comboTimer = 0;
    state.golden = null;
    state.gate = null;
    state.moveTimer = 0;
    state.fx.clear();
    spawnApple();
  }

  function startRun() {
    state.score = 0;
    state.bed = 1;
    state.totalEaten = 0;
    state.runTime = 0;
    state.endStats = null;
    state.paused = false;
    startBed();
    state.screen = SCREEN_PLAY;
  }

  function finishRun(won) {
    state.best = Math.max(state.best, state.score);
    state.endStats = {
      score: state.score,
      bed: state.bed,
      eaten: state.totalEaten,
      length: state.worm.segments.length,
      time: Math.round(state.runTime),
    };
    state.screen = won ? SCREEN_WIN : SCREEN_OVER;
    if (won) audio.win();
  }

  function die() {
    const head = state.worm.segments[0];
    const cx = (head.x + 0.5) * 40;
    const cy = (head.y + 0.5) * 40;
    state.fx.burst(cx, cy, '#e33f2f', 26, 1.3);
    state.fx.burst(cx, cy, '#f26d64', 18, 1);
    state.shake = 0.55;
    audio.die();
    finishRun(false);
  }

  function eatApple(cell, isGolden) {
    const cx = (cell.x + 0.5) * 40;
    const cy = (cell.y + 0.5) * 40;
    state.combo = state.comboTimer > 0 ? Math.min(COMBO_MAX, state.combo + 1) : 1;
    state.comboTimer = COMBO_WINDOW;
    const mult = state.combo;
    const gained = (isGolden ? GOLDEN_SCORE : APPLE_SCORE) * mult;
    state.score += gained;
    state.worm.growPending += isGolden ? 2 : 1;
    state.fx.burst(cx, cy, isGolden ? '#ffc93c' : '#e33f2f', isGolden ? 20 : 12, isGolden ? 1.2 : 0.9);
    state.fx.burst(cx, cy, '#ffffff', 5, 0.7);
    state.fx.floatText(cx, cy - 14, `+${gained}`, isGolden ? '#ffc93c' : '#fff7e0');
    if (isGolden) {
      state.golden = null;
      audio.golden();
    } else {
      state.totalEaten += 1;
      state.eaten += 1;
      audio.eat(state.combo);
      if (state.eaten >= BEDS[state.bed - 1].target) {
        state.apple = null;
        state.golden = null;
        state.gate = freeCell();
        state.fx.floatText(cx, cy - 40, 'GATE OPEN!', '#ffd94d');
        audio.gate();
      } else {
        spawnApple();
        maybeSpawnGolden();
      }
    }
  }

  function moveTick() {
    const worm = state.worm;
    const next = {
      x: worm.segments[0].x + worm.pendingDir.x,
      y: worm.segments[0].y + worm.pendingDir.y,
    };
    const growing = worm.growPending > 0;
    // Walls, rocks, gate, food and the tail are all judged on the cell the
    // head is about to enter, before anything moves.
    if (next.x < 0 || next.x >= COLS || next.y < 0 || next.y >= ROWS) return die();
    if (state.rocks.has(cellKey(next.x, next.y))) return die();
    if (occupied(next.x, next.y, { ignoreTail: !growing })) return die();

    tickWorm(worm);

    if (state.gate && next.x === state.gate.x && next.y === state.gate.y) {
      if (state.bed >= BEDS.length) return finishRun(true);
      state.screen = SCREEN_LEVEL;
      audio.level();
      return;
    }
    if (state.apple && next.x === state.apple.x && next.y === state.apple.y) eatApple(next, false);
    else if (state.golden && next.x === state.golden.x && next.y === state.golden.y) eatApple(next, true);
  }

  /** Advance the world one fixed step. Input is the createInput shape. */
  function step(dt, input) {
    state.time += dt;
    state.fx.step(dt);
    if (state.shake > 0) state.shake = Math.max(0, state.shake - dt);

    if (input.takeMute()) audio.toggleMute();

    if (state.screen === SCREEN_TITLE) {
      if (input.takeConfirm()) startRun();
      return;
    }
    if (state.screen === SCREEN_LEVEL) {
      if (input.takeConfirm()) {
        state.bed += 1;
        startBed();
        state.screen = SCREEN_PLAY;
      }
      return;
    }
    if (state.screen === SCREEN_WIN || state.screen === SCREEN_OVER) {
      if (input.takeConfirm()) startRun();
      return;
    }
    // SCREEN_PLAY
    if (input.takePause()) {
      state.paused = !state.paused;
      return;
    }
    if (state.paused) return;

    state.runTime += dt;
    let name = input.takeDir();
    while (name) {
      if (steer(state.worm, DIRS[name])) audio.turn();
      name = input.takeDir();
    }
    if (state.comboTimer > 0) {
      state.comboTimer -= dt;
      if (state.comboTimer <= 0) state.combo = 0;
    }
    if (state.golden) {
      state.golden.life -= dt;
      if (state.golden.life <= 0) state.golden = null;
    }
    state.moveTimer += dt;
    const tick = BEDS[state.bed - 1].tick;
    while (state.moveTimer >= tick && state.screen === SCREEN_PLAY) {
      state.moveTimer -= tick;
      moveTick();
    }
  }

  /** The render blend between the last tick and the next, in [0, 1). */
  function moveAlpha() {
    const tick = BEDS[state.bed - 1].tick;
    return Math.min(1, state.moveTimer / tick);
  }

  // A gentle staged garden behind the title screen.
  startBed();
  state.screen = SCREEN_TITLE;

  return { state, step, startRun, startBed, moveAlpha };
}

/** A simple pilot for screenshot scenes: head for the apple, avoid death. */
export function autopilot(state, input) {
  const worm = state.worm;
  const head = worm.segments[0];
  const target = state.gate || state.apple || state.golden;
  if (!target) return;
  const options = [
    { name: 'up', ...DIRS.up },
    { name: 'down', ...DIRS.down },
    { name: 'left', ...DIRS.left },
    { name: 'right', ...DIRS.right },
  ];
  let bestName = null;
  let bestScore = -Infinity;
  for (const opt of options) {
    if (worm.segments.length > 1 && opt.x === -worm.dir.x && opt.y === -worm.dir.y) continue;
    const nx = head.x + opt.x;
    const ny = head.y + opt.y;
    if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) continue;
    if (state.rocks.has(cellKey(nx, ny))) continue;
    const hitsTail = worm.segments.some((s, i) => i > 0 && s.x === nx && s.y === ny);
    if (hitsTail) continue;
    const dist = Math.abs(target.x - nx) + Math.abs(target.y - ny);
    const score = -dist + (opt.x === worm.dir.x && opt.y === worm.dir.y ? 0.5 : 0);
    if (score > bestScore) {
      bestScore = score;
      bestName = opt.name;
    }
  }
  if (bestName) input.pushDir(bestName);
}
