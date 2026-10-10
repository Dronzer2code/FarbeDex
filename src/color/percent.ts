/**
 * Largest-remainder rounding: shares (any non-negative weights) → integer units summing to `total`.
 * Ties broken by lower index (deterministic). With total = 1000, units/10 are percentages with one decimal.
 */
export function largestRemainder(shares: readonly number[], total = 1000): number[] {
  const sum = shares.reduce((s, v) => s + v, 0);
  if (sum <= 0) return shares.map(() => 0);
  const exact = shares.map((v) => (v / sum) * total);
  const units = exact.map(Math.floor);
  let rest = total - units.reduce((s, v) => s + v, 0);
  const order = exact
    .map((v, i) => ({ i, r: v - Math.floor(v) }))
    .sort((p, q) => q.r - p.r || p.i - q.i);
  for (let j = 0; rest > 0; j = (j + 1) % order.length, rest--) units[order[j].i]++;
  return units;
}
