// One InferenceSession for the app's lifetime (docs/TRD.md → REFEREE). CPU EP with XNNPACK first (VERIFY-5).
import { InferenceSession, Tensor } from 'onnxruntime-react-native';

import { modelFileOnDisk, toFsPath } from '../models/download';
import { getModelFile } from '../models/manifest';
import { REFEREE_MODEL } from './config';
import { l2Normalize } from './preprocess';

let sessionPromise: Promise<InferenceSession> | null = null;
export let refereeProvider: 'xnnpack' | 'cpu' | null = null;

async function create(path: string): Promise<InferenceSession> {
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

/** Runs the image encoder on CHW float data; returns the L2-normalised embedding. */
export async function embedImage(chw: Float32Array): Promise<Float32Array> {
  const session = await getRefereeSession();
  const s = REFEREE_MODEL.inputSize;
  const input = new Tensor('float32', chw, [1, 3, s, s]);
  const out = await session.run({ [REFEREE_MODEL.inputName]: input });
  const emb = out[REFEREE_MODEL.outputName];
  return l2Normalize(emb.data as Float32Array);
}
