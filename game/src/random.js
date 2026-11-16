// A tiny seeded random generator (mulberry32) and the helpers the game draws
// from it. One generator per run keeps a play session varied, and a fixed seed
// makes a screenshot scene come out the same frame every time it is staged.

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A float in [min, max). */
export function range(rng, min, max) {
  return min + rng() * (max - min);
}

/** An integer in [min, max], both ends included. */
export function intRange(rng, min, max) {
  return min + Math.floor(rng() * (max - min + 1));
}

/** One member of the list, chosen by the generator. */
export function pick(rng, list) {
  return list[Math.floor(rng() * list.length)];
}

/** True with probability p. */
export function chance(rng, p) {
  return rng() < p;
}
