// Referee: scene gate + subject label — docs/TRD.md → REFEREE.
// T5: stub that accepts every scene; T6 replaces it with MobileCLIP scoring against label embeddings.
import type { SceneDecision } from '../capture/liveChecks';
import type { RgbaImage } from './preprocess';

export interface RefereeResult {
  scene: SceneDecision;
  subject: { label: string; score: number } | null;
  ms: number;
}

export async function runReferee(_img: RgbaImage): Promise<RefereeResult> {
  return { scene: { accepted: true, label: 'OUTDOOR_NATURE', score: 1 }, subject: null, ms: 0 };
}

/** Warm the session when the camera opens (no-op until T6). */
export async function warmReferee(): Promise<void> {}
