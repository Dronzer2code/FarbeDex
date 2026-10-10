// Laptop-only: renders the original FarbeDex prism-drop mark (assets/brand/mark.svg) into app icons.
// Usage: npm i --no-save sharp && node scripts/dev/make-icons.mjs
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const mark = readFileSync(join(root, 'assets/brand/mark.svg'), 'utf8');
const inner = mark.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
const BG = '#F6F6F8';

/** Mark centred on a square canvas; `scale` = mark size relative to the canvas. */
function svg(size, scale, { bg = null, mono = null } = {}) {
  const m = size * scale;
  const off = (size - m) / 2;
  let body = inner;
  if (mono) body = body.replace(/fill="#[0-9A-Fa-f]{6}"/g, `fill="${mono}"`);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
  ${bg ? `<rect width="100%" height="100%" fill="${bg}"/>` : ''}
  <svg x="${off}" y="${off}" width="${m}" height="${m}" viewBox="0 0 64 64">${body}</svg>
</svg>`;
}

const out = (name) => join(root, 'assets', name);
await sharp(Buffer.from(svg(1024, 0.72, { bg: BG }))).png().toFile(out('icon.png'));
// Adaptive icon: foreground must sit inside the 66% safe zone.
await sharp(Buffer.from(svg(1024, 0.5))).png().toFile(out('android-icon-foreground.png'));
await sharp({ create: { width: 1024, height: 1024, channels: 4, background: BG } }).png().toFile(out('android-icon-background.png'));
await sharp(Buffer.from(svg(1024, 0.5, { mono: '#000000' }))).png().toFile(out('android-icon-monochrome.png'));
await sharp(Buffer.from(svg(512, 0.9))).png().toFile(out('splash-icon.png'));
console.log('Icons written to assets/');
