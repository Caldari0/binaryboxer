// ============================================================
// Binary Boxer — Gym & fighter records (contract, gym-shaped v1)
// Shapes per gym-pivot-decisions.md + story-presentation-decisions.md
// (#2 gym-shaped Gate 0 schemas, #9 storybook reservation). Market,
// ransom, and series LOGIC are Gate 1; these records only give that
// state a home. Gym records must stay CROSS-USER READABLE
// (bantam-decisions #8): no user-private data in this blob.
// ============================================================

import { z } from 'zod';
import { LanguagePairSchema } from './language';
import { GrowthSourcesSchema } from './stats';

/** The nine goblin gym-leader ranks (canon §3 ladder; staff when woken). */
export const GoblinRankSchema = z.enum([
  'goblin',
  'ranger',
  'guardian',
  'chief',
  'knight',
  'paladin',
  'shaman',
  'lord',
  'champion',
]);
export type GoblinRank = z.infer<typeof GoblinRankSchema>;

export const FighterOriginSchema = z.enum(['founding', 'ransom', 'hired']);
export type FighterOrigin = z.infer<typeof FighterOriginSchema>;

export const WinLossRecordSchema = z.object({
  wins: z.number().int().min(0),
  losses: z.number().int().min(0),
  bouts: z.number().int().min(0),
});
export type WinLossRecord = z.infer<typeof WinLossRecordSchema>;

export const emptyRecord = (): WinLossRecord => ({ wins: 0, losses: 0, bouts: 0 });

/** Per-fighter persistent state. One record per Remnant on the roster. */
export const FighterRecordSchema = z.object({
  fighterId: z.string().min(1),
  name: z.string().min(1).max(20),
  languages: LanguagePairSchema,
  growthSources: GrowthSourcesSchema,
  /** Installed program IDs only — program definitions/effects are Gate 1. */
  installedPrograms: z.array(z.string()).default([]),
  /** Chassis condition between bouts, 0–100. Recovery rules are Gate 1. */
  condition: z.object({ integrity: z.number().int().min(0).max(100) }),
  origin: FighterOriginSchema,
  record: WinLossRecordSchema,
  createdAt: z.number().int().positive(),
});
export type FighterRecord = z.infer<typeof FighterRecordSchema>;

/** Storybook read-state (story-presentation #9): content ships in the
 * client bundle; only which beats fired/were read persists here. */
export const StorybookStateSchema = z.object({
  pending: z.array(z.string()).default([]),
  read: z.array(z.string()).default([]),
});
export type StorybookState = z.infer<typeof StorybookStateSchema>;

/** The gym — the player's persistent root record (installation-scoped). */
export const GymRecordSchema = z.object({
  /** Reddit username; doubles as the gym's id in keys. */
  username: z.string().min(1),
  gymName: z.string().min(1).max(30),
  generation: z.number().int().min(1),
  /** Gym integrity — a lost fixture takes a light; dark gym ends the
   * generation (gym-pivot #8). Count per generation is tunable. */
  lamps: z.number().int().min(0),
  /** Non-spendable reputation ladder (gym-pivot #3). */
  prestige: z.number().int().min(0),
  /** The one spendable currency (gym-pivot #3). */
  scrap: z.number().int().min(0),
  /** Roster fighter ids, capacity ≤5 (First Cup runs 2–3). */
  roster: z.array(z.string()).max(5),
  /** Woken gym-leader staff (canon §3); cups derive from staff + freed
   * fighters — derived, never stored. */
  staffWoken: z.array(GoblinRankSchema).default([]),
  storybook: StorybookStateSchema,
  record: WinLossRecordSchema,
  createdAt: z.number().int().positive(),
  updatedAt: z.number().int().positive(),
});
export type GymRecord = z.infer<typeof GymRecordSchema>;
