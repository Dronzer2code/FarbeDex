// Pure motion statistics (unit-tested).

export interface MotionSample {
  t: number; // epoch ms
  mag: number; // |rotationRate| in deg/s
}

/** Standard deviation of the rotation-rate magnitude; null when too few samples to judge. */
export function motionStd(samples: readonly MotionSample[], minSamples = 8): number | null {
  if (samples.length < minSamples) return null;
  const mean = samples.reduce((s, x) => s + x.mag, 0) / samples.length;
  const variance = samples.reduce((s, x) => s + (x.mag - mean) ** 2, 0) / samples.length;
  return Math.sqrt(variance);
}
