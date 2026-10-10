// Catch pipeline — docs/TRD.md → CATCH PIPELINE; docs/PROCESS_FLOW.md → Capture state machine.
import { randomUUID } from 'expo-crypto';

import { extractPalette, type Swatch } from '../color/extract';
import { commitCatch } from '../db/catchRepo';
import { getDb } from '../db/db';
import { runReferee } from '../referee/referee';
import { refineSubject } from '../referee/subjectPrior';
import { bumpData } from '../store/data';
import { computeLiveChecks, type LiveCheckResult, type RejectReason } from './liveChecks';
import { deleteCaptureFiles, deleteFileUri, prepareImages } from './imagePrep';
import { motionStd, type MotionSample } from './motionMath';

export interface CaptureInput {
  photoUri: string; // camera cache file
  width: number;
  height: number;
  captureAt: number;
  motion: MotionSample[];
  sensorAvailable: boolean;
  /** Returns true when the user left the camera screen (cancel → delete files, save nothing). */
  isCancelled: () => boolean;
  onStep?: (step: 'scene' | 'colours') => void;
}

export interface CaptureTimings {
  prepMs: number;
  refereeMs: number;
  extractMs: number;
  commitMs: number;
  totalMs: number;
}

export type CaptureOutcome =
  | { kind: 'accepted'; id: string; swatches: Swatch[]; newEntryNos: number[]; live: LiveCheckResult; timings: CaptureTimings }
  | { kind: 'rejected'; reason: RejectReason; live: LiveCheckResult | null; timings: Partial<CaptureTimings> }
  | { kind: 'cancelled' };

export async function runCapture(input: CaptureInput): Promise<CaptureOutcome> {
  const id = randomUUID();
  const t0 = Date.now();
  const timings: Partial<CaptureTimings> = {};
  const std = motionStd(input.motion);
  try {
    input.onStep?.('scene');
    const prep = await prepareImages(id, input.photoUri, input.width, input.height);
    deleteFileUri(input.photoUri);
    timings.prepMs = Date.now() - t0;
    if (input.isCancelled()) {
      deleteCaptureFiles(id);
      return { kind: 'cancelled' };
    }

    const tA = Date.now();
    const [referee, extraction] = await Promise.all([
      runReferee(prep.referee256).then((r) => {
        timings.refereeMs = Date.now() - tA;
        input.onStep?.('colours');
        return r;
      }),
      // Yield once so the Referee's native call starts before the JS-heavy extraction.
      new Promise<ReturnType<typeof extractPalette>>((resolve) =>
        setTimeout(() => {
          const tE = Date.now();
          const e = extractPalette(prep.analysis160.data);
          timings.extractMs = Date.now() - tE;
          resolve(e);
        }, 0),
      ),
    ]);

    const live = computeLiveChecks({
      motionStd: std,
      sensorAvailable: input.sensorAvailable,
      captureAt: input.captureAt,
      commitAt: Date.now(),
      scene: referee.scene,
    });
    if (input.isCancelled()) {
      deleteCaptureFiles(id);
      return { kind: 'cancelled' };
    }
    if (!live.accepted) {
      deleteCaptureFiles(id);
      return { kind: 'rejected', reason: live.reason ?? 'ERROR', live, timings };
    }

    // Subject label must be supported by the photo's real colours (no "fern" for a blue sky).
    const subject = referee.subjectProbs ? refineSubject(referee.subjectProbs, extraction.swatches) : referee.subject;

    const tC = Date.now();
    const db = await getDb();
    const result = await commitCatch(db, {
      id,
      createdAt: input.captureAt,
      photoPath: prep.photoPath,
      thumbPath: prep.thumbPath,
      width: prep.width,
      height: prep.height,
      subjectLabel: subject?.label ?? null,
      subjectScore: subject?.score ?? null,
      sceneLabel: referee.scene.label,
      sceneScore: referee.scene.score,
      otherPct: extraction.otherPct,
      liveChecks: { ...live, timings },
      swatches: extraction.swatches,
      minority: extraction.minority,
    }, { register: 'none' });
    timings.commitMs = Date.now() - tC;
    bumpData();
    timings.totalMs = Date.now() - t0;
    return { kind: 'accepted', id, swatches: result.swatches, newEntryNos: result.newEntryNos, live, timings: timings as CaptureTimings };
  } catch (e) {
    console.warn('[capture] failed', e);
    deleteCaptureFiles(id, [input.photoUri]);
    return { kind: 'rejected', reason: 'ERROR', live: null, timings };
  }
}
