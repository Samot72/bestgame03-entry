// Wiggle Worm's sound: every effect is synthesized with WebAudio — short
// oscillator blips and arpeggios, no audio files. The context stays locked
// until the player's first key or click (browser policy), and M mutes.

export function createAudio() {
  let ctx = null;
  let master = null;
  let muted = false;

  function unlock() {
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
  }

  function tone(freq, dur, { type = 'sine', vol = 0.2, slide = 0, delay = 0 } = {}) {
    if (!ctx || muted) return;
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t0 + dur);
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(gain);
    gain.connect(master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  return {
    unlock,
    get muted() { return muted; },
    toggleMute() {
      muted = !muted;
      return muted;
    },
    eat(combo) {
      const base = 420 + Math.min(combo, 5) * 60;
      tone(base, 0.09, { type: 'triangle', vol: 0.25 });
      tone(base * 1.5, 0.12, { type: 'triangle', vol: 0.18, delay: 0.05 });
    },
    golden() {
      tone(880, 0.1, { type: 'sine', vol: 0.22 });
      tone(1174, 0.1, { type: 'sine', vol: 0.22, delay: 0.07 });
      tone(1568, 0.16, { type: 'sine', vol: 0.2, delay: 0.14 });
    },
    gate() {
      tone(523, 0.1, { type: 'square', vol: 0.12 });
      tone(784, 0.14, { type: 'square', vol: 0.12, delay: 0.08 });
    },
    level() {
      [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.14, { type: 'triangle', vol: 0.2, delay: i * 0.09 }));
    },
    win() {
      [523, 659, 784, 1046, 784, 1046, 1318].forEach((f, i) => tone(f, 0.18, { type: 'triangle', vol: 0.2, delay: i * 0.11 }));
    },
    die() {
      tone(320, 0.4, { type: 'sawtooth', vol: 0.16, slide: -240 });
      tone(160, 0.5, { type: 'triangle', vol: 0.2, slide: -100, delay: 0.08 });
    },
    turn() {
      tone(240, 0.03, { type: 'sine', vol: 0.05 });
    },
  };
}
