import { kmeans } from '../src/color/kmeans';
import { mulberry32 } from '../src/color/prng';

function syntheticPoints(n: number): Float64Array {
  const rand = mulberry32(42);
  const centers = [
    [0.3, 0.05, 0.08],
    [0.7, -0.1, 0.1],
    [0.9, 0, -0.02],
    [0.5, 0.15, -0.1],
  ];
  const p = new Float64Array(n * 3);
  for (let i = 0; i < n; i++) {
    const c = centers[i % centers.length];
    p[i * 3] = c[0] + (rand() - 0.5) * 0.02;
    p[i * 3 + 1] = c[1] + (rand() - 0.5) * 0.02;
    p[i * 3 + 2] = c[2] + (rand() - 0.5) * 0.02;
  }
  return p;
}

describe('kmeans', () => {
  it('is deterministic for identical input', () => {
    const pts = syntheticPoints(4000);
    const a = kmeans(pts);
    const b = kmeans(pts.slice());
    expect(Array.from(a.centroids)).toEqual(Array.from(b.centroids));
    expect(Array.from(a.counts)).toEqual(Array.from(b.counts));
  });

  it('assigns every point and stops within 15 iterations', () => {
    const r = kmeans(syntheticPoints(4000));
    expect(r.counts.reduce((s, v) => s + v, 0)).toBe(4000);
    expect(r.iterations).toBeLessThanOrEqual(15);
  });

  it('handles fewer points than k and identical points', () => {
    expect(kmeans(new Float64Array([0.5, 0, 0, 0.5, 0, 0])).counts.reduce((s, v) => s + v, 0)).toBe(2);
    const same = new Float64Array(300).fill(0.4);
    expect(kmeans(same).counts.reduce((s, v) => s + v, 0)).toBe(100);
  });
});
