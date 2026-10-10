import { l2Normalize, preprocessToChw } from '../src/referee/preprocess';

function solid(w: number, h: number, rgb: [number, number, number]) {
  const data = new Uint8Array(w * h * 4);
  for (let i = 0; i < w * h; i++) data.set([...rgb, 255], i * 4);
  return { width: w, height: h, data };
}

describe('referee preprocess', () => {
  it('produces 3×S×S CHW in [0,1] without normalisation', () => {
    const out = preprocessToChw(solid(320, 256, [255, 0, 51]), 256);
    expect(out.length).toBe(3 * 256 * 256);
    expect(out[0]).toBeCloseTo(1);
    expect(out[256 * 256]).toBeCloseTo(0);
    expect(out[2 * 256 * 256 + 1000]).toBeCloseTo(0.2);
  });

  it('center-crops the long side', () => {
    // Left half black, right half white, 512×256 → crop keeps the middle 256 columns.
    const w = 512;
    const h = 256;
    const data = new Uint8Array(w * h * 4);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) data.set(x < w / 2 ? [0, 0, 0, 255] : [255, 255, 255, 255], (y * w + x) * 4);
    const out = preprocessToChw({ width: w, height: h, data }, 256);
    expect(out[10]).toBeCloseTo(0); // left part of crop is black
    expect(out[250]).toBeCloseTo(1); // right part is white
  });

  it('applies mean/std when given', () => {
    const out = preprocessToChw(solid(4, 4, [255, 255, 255]), 2, [0.5, 0.5, 0.5], [0.5, 0.5, 0.5]);
    expect(out[0]).toBeCloseTo(1);
  });

  it('l2Normalize gives unit length', () => {
    const v = l2Normalize([3, 4]);
    expect(v[0]).toBeCloseTo(0.6);
    expect(v[1]).toBeCloseTo(0.8);
  });
});
