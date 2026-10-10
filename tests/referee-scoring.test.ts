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

  it('rejects a confident screen or home interior', () => {
    expect(scoreReferee([-1, 0, 0], emb).scene).toMatchObject({ accepted: false, label: 'SCREEN' });
    expect(scoreReferee([0, 0, 1], emb).scene).toMatchObject({ accepted: false, label: 'INDOOR' });
  });

  it('is lenient: unsure interiors pass, prints never reject (team decision)', () => {
    // INDOOR and nature roughly tied → below the confidence bar → accepted.
    expect(scoreReferee([0.0071, 0, 0.007], emb).scene.accepted).toBe(true);
    // Strong PRINT match is not a rejection reason.
    expect(scoreReferee([0, -1, 0], emb).scene.accepted).toBe(true);
  });
});
