// Namer prompt + output schema — docs/TRD.md → NAMER → Prompt. Pure (unit-tested).

export interface NewColour {
  no: number;
  hex: string;
  family: string;
  tone: string;
}

export interface NamerRequest {
  subjectLabel: string | null;
  palette: { hex: string; pct: number }[];
  newColours: NewColour[];
  usedNames: string[];
  /** Appended on the retry: why the previous names were rejected. */
  feedback?: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export const SYSTEM_PROMPT =
  "You name colours for a designer's colour collection and give short interface advice. Reply with JSON only.";

const RULES =
  'Rules: for each new colour write "word": one or two evocative words about the subject or the place (for example "Rooftop Morning", "Wet Moss"). ' +
  'Do NOT use colour or brightness words (dark, light, pale, deep, bright, blue, grey, black, white, charcoal...): the app adds the colour name after your words. ' +
  'Title Case, no brand names, no numbers.\n' +
  'Then write "note": one sentence, at most 25 words, on how to use this palette in a user interface.';

export function userMessage(r: NamerRequest): string {
  const lines = [
    `Subject of the photo: ${r.subjectLabel ?? 'outdoor scene'}`,
    `Palette (largest first): ${r.palette.map((p) => `${p.hex} ${p.pct.toFixed(1)}%`).join(', ')}`,
    `New colours to name: ${JSON.stringify(r.newColours)}`,
    `Names already used (do not reuse): ${r.usedNames.slice(0, 40).join(', ') || 'none'}`,
    RULES,
  ];
  if (r.feedback) lines.push(`Your previous answer was rejected: ${r.feedback}. Give new words that follow the rules.`);
  return lines.join('\n');
}

// Two short few-shot examples (moss scene, sunset scene).
const FEW_SHOT: ChatMessage[] = [
  {
    role: 'user',
    content: userMessage({
      subjectLabel: 'moss',
      palette: [
        { hex: '#4E6B2F', pct: 46.2 },
        { hex: '#8A8F86', pct: 31.0 },
        { hex: '#2B3324', pct: 15.4 },
      ],
      newColours: [
        { no: 65, hex: '#4E6B2F', family: 'Green', tone: 'dusty' },
        { no: 4, hex: '#8A8F86', family: 'Neutral', tone: 'neutral' },
      ],
      usedNames: [],
    }),
  },
  {
    role: 'assistant',
    content: JSON.stringify({
      names: [
        { no: 65, word: 'Wet Moss' },
        { no: 4, word: 'Old Wall' },
      ],
      note: 'Use the stone grey as the page background and the moss green for primary buttons and links.',
    }),
  },
  {
    role: 'user',
    content: userMessage({
      subjectLabel: 'sunset sky',
      palette: [
        { hex: '#F29A4A', pct: 38.5 },
        { hex: '#6B5A8E', pct: 33.1 },
        { hex: '#F6D7A7', pct: 20.3 },
      ],
      newColours: [{ no: 40, hex: '#F29A4A', family: 'Orange', tone: 'vivid' }],
      usedNames: ['Wet Moss Green', 'Old Wall Stone'],
    }),
  },
  {
    role: 'assistant',
    content: JSON.stringify({
      names: [{ no: 40, word: 'Late Ember' }],
      note: 'Keep the pale peach for cards, the dusk violet for headings, and the ember orange only for alerts.',
    }),
  },
];

export function buildMessages(r: NamerRequest): ChatMessage[] {
  return [{ role: 'system', content: SYSTEM_PROMPT }, ...FEW_SHOT, { role: 'user', content: userMessage(r) }];
}

/** JSON schema for llama.rn `response_format` (converted to a GBNF grammar natively; VERIFY-4). */
export function buildSchema(nos: number[]): object {
  const names =
    nos.length === 0
      ? { type: 'array', maxItems: 0, items: { type: 'object' } }
      : {
          type: 'array',
          minItems: nos.length,
          maxItems: nos.length,
          items: {
            type: 'object',
            properties: {
              no: { type: 'integer', enum: nos },
              word: { type: 'string', minLength: 3, maxLength: 18 },
            },
            required: ['no', 'word'],
          },
        };
  return {
    type: 'object',
    properties: { names, note: { type: 'string', minLength: 10, maxLength: 220 } },
    required: ['names', 'note'],
  };
}

export interface NamerJson {
  names: { no: number; word?: string; name?: string }[];
  note: string;
}

export function parseNamerJson(text: string): NamerJson | null {
  try {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start < 0 || end < start) return null;
    const j = JSON.parse(text.slice(start, end + 1));
    if (!j || !Array.isArray(j.names)) return null;
    return { names: j.names.filter((n: unknown) => n && typeof n === 'object'), note: typeof j.note === 'string' ? j.note : '' };
  } catch {
    return null;
  }
}
