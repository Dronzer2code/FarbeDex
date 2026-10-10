// UI preferences (persisted in settings). Faces on Specimens default to on.
import { create } from 'zustand';

import { SettingKey, getSetting, setSetting } from '../db/settingsRepo';

interface Prefs {
  facesEnabled: boolean;
  load: () => Promise<void>;
  setFacesEnabled: (on: boolean) => Promise<void>;
}

export const usePrefs = create<Prefs>((set) => ({
  facesEnabled: true,
  load: async () => {
    const v = await getSetting(SettingKey.facesEnabled);
    set({ facesEnabled: v !== '0' });
  },
  setFacesEnabled: async (on) => {
    set({ facesEnabled: on });
    await setSetting(SettingKey.facesEnabled, on ? '1' : '0');
  },
}));
