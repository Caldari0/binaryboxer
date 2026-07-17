// ============================================================
// Binary Boxer — Language growth leans (new model)
// Each language contributes a SMALL identity lean: +2 to a primary
// stat, +1 to a secondary (spec §3: "a small growth lean"). Every
// language totals exactly 3 points, so every language pair sums to
// the same overall stat budget — the v1 Python-dominance critical
// is structurally impossible, enforced by a fairness test.
// The old data/languages.ts (flat per-level bonuses) is legacy donor
// content serving the old routes until the Gate 1 cutover.
// ============================================================

import type { LanguageId } from '../../shared/contracts';
import type { StatKey } from '../../shared/contracts';

export type LanguageLean = {
  primary: StatKey;
  secondary: StatKey;
};

export const LANGUAGE_LEANS: Record<LanguageId, LanguageLean> = {
  rust: { primary: 'chin', secondary: 'power' },
  javascript: { primary: 'speed', secondary: 'technique' },
  python: { primary: 'stamina', secondary: 'technique' },
  cpp: { primary: 'power', secondary: 'speed' },
  css: { primary: 'technique', secondary: 'chin' },
  go: { primary: 'stamina', secondary: 'speed' },
  typescript: { primary: 'technique', secondary: 'power' },
  c: { primary: 'power', secondary: 'chin' },
  haskell: { primary: 'technique', secondary: 'stamina' },
  lua: { primary: 'speed', secondary: 'stamina' },
};

export const PRIMARY_LEAN = 2;
export const SECONDARY_LEAN = 1;
