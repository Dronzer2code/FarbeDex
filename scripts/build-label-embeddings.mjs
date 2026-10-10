// npm run build:labels → assets/labels/label-embeddings.json (laptop only; docs/TRD.md → REFEREE).
// Uses the SAME model's text encoder as the on-phone image encoder. Each label vector is the
// L2-normalised mean of its prompts' embeddings (`vec`); per-prompt vectors are kept in `vecs` and the app
// scores a label by its best-matching prompt. The phone never loads a text encoder.
import { AutoTokenizer, CLIPModel, CLIPTextModelWithProjection, Tensor } from '@huggingface/transformers';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Presets (src/referee/config.ts → ACTIVE_REFEREE):
//   MobileCLIP-S0: default (separate text model; logit_scale 100 per the model card example)
//   TinyCLIP-8M:   REFEREE_TEXT_MODEL=onnx-community/TinyCLIP-ViT-8M-16-Text-3M-YFCC15M-ONNX REFEREE_COMBINED=1 REFEREE_INPUT=224
//                  (combined graph; logit_scale is read from the model's own logits)
const MODEL_ID = process.env.REFEREE_TEXT_MODEL ?? 'Xenova/mobileclip_s0';
const COMBINED = process.env.REFEREE_COMBINED === '1';
const INPUT = Number(process.env.REFEREE_INPUT ?? 256);
let LOGIT_SCALE = Number(process.env.REFEREE_LOGIT_SCALE ?? 100);

const SCENE = [
  {
    id: 'OUTDOOR_NATURE',
    prompts: [
      'a photo of plants outdoors', 'a photo of the sky outside', 'a photo taken outdoors in nature',
      'a photo of trees and grass', 'a photo of a landscape', 'a photo of flowers in a garden', 'a photo of a beach or a lake',
      'a close-up photo of moss on a stone outside', 'a close-up photo of a leaf outdoors', 'a close-up photo of tree bark', 'a macro photo of an insect on a flower',
    ],
  },
  {
    id: 'OUTDOOR_URBAN',
    prompts: ['a photo of an outdoor street', 'a photo of a building exterior', 'a photo of a wall outside', 'a photo of a city park', 'a photo of a fence and a sidewalk'],
  },
  { id: 'INDOOR', prompts: ['a photo of a room indoors', 'a photo of furniture inside a house', 'a photo of an office interior', 'a photo of a kitchen'] },
  {
    id: 'SCREEN',
    prompts: [
      'a photo of a computer monitor', 'a photo of a phone screen', 'a photo of a TV screen showing a picture',
      'a photo of a laptop screen on a desk', 'a close-up photo of a screen with visible pixels', 'a photo of a smartphone held in a hand showing a picture',
    ],
  },
  {
    id: 'PRINT',
    prompts: ['a photo of a printed photograph', 'a photo of a poster on a wall', 'a photo of a book page', 'a photo of a magazine held in a hand', 'a photo of a postcard on a table'],
  },
];

const SUBJECTS = [
  'sky', 'clouds', 'sunset sky', 'tree leaves', 'autumn leaves', 'grass', 'fern', 'moss', 'lichen', 'tree bark',
  'flower', 'fruit', 'soil', 'rock', 'sand', 'water', 'wood', 'rusty metal', 'brick wall', 'painted wall',
].map((label) => ({ id: label, prompts: [`a close-up photo of ${label}`] }));

function l2(v) {
  const n = Math.hypot(...v) || 1;
  return v.map((x) => x / n);
}

const tokenizer = await AutoTokenizer.from_pretrained(MODEL_ID);
const model = COMBINED
  ? await CLIPModel.from_pretrained(MODEL_ID, { dtype: 'fp32' })
  : await CLIPTextModelWithProjection.from_pretrained(MODEL_ID, { dtype: 'fp32' });
const dummyPixels = new Tensor('float32', new Float32Array(3 * INPUT * INPUT).fill(0.5), [1, 3, INPUT, INPUT]);

async function textEmbeds(prompts) {
  const inputs = tokenizer(prompts, { padding: COMBINED ? true : 'max_length', truncation: true });
  if (!COMBINED) return (await model(inputs)).text_embeds;
  const out = await model({ ...inputs, pixel_values: dummyPixels });
  // logits_per_text = logit_scale · cos(text, image) → recover the learned scale once.
  const d = out.text_embeds.dims[1];
  const t = l2(Array.from(out.text_embeds.data.slice(0, d)));
  const im = l2(Array.from(out.image_embeds.data.slice(0, d)));
  const cos = t.reduce((s, x, i) => s + x * im[i], 0);
  LOGIT_SCALE = Number((out.logits_per_text.data[0] / cos).toFixed(4));
  return out.text_embeds;
}

async function embed(prompts) {
  const text_embeds = await textEmbeds(prompts);
  const dims = text_embeds.dims[1];
  const rows = [];
  for (let i = 0; i < prompts.length; i++) rows.push(l2(Array.from(text_embeds.data.slice(i * dims, (i + 1) * dims))));
  const mean = rows[0].map((_, j) => rows.reduce((s, r) => s + r[j], 0) / rows.length);
  const round = (v) => v.map((x) => Number(x.toFixed(5)));
  return { vec: round(l2(mean)), vecs: rows.map(round) };
}

async function group(labels) {
  const out = [];
  for (const l of labels) out.push({ id: l.id, prompts: l.prompts, ...(await embed(l.prompts)) });
  return out;
}

const scene = await group(SCENE);
const subject = await group(SUBJECTS);
const json = { model: MODEL_ID, dims: scene[0].vec.length, logitScale: LOGIT_SCALE, scene, subject };


const out = process.env.LABELS_OUT ?? join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'labels', 'label-embeddings.json');
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(json));
console.log(`Wrote ${scene.length} scene + ${subject.length} subject labels (${json.dims} dims, logitScale ${LOGIT_SCALE}, model ${MODEL_ID}) to ${out}`);
