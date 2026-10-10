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
      'a photo of potted plants on a balcony', 'a close-up photo of a plant in a pot', 'a photo of a flower pot', 'a photo of a rooftop garden',
    ],
  },
  {
    id: 'OUTDOOR_URBAN',
    prompts: [
      'a photo of an outdoor street', 'a photo of a building exterior', 'a photo of a wall outside', 'a photo of a city park', 'a photo of a fence and a sidewalk',
      'a photo taken from a balcony', 'a photo of a rooftop terrace', 'a photo of the view from a roof', 'a photo of houses in a neighbourhood',
    ],
  },
  {
    // Only clear home interiors count as INDOOR (team decision 2026-10-10: be lenient).
    id: 'INDOOR',
    prompts: [
      'a photo of a bed in a bedroom', 'a photo of a kitchen with appliances', 'a photo of a refrigerator',
      'a photo of a washing machine', 'a photo of a microwave oven', 'a photo of a sofa in a living room', 'a photo of a bathroom sink',
    ],
  },
  {
    id: 'SCREEN',
    prompts: [
      'a photo of a computer monitor', 'a photo of a phone screen', 'a photo of a TV screen showing a picture',
      'a photo of a laptop screen on a desk', 'a close-up photo of a screen with visible pixels', 'a photo of a smartphone held in a hand showing a picture',
    ],
  },
  {
    // Kept as a label so prints do not pull towards OUTDOOR, but never a rejection reason.
    id: 'PRINT',
    prompts: ['a photo of a printed photograph', 'a photo of a poster on a wall', 'a photo of a book page', 'a photo of a magazine held in a hand'],
  },
];

// Several prompts per subject (team report 2026-10-10: a sky photo was labelled "fern" with one prompt each).
const SUBJECTS = Object.entries({
  sky: ['a photo of the blue sky', 'a photo of a clear sky', 'a wide photo of the sky above buildings', 'a photo looking up at the sky'],
  clouds: ['a photo of white clouds in the sky', 'a photo of a cloudy sky', 'a photo of grey clouds'],
  'sunset sky': ['a photo of a sunset sky', 'a photo of an orange and pink sky at dusk', 'a photo of the sky at sunrise'],
  'tree leaves': ['a close-up photo of green tree leaves', 'a photo of a tree canopy', 'a photo of leaves on a branch'],
  'autumn leaves': ['a photo of autumn leaves', 'a photo of red and orange leaves', 'a photo of fallen yellow leaves'],
  grass: ['a photo of green grass', 'a close-up photo of a lawn', 'a photo of a grassy field'],
  fern: ['a close-up photo of fern fronds', 'a photo of a fern plant'],
  moss: ['a close-up photo of green moss', 'a photo of moss on a stone'],
  lichen: ['a close-up photo of lichen on a rock', 'a photo of lichen on tree bark'],
  'tree bark': ['a close-up photo of tree bark', 'a photo of a tree trunk'],
  flower: ['a close-up photo of a flower', 'a photo of colourful flowers', 'a photo of a blooming plant'],
  'potted plant': ['a photo of a potted plant', 'a photo of plants in pots on a balcony', 'a photo of a flower pot'],
  fruit: ['a close-up photo of fruit', 'a photo of berries on a bush'],
  soil: ['a close-up photo of soil', 'a photo of dirt on the ground'],
  rock: ['a close-up photo of a rock', 'a photo of stones'],
  sand: ['a close-up photo of sand', 'a photo of a sandy beach'],
  water: ['a photo of water', 'a photo of a lake or the sea', 'a photo of a river'],
  wood: ['a close-up photo of wooden planks', 'a photo of a wooden fence'],
  'rusty metal': ['a close-up photo of rusty metal', 'a photo of a rusty gate'],
  'brick wall': ['a photo of a brick wall', 'a close-up photo of red bricks'],
  'painted wall': ['a photo of a painted wall', 'a photo of a building facade', 'a photo of a concrete wall'],
}).map(([id, prompts]) => ({ id, prompts }));

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
