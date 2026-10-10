// Referee model + gate config — docs/TRD.md → REFEREE; values per VERIFY-2 (Xenova/mobileclip_s0
// preprocessor_config.json: shortest_edge 256, center crop 256, rescale 1/255, do_normalize false).

export const REFEREE_MODEL = {
  inputName: 'pixel_values',
  outputName: 'image_embeds',
  inputSize: 256,
  dims: 512,
  /** Per-channel mean/std, or null when the model expects plain [0,1] RGB. */
  mean: null as readonly [number, number, number] | null,
  std: null as readonly [number, number, number] | null,
  logitScale: 100,
} as const;

/** Scene gate (calibrated in T6; docs/TASKS.md → CALIBRATION RECORD). */
export const SCENE_ACCEPT_MIN = 0.55;
