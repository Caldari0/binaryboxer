// ============================================================
// Binary Boxer — Stat model (contract)
// Five effectiveness-only growth keys (spec §3 "stats: effectiveness
// only"), chosen to map 1:1 onto the Bantam display vocabulary
// (Power/Speed/Technique/Stamina/Chin; "Heart" is the condition
// gauge, not a growth stat). Derived stats are computed from
// SEPARATE persistent sources (spec §5 #7) and combined only for
// display/effectiveness — never stored combined.
// ============================================================

import { z } from 'zod';

export const StatKeySchema = z.enum(['power', 'speed', 'technique', 'stamina', 'chin']);
export type StatKey = z.infer<typeof StatKeySchema>;

export const STAT_KEYS: readonly StatKey[] = StatKeySchema.options;

/** A sparse per-stat contribution from one growth source. */
export const StatDeltaSchema = z
  .partialRecord(StatKeySchema, z.number().int().min(0).max(999))
  .default({});
export type StatDelta = z.infer<typeof StatDeltaSchema>;

/**
 * The separate persistent growth sources (spec §5 #7). Combined only
 * at derivation time; never collapse these into one "trained" field.
 */
export const GrowthSourcesSchema = z.object({
  manualTraining: StatDeltaSchema,
  fightLearning: StatDeltaSchema,
  legacyBonuses: StatDeltaSchema,
});
export type GrowthSources = z.infer<typeof GrowthSourcesSchema>;

export const emptyGrowthSources = (): GrowthSources => ({
  manualTraining: {},
  fightLearning: {},
  legacyBonuses: {},
});

/** A fully-derived stat block (display/effectiveness view). */
export const StatBlockSchema = z.object({
  power: z.number().int().min(0),
  speed: z.number().int().min(0),
  technique: z.number().int().min(0),
  stamina: z.number().int().min(0),
  chin: z.number().int().min(0),
});
export type StatBlock = z.infer<typeof StatBlockSchema>;
