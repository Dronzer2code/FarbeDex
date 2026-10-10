import type { ModelFile } from './manifest';

/** Normalises a user-typed LAN base URL ("192.168.1.23:8099" → "http://192.168.1.23:8099"). */
export function normalizeDevBaseUrl(input: string): string | null {
  const trimmed = input.trim().replace(/\/+$/, '');
  if (!trimmed) return null;
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
  if (!/^https?:\/\/[^\s/]+(:\d+)?(\/[^\s]*)?$/i.test(withScheme)) return null;
  return withScheme;
}

/**
 * The URL a model file is downloaded from. The dev-only LAN model source is honoured ONLY when
 * `isDev` is true (pass `__DEV__`); release builds always use the manifest URL.
 */
export function resolveModelUrl(file: ModelFile, isDev: boolean, devBaseUrl: string | null): string {
  if (!isDev || !devBaseUrl) return file.url;
  const base = normalizeDevBaseUrl(devBaseUrl);
  if (!base) return file.url;
  return `${base}/${encodeURIComponent(file.fileName)}`;
}
