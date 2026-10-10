// AC-G.1: forbidden franchise terms (CLAUDE.md → HARD RULES) are absent from every tracked or new file,
// except the spec documents and this test. Terms are assembled from parts so this file stays clean too.
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const root = path.resolve(__dirname, '..');
const P = 'pok' + 'e';
// Matched case-insensitively on accent-stripped text, with optional space/hyphen ("… ball", "…-dex").
const PATTERNS = [new RegExp(`${P}[\\s-]?(mon|dex|ball)`, 'i'), new RegExp('got' + 'ta\\s+catch', 'i')];

const EXCLUDED = (f: string) =>
  f === 'CLAUDE.md' ||
  f === 'AGENT.md' ||
  f === 'BUILD_PROMPTS.md' ||
  f.startsWith('docs/') ||
  f === 'tests/no-franchise-terms.test.ts' ||
  f === 'package-lock.json';

function stripAccents(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

describe('no franchise terms', () => {
  const files = execSync('git ls-files --cached --others --exclude-standard', { cwd: root })
    .toString()
    .split('\n')
    .filter(Boolean)
    .filter((f) => !EXCLUDED(f))
    .filter((f) => fs.existsSync(path.join(root, f)));

  it('scans at least the app sources', () => {
    expect(files.some((f) => f.startsWith('app/'))).toBe(true);
  });

  it.each(files)('%s is clean', (f) => {
    const buf = fs.readFileSync(path.join(root, f));
    const nameHit = PATTERNS.some((re) => re.test(stripAccents(f)));
    if (buf.includes(0)) {
      expect(nameHit).toBe(false); // binary: check the filename only
      return;
    }
    const text = stripAccents(buf.toString('utf8'));
    const hits = PATTERNS.filter((re) => re.test(text)).map(String);
    expect({ nameHit, hits }).toEqual({ nameHit: false, hits: [] });
  });
});
