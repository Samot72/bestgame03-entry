// The juice layer: burst particles (apple crumbs, golden sparkles, the
// death poof) and floating score text. Pure state and math — render.js
// draws what this module keeps, world.js spawns into it.

import { range } from './random.js';

export function createFx(rng) {
  const particles = [];
  const floaters = [];

  function burst(x, y, color, count, power = 1) {
    for (let i = 0; i < count; i += 1) {
      const angle = rng() * Math.PI * 2;
      const speed = range(rng, 40, 190) * power;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 40,
        life: range(rng, 0.35, 0.8),
        age: 0,
        size: range(rng, 2.5, 6),
        color,
      });
    }
  }

  function floatText(x, y, text, color = '#fff7e0') {
    floaters.push({ x, y, text, color, age: 0, life: 0.9 });
  }

  function step(dt) {
    for (let i = particles.length - 1; i >= 0; i -= 1) {
      const p = particles[i];
      p.age += dt;
      if (p.age >= p.life) {
        particles.splice(i, 1);
        continue;
      }
      p.vy += 320 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    for (let i = floaters.length - 1; i >= 0; i -= 1) {
      const f = floaters[i];
      f.age += dt;
      f.y -= 44 * dt;
      if (f.age >= f.life) floaters.splice(i, 1);
    }
  }

  function clear() {
    particles.length = 0;
    floaters.length = 0;
  }

  return { particles, floaters, burst, floatText, step, clear };
}
