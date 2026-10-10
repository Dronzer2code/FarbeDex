// One InferenceSession for the app's lifetime (docs/TRD.md → REFEREE). CPU EP with XNNPACK first (VERIFY-5).
import type { InferenceSession, Tensor as OrtTensor } from 'onnxruntime-react-native';
import { NativeModules } from 'react-native';

import { modelFileOnDisk, toFsPath } from '../models/download';
import { getModelFile } from '../models/manifest';
import { ACTIVE_REFEREE, REFEREE_IO } from './config';
import { l2Normalize } from './preprocess';

type Ort = typeof import('onnxruntime-react-native');

/** Lazy native import: if the module is missing, only the Referee fails (ERROR), not the whole app. */
function ort(): Ort {
  // Check first: requiring the package without its native module throws a fatal module-init error.
  if (!NativeModules.Onnxruntime) throw new Error('ONNX Runtime native module missing — install a dev client built after 2026-10-10 11:45');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('onnxruntime-react-native') as Ort;
}

let sessionPromise: Promise<InferenceSession> | null = null;
export let refereeProvider: 'xnnpack' | 'cpu' | null = null;

async function create(path: string): Promise<InferenceSession> {
  const { InferenceSession } = ort();
  try {
    const s = await InferenceSession.create(path, { executionProviders: ['xnnpack', 'cpu'], graphOptimizationLevel: 'all' });
    refereeProvider = 'xnnpack';
    return s;
  } catch {
    const s = await InferenceSession.create(path, { executionProviders: ['cpu'], graphOptimizationLevel: 'all' });
    refereeProvider = 'cpu';
    return s;
  }
}

export function getRefereeSession(): Promise<InferenceSession> {
  if (!sessionPromise) {
    const path = toFsPath(modelFileOnDisk(getModelFile('referee')).uri);
    sessionPromise = create(path).catch((e) => {
      sessionPromise = null;
      throw e;
    });
  }
  return sessionPromise;
}

// CLIP BOS/EOS tokens: a minimal valid text sequence for combined graphs (text output is ignored).
const DUMMY_IDS = [49406, 49407];

/** Runs the image encoder on CHW float data; returns the L2-normalised embedding. */
export async function embedImage(chw: Float32Array): Promise<Float32Array> {
  const session = await getRefereeSession();
  const { Tensor } = ort();
  const s = ACTIVE_REFEREE.inputSize;
  const feeds: Record<string, OrtTensor> = { [REFEREE_IO.pixelInput]: new Tensor('float32', chw, [1, 3, s, s]) };
  if (ACTIVE_REFEREE.combinedTextInputs) {
    feeds.input_ids = new Tensor('int64', BigInt64Array.from(DUMMY_IDS.map(BigInt)), [1, DUMMY_IDS.length]);
    feeds.attention_mask = new Tensor('int64', BigInt64Array.from(DUMMY_IDS.map(() => BigInt(1))), [1, DUMMY_IDS.length]);
  }
  const out = await session.run(feeds);
  return l2Normalize(out[REFEREE_IO.output].data as Float32Array);
}
