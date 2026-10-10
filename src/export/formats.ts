// Palette export — docs/TRD.md → EXPORT. Pure (unit-tested). Order = Distribution order.
import { contrastGrade, contrastRatio, type ContrastGrade } from '../color/contrast';

export interface ExportSwatch {
  no: number;
  name: string;
  hex: string;
  pct: number;
}

const code = (no: number) => `#${String(no).padStart(3, '0')}`;

export function toCss(sw: readonly ExportSwatch[]): string {
  const lines = sw.flatMap((s, i) => [`  /* ${code(s.no)} ${s.name} · ${s.pct.toFixed(1)}% */`, `  --farbe-${i + 1}: ${s.hex};`]);
  return `:root {\n${lines.join('\n')}\n}\n`;
}

export function toTailwind(sw: readonly ExportSwatch[]): string {
  const lines = sw.map((s, i) => `      ${i + 1}: '${s.hex}', // ${code(s.no)} ${s.name} · ${s.pct.toFixed(1)}%`);
  return `colors: {\n  farbe: {\n${lines.map((l) => l.slice(2)).join('\n')}\n  },\n},\n`;
}

/** W3C design tokens draft format. */
export function toTokens(sw: readonly ExportSwatch[]): string {
  const farbe: Record<string, { $type: 'color'; $value: string; $description: string }> = {};
  sw.forEach((s, i) => {
    farbe[String(i + 1)] = { $type: 'color', $value: s.hex, $description: `${code(s.no)} ${s.name} · ${s.pct.toFixed(1)}%` };
  });
  return `${JSON.stringify({ farbe }, null, 2)}\n`;
}

export interface ContrastPair {
  a: ExportSwatch;
  b: ExportSwatch;
  ratio: number;
  grade: ContrastGrade;
}

export function contrastPairs(sw: readonly ExportSwatch[]): ContrastPair[] {
  const out: ContrastPair[] = [];
  for (let i = 0; i < sw.length; i++)
    for (let j = i + 1; j < sw.length; j++) {
      const ratio = contrastRatio(sw[i].hex, sw[j].hex);
      out.push({ a: sw[i], b: sw[j], ratio, grade: contrastGrade(ratio) });
    }
  return out.sort((p, q) => q.ratio - p.ratio);
}

export function toContrastText(sw: readonly ExportSwatch[]): string {
  return contrastPairs(sw)
    .map((p) => `${p.a.hex} on ${p.b.hex}: ${p.ratio.toFixed(2)}:1 ${p.grade}`)
    .join('\n');
}
