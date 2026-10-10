import { MODEL_FILES, TOTAL_MODEL_BYTES } from '../src/models/manifest';
import { normalizeDevBaseUrl, resolveModelUrl } from '../src/models/resolveUrl';

const namer = MODEL_FILES.find((m) => m.id === 'namer')!;

describe('model URL resolution', () => {
  it('release builds always use the manifest URL, even if a dev URL is stored', () => {
    expect(resolveModelUrl(namer, false, 'http://192.168.1.23:8099')).toBe(namer.url);
  });

  it('dev builds use the LAN source when set', () => {
    expect(resolveModelUrl(namer, true, 'http://192.168.1.23:8099/')).toBe(
      'http://192.168.1.23:8099/gemma-3-270m-it-Q4_K_M.gguf',
    );
  });

  it('dev builds fall back to the manifest URL when unset or invalid', () => {
    expect(resolveModelUrl(namer, true, null)).toBe(namer.url);
    expect(resolveModelUrl(namer, true, 'not a url')).toBe(namer.url);
  });

  it('normalises typed base URLs', () => {
    expect(normalizeDevBaseUrl('192.168.1.23:8099')).toBe('http://192.168.1.23:8099');
    expect(normalizeDevBaseUrl('  http://10.0.0.5:8099//  ')).toBe('http://10.0.0.5:8099');
    expect(normalizeDevBaseUrl('')).toBeNull();
  });

  it('manifest pins sizes and md5 within the 300 MB budget', () => {
    for (const m of MODEL_FILES) {
      expect(m.md5).toMatch(/^[0-9a-f]{32}$/);
      expect(m.bytes).toBeGreaterThan(0);
      expect(m.url.startsWith('https://')).toBe(true);
    }
    expect(TOTAL_MODEL_BYTES).toBeLessThanOrEqual(300 * 1024 * 1024);
  });
});
