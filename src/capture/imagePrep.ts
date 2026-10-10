// Image preparation — docs/TRD.md → CATCH PIPELINE step 2; docs/DEX_SPEC.md step 1.
// Writes catches/<id>.jpg (≤ 4096 px, JPEG 0.92) and thumbs/<id>.jpg (480 px), and decodes two analysis
// images: 160 px longest side (extraction) and 256 px shortest side (Referee).
import { Directory, File, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { decode as decodeJpeg } from 'jpeg-js';

import type { RgbaImage } from '../referee/preprocess';

export function catchesDir(): Directory {
  return new Directory(Paths.document, 'catches');
}
export function thumbsDir(): Directory {
  return new Directory(Paths.document, 'thumbs');
}

function ensureDir(d: Directory) {
  if (!d.exists) d.create({ intermediates: true, idempotent: true });
}

/** Resize so that the longest (or shortest) side equals `target` (never upscales). */
function resizeSpec(w: number, h: number, target: number, side: 'longest' | 'shortest') {
  const ref = side === 'longest' ? Math.max(w, h) : Math.min(w, h);
  if (ref <= target) return null;
  const scale = target / ref;
  return { width: Math.round(w * scale), height: Math.round(h * scale) };
}

async function renderJpeg(uri: string, w: number, h: number, target: number, side: 'longest' | 'shortest', compress: number) {
  const ctx = ImageManipulator.manipulate(uri);
  const spec = resizeSpec(w, h, target, side);
  if (spec) ctx.resize(spec);
  const img = await ctx.renderAsync();
  const saved = await img.saveAsync({ format: SaveFormat.JPEG, compress });
  return saved; // { uri, width, height } in the cache directory
}

async function decodeFile(uri: string): Promise<RgbaImage> {
  const f = new File(uri);
  const bytes = await f.bytes();
  f.delete();
  const img = decodeJpeg(bytes, { useTArray: true, formatAsRGBA: true });
  return { width: img.width, height: img.height, data: img.data };
}

export interface PreparedImages {
  photoPath: string; // file:// URI in app-private storage
  thumbPath: string;
  width: number;
  height: number;
  analysis160: RgbaImage;
  referee256: RgbaImage;
}

export async function prepareImages(id: string, photoUri: string, width: number, height: number): Promise<PreparedImages> {
  ensureDir(catchesDir());
  ensureDir(thumbsDir());

  // Keep up to 4096 px at high quality (max-capability capture); analysis images stay small.
  const full = await renderJpeg(photoUri, width, height, 4096, 'longest', 0.92);
  const photo = new File(catchesDir(), `${id}.jpg`);
  await new File(full.uri).move(photo);

  const thumb = await renderJpeg(photo.uri, full.width, full.height, 480, 'longest', 0.8);
  const thumbFile = new File(thumbsDir(), `${id}.jpg`);
  await new File(thumb.uri).move(thumbFile);

  const [a160, r256] = await Promise.all([
    renderJpeg(photo.uri, full.width, full.height, 160, 'longest', 0.9).then((s) => decodeFile(s.uri)),
    renderJpeg(photo.uri, full.width, full.height, 256, 'shortest', 0.9).then((s) => decodeFile(s.uri)),
  ]);

  return {
    photoPath: photo.uri,
    thumbPath: thumbFile.uri,
    width: full.width,
    height: full.height,
    analysis160: a160,
    referee256: r256,
  };
}

/** Deletes every file written for a capture (rejections, errors, cancellation). */
export function deleteCaptureFiles(id: string, extraUris: (string | undefined)[] = []): void {
  const files = [new File(catchesDir(), `${id}.jpg`), new File(thumbsDir(), `${id}.jpg`), ...extraUris.filter(Boolean).map((u) => new File(u!))];
  for (const f of files) {
    try {
      if (f.exists) f.delete();
    } catch {
      // best effort
    }
  }
}

export function deleteFileUri(uri: string): void {
  try {
    const f = new File(uri);
    if (f.exists) f.delete();
  } catch {
    // best effort
  }
}
