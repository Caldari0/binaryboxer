// ============================================================
// Binary Boxer — Opponent generation (Gate 0 stub)
// Deterministic from seed; stat budget EQUALS the fighter pair
// budget so the harness measures engine fairness, not stat
// inflation (v1's enemies had 13 uniformly-scaled stats vs the
// player's 2 — the unwinnability critical). Archetypes, variants,
// tells, and phases arrive with Gate 1's real enemy engine; the
// donor name/tagline catalog is adapted then.
// ============================================================

import type { GoblinRank, Opponent, StatKey } from '../../shared/contracts';
import { STAT_KEYS } from '../../shared/contracts';
import { BASE_STAT, MAX_INTEGRITY } from '../gym/constants';
import { SeededRng } from './rng';

/** Two languages × (2+1) lean points — the budget every fighter has. */
export const LEAN_BUDGET = 6;

const GOBLIN_NAMES = [
  'Gob',
  'Snagtooth',
  'Bilgepot',
  'Rustle',
  'Clanker',
  'Smudge',
  'Tinwhistle',
  'Grindle',
] as const;

export const generateOpponent = (seed: number, rank: GoblinRank = 'goblin'): Opponent => {
  const rng = new SeededRng(seed ^ 0x9e3779b9);
  const stats = Object.fromEntries(STAT_KEYS.map((key) => [key, BASE_STAT])) as Record<
    StatKey,
    number
  >;
  // Scatter exactly the fighter lean budget across the five keys.
  for (let i = 0; i < LEAN_BUDGET; i++) {
    const key = STAT_KEYS[rng.range(0, STAT_KEYS.length - 1)]!;
    stats[key] += 1;
  }
  return {
    name: GOBLIN_NAMES[rng.range(0, GOBLIN_NAMES.length - 1)]!,
    rank,
    stats,
    maxIntegrity: MAX_INTEGRITY,
  };
};
