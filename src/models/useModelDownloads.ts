// Download state for both model files (docs/PROCESS_FLOW.md → Model download).
import { useCallback, useRef, useState } from 'react';

import { SettingKey, getSetting } from '../db/settingsRepo';
import { DownloadPausedError, downloadModel } from './download';
import { MODEL_FILES, type ModelId } from './manifest';
import { resolveModelUrl } from './resolveUrl';
import { modelState } from './status';

export type ModelDlState =
  | { kind: 'idle' }
  | { kind: 'downloading'; pct: number }
  | { kind: 'verifying' }
  | { kind: 'ready' }
  | { kind: 'failed'; message: string };

function initialStates(): Record<ModelId, ModelDlState> {
  return Object.fromEntries(
    MODEL_FILES.map((m) => [m.id, modelState(m) === 'ready' ? { kind: 'ready' } : { kind: 'idle' }]),
  ) as Record<ModelId, ModelDlState>;
}

export function useModelDownloads() {
  const [states, setStates] = useState<Record<ModelId, ModelDlState>>(initialStates);
  const [running, setRunning] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const set = (id: ModelId, s: ModelDlState) => setStates((prev) => ({ ...prev, [id]: s }));

  const refresh = useCallback(() => setStates(initialStates()), []);

  const downloadAll = useCallback(async () => {
    if (running) return;
    setRunning(true);
    const abort = new AbortController();
    abortRef.current = abort;
    const devBase = __DEV__ ? await getSetting(SettingKey.devModelBaseUrl) : null;
    try {
      for (const m of MODEL_FILES) {
        if (modelState(m) === 'ready') {
          set(m.id, { kind: 'ready' });
          continue;
        }
        const url = resolveModelUrl(m, __DEV__, devBase);
        let lastPct = -1;
        try {
          await downloadModel(
            m,
            url,
            (p) => {
              if (p.phase === 'verifying') return set(m.id, { kind: 'verifying' });
              const pct = Math.floor((p.bytesWritten / p.totalBytes) * 100);
              if (pct !== lastPct) {
                lastPct = pct;
                set(m.id, { kind: 'downloading', pct });
              }
            },
            abort.signal,
          );
          set(m.id, { kind: 'ready' });
        } catch (e) {
          const message = e instanceof DownloadPausedError ? 'Paused' : e instanceof Error ? e.message : String(e);
          set(m.id, { kind: 'failed', message });
          break; // stop the queue; Retry resumes from the partial file
        }
      }
    } finally {
      abortRef.current = null;
      setRunning(false);
    }
  }, [running]);

  const cancel = useCallback(() => abortRef.current?.abort(), []);

  const allReady = MODEL_FILES.every((m) => states[m.id].kind === 'ready');

  return { states, running, allReady, downloadAll, cancel, refresh };
}
