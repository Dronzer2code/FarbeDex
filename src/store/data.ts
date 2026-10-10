// Data-change signal: repositories are the source of truth; screens reload when `version` changes.
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { create } from 'zustand';

import { deleteFileUri } from '../capture/imagePrep';
import { deleteCatch } from '../db/catchRepo';
import { getDb } from '../db/db';
import type { DbLike } from '../db/types';

export const useDataVersion = create<{ version: number; bump: () => void }>((set) => ({
  version: 0,
  bump: () => set((s) => ({ version: s.version + 1 })),
}));

export function bumpData() {
  useDataVersion.getState().bump();
}

/** Loads data with the DB on focus and whenever the data version changes. */
export function useDbQuery<T>(load: (db: DbLike) => Promise<T>, deps: unknown[]): { data: T | undefined; reload: () => void } {
  const version = useDataVersion((s) => s.version);
  const [data, setData] = useState<T>();
  const [tick, setTick] = useState(0);
  const depsKey = JSON.stringify(deps);
  useFocusEffect(
    useCallback(() => {
      let alive = true;
      getDb()
        .then((db) => load(db))
        .then((d) => alive && setData(d))
        .catch((e) => console.warn('[db] query failed', e));
      return () => {
        alive = false;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [version, tick, depsKey]),
  );
  return { data, reload: () => setTick((t) => t + 1) };
}

/** Deletes a Catch (recompute in DB), its files, and notifies screens. */
export async function deleteCatchEverywhere(id: string): Promise<void> {
  const db = await getDb();
  const paths = await deleteCatch(db, id);
  if (paths) {
    deleteFileUri(paths.photoPath);
    deleteFileUri(paths.thumbPath);
  }
  bumpData();
}
