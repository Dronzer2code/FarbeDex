import { faceTraits } from '../src/ui/faceTraits';

describe('specimen faces', () => {
  it('are deterministic per Entry', () => {
    for (const no of [1, 67, 115, 151]) expect(faceTraits(no)).toEqual(faceTraits(no));
  });

  it('vary across the 151 Entries (ages, genders, mouths)', () => {
    const all = Array.from({ length: 151 }, (_, i) => faceTraits(i + 1));
    expect(new Set(all.map((t) => t.age)).size).toBe(4);
    expect(new Set(all.map((t) => t.gender)).size).toBe(3);
    expect(new Set(all.map((t) => t.mouth)).size).toBeGreaterThanOrEqual(3);
    all.forEach((t) => expect(Math.abs(t.tilt)).toBeLessThanOrEqual(3));
  });

  it('follow the age/gender rules', () => {
    const all = Array.from({ length: 151 }, (_, i) => faceTraits(i + 1));
    all.filter((t) => t.age === 'baby').forEach((t) => expect([t.eyes, t.mouth]).toEqual(['shiny', 'tiny']));
    all.filter((t) => t.age === 'elder').forEach((t) => expect(t.eyes).toBe('happy'));
    all.filter((t) => t.gender === 'feminine').forEach((t) => expect(['bow', 'bun', 'lashes']).toContain(t.extra));
    all.filter((t) => t.extra === 'moustache').forEach((t) => expect(['adult', 'elder']).toContain(t.age));
  });
});
