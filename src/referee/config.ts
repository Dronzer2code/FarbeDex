// Referee model presets + gate config — docs/TRD.md → REFEREE; VERIFY-2 / VERIFY-3.
// Switching models = change ACTIVE_REFEREE, run `npm run build:labels` with the matching env (see
// scripts/build-label-embeddings.mjs), and serve/upload the file. JS-only: no dev-client rebuild.

export interface RefereePreset {
  id: 'mobileclip_s0_fp16' | 'tinyclip_8m_q8';
  fileName: string;
  bytes: number;
  md5: string;
  license: string;
  source: string;
  inputSize: number;
  mean: readonly [number, number, number] | null;
  std: readonly [number, number, number] | null;
  /** Combined CLIP graphs also need text inputs; we feed a dummy 2-token sequence and read image_embeds. */
  combinedTextInputs: boolean;
}

const CLIP_MEAN = [0.48145466, 0.4578275, 0.40821073] as const;
const CLIP_STD = [0.26862954, 0.26130258, 0.27577711] as const;

export const REFEREE_PRESETS: Record<RefereePreset['id'], RefereePreset> = {
  // huggingface.co/Xenova/mobileclip_s0 → onnx/vision_model_fp16.onnx. (The uint8 "quantized" file gave
  // unusable embeddings in the laptop check; fp16 matches fp32 at cos ≈ 1.0.)
  mobileclip_s0_fp16: {
    id: 'mobileclip_s0_fp16',
    fileName: 'mobileclip_s0_vision_fp16.onnx',
    bytes: 22_876_479,
    md5: '81304dbb50d185466348b3ed59ab422a',
    license: 'Apple Machine Learning Research Model License (MobileCLIP)',
    source: 'huggingface.co/Xenova/mobileclip_s0 (onnx/vision_model_fp16.onnx)',
    inputSize: 256,
    mean: null,
    std: null,
    combinedTextInputs: false,
  },
  // huggingface.co/onnx-community/TinyCLIP-ViT-8M-16-Text-3M-YFCC15M-ONNX → onnx/model_quantized.onnx (MIT).
  tinyclip_8m_q8: {
    id: 'tinyclip_8m_q8',
    fileName: 'tinyclip_8m_q8.onnx',
    bytes: 24_281_512,
    md5: '7cbfbdfa9b07e0074d2446d6fe64d9de',
    license: 'MIT (TinyCLIP, Microsoft)',
    source: 'huggingface.co/onnx-community/TinyCLIP-ViT-8M-16-Text-3M-YFCC15M-ONNX (onnx/model_quantized.onnx)',
    inputSize: 224,
    mean: CLIP_MEAN,
    std: CLIP_STD,
    combinedTextInputs: true,
  },
};

// UNRESOLVED (team decision, VERIFY-2): MobileCLIP licence is research-only; TinyCLIP is MIT.
export const ACTIVE_REFEREE: RefereePreset = REFEREE_PRESETS.mobileclip_s0_fp16;

export const REFEREE_IO = {
  pixelInput: 'pixel_values',
  output: 'image_embeds',
  dims: 512,
} as const;

/** Scene gate (calibrated in T6; docs/TASKS.md → CALIBRATION RECORD). */
export const SCENE_ACCEPT_MIN = 0.55;
