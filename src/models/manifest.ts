// Model manifest — docs/TRD.md → MODEL DELIVERY. Sizes/md5 match docs/TASKS.md → CALIBRATION RECORD.

export type ModelId = 'referee' | 'namer';

export interface ModelFile {
  id: ModelId;
  fileName: string;
  url: string;
  bytes: number;
  md5: string;
  license: string;
}

// UNRESOLVED: GitHub owner of the release; set when release `models-v1` exists (docs/SETUP.md §5).
export const MODEL_RELEASE_BASE = 'https://github.com/UNRESOLVED_OWNER/farbedex/releases/download/models-v1';

export const MODEL_FILES: readonly ModelFile[] = [
  {
    id: 'referee',
    // Source: huggingface.co/Xenova/mobileclip_s0 → onnx/vision_model_quantized.onnx (VERIFY-2)
    fileName: 'mobileclip_s0_vision.onnx',
    url: `${MODEL_RELEASE_BASE}/mobileclip_s0_vision.onnx`,
    bytes: 11_846_843,
    md5: 'e89a825d4f2c14897fc59acba7c5a0fa',
    license: 'Apple Machine Learning Research Model License (MobileCLIP)',
  },
  {
    id: 'namer',
    // Source: huggingface.co/unsloth/gemma-3-270m-it-GGUF → gemma-3-270m-it-Q4_K_M.gguf (VERIFY-7)
    fileName: 'gemma-3-270m-it-Q4_K_M.gguf',
    url: `${MODEL_RELEASE_BASE}/gemma-3-270m-it-Q4_K_M.gguf`,
    bytes: 253_115_424,
    md5: '7d0214b04bf023c129d0b719ec435393',
    license: 'Gemma Terms of Use',
  },
];

export function getModelFile(id: ModelId): ModelFile {
  const file = MODEL_FILES.find((f) => f.id === id);
  if (!file) throw new Error(`Unknown model ${id}`);
  return file;
}

export const TOTAL_MODEL_BYTES = MODEL_FILES.reduce((sum, f) => sum + f.bytes, 0);
