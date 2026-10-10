import { scoreReferee, softmaxScores, type LabelEmbeddings } from '../src/referee/scoring';

const v = (...xs: number[]) => xs;
const emb: LabelEmbeddings = {
  model: 'test',
  dims: 3,
  logitScale: 100,
  scene: [
    { id: 'OUTDOOR_NATURE', prompts: ['a', 'b'], vec: v(1, 0, 0), vecs: [v(1, 0, 0), v(0.6, 0.8, 0)] },
    { id: 'OUTDOOR_URBAN', prompts: ['c'], vec: v(0, 1, 0) },
    { id: 'INDOOR', prompts: ['d'], vec: v(0, 0, 1) },
    { id: 'SCREEN', prompts: ['e'], vec: v(-1, 0, 0) },
    { id: 'PRINT', prompts: ['f'], vec: v(0, -1, 0) },
  ],
  subject: [
    { id: 'moss', prompts: ['m'], vec: v(1, 0, 0) },
    { id: 'sky', prompts: ['s'], vec: v(0, 1, 0) },
  ],
};

describe('referee scoring', () => {
  it('softmax sums to 1 and uses the best prompt per label', () => {
    const p = softmaxScores([0.6, 0.8, 0], emb.scene, 100);
    expect(p.reduce((s, x) => s + x, 0)).toBeCloseTo(1);
    expect(p[0]).toBeGreaterThan(p[1]); // nature's second prompt matches exactly
  });

  it('accepts confident outdoor scenes', () => {
    const r = scoreReferee([1, 0, 0], emb);
    expect(r.scene).toMatchObject({ accepted: true, label: 'OUTDOOR_NATURE' });
    expect(r.subject?.label).toBe('moss');
  });

  it('rejects a screen with SCREEN as the reason', () => {
    expect(scoreReferee([-1, 0, 0], emb).scene).toMatchObject({ accepted: false, label: 'SCREEN' });
  });

  it('low-confidence outdoor argmax is rejected with the strongest non-outdoor label', () => {
    const r = scoreReferee([0.02, 0, 0.0199], emb, 0.99);
    expect(r.scene.accepted).toBe(false);
    expect(r.scene.label).toBe('INDOOR');
  });
});
