import { FRESH_MAX_MS, REJECT_COPY, computeLiveChecks } from '../src/capture/liveChecks';
import { motionStd } from '../src/capture/motionMath';

const outdoor = { accepted: true, label: 'OUTDOOR_NATURE', score: 0.9 };

describe('live checks', () => {
  it('motionStd is null with too few samples, 0 for a still phone', () => {
    expect(motionStd([{ t: 0, mag: 1 }])).toBeNull();
    expect(motionStd(Array.from({ length: 40 }, (_, i) => ({ t: i * 20, mag: 0.3 })))).toBeCloseTo(0, 10);
    expect(motionStd(Array.from({ length: 40 }, (_, i) => ({ t: i * 20, mag: i % 2 ? 4 : 0 })))).toBeCloseTo(2);
  });

  it('accepts hand-held outdoor captures', () => {
    const r = computeLiveChecks({ motionStd: 2, sensorAvailable: true, captureAt: 0, commitAt: 1500, scene: outdoor });
    expect(r).toMatchObject({ accepted: true, motionOk: true, freshOk: true, sceneOk: true });
    expect(r.reason).toBeUndefined();
  });

  it('rejects a phone resting still (AC-F2.4)', () => {
    const r = computeLiveChecks({ motionStd: 0.02, sensorAvailable: true, captureAt: 0, commitAt: 1000, scene: outdoor });
    expect(r).toMatchObject({ accepted: false, reason: 'NO_MOTION' });
    expect(REJECT_COPY.NO_MOTION).toBe('Hold the phone in your hand and try again.');
  });

  it('passes motion when the sensor is unavailable', () => {
    const r = computeLiveChecks({ motionStd: null, sensorAvailable: false, captureAt: 0, commitAt: 1000, scene: outdoor });
    expect(r.motionOk).toBe(true);
    expect(r.motionStd).toBeNull();
  });

  it('rejects stale captures', () => {
    const r = computeLiveChecks({ motionStd: 2, sensorAvailable: true, captureAt: 0, commitAt: FRESH_MAX_MS + 1, scene: outdoor });
    expect(r.reason).toBe('STALE');
  });

  it('scene rejection reason wins and maps from the label', () => {
    const r = computeLiveChecks({ motionStd: 0, sensorAvailable: true, captureAt: 0, commitAt: 10, scene: { accepted: false, label: 'SCREEN', score: 0.8 } });
    expect(r.reason).toBe('SCREEN');
    expect(REJECT_COPY.SCREEN).toBe("That's a screen. Go find the real thing.");
  });
});
