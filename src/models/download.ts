// Model download — docs/TRD.md → MODEL DELIVERY, VERIFY-6.
// Android DownloadTask: resumeData is the byte offset of the partial file; a failed transfer keeps the
// partial `.part` file, so a retry resumes with an HTTP Range request (server 200 → full restart).
import { Directory, DownloadTask, File, Paths } from 'expo-file-system';
import { getInfoAsync } from 'expo-file-system/legacy';

import type { ModelFile } from './manifest';

export type DownloadPhase = 'downloading' | 'verifying';

export interface DownloadProgressInfo {
  phase: DownloadPhase;
  bytesWritten: number;
  totalBytes: number;
}

export class ModelVerifyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ModelVerifyError';
  }
}

export class DownloadPausedError extends Error {
  constructor() {
    super('Download paused');
    this.name = 'DownloadPausedError';
  }
}

export function modelsDir(): Directory {
  return new Directory(Paths.document, 'models');
}

export function modelFileOnDisk(m: ModelFile): File {
  return new File(modelsDir(), m.fileName);
}

function partFile(m: ModelFile): File {
  return new File(modelsDir(), `${m.fileName}.part`);
}

/** Plain filesystem path (no `file://`), as required by onnxruntime-react-native. */
export function toFsPath(uri: string): string {
  return decodeURI(uri.replace(/^file:\/\//, ''));
}

/**
 * Downloads one model file from `url` into `models/<fileName>.part`, verifies size + md5, then
 * renames it. Resumes from an existing `.part` file. Throws ModelVerifyError on mismatch (the
 * partial file is deleted so the next attempt restarts).
 */
export async function downloadModel(
  m: ModelFile,
  url: string,
  onProgress?: (p: DownloadProgressInfo) => void,
  signal?: AbortSignal,
): Promise<void> {
  const dir = modelsDir();
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });

  const part = partFile(m);
  let offset = part.exists ? (part.size ?? 0) : 0;
  if (offset > m.bytes) {
    part.delete();
    offset = 0;
  }

  if (offset < m.bytes) {
    const options = {
      signal,
      onProgress: (d: { bytesWritten: number }) =>
        onProgress?.({ phase: 'downloading', bytesWritten: d.bytesWritten, totalBytes: m.bytes }),
    };
    onProgress?.({ phase: 'downloading', bytesWritten: offset, totalBytes: m.bytes });
    let result: File | null;
    if (offset > 0) {
      const task = DownloadTask.fromSavable(
        { url, fileUri: part.uri, isDirectory: false, resumeData: String(offset) },
        options,
      );
      result = await task.resumeAsync();
    } else {
      const task = File.createDownloadTask(url, part, options);
      result = await task.downloadAsync();
    }
    if (result === null) throw new DownloadPausedError();
  }

  onProgress?.({ phase: 'verifying', bytesWritten: m.bytes, totalBytes: m.bytes });
  const checked = new File(part.uri);
  const size = checked.size ?? 0;
  if (size !== m.bytes) {
    checked.delete();
    throw new ModelVerifyError(`${m.fileName}: expected ${m.bytes} bytes, got ${size}`);
  }
  // Async native md5 (the new File API's md5 is synchronous and would block the JS thread for ~250 MB).
  const info = await getInfoAsync(checked.uri, { md5: true });
  const md5 = info.exists ? info.md5 : undefined;
  if (md5?.toLowerCase() !== m.md5.toLowerCase()) {
    checked.delete();
    throw new ModelVerifyError(`${m.fileName}: md5 mismatch (${md5 ?? 'none'})`);
  }

  const final = modelFileOnDisk(m);
  if (final.exists) final.delete();
  await checked.move(final);
}

export function deleteModel(m: ModelFile): void {
  for (const f of [modelFileOnDisk(m), partFile(m)]) {
    if (f.exists) f.delete();
  }
}
