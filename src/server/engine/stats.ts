// ============================================================
// Binary Boxer — Stat Calculation Engine
// Pure functions only: no Redis, no side effects
// ============================================================

import type {
  RobotStats,
  LanguageId,
  GrowthStatKey,
} from '../../shared/types';
import { getLanguage } from '../data/languages';

// All growth stat keys (everything except 'hp')
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

// Python special: +2 to ALL growth stats per level
const PYTHON_ALL_STAT_BONUS = 2;

/**
 * Returns the starting base stats for a new robot.
 * HP 100, maxHp 100, Power 10, Defence 5, Speed 5, all others 0.
 */
export const getBaseStats = (): RobotStats => ({
  hp: 100,
  maxHp: 100,
  power: 10,
  defence: 5,
  speed: 5,
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
});

/**
 * Calculate full robot stats for a given level, language pair, and legacy bonuses.
 *
 * - Start with base stats
 * - Add language bonuses scaled by level
 * - Python special: +2 to ALL growth stats per level
 * - Add legacy stats (inherited from dynasty)
 * - HP scales: maxHp = 100 + (level * 10) + language HP bonuses + legacy
 * - hp is set equal to maxHp for fresh calculations
 */
export const calculateStatsForLevel = (
  language1: LanguageId,
  language2: LanguageId,
  level: number,
  legacyStats: Partial<Record<GrowthStatKey, number>>,
): RobotStats => {
  const stats = getBaseStats();
  const lang1 = getLanguage(language1);
  const lang2 = getLanguage(language2);

  // Apply language 1 bonuses per level
  applyLanguageBonuses(stats, lang1.primaryStat, lang1.primaryBonus, level);
  if (lang1.secondaryStat !== null) {
    applyLanguageBonuses(stats, lang1.secondaryStat, lang1.secondaryBonus, level);
  }

  // Apply language 2 bonuses per level
  applyLanguageBonuses(stats, lang2.primaryStat, lang2.primaryBonus, level);
  if (lang2.secondaryStat !== null) {
    applyLanguageBonuses(stats, lang2.secondaryStat, lang2.secondaryBonus, level);
  }

  // Python special: +2 to ALL growth stats per level
  if (language1 === 'python') {
    for (const key of GROWTH_STAT_KEYS) {
      stats[key] += PYTHON_ALL_STAT_BONUS * level;
    }
  }
  if (language2 === 'python') {
    for (const key of GROWTH_STAT_KEYS) {
      stats[key] += PYTHON_ALL_STAT_BONUS * level;
    }
  }

  // Add legacy stats (inherited from dynasty)
  for (const key of GROWTH_STAT_KEYS) {
    const legacy = legacyStats[key];
    if (legacy !== undefined) {
      stats[key] += legacy;
    }
  }

  // HP scaling: maxHp = 100 + (level * 10) + any HP bonuses already added above
  // The base 100 is already in getBaseStats(), and language/legacy bonuses to maxHp
  // have been added above. We now add the level-based HP scaling.
  stats.maxHp += level * 10;

  // Set hp = maxHp for fresh calculations
  stats.hp = stats.maxHp;

  return stats;
};

/**
 * Apply a language bonus to a stat, scaled by level.
 * statGrowth = languageBonus * level
 */
const applyLanguageBonuses = (
  stats: RobotStats,
  stat: GrowthStatKey,
  bonus: number,
  level: number,
): void => {
  stats[stat] += bonus * level;
};

/**
 * Calculate XP required to reach the next level.
 * Formula: level * 50
 */
export const getXpRequired = (level: number): number => {
  return level * 50;
};

/**
 * Calculate XP awarded for completing a fight.
 * baseXP = 10 + (enemyLevel * 2) + (won ? 5 : 0)
 * Boss fights award 3x XP.
 */
export const getXpForFight = (
  enemyLevel: number,
  won: boolean,
  isBoss: boolean,
): number => {
  let baseXP = 10 + enemyLevel * 2 + (won ? 5 : 0);
  if (isBoss) {
    baseXP *= 3;
  }
  return baseXP;
};

/**
 * Calculate the XP cost to train a stat by one point.
 * Formula: currentStatValue * 10
 */
export const getTrainingCost = (currentStatValue: number): number => {
  return currentStatValue * 10;
};

/**
 * Apply companion buffs to a robot's stats.
 * Returns a new stats object (does not mutate the input).
 *
 * - Veil: +20% wisdom
 * - Echo: +15% critChance + 10% to the highest language-bonus stat
 */
export const applyCompanionBuffs = (
  stats: RobotStats,
  hasVeil: boolean,
  hasEcho: boolean,
  language1: LanguageId,
  language2: LanguageId,
): RobotStats => {
  const buffed: RobotStats = { ...stats };

  if (hasVeil) {
    buffed.wisdom = Math.round(buffed.wisdom * 1.2);
  }

  if (hasEcho) {
    buffed.critChance = Math.round(buffed.critChance * 1.15);

    // Find the highest language-bonus stat and boost it by 10%
    const highestStat = getHighestLanguageBonusStat(language1, language2);
    if (highestStat !== null) {
      buffed[highestStat] = Math.round(buffed[highestStat] * 1.1);
    }
  }

  return buffed;
};

/**
 * Determine the stat that has the highest combined language bonus
 * across both languages. Used by Echo companion buff.
 * Returns null if no bonuses found (should not happen with valid languages).
 */
const getHighestLanguageBonusStat = (
  language1: LanguageId,
  language2: LanguageId,
): GrowthStatKey | null => {
  const lang1 = getLanguage(language1);
  const lang2 = getLanguage(language2);

  const bonusMap = new Map<GrowthStatKey, number>();

  const addBonus = (stat: GrowthStatKey | null, bonus: number): void => {
    if (stat === null) return;
    bonusMap.set(stat, (bonusMap.get(stat) ?? 0) + bonus);
  };

  addBonus(lang1.primaryStat, lang1.primaryBonus);
  addBonus(lang1.secondaryStat, lang1.secondaryBonus);
  addBonus(lang2.primaryStat, lang2.primaryBonus);
  addBonus(lang2.secondaryStat, lang2.secondaryBonus);

  let highestStat: GrowthStatKey | null = null;
  let highestBonus = 0;

  for (const [stat, bonus] of bonusMap) {
    if (bonus > highestBonus) {
      highestBonus = bonus;
      highestStat = stat;
    }
  }

  return highestStat;
};
