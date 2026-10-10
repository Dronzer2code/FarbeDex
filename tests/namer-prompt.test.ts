import { buildMessages, buildSchema, parseNamerJson, userMessage } from '../src/namer/prompt';
import { entryCoords, toneFor } from '../src/dex/rules';

const req = {
  subjectLabel: 'moss',
  palette: [{ hex: '#5F7A3A', pct: 42 }, { hex: '#5A4632', pct: 30.5 }],
  newColours: [{ no: 67, hex: '#5F7A3A', family: 'Green', tone: 'dusty' }],
  usedNames: ['Old Gate Bark'],
};

describe('namer prompt', () => {
  it('follows the TRD user-message format', () => {
    const m = userMessage(req);
    expect(m).toContain('Subject of the photo: moss');
    expect(m).toContain('Palette (largest first): #5F7A3A 42.0%, #5A4632 30.5%');
    expect(m).toContain('New colours to name: [{"no":67');
    expect(m).toContain('Names already used (do not reuse): Old Gate Bark');
    expect(m).toContain('at most 25 words');
    expect(userMessage({ ...req, feedback: '#67: 1-3 words' })).toContain('rejected: #67: 1-3 words');
  });

  it('system + two few-shot pairs + request', () => {
    const msgs = buildMessages(req);
    expect(msgs.map((x) => x.role)).toEqual(['system', 'user', 'assistant', 'user', 'assistant', 'user']);
    // Few-shot answers are valid JSON with consistent entry numbers/tones.
    for (const a of msgs.filter((x) => x.role === 'assistant')) expect(parseNamerJson(a.content)).not.toBeNull();
    expect(toneFor(65)).toBe('dusty');
    expect(entryCoords(65).family).toBe('Green');
    expect(toneFor(40)).toBe('vivid');
    expect(entryCoords(40).family).toBe('Orange');
  });

  it('schema pins the requested entry numbers', () => {
    const s = buildSchema([67, 4]) as { properties: { names: { minItems: number; items: { properties: { no: { enum: number[] } } } } } };
    expect(s.properties.names.minItems).toBe(2);
    expect(s.properties.names.items.properties.no.enum).toEqual([67, 4]);
    expect((buildSchema([]) as { properties: { names: { maxItems: number } } }).properties.names.maxItems).toBe(0);
  });

  it('parses JSON with surrounding text and rejects garbage', () => {
    expect(parseNamerJson('```json\n{"names":[{"no":67,"name":"Moss"}],"note":"x"}\n```')?.names[0].no).toBe(67);
    expect(parseNamerJson('nope')).toBeNull();
  });
});
