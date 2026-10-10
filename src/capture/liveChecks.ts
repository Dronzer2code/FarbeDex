// Live checks — docs/TRD.md → LIVE CHECKS. Pure (unit-tested).

export type RejectReason = 'NO_MOTION' | 'SCREEN' | 'PRINT' | 'INDOOR' | 'STALE' | 'ERROR';

export interface LiveCheckResult {
  motionOk: boolean;
  motionStd: number | null; // null if sensor unavailable
  freshOk: boolean;
  captureToCommitMs: number;
  sceneOk: boolean;
  sceneLabel: string;
  sceneScore: number;
  accepted: boolean;
  reason?: RejectReason;
}

/** Calibrated in T5 (docs/TASKS.md → CALIBRATION RECORD). Units: deg/s (VERIFY-9). */
export const MOTION_MIN = 0.5;
export const FRESH_MAX_MS = 120_000;

export interface SceneDecision {
  accepted: boolean;
  label: string; // winning scene label id, e.g. OUTDOOR_NATURE, SCREEN
  score: number;
}

export function sceneReason(label: string): RejectReason {
  if (label === 'SCREEN' || label === 'PRINT' || label === 'INDOOR') return label;
  return 'ERROR';
}

export function computeLiveChecks(input: {
  motionStd: number | null;
  sensorAvailable: boolean;
  captureAt: number;
  commitAt: number;
  scene: SceneDecision;
  motionMin?: number;
}): LiveCheckResult {
  const motionMin = input.motionMin ?? MOTION_MIN;
  // Sensor unavailable → pass (TRD). Sensor available but too few samples → treat as no motion data → fail.
  const motionOk = !input.sensorAvailable ? true : input.motionStd !== null && input.motionStd >= motionMin;
  const captureToCommitMs = input.commitAt - input.captureAt;
  const freshOk = captureToCommitMs >= 0 && captureToCommitMs <= FRESH_MAX_MS;
  const sceneOk = input.scene.accepted;
  const accepted = motionOk && freshOk && sceneOk;
  let reason: RejectReason | undefined;
  if (!accepted) {
    // Order: scene problems are the most informative, then motion, then staleness.
    if (!sceneOk) reason = sceneReason(input.scene.label);
    else if (!motionOk) reason = 'NO_MOTION';
    else reason = 'STALE';
  }
  return {
    motionOk,
    motionStd: input.sensorAvailable ? input.motionStd : null,
    freshOk,
    captureToCommitMs,
    sceneOk,
    sceneLabel: input.scene.label,
    sceneScore: input.scene.score,
    accepted,
    reason,
  };
}

/** Rejection copy — docs/PROCESS_FLOW.md → J2 (exact strings). */
export const REJECT_COPY: Record<RejectReason, string> = {
  SCREEN: "That's a screen. Go find the real thing.",
  PRINT: 'That looks like a print or poster. Catch the real scene.',
  INDOOR: "Looks like you're inside. FarbeDex only counts colours caught outdoors.",
  NO_MOTION: 'Hold the phone in your hand and try again.',
  STALE: 'Something went wrong. Try again.',
  ERROR: 'Something went wrong. Try again.',
};
