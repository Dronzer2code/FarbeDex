import { gateTarget } from '../src/store/gate';

describe('start gate', () => {
  const base = { loaded: true, onboarded: true, modelsReady: true, devSkipModels: false };
  it('routes first launch to onboarding, missing models to setup, else Home (AC-F1.3)', () => {
    expect(gateTarget({ ...base, onboarded: false })).toBe('/onboarding');
    expect(gateTarget({ ...base, modelsReady: false })).toBe('/setup-models');
    expect(gateTarget(base)).toBeNull();
    expect(gateTarget({ ...base, loaded: false })).toBeNull();
    expect(gateTarget({ ...base, modelsReady: false, devSkipModels: true })).toBeNull();
  });
});
