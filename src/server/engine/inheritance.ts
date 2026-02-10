// ============================================================
// Binary Boxer — Dynasty Inheritance Engine
// Pure functions only: no Redis, no side effects
// ============================================================

import type {
  RobotStats,
  GrowthStatKey,
  DynastyGeneration,
  DynastyTitle,
} from '../../shared/types';

// Growth stat keys used for inheritance (everything except 'hp')
const GROWTH_STAT_KEYS: GrowthStatKey[] = [
  'maxHp',
  'power',
  'defence',
  'speed',
  'wisdom',
  'creativity',
  'stability',
  'adaptability',
  'evasion',
  'blockChance',
  'counter',
  'critChance',
  'patternRead',
  'penetration',
];

// Base inheritance rate: 10% of parent's final stats
const BASE_INHERITANCE_RATE = 0.10;

// Kindred companion multiplier: +25% to inheritance
const KINDRED_MULTIPLIER = 1.25;

// Decay per generation gap: 2% per generation
const DECAY_BASE = 0.98;

/**
 * Calculate inheritance bonuses from a parent robot's final stats.
 *
 * For each growth stat (not hp):
 * - inheritedBonus = parentFinalStats[stat] * 0.10
 * - If hasKindred: inheritedBonus *= 1.25
 * - Apply decay: inheritedBonus *= (0.98 ^ generation)
 * - Round to 1 decimal place
 */
export const calculateInheritance = (
  parentFinalStats: RobotStats,
  generation: number,
  hasKindred: boolean,
): Partial<Record<GrowthStatKey, number>> => {
  const legacy: Partial<Record<GrowthStatKey, number>> = {};

  for (const stat of GROWTH_STAT_KEYS) {
    let inheritedBonus = parentFinalStats[stat] * BASE_INHERITANCE_RATE;

    if (hasKindred) {
      inheritedBonus *= KINDRED_MULTIPLIER;
    }

    // Apply generational decay
    inheritedBonus *= Math.pow(DECAY_BASE, generation);

    // Round to 1 decimal place
    inheritedBonus = Math.round(inheritedBonus * 10) / 10;

    if (inheritedBonus > 0) {
      legacy[stat] = inheritedBonus;
    }
  }

  return legacy;
};

/**
 * Get the dynasty title based on the current generation number.
 *
 * - 1: 'Prototype'
 * - 2: 'Lineage'
 * - 3-4: 'Legacy'
 * - 5-9: 'Dynasty'
 * - 10-24: 'Empire'
 * - 25+: 'Eternal'
 */
export const getDynastyTitle = (generation: number): DynastyTitle => {
  if (generation >= 25) return 'Eternal';
  if (generation >= 10) return 'Empire';
  if (generation >= 5) return 'Dynasty';
  if (generation >= 3) return 'Legacy';
  if (generation >= 2) return 'Lineage';
  return 'Prototype';
};

/**
 * Calculate the total accumulated legacy stats from all ancestors in a dynasty.
 * Each ancestor's contribution decays by 0.98^(generationGap) where
 * generationGap is the distance from the ancestor to the current generation.
 *
 * @param generations - All previous dynasty generations (ancestors)
 * @param hasKindred - Whether the current robot has the Kindred companion
 * @returns Combined legacy stats from all ancestors
 */
export const calculateTotalLegacy = (
  generations: DynastyGeneration[],
  hasKindred: boolean,
): Partial<Record<GrowthStatKey, number>> => {
  if (generations.length === 0) {
    return {};
  }

  const totalLegacy: Record<GrowthStatKey, number> = {
    maxHp: 0,
    power: 0,
    defence: 0,
    speed: 0,
    wisdom: 0,
    creativity: 0,
    stability: 0,
    adaptability: 0,
    evasion: 0,
    blockChance: 0,
    counter: 0,
    critChance: 0,
    patternRead: 0,
    penetration: 0,
  };

  // The current generation number is one more than the last ancestor's
  const currentGeneration =
    (generations[generations.length - 1]?.generationNumber ?? 0) + 1;

  for (const ancestor of generations) {
    const generationGap = currentGeneration - ancestor.generationNumber;
    const decayFactor = Math.pow(DECAY_BASE, generationGap);

    for (const stat of GROWTH_STAT_KEYS) {
      let contribution =
        ancestor.finalStats[stat] * BASE_INHERITANCE_RATE * decayFactor;

      if (hasKindred) {
        contribution *= KINDRED_MULTIPLIER;
      }

      totalLegacy[stat] += contribution;
    }
  }

  // Round all values to 1 decimal place and filter out zeros
  const result: Partial<Record<GrowthStatKey, number>> = {};
  for (const stat of GROWTH_STAT_KEYS) {
    const rounded = Math.round(totalLegacy[stat] * 10) / 10;
    if (rounded > 0) {
      result[stat] = rounded;
    }
  }

  return result;
};
