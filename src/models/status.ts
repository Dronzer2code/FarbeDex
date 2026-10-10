// Boot-time model check: size only (fast); md5 is verified right after download (docs/PROCESS_FLOW.md).
import { modelFileOnDisk } from './download';
import { MODEL_FILES, type ModelFile, type ModelId } from './manifest';

export type ModelState = 'ready' | 'missing';

export function modelState(m: ModelFile): ModelState {
  const f = modelFileOnDisk(m);
  return f.exists && f.size === m.bytes ? 'ready' : 'missing';
}

export function allModelsReady(): boolean {
  return MODEL_FILES.every((m) => modelState(m) === 'ready');
}

export function modelStates(): Record<ModelId, ModelState> {
  return Object.fromEntries(MODEL_FILES.map((m) => [m.id, modelState(m)])) as Record<ModelId, ModelState>;
}
