// Referee scoring — docs/TRD.md → REFEREE: logits = logitScale · (imageVec · labelVec); softmax per group.
// Decision 2026-10-10: a label's vector is its best-matching prompt (max) rather than the prompt mean,
// because averaging diverse prompts blurred the outdoor labels (laptop check, docs/TASKS.md).
// Pure (shared by the app and the laptop check script).
import type { SceneDecision } from '../capture/liveChecks';
import { REJECT_LABELS, REJECT_MIN } from './config';

export interface LabelVec {
  id: string;
  prompts: string[];
  vec: number[];
  /** Per-prompt vectors; when present a label scores as its best-matching prompt. */
  vecs?: number[][];
}

export interface LabelEmbeddings {
  model: string;
  dims: number;
  logitScale: number;
  scene: LabelVec[];
  subject: LabelVec[];
}

export const OUTDOOR_LABELS = ['OUTDOOR_NATURE', 'OUTDOOR_URBAN'] as const;

export function softmaxScores(imageVec: ArrayLike<number>, labels: readonly LabelVec[], logitScale: number): number[] {
  const dot = (v: number[]) => {
    let d = 0;
    for (let i = 0; i < v.length; i++) d += imageVec[i] * v[i];
    return d;
  };
  // Label logit = best-matching prompt (max), or the mean vector when per-prompt vectors are absent.
  const logits = labels.map((l) => logitScale * (l.vecs?.length ? Math.max(...l.vecs.map(dot)) : dot(l.vec)));
  const max = Math.max(...logits);
  const exps = logits.map((x) => Math.exp(x - max));
  const sum = exps.reduce((s, x) => s + x, 0);
  return exps.map((x) => x / sum);
}

export interface RefereeScore {
  scene: SceneDecision;
  subject: { label: string; score: number } | null;
  sceneProbs: Record<string, number>;
  subjectProbs: Record<string, number>;
  outdoorP: number;
}

export function scoreReferee(imageVec: ArrayLike<number>, emb: LabelEmbeddings, rejectMin = REJECT_MIN): RefereeScore {
  const sp = softmaxScores(imageVec, emb.scene, emb.logitScale);
  const sceneProbs = Object.fromEntries(emb.scene.map((l, i) => [l.id, sp[i]]));
  const outdoorP = OUTDOOR_LABELS.reduce((s, id) => s + (sceneProbs[id] ?? 0), 0);
  // Lenient gate: reject only a confident home interior or screen that clearly beats "outdoors".
  const worst = (REJECT_LABELS as readonly string[])
    .map((id) => ({ id, p: sceneProbs[id] ?? 0 }))
    .sort((a, b) => b.p - a.p)[0];
  const rejected = !!worst && worst.p >= rejectMin && worst.p > outdoorP;
  const bestOutdoor = OUTDOOR_LABELS.map((id) => ({ id, p: sceneProbs[id] ?? 0 })).sort((a, b) => b.p - a.p)[0];
  const scene = rejected
    ? { accepted: false, label: worst.id, score: worst.p }
    : { accepted: true, label: bestOutdoor.id, score: outdoorP };

  const subP = softmaxScores(imageVec, emb.subject, emb.logitScale);
  let bs = 0;
  for (let i = 1; i < subP.length; i++) if (subP[i] > subP[bs]) bs = i;
  return {
    scene,
    subject: emb.subject.length ? { label: emb.subject[bs].id, score: subP[bs] } : null,
    sceneProbs,
    subjectProbs: Object.fromEntries(emb.subject.map((l, i) => [l.id, subP[i]])),
    outdoorP,
  };
}
