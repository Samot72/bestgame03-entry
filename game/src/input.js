// Keyboard and pointer input for Wiggle Worm. Steering keys feed a direction
// queue the world consumes at each grid tick (so a quick tap between ticks is
// never lost, and a 180-degree turn into the worm's own neck can be refused
// by the world, not here). One-shot presses — confirm (Space / click),
// pause (P) and mute (M) — are queued as edge flags the loop takes once.

export const DIRS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const STEER = new Map([
  ['ArrowUp', 'up'], ['KeyW', 'up'],
  ['ArrowDown', 'down'], ['KeyS', 'down'],
  ['ArrowLeft', 'left'], ['KeyA', 'left'],
  ['ArrowRight', 'right'], ['KeyD', 'right'],
]);

export function createInput() {
  const dirQueue = [];
  let confirmEdge = false;
  let pauseEdge = false;
  let muteEdge = false;

  function onKeyDown(event) {
    const steer = STEER.get(event.code);
    if (steer) {
      if (dirQueue[dirQueue.length - 1] !== steer) dirQueue.push(steer);
      if (dirQueue.length > 3) dirQueue.shift();
      event.preventDefault();
      return;
    }
    if (event.code === 'Space') {
      if (!event.repeat) confirmEdge = true;
      event.preventDefault();
    } else if (event.code === 'KeyP') {
      if (!event.repeat) pauseEdge = true;
    } else if (event.code === 'KeyM') {
      if (!event.repeat) muteEdge = true;
    }
  }

  return {
    attach(target) {
      window.addEventListener('keydown', onKeyDown);
      target.addEventListener('pointerdown', () => { confirmEdge = true; });
    },
    /** The next queued steering direction name, or null. */
    takeDir() {
      return dirQueue.length > 0 ? dirQueue.shift() : null;
    },
    peekDir() {
      return dirQueue.length > 0 ? dirQueue[0] : null;
    },
    takeConfirm() {
      const was = confirmEdge;
      confirmEdge = false;
      return was;
    },
    takePause() {
      const was = pauseEdge;
      pauseEdge = false;
      return was;
    },
    takeMute() {
      const was = muteEdge;
      muteEdge = false;
      return was;
    },
    flushEdges() {
      confirmEdge = false;
      pauseEdge = false;
      muteEdge = false;
    },
  };
}

/** A scripted input for screenshot scenes and the autopilot: same shape, no DOM. */
export function makeFakeInput() {
  const queue = [];
  let confirm = false;
  return {
    attach() {},
    pushDir(name) { queue.push(name); },
    pressConfirm() { confirm = true; },
    takeDir() { return queue.length > 0 ? queue.shift() : null; },
    peekDir() { return queue.length > 0 ? queue[0] : null; },
    takeConfirm() { const was = confirm; confirm = false; return was; },
    takePause() { return false; },
    takeMute() { return false; },
    flushEdges() { confirm = false; },
  };
}
