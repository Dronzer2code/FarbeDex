// llama.rn context for the Namer — docs/TRD.md → NAMER; parameter names per VERIFY-4 (llama.rn 0.12.9).
import type { LlamaContext } from 'llama.rn';

import { modelFileOnDisk } from '../models/download';
import { getModelFile } from '../models/manifest';

let ctxPromise: Promise<LlamaContext> | null = null;

/** Lazy native import: if llama.rn is missing, only the Namer fails (template names), not the whole app. */
function llama(): typeof import('llama.rn') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('llama.rn') as typeof import('llama.rn');
}

export function getNamerContext(): Promise<LlamaContext> {
  if (!ctxPromise) {
    const uri = modelFileOnDisk(getModelFile('namer')).uri;
    ctxPromise = Promise.resolve()
      .then(() => llama().initLlama({ model: uri, n_ctx: 1024, n_threads: 4, n_gpu_layers: 0, use_mlock: false }))
      .catch((e) => {
        ctxPromise = null;
        throw e;
      });
  }
  return ctxPromise;
}

/** Frees the model (called when the app goes to background). */
export async function releaseNamer(): Promise<void> {
  const p = ctxPromise;
  ctxPromise = null;
  if (p) {
    try {
      await (await p).release();
    } catch {
      // already released or never loaded
    }
  }
}

export function isNamerLoaded(): boolean {
  return ctxPromise !== null;
}
