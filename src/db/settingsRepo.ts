import { getDb } from './db';

/** Known settings keys. */
export const SettingKey = {
  onboardingDone: 'onboarding_done',
  devModelBaseUrl: 'dev_model_base_url',
  namerDisabled: 'dev_namer_disabled',
} as const;

export async function getSetting(key: string): Promise<string | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', key);
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    key,
    value,
  );
}

export async function deleteSetting(key: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM settings WHERE key = ?', key);
}
