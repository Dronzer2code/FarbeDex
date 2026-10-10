// Laptop-only: synthesises FarbeDex's original 8-bit style sound effects into assets/sounds/*.wav.
// Pure waveform maths (square / triangle / noise + envelopes) — no third-party audio. Usage: node scripts/dev/make-sounds.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RATE = 22050;
const out = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'assets', 'sounds');
mkdirSync(out, { recursive: true });

const note = (n) => 440 * Math.pow(2, (n - 69) / 12); // MIDI → Hz
let seed = 0xfa4be;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1;

const wave = {
  square: (p) => (p % 1 < 0.5 ? 1 : -1),
  pulse: (p) => (p % 1 < 0.25 ? 1 : -1),
  triangle: (p) => 1 - 4 * Math.abs((p % 1) - 0.5),
  noise: () => rnd(),
};

/** tones: [{ at, dur, freq, type, vol, slide? }] (seconds / Hz). */
function render(tones, total) {
  const buf = new Float32Array(Math.ceil(total * RATE));
  for (const t of tones) {
    const start = Math.floor(t.at * RATE);
    const len = Math.floor(t.dur * RATE);
    let phase = 0;
    for (let i = 0; i < len && start + i < buf.length; i++) {
      const k = i / len;
      const f = t.slide ? t.freq * (1 + (t.slide - 1) * k) : t.freq;
      phase += f / RATE;
      const env = Math.min(1, i / (0.004 * RATE)) * Math.pow(1 - k, t.decay ?? 1.6); // fast attack, smooth decay
      buf[start + i] += wave[t.type](phase) * env * (t.vol ?? 0.22);
    }
  }
  return buf;
}

function wav(name, samples) {
  const data = Buffer.alloc(samples.length * 2);
  samples.forEach((v, i) => data.writeInt16LE(Math.max(-1, Math.min(1, v)) * 32767, i * 2));
  const h = Buffer.alloc(44);
  h.write('RIFF', 0);
  h.writeUInt32LE(36 + data.length, 4);
  h.write('WAVEfmt ', 8);
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20); // PCM
  h.writeUInt16LE(1, 22); // mono
  h.writeUInt32LE(RATE, 24);
  h.writeUInt32LE(RATE * 2, 28);
  h.writeUInt16LE(2, 32);
  h.writeUInt16LE(16, 34);
  h.write('data', 36);
  h.writeUInt32LE(data.length, 40);
  writeFileSync(join(out, `${name}.wav`), Buffer.concat([h, data]));
}

// Shutter: tiny noise burst + click.
wav('shutter', render([
  { at: 0, dur: 0.05, freq: 1, type: 'noise', vol: 0.25, decay: 3 },
  { at: 0, dur: 0.03, freq: 1800, type: 'square', vol: 0.12, decay: 4 },
], 0.08));

// Catch: bouncy rising arpeggio (C5 E5 G5 C6).
wav('catch', render([72, 76, 79, 84].map((n, i) => ({ at: i * 0.07, dur: 0.12, freq: note(n), type: 'pulse', vol: 0.18 })), 0.42));

// New entry: two-note chime + soft echo.
wav('new', render([
  { at: 0, dur: 0.16, freq: note(79), type: 'triangle', vol: 0.3 },
  { at: 0.12, dur: 0.34, freq: note(84), type: 'triangle', vol: 0.32 },
  { at: 0.12, dur: 0.3, freq: note(96), type: 'square', vol: 0.05 },
], 0.5));

// Rare / Legendary / Mythical: fast sparkle run + shimmering top notes.
wav('rare', render([
  ...[72, 76, 79, 83, 86, 88, 91, 95].map((n, i) => ({ at: i * 0.045, dur: 0.1, freq: note(n), type: 'pulse', vol: 0.14 })),
  { at: 0.38, dur: 0.45, freq: note(96), type: 'triangle', vol: 0.25 },
  { at: 0.42, dur: 0.4, freq: note(100), type: 'triangle', vol: 0.15 },
], 0.9));

// Reject: gentle descending boop (not harsh).
wav('reject', render([
  { at: 0, dur: 0.14, freq: note(64), type: 'square', vol: 0.12, slide: 0.92 },
  { at: 0.12, dur: 0.2, freq: note(60), type: 'square', vol: 0.12, slide: 0.85 },
], 0.34));

// App opening: warm three-chord flourish.
wav('open', render([
  ...[[60, 64, 67], [65, 69, 72], [67, 71, 74]].flatMap((ch, i) => ch.map((n) => ({ at: i * 0.16, dur: 0.22, freq: note(n), type: 'triangle', vol: 0.12 }))),
  { at: 0.48, dur: 0.5, freq: note(84), type: 'pulse', vol: 0.12 },
], 1.05));

// Level up (an Entry caught again): quick rising "xp" blips.
wav('levelup', render([67, 71, 74, 79, 83].map((n, i) => ({ at: i * 0.05, dur: 0.07, freq: note(n), type: 'square', vol: 0.12, decay: 2.5 })), 0.34));

console.log('Sounds written to', out);
