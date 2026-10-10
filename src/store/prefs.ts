// UI preferences (persisted in settings). Faces on Specimens default to on.
import { create } from 'zustand';

import { SettingKey, getSetting, setSetting } from '../db/settingsRepo';

interface Prefs {
  facesEnabled: boolean;
  soundsEnabled: boolean;
  load: () => Promise<void>;
  setFacesEnabled: (on: boolean) => Promise<void>;
  setSoundsEnabled: (on: boolean) => Promise<void>;
}

export const usePrefs = create<Prefs>((set) => ({
  facesEnabled: true,
  soundsEnabled: true,
  load: async () => {
    const v = await getSetting(SettingKey.facesEnabled);
    const snd = await getSetting(SettingKey.soundsEnabled);
    set({ facesEnabled: v !== '0', soundsEnabled: snd !== '0' });
  },
  setFacesEnabled: async (on) => {
    set({ facesEnabled: on });
    await setSetting(SettingKey.facesEnabled, on ? '1' : '0');
  },
  setSoundsEnabled: async (on) => {
    set({ soundsEnabled: on });
    await setSetting(SettingKey.soundsEnabled, on ? '1' : '0');
  },
}));
