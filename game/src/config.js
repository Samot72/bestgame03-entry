// Wiggle Worm's shared numbers: the 1280x720 stage, the garden grid that
// exactly tiles it, the fixed step the loop runs on, and the five beds
// (levels) with their apple targets, speeds and rock counts.

export const VIEW_W = 1280;
export const VIEW_H = 720;

export const COLS = 32;
export const ROWS = 18;
export const CELL = 40; // COLS * CELL = 1280, ROWS * CELL = 720.

export const STEP = 1 / 60;
export const MAX_FRAME = 0.25;

// One entry per bed: apples to eat before the gate opens, seconds per grid
// step (smaller = faster), and how many rocks litter the bed.
export const BEDS = [
  { target: 6, tick: 0.165, rocks: 3 },
  { target: 8, tick: 0.150, rocks: 6 },
  { target: 10, tick: 0.136, rocks: 9 },
  { target: 12, tick: 0.123, rocks: 12 },
  { target: 14, tick: 0.111, rocks: 15 },
];

export const START_LENGTH = 4;
export const COMBO_WINDOW = 3.5; // seconds between eats to keep a combo alive
export const COMBO_MAX = 5;
export const GOLDEN_LIFE = 5; // seconds a golden apple stays on the grass
export const APPLE_SCORE = 10;
export const GOLDEN_SCORE = 50;

export const COLORS = {
  grassA: '#79c25f',
  grassB: '#6fb855',
  fence: '#a4713d',
  fenceDark: '#7d5527',
  wormA: '#3f9e4d',
  wormB: '#57b765',
  wormBelly: '#cdeeb0',
  blush: '#f49ac1',
  apple: '#e33f2f',
  appleDark: '#b92a1e',
  golden: '#ffc93c',
  goldenDark: '#e0a41a',
  rock: '#8d9299',
  rockDark: '#6e7278',
  gate: '#ffd94d',
  ink: '#20301c',
  cream: '#fff7e0',
};
