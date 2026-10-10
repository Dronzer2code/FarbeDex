// Laptop-only Referee sanity check: compares our preprocessing with transformers.js and prints scene
// decisions for a folder of images. Usage (after npm run build:labels):
//   npx tsx scripts/dev/referee-check.ts <image-dir> [model.onnx]
import { AutoProcessor, RawImage } from '@huggingface/transformers';
import * as ort from 'onnxruntime-node';
import sharp from 'sharp';
import labels from '../../assets/labels/label-embeddings.json';
import { preprocessToChw, l2Normalize } from '../../src/referee/preprocess';
import { scoreReferee } from '../../src/referee/scoring';

const DIR = process.argv[2];
const files = ['beach.png', 'moraine-lake.png', 'savanna.jpg', 'city-streets.jpg', 'house.jpg', 'butterfly.jpg', 'cats.jpg', 'book-cover.png', 'invoice.png'];
(async () => {
  const proc = await AutoProcessor.from_pretrained('Xenova/mobileclip_s0');
  const sess = await ort.InferenceSession.create(process.argv[3] ?? '.models/mobileclip_s0_vision.onnx');
  for (const f of files) {
    const path = `${DIR}/${f}`;
    // App path: resize shortest side to 256 (like imagePrep), then our preprocess.
    const meta = await sharp(path).metadata();
    const s = 256 / Math.min(meta.width!, meta.height!);
    const { data, info } = await sharp(path).removeAlpha().ensureAlpha().resize(Math.round(meta.width! * s), Math.round(meta.height! * s)).raw().toBuffer({ resolveWithObject: true });
    const ours = preprocessToChw({ width: info.width, height: info.height, data: new Uint8Array(data) }, 256);
    const ref = (await proc(await RawImage.read(path))).pixel_values.data as Float32Array;
    let mse = 0; for (let i = 0; i < ours.length; i++) mse += (ours[i] - ref[i]) ** 2; mse /= ours.length;
    const run = async (x: Float32Array) => l2Normalize((await sess.run({ pixel_values: new ort.Tensor('float32', x, [1, 3, 256, 256]) })).image_embeds.data as Float32Array);
    const a = await run(ours); const b = await run(Float32Array.from(ref));
    let cos = 0; for (let i = 0; i < a.length; i++) cos += a[i] * b[i];
    const r = scoreReferee(a, labels as any);
    console.log(f.padEnd(18), 'mse', mse.toFixed(5), 'cos', cos.toFixed(4), r.scene.accepted ? 'ACCEPT' : 'REJECT', r.scene.label, r.scene.score.toFixed(2), 'outdoor', r.outdoorP.toFixed(2), 'subject', r.subject?.label, r.subject?.score.toFixed(2));
  }
})();
