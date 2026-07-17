// ============================================================
// Binary Boxer — Language identity (contract)
// The ten language IDs survive the rebuild (donor-triage: Language
// is ADAPT — identity retained, flat stat bonuses replaced).
// ============================================================

import { z } from 'zod';

export const LanguageIdSchema = z.enum([
  'rust',
  'javascript',
  'python',
  'cpp',
  'css',
  'go',
  'typescript',
  'c',
  'haskell',
  'lua',
]);
export type LanguageId = z.infer<typeof LanguageIdSchema>;

/** Exactly two distinct languages seed a fighter (gym-pivot decision #7). */
export const LanguagePairSchema = z
  .tuple([LanguageIdSchema, LanguageIdSchema])
  .refine(([a, b]) => a !== b, { message: 'languages must be distinct' });
export type LanguagePair = z.infer<typeof LanguagePairSchema>;
