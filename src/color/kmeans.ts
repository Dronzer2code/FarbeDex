// Deterministic k-means in OKLab — docs/DEX_SPEC.md → PALETTE EXTRACTION step 3.
import { KMEANS_SEED, mulberry32 } from './prng';

export interface KMeansResult {
  /** Flat [l, a, b] per cluster. */
  centroids: Float64Array;
  counts: Int32Array;
  iterations: number;
}

function dist2(p: Float32Array | Float64Array, i: number, c: Float64Array, j: number): number {
  const dl = p[i] - c[j];
  const da = p[i + 1] - c[j + 1];
  const db = p[i + 2] - c[j + 2];
  return dl * dl + da * da + db * db;
}

/**
 * @param points flat OKLab triples (length = 3·n)
 */
export function kmeans(
  points: Float32Array | Float64Array,
  k = 8,
  maxIter = 15,
  tol = 0.001,
  seed = KMEANS_SEED,
): KMeansResult {
  const n = points.length / 3;
  if (n === 0) return { centroids: new Float64Array(0), counts: new Int32Array(0), iterations: 0 };
  k = Math.min(k, n);
  const rand = mulberry32(seed);
  const centroids = new Float64Array(3 * k);

  // k-means++ initialisation.
  const first = Math.floor(rand() * n) * 3;
  centroids.set([points[first], points[first + 1], points[first + 2]], 0);
  const d2 = new Float64Array(n).fill(Infinity);
  for (let c = 1; c < k; c++) {
    let sum = 0;
    for (let i = 0; i < n; i++) {
      const d = dist2(points, i * 3, centroids, (c - 1) * 3);
      if (d < d2[i]) d2[i] = d;
      sum += d2[i];
    }
    let pick = 0;
    if (sum > 0) {
      let target = rand() * sum;
      for (pick = 0; pick < n - 1; pick++) {
        target -= d2[pick];
        if (target <= 0) break;
      }
    } else {
      pick = Math.floor(rand() * n);
    }
    centroids.set([points[pick * 3], points[pick * 3 + 1], points[pick * 3 + 2]], c * 3);
  }

  const assign = new Int32Array(n);
  const counts = new Int32Array(k);
  const sums = new Float64Array(3 * k);
  let iterations = 0;

  for (let iter = 0; iter < maxIter; iter++) {
    iterations = iter + 1;
    counts.fill(0);
    sums.fill(0);
    for (let i = 0; i < n; i++) {
      let best = 0;
      let bestD = Infinity;
      for (let c = 0; c < k; c++) {
        const d = dist2(points, i * 3, centroids, c * 3);
        if (d < bestD) {
          bestD = d;
          best = c;
        }
      }
      assign[i] = best;
      counts[best]++;
      sums[best * 3] += points[i * 3];
      sums[best * 3 + 1] += points[i * 3 + 1];
      sums[best * 3 + 2] += points[i * 3 + 2];
    }

    let maxShift = 0;
    for (let c = 0; c < k; c++) {
      let nl: number;
      let na: number;
      let nb: number;
      if (counts[c] > 0) {
        nl = sums[c * 3] / counts[c];
        na = sums[c * 3 + 1] / counts[c];
        nb = sums[c * 3 + 2] / counts[c];
      } else {
        // Re-seed an empty cluster from the point farthest from its assigned centroid.
        let far = -1;
        let farD = 0;
        for (let i = 0; i < n; i++) {
          const d = dist2(points, i * 3, centroids, assign[i] * 3);
          if (d > farD) {
            farD = d;
            far = i;
          }
        }
        if (far < 0) continue; // all points identical to their centroids
        nl = points[far * 3];
        na = points[far * 3 + 1];
        nb = points[far * 3 + 2];
        assign[far] = c;
      }
      const shift = Math.sqrt((nl - centroids[c * 3]) ** 2 + (na - centroids[c * 3 + 1]) ** 2 + (nb - centroids[c * 3 + 2]) ** 2);
      if (shift > maxShift) maxShift = shift;
      centroids[c * 3] = nl;
      centroids[c * 3 + 1] = na;
      centroids[c * 3 + 2] = nb;
    }
    if (maxShift < tol) break;
  }

  // Final counts consistent with the final centroids.
  counts.fill(0);
  sums.fill(0);
  for (let i = 0; i < n; i++) {
    let best = 0;
    let bestD = Infinity;
    for (let c = 0; c < k; c++) {
      const d = dist2(points, i * 3, centroids, c * 3);
      if (d < bestD) {
        bestD = d;
        best = c;
      }
    }
    counts[best]++;
    sums[best * 3] += points[i * 3];
    sums[best * 3 + 1] += points[i * 3 + 1];
    sums[best * 3 + 2] += points[i * 3 + 2];
  }
  for (let c = 0; c < k; c++) {
    if (counts[c] > 0) {
      centroids[c * 3] = sums[c * 3] / counts[c];
      centroids[c * 3 + 1] = sums[c * 3 + 1] / counts[c];
      centroids[c * 3 + 2] = sums[c * 3 + 2] / counts[c];
    }
  }
  return { centroids, counts, iterations };
}
