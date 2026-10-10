// Palette image export: share sheet, or save into a user-picked folder via Android's Storage Access Framework.
// No media-library / gallery access (camera-only rule): the user chooses a folder (e.g. Downloads) once.
import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type Svg from 'react-native-svg';

import { getSetting, setSetting } from '../db/settingsRepo';
import { CARD_EXPORT } from '../ui/PaletteCard';

const EXPORT_DIR_KEY = 'export_dir_uri';

/** Renders the card SVG to base64 PNG at export size. */
export function svgToPngBase64(svg: Svg | null): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!svg) return reject(new Error('Card not ready'));
    try {
      svg.toDataURL((b64) => (b64 ? resolve(b64.replace(/^data:image\/png;base64,/, '')) : reject(new Error('Empty image'))), CARD_EXPORT);
    } catch (e) {
      reject(e);
    }
  });
}

export function paletteFileName(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `farbedex-palette-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}.png`;
}

export async function sharePng(base64: string): Promise<void> {
  const f = new File(Paths.cache, paletteFileName());
  if (f.exists) f.delete();
  f.create();
  f.write(base64, { encoding: 'base64' });
  if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(f.uri, { mimeType: 'image/png', dialogTitle: 'Share palette' });
}

/** Saves into the remembered folder; asks for a folder the first time (or if access was lost). */
export async function savePngToDevice(base64: string): Promise<string> {
  const name = paletteFileName();
  const write = (dir: Directory) => {
    const f = dir.createFile(name, 'image/png');
    f.write(base64, { encoding: 'base64' });
    return f;
  };
  const saved = await getSetting(EXPORT_DIR_KEY);
  if (saved) {
    try {
      write(new Directory(saved));
      return name;
    } catch {
      // folder gone or permission revoked → ask again
    }
  }
  const dir = await Directory.pickDirectoryAsync();
  write(dir);
  await setSetting(EXPORT_DIR_KEY, dir.uri);
  return name;
}
