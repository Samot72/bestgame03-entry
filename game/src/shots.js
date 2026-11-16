// The screenshot scenes behind ?shot=title|play|level|win|over&seed=n.
// Each is the real game, staged: the title idles over a dressed garden, the
// play scene is a mid-feast moment in Bed 3 flown by the autopilot with a
// long worm, a live combo and crumbs still in the air, the level scene is
// the real gate-arrival panel, and win/over set the run's end states. The
// seed fixes the garden, so a scene is the same frame every time.

import { STEP } from './config.js';
import { makeFakeInput } from './input.js';
import { drawWorm } from './render.js';
import { autopilot, SCREEN_LEVEL, SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './world.js';

function runSteps(world, seconds, withPilot) {
  const fake = makeFakeInput();
  const steps = Math.round(seconds / STEP);
  for (let i = 0; i < steps; i += 1) {
    if (withPilot && world.state.screen === SCREEN_PLAY) autopilot(world.state, fake);
    world.step(STEP, fake);
    if (withPilot && world.state.screen !== SCREEN_PLAY) break;
  }
  return fake;
}

/** Lay the worm along a gentle S so staged scenes show a long, lively body. */
function layWorm(state, headX, headY, length) {
  const path = [];
  let x = headX;
  let y = headY;
  const moves = [];
  for (let i = 0; i < 6; i += 1) moves.push('left');
  for (let i = 0; i < 3; i += 1) moves.push('down');
  for (let i = 0; i < 6; i += 1) moves.push('right');
  for (let i = 0; i < 3; i += 1) moves.push('down');
  for (let i = 0; i < 8; i += 1) moves.push('left');
  const delta = { left: [-1, 0], right: [1, 0], down: [0, 1], up: [0, -1] };
  path.push({ x, y });
  for (const m of moves) {
    if (path.length >= length) break;
    x += delta[m][0];
    y += delta[m][1];
    path.push({ x, y });
  }
  while (path.length < length) {
    x -= 1;
    path.push({ x, y });
  }
  state.worm.segments = path.slice(0, length);
  state.worm.prev = state.worm.segments.map((s) => ({ x: s.x + 1, y: s.y }));
  state.worm.dir = { x: 1, y: 0 };
  state.worm.pendingDir = { x: 1, y: 0 };
  state.worm.growPending = 0;
}

/** Lay the worm in one straight row (the title's mascot, fully on stage). */
function layWormRow(state, headX, headY, length) {
  const segments = [];
  for (let i = 0; i < length; i += 1) segments.push({ x: headX - i, y: headY });
  state.worm.segments = segments;
  state.worm.prev = segments.map((s) => ({ x: s.x + 1, y: s.y }));
  state.worm.dir = { x: 1, y: 0 };
  state.worm.pendingDir = { x: 1, y: 0 };
  state.worm.growPending = 0;
}

/** Stage the named scene on `world` and return the input it was flown with. */
export function stageShot(name, world) {
  const state = world.state;
  if (name === 'play') {
    world.startRun();
    state.bed = 3;
    world.startBed();
    layWorm(state, 20, 6, 16);
    state.score = 640;
    state.eaten = 6;
    state.totalEaten = 20;
    state.combo = 3;
    state.comboTimer = 2.4;
    if (state.apple) { state.apple.x = 23; state.apple.y = 6; }
    state.golden = { x: 12, y: 12, life: 3.4 };
    const fake = runSteps(world, 1.1, true);
    if (state.screen !== SCREEN_PLAY) {
      // The pilot reached the gate or came to grief; restage the feast.
      state.screen = SCREEN_PLAY;
      layWorm(state, 20, 6, 16);
      state.moveTimer = 0.07;
    }
    // Crumbs and a score pop, frozen mid-air.
    const head = state.worm.segments[0];
    state.fx.burst((head.x + 2.5) * 40, (head.y + 0.5) * 40, '#e33f2f', 10, 0.9);
    state.fx.floatText((head.x + 2.5) * 40, (head.y + 0.5) * 40 - 16, '+30', '#fff7e0');
    state.fx.step(0.12);
    return fake;
  }
  if (name === 'level') {
    world.startRun();
    state.bed = 2;
    world.startBed();
    state.score = 380;
    state.eaten = 8;
    state.totalEaten = 14;
    layWorm(state, 18, 8, 13);
    state.screen = SCREEN_LEVEL;
    return makeFakeInput();
  }
  if (name === 'win') {
    world.startRun();
    state.bed = 5;
    world.startBed();
    layWorm(state, 19, 7, 24);
    state.score = 2350;
    state.eaten = 14;
    state.totalEaten = 50;
    state.best = 2350;
    state.endStats = { score: 2350, bed: 5, eaten: 50, length: 24, time: 214 };
    state.screen = SCREEN_WIN;
    state.fx.burst(500, 300, '#ffc93c', 16, 1.1);
    state.fx.burst(780, 260, '#ff8fb2', 14, 1.1);
    state.fx.step(0.15);
    return makeFakeInput();
  }
  if (name === 'over') {
    world.startRun();
    state.bed = 3;
    world.startBed();
    layWorm(state, 17, 9, 15);
    state.score = 720;
    state.eaten = 7;
    state.totalEaten = 21;
    state.best = 940;
    state.endStats = { score: 720, bed: 3, eaten: 21, length: 15, time: 96 };
    state.screen = SCREEN_OVER;
    const head = state.worm.segments[0];
    state.fx.burst((head.x + 0.5) * 40, (head.y + 0.5) * 40, '#e33f2f', 22, 1.3);
    state.fx.burst((head.x + 0.5) * 40, (head.y + 0.5) * 40, '#f26d64', 14, 1);
    state.fx.step(0.18);
    return makeFakeInput();
  }
  // Anything else is the title: a dressed garden idling behind the panel,
  // with the worm mascot in one straight row along the bottom.
  world.startRun();
  state.bed = 2;
  world.startBed();
  layWormRow(state, 25, 16, 13);
  state.screen = SCREEN_TITLE;
  const fake = runSteps(world, 0.5, false);
  state.screen = SCREEN_TITLE;
  return fake;
}

export { drawWorm };
