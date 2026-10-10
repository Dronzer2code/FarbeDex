// Motion ring buffer for the "hand-held" live check — docs/TRD.md → LIVE CHECKS; VERIFY-9:
// expo-sensors DeviceMotion.rotationRate on Android is the gyroscope in deg/s (alpha/beta/gamma = x/y/z).
import { DeviceMotion } from 'expo-sensors';

import type { MotionSample } from './motionMath';

export const MOTION_HZ = 50;
const BUFFER_MS = 1500;

export class MotionBuffer {
  private samples: MotionSample[] = [];
  private sub: { remove(): void } | null = null;
  available: boolean | null = null;

  async start(): Promise<void> {
    if (this.sub) return;
    this.available = await DeviceMotion.isAvailableAsync().catch(() => false);
    if (!this.available) return;
    DeviceMotion.setUpdateInterval(1000 / MOTION_HZ);
    this.sub = DeviceMotion.addListener((m) => {
      const r = m.rotationRate;
      if (!r) return;
      const now = Date.now();
      this.samples.push({ t: now, mag: Math.sqrt(r.alpha * r.alpha + r.beta * r.beta + r.gamma * r.gamma) });
      const cutoff = now - BUFFER_MS;
      while (this.samples.length && this.samples[0].t < cutoff) this.samples.shift();
    });
  }

  stop(): void {
    this.sub?.remove();
    this.sub = null;
    this.samples = [];
  }

  /** Copy of the samples from the last `windowMs`. */
  snapshot(windowMs = 800): MotionSample[] {
    const cutoff = Date.now() - windowMs;
    return this.samples.filter((s) => s.t >= cutoff);
  }
}
