// Pick the device's largest still-picture size (team request 2026-10-10: capture at max capability). Pure.

/** Largest "WxH" by pixel count; non-dimension entries are ignored. Undefined → camera default. */
export function pickLargestPictureSize(sizes: readonly string[]): string | undefined {
  let best: { s: string; px: number } | undefined;
  for (const s of sizes) {
    const m = /^(\d+)\s*x\s*(\d+)$/i.exec(s.trim());
    if (!m) continue;
    const px = Number(m[1]) * Number(m[2]);
    if (!best || px > best.px) best = { s, px };
  }
  return best?.s;
}
