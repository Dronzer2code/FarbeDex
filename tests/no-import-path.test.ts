// AC-F2.1: the app has no way to import images (docs/TRD.md → TESTING, CLAUDE.md → HARD RULES).
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const root = path.resolve(__dirname, '..');
const FORBIDDEN_PACKAGES = ['expo-image-picker', 'expo-media-library', 'expo-document-picker', 'expo-location'];

function readJson(file: string) {
  return JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
}

describe('no import path', () => {
  it('package.json contains no image-import packages', () => {
    const pkg = readJson('package.json');
    const deps = { ...pkg.dependencies, ...pkg.devDependencies, ...pkg.optionalDependencies };
    for (const name of FORBIDDEN_PACKAGES) {
      expect(Object.keys(deps)).not.toContain(name);
    }
  });

  it('app.json declares no image/* intent filter and no media/storage permissions', () => {
    const { expo } = readJson('app.json');
    const filters = JSON.stringify(expo.android?.intentFilters ?? []);
    expect(filters).not.toMatch(/image\//i);
    expect(filters).not.toMatch(/SEND/);
    const perms: string[] = expo.android?.permissions ?? [];
    expect(perms.filter((p) => !/CAMERA$/.test(p))).toEqual([]);
    expect(expo.platforms).toEqual(['android']);
  });

  it('no source file imports a forbidden package', () => {
    const files = execSync('git ls-files --cached --others --exclude-standard -- app src', { cwd: root })
      .toString()
      .split('\n')
      .filter((f) => /\.(ts|tsx|js|jsx)$/.test(f));
    for (const f of files) {
      const text = fs.readFileSync(path.join(root, f), 'utf8');
      for (const name of FORBIDDEN_PACKAGES) {
        expect({ file: f, imports: text.includes(`'${name}`) || text.includes(`"${name}`) }).toEqual({ file: f, imports: false });
      }
    }
  });
});
