import { todaysHunt } from '../src/dex/todaysHunt';

describe("today's hunt", () => {
  const missing = Array.from({ length: 151 }, (_, i) => i + 1);
  it('is deterministic per day and picks a missing entry', () => {
    const a = todaysHunt(missing, new Date(2026, 9, 10, 9));
    const b = todaysHunt(missing, new Date(2026, 9, 10, 22));
    expect(a).toBe(b);
    expect(missing).toContain(a);
  });
  it('changes across days (usually) and handles none missing', () => {
    const picks = new Set(Array.from({ length: 10 }, (_, d) => todaysHunt(missing, new Date(2026, 9, 1 + d))));
    expect(picks.size).toBeGreaterThan(3);
    expect(todaysHunt([], new Date())).toBeNull();
    expect(todaysHunt([42], new Date())).toBe(42);
  });
});
