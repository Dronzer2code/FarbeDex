// Referee: scene gate + subject label — docs/TRD.md → REFEREE.
import { create } from 'zustand';

import labels from '../../assets/labels/label-embeddings.json';
import type { SceneDecision } from '../capture/liveChecks';
import { getModelFile } from '../models/manifest';
import { modelState } from '../models/status';
import { ACTIVE_REFEREE } from './config';
import { preprocessToChw, type RgbaImage } from './preprocess';
import { scoreReferee, type LabelEmbeddings } from './scoring';
import { embedImage, forceCpuSession, getRefereeSession, refereeProvider } from './session';

export interface RefereeResult {
  scene: SceneDecision;
  subject: { label: string; score: number } | null;
  sceneProbs: Record<string, number>;
  /** Full subject distribution, refined against the palette in capture.ts (subjectPrior). */
  subjectProbs?: Record<string, number>;
  ms: number;
}

const EMB = labels as LabelEmbeddings;

/** Dev calibration log (last 50 decisions), copyable from /dev/ai-spike. */
export const useRefereeLog = create<{ entries: (RefereeResult & { at: number })[] }>(() => ({ entries: [] }));

function log(r: RefereeResult) {
  if (!__DEV__) return;
  useRefereeLog.setState((s) => ({ entries: [{ ...r, at: Date.now() }, ...s.entries].slice(0, 50) }));
}

export async function runReferee(img: RgbaImage): Promise<RefereeResult> {
  const t0 = Date.now();
  if (__DEV__ && modelState(getModelFile('referee')) !== 'ready') {
    // Dev-only bypass so the pipeline can be tested before models are on the phone.
    return { scene: { accepted: true, label: 'DEV_NO_REFEREE', score: 0 }, subject: null, sceneProbs: {}, ms: 0 };
  }
  try {
    const chw = preprocessToChw(img, ACTIVE_REFEREE.inputSize, ACTIVE_REFEREE.mean, ACTIVE_REFEREE.std);
    let vec = await embedImage(chw);
    if (!vec.every(Number.isFinite) && refereeProvider === 'xnnpack') {
      console.warn('[referee] non-finite on XNNPACK; retrying on CPU');
      forceCpuSession();
      vec = await embedImage(chw);
    }
    if (!vec.every(Number.isFinite)) {
      // Non-finite embedding (seen on device): don't block the user (lenient gate), record it for calibration.
      const r: RefereeResult = { scene: { accepted: true, label: 'OUTDOOR_UNSCORED', score: 0 }, subject: null, sceneProbs: {}, ms: Date.now() - t0 };
      console.warn('[referee] non-finite embedding; provider', refereeProvider);
      log(r);
      return r;
    }
    const s = scoreReferee(vec, EMB);
    const r: RefereeResult = { scene: s.scene, subject: s.subject, sceneProbs: s.sceneProbs, subjectProbs: s.subjectProbs, ms: Date.now() - t0 };
    log(r);
    return r;
  } catch (e) {
    console.warn('[referee] unavailable', e);
    // Referee unavailable → reject with ERROR: no unverified Catches enter the FarbeDex.
    return { scene: { accepted: false, label: 'ERROR', score: 0 }, subject: null, sceneProbs: {}, ms: Date.now() - t0 };
  }
}

/** Warm the session when the camera opens. */
export async function warmReferee(): Promise<void> {
  if (modelState(getModelFile('referee')) === 'ready') await getRefereeSession();
}
