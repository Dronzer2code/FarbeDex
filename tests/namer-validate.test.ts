import { findBlocked } from '../src/namer/blocklist';
import { composeName, toTitleCase, validateName, validateNote } from '../src/namer/validate';

const opts = { usedNames: ['Moss Velvet'], templateName: 'Dusty Green' };

describe('namer validation', () => {
  it('accepts and title-cases good names', () => {
    expect(validateName('wet moss stone', opts)).toEqual({ ok: true, name: 'Wet Moss Stone' });
    expect(validateName("Robin's Egg", opts)).toEqual({ ok: true, name: "Robin's Egg" });
    expect(validateName('rust-red gate', opts)).toEqual({ ok: true, name: 'Rust-Red Gate' });
  });

  it('enforces length, words and characters', () => {
    expect(validateName('Ab', opts)).toMatchObject({ ok: false, reason: 'LENGTH' });
    expect(validateName('A Very Long Evocative Colour Name', opts)).toMatchObject({ ok: false });
    expect(validateName('Moss 42', opts)).toMatchObject({ ok: false, reason: 'FORMAT' });
    expect(validateName('One Two Three Four', opts)).toMatchObject({ ok: false, reason: 'WORDS' });
    expect(validateName(12, opts)).toMatchObject({ ok: false, reason: 'FORMAT' });
  });

  it('rejects duplicates (case-insensitive), template names and blocked words', () => {
    expect(validateName('moss velvet', opts)).toMatchObject({ ok: false, reason: 'DUPLICATE' });
    expect(validateName('Dusty Green', opts)).toMatchObject({ ok: false, reason: 'TEMPLATE' });
    expect(validateName('Pantone Moss', opts)).toMatchObject({ ok: false, reason: 'BLOCKED' });
    expect(validateName('Damn Moss', opts)).toMatchObject({ ok: false, reason: 'BLOCKED' });
  });

  it('blocks franchise terms with or without accents and spaces', () => {
    const P = 'Pok' + 'é';
    expect(findBlocked(`${P}mon Green`)).not.toBeNull();
    expect(findBlocked(`${P} Ball Red`)).not.toBeNull();
    expect(findBlocked('Grass Lass')).toBeNull(); // "ass" only as a whole word
  });

  it('validates design notes', () => {
    expect(validateNote('Use the moss green as the page background and the rust as a sparing accent for buttons.')).toBeTruthy();
    expect(validateNote('Too short')).toBeNull();
    expect(validateNote('Moss is green because chlorophyll absorbs red light, so use it as background.')).toBeNull();
    expect(validateNote(Array(30).fill('word').join(' '))).toBeNull();
    expect(validateNote('Use the sky blue for links and the bark brown for body text')).toMatch(/\.$/);
  });

  it('toTitleCase collapses spaces', () => {
    expect(toTitleCase('  pale   SKY ')).toBe('Pale Sky');
  });
});

describe('composeName (Gemma words + true colour word)', () => {
  const o = { usedNames: ['Moss Velvet'], templateName: 'Vivid Pale Blue' };
  it('appends the Entry colour word', () => {
    expect(composeName('rooftop morning', 'Blue', o)).toEqual({ ok: true, name: 'Rooftop Morning Blue' });
    expect(composeName('Old Wall', 'Stone', o)).toEqual({ ok: true, name: 'Old Wall Stone' });
  });
  it('rejects colour/brightness words so a blue can never be "Dark Charcoal"', () => {
    expect(composeName('Dark Charcoal', 'Blue', o)).toMatchObject({ ok: false, reason: 'COLOUR_WORD' });
    expect(composeName('Pale Sky', 'Blue', o)).toMatchObject({ ok: false, reason: 'COLOUR_WORD' });
    expect(composeName('Grey-Green', 'Blue', o)).toMatchObject({ ok: false, reason: 'COLOUR_WORD' });
  });
  it('limits to two words and checks the composed name', () => {
    expect(composeName('One Two Three', 'Blue', o)).toMatchObject({ ok: false, reason: 'WORDS' });
    expect(composeName('', 'Blue', o)).toMatchObject({ ok: false, reason: 'FORMAT' });
    expect(composeName('Moss', 'Velvet', o)).toMatchObject({ ok: false, reason: 'DUPLICATE' });
  });
});
