// Field Notes (F12). Cards with verified = false MUST NOT be shown (docs/DEX_SPEC.md → FIELD NOTES SEED).
import notes from '../../assets/field-notes.json';

export interface FieldNote {
  id: string;
  title: string;
  body: string;
  families: string[];
  sourceTitle: string;
  sourceUrl: string;
  verified: boolean;
  verifiedBy?: string;
}

export function verifiedFieldNotes(all: readonly FieldNote[] = notes as FieldNote[]): FieldNote[] {
  return all.filter((n) => n.verified === true);
}

export function fieldNotesForFamily(family: string, all: readonly FieldNote[] = notes as FieldNote[]): FieldNote[] {
  return verifiedFieldNotes(all).filter((n) => n.families.includes(family));
}
