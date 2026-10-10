// Namer — docs/TRD.md → NAMER; docs/PROCESS_FLOW.md → Namer per Catch.
// Queued per Catch; lazy model load; JSON-constrained completion; validate; retry once; template fallback.
import { create } from 'zustand';

import { getCatch, setCatchNote } from '../db/catchRepo';
import { getDb } from '../db/db';
import { allNames, getAllEntries, setEntryName } from '../db/entryRepo';
import { SettingKey, getSetting } from '../db/settingsRepo';
import { ENTRIES } from '../dex/entries.generated';
import { toneFor } from '../dex/rules';
import { getModelFile } from '../models/manifest';
import { modelState } from '../models/status';
import { bumpData } from '../store/data';
import { showToast } from '../ui/toast';
import { getNamerContext } from './llama';
import { buildMessages, buildSchema, parseNamerJson, type NamerRequest, type NewColour } from './prompt';
import { validateName, validateNote } from './validate';

export const NAMER_TIMEOUT_MS = 12_000;

export interface NamerTimings {
  loadMs: number;
  genMs: number[];
  totalMs: number;
  names: number;
  source: 'GEMMA' | 'TEMPLATE' | 'MIXED';
}

interface NamerStatus {
  pending: Record<string, true>;
  running: boolean;
  last: NamerTimings | null;
  lastError: string | null;
}

export const useNamerStatus = create<NamerStatus>(() => ({ pending: {}, running: false, last: null, lastError: null }));

const queue: string[] = [];

export function enqueueNamer(catchId: string): void {
  useNamerStatus.setState((s) => ({ pending: { ...s.pending, [catchId]: true } }));
  queue.push(catchId);
  void drain();
}

async function drain() {
  if (useNamerStatus.getState().running) return;
  useNamerStatus.setState({ running: true });
  try {
    while (queue.length) {
      const id = queue.shift()!;
      try {
        await nameCatch(id);
      } catch (e) {
        console.warn('[namer] failed', e);
      } finally {
        useNamerStatus.setState((s) => {
          const pending = { ...s.pending };
          delete pending[id];
          return { pending };
        });
        bumpData();
      }
    }
  } finally {
    useNamerStatus.setState({ running: false });
  }
}

export function isNamerBusy(): boolean {
  return useNamerStatus.getState().running;
}

async function complete(req: NamerRequest, nos: number[]): Promise<{ text: string; ms: number }> {
  const ctx = await getNamerContext();
  const t0 = Date.now();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      ctx.stopCompletion().catch(() => {});
      reject(new Error('Namer timeout'));
    }, NAMER_TIMEOUT_MS);
  });
  try {
    const res = await Promise.race([
      ctx.completion({
        messages: buildMessages(req),
        jinja: true,
        response_format: { type: 'json_schema', json_schema: { strict: true, schema: buildSchema(nos) } },
        temperature: 0.7,
        top_p: 0.9,
        n_predict: 220,
        stop: ['<end_of_turn>'],
      }),
      timeout,
    ]);
    return { text: res.text, ms: Date.now() - t0 };
  } finally {
    clearTimeout(timer);
  }
}

async function nameCatch(catchId: string): Promise<void> {
  const db = await getDb();
  const c = await getCatch(db, catchId);
  if (!c) return;
  const entries = new Map((await getAllEntries(db)).map((e) => [e.no, e]));
  // New Entries without a name (a re-caught Entry keeps its old name).
  const targets = c.swatches.filter((s) => s.is_new === 1 && !entries.get(s.entry_no)?.name);
  const writeTemplates = async (nos: number[]) => {
    for (const no of nos) await setEntryName(db, no, ENTRIES[no - 1].templateName, 'TEMPLATE');
  };

  const disabled = (await getSetting(SettingKey.namerDisabled)) === '1';
  if (disabled || modelState(getModelFile('namer')) !== 'ready') {
    await writeTemplates(targets.map((t) => t.entry_no));
    useNamerStatus.setState({ last: { loadMs: 0, genMs: [], totalMs: 0, names: targets.length, source: 'TEMPLATE' } });
    return;
  }

  const t0 = Date.now();
  const used = new Set(await allNames(db));
  const newColours: NewColour[] = targets.map((s) => ({
    no: s.entry_no,
    hex: s.hex,
    family: ENTRIES[s.entry_no - 1].family,
    tone: toneFor(s.entry_no),
  }));
  const base: NamerRequest = {
    subjectLabel: c.catch.subject_label,
    palette: c.swatches.map((s) => ({ hex: s.hex, pct: s.pct })),
    newColours,
    usedNames: [...used].slice(-40),
  };

  const accepted = new Map<number, string>();
  let note: string | null = null;
  const genMs: number[] = [];
  let loadMs = 0;
  try {
    const tl = Date.now();
    await getNamerContext();
    loadMs = Date.now() - tl;

    let pending = newColours;
    let feedback: string | undefined;
    for (let attempt = 0; attempt < 2; attempt++) {
      if (attempt > 0 && pending.length === 0) break;
      const req = attempt === 0 ? base : { ...base, newColours: pending, usedNames: [...used].slice(-40), feedback };
      const { text, ms } = await complete(req, pending.map((p) => p.no));
      genMs.push(ms);
      const json = parseNamerJson(text);
      if (attempt === 0) note = validateNote(json?.note);
      const reasons: string[] = [];
      const stillPending: NewColour[] = [];
      for (const p of pending) {
        const raw = json?.names.find((n) => n.no === p.no)?.name;
        const v = validateName(raw, { usedNames: used, templateName: ENTRIES[p.no - 1].templateName });
        if (v.ok) {
          accepted.set(p.no, v.name);
          used.add(v.name);
        } else {
          stillPending.push(p);
          reasons.push(`#${p.no}: ${v.detail}`);
        }
      }
      pending = stillPending;
      feedback = reasons.join('; ');
    }
  } catch (e) {
    useNamerStatus.setState({ lastError: String(e) });
    showToast('Naming offline — templates used');
  }

  for (const [no, name] of accepted) await setEntryName(db, no, name, 'GEMMA');
  await writeTemplates(targets.map((t) => t.entry_no).filter((no) => !accepted.has(no)));
  if (note) await setCatchNote(db, catchId, note);

  useNamerStatus.setState({
    last: {
      loadMs,
      genMs,
      totalMs: Date.now() - t0,
      names: targets.length,
      source: accepted.size === targets.length ? 'GEMMA' : accepted.size === 0 ? 'TEMPLATE' : 'MIXED',
    },
  });
}
