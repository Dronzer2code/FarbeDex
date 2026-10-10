// Deterministic "random" face traits per Entry (team request 2026-10-10: cozy faces on the Specimens).
// Pure (unit-tested). Same Entry number → same face everywhere.
import { mulberry32 } from '../color/prng';

export type FaceAge = 'baby' | 'kid' | 'adult' | 'elder';
export type FaceGender = 'feminine' | 'masculine' | 'neutral';
export type FaceEyes = 'shiny' | 'happy' | 'round';
export type FaceMouth = 'smile' | 'open' | 'tiny' | 'cat';
export type FaceExtra = 'bow' | 'bun' | 'lashes' | 'brows' | 'moustache' | 'sprout' | 'none';

export interface FaceTraits {
  age: FaceAge;
  gender: FaceGender;
  eyes: FaceEyes;
  mouth: FaceMouth;
  extra: FaceExtra;
  blush: boolean;
  /** Small horizontal offset (−3..3 viewBox units) so faces don't all look identical. */
  tilt: number;
}

const AGES: FaceAge[] = ['baby', 'kid', 'adult', 'elder'];
const GENDERS: FaceGender[] = ['feminine', 'masculine', 'neutral'];

function pick<T>(rand: () => number, list: readonly T[]): T {
  return list[Math.floor(rand() * list.length) % list.length];
}

export function faceTraits(no: number): FaceTraits {
  const rand = mulberry32((no * 2654435761) ^ 0xface);
  const age = pick(rand, AGES);
  const gender = pick(rand, GENDERS);
  // Eyes always have a highlight or an arc (never bare dots) so faces stay distinctive and original.
  const eyes: FaceEyes = age === 'baby' ? 'shiny' : age === 'elder' ? 'happy' : pick(rand, ['shiny', 'happy', 'round'] as const);
  const mouth: FaceMouth = age === 'baby' ? 'tiny' : pick(rand, ['smile', 'open', 'cat'] as const);
  let extra: FaceExtra;
  if (gender === 'feminine') extra = pick(rand, ['bow', 'bun', 'lashes'] as const);
  else if (gender === 'masculine') extra = age === 'adult' || age === 'elder' ? pick(rand, ['moustache', 'brows'] as const) : 'brows';
  else extra = pick(rand, ['sprout', 'none'] as const);
  const blush = age !== 'elder' || rand() < 0.5;
  const tilt = Math.round((rand() - 0.5) * 6);
  return { age, gender, eyes, mouth, extra, blush, tilt };
}
