// Pure preprocessing for the Referee: RGBA pixels → float32 CHW tensor data.
// Resize shortest side to `size` + center crop (done in one bilinear sampling pass), rescale to [0,1],
// optional mean/std normalisation. No React Native imports (unit-tested).

export interface RgbaImage {
  width: number;
  height: number;
  data: Uint8Array | Uint8ClampedArray; // RGBA, row-major
}

export function preprocessToChw(
  img: RgbaImage,
  size: number,
  mean: readonly [number, number, number] | null = null,
  std: readonly [number, number, number] | null = null,
): Float32Array {
  const { width: w, height: h, data } = img;
  const scale = size / Math.min(w, h);
  // Region of the source covered by the center crop, in source pixels.
  const cropW = size / scale;
  const cropH = size / scale;
  const x0 = (w - cropW) / 2;
  const y0 = (h - cropH) / 2;
  const plane = size * size;
  const out = new Float32Array(3 * plane);

  for (let y = 0; y < size; y++) {
    const sy = Math.min(h - 1, Math.max(0, y0 + (y + 0.5) / scale - 0.5));
    const yA = Math.floor(sy);
    const yB = Math.min(h - 1, yA + 1);
    const fy = sy - yA;
    for (let x = 0; x < size; x++) {
      const sx = Math.min(w - 1, Math.max(0, x0 + (x + 0.5) / scale - 0.5));
      const xA = Math.floor(sx);
      const xB = Math.min(w - 1, xA + 1);
      const fx = sx - xA;
      const iAA = (yA * w + xA) * 4;
      const iAB = (yA * w + xB) * 4;
      const iBA = (yB * w + xA) * 4;
      const iBB = (yB * w + xB) * 4;
      const o = y * size + x;
      for (let c = 0; c < 3; c++) {
        const top = data[iAA + c] * (1 - fx) + data[iAB + c] * fx;
        const bottom = data[iBA + c] * (1 - fx) + data[iBB + c] * fx;
        let v = (top * (1 - fy) + bottom * fy) / 255;
        if (mean && std) v = (v - mean[c]) / std[c];
        out[c * plane + o] = v;
      }
    }
  }
  return out;
}

export function l2Normalize(v: Float32Array | number[]): Float32Array {
  let sum = 0;
  for (let i = 0; i < v.length; i++) sum += v[i] * v[i];
  const norm = Math.sqrt(sum) || 1;
  const out = new Float32Array(v.length);
  for (let i = 0; i < v.length; i++) out[i] = v[i] / norm;
  return out;
}
