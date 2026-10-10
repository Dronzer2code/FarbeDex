// Favourites flow glue: register picks, notify screens, then run the Namer for the new Entries.
import { autoRegisterPending, getCatch, registerFavourites } from '../db/catchRepo';
import { getDb } from '../db/db';
import { defaultFavourites } from '../dex/shiny';
import { enqueueNamer } from '../namer/namer';
import { bumpData } from './data';

export async function confirmFavourites(catchId: string, entryNos: number[]) {
  const db = await getDb();
  const r = await registerFavourites(db, catchId, entryNos);
  bumpData();
  if (!r.alreadyRegistered) enqueueNamer(catchId);
  return r;
}

/** Leaving the result screen without choosing registers the top colours, so a catch is never lost. */
export async function registerDefaultsIfPending(catchId: string): Promise<void> {
  const db = await getDb();
  const c = await getCatch(db, catchId);
  if (c && c.catch.registered === 0) await confirmFavourites(catchId, defaultFavourites(c.swatches));
}

/** App start: catches left unregistered (app closed mid-choice) get their top colours. */
export async function registerAllPending(): Promise<void> {
  const db = await getDb();
  const ids = await autoRegisterPending(db);
  ids.forEach(enqueueNamer);
  if (ids.length) bumpData();
}
