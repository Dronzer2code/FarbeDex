// App start gate — docs/PROCESS_FLOW.md → App start gate. Loaded once in the root layout.
import { create } from 'zustand';

import { getDb } from '../db/db';
import { repairMismatchedNames } from '../db/entryRepo';
import { SettingKey, getSetting, setSetting } from '../db/settingsRepo';
import { ENTRIES } from '../dex/entries.generated';
import { colourWordFor } from '../dex/rules';
import { allModelsReady } from '../models/status';
import { usePrefs } from './prefs';

interface GateState {
  loaded: boolean;
  onboarded: boolean;
  modelsReady: boolean;
  /** Dev-only: continue into the app without models (Referee/Namer unavailable). */
  devSkipModels: boolean;
  load: () => Promise<void>;
  finishOnboarding: () => Promise<void>;
  refreshModels: () => void;
  skipModelsDev: () => void;
}

export const useGate = create<GateState>((set) => ({
  loaded: false,
  onboarded: false,
  modelsReady: false,
  devSkipModels: false,
  load: async () => {
    const onboarded = (await getSetting(SettingKey.onboardingDone)) === '1';
    if ((await getSetting(SettingKey.namesRepairedV2)) !== '1') {
      try {
        await repairMismatchedNames(await getDb(), colourWordFor, (no) => ENTRIES[no - 1].templateName);
        await setSetting(SettingKey.namesRepairedV2, '1');
      } catch (e) {
        console.warn('[names] repair failed', e);
      }
    }
    await usePrefs.getState().load().catch(() => {});
    set({ loaded: true, onboarded, modelsReady: allModelsReady() });
  },
  finishOnboarding: async () => {
    await setSetting(SettingKey.onboardingDone, '1');
    set({ onboarded: true });
  },
  refreshModels: () => set({ modelsReady: allModelsReady() }),
  skipModelsDev: () => set({ devSkipModels: __DEV__ }),
}));

/** Where the app should be: null = normal app. */
export function gateTarget(s: Pick<GateState, 'loaded' | 'onboarded' | 'modelsReady' | 'devSkipModels'>): '/onboarding' | '/setup-models' | null {
  if (!s.loaded) return null;
  if (!s.onboarded) return '/onboarding';
  if (!s.modelsReady && !s.devSkipModels) return '/setup-models';
  return null;
}
