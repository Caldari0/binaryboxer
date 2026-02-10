// ============================================================
// Binary Boxer — Enemy Generation Engine
// Pure functions only: no Redis, no side effects
// ============================================================

import type { EnemyData, RobotStats } from '../../shared/types';
import {
  ENEMY_NAMES,
  BOSS_NAMES,
  BOSS_TAGLINES,
  BOSS_ABILITIES,
} from '../data/enemies';

/**
 * Mulberry32 — a simple deterministic pseudo-random number generator.
 * Returns a float in the range [0, 1).
 */
export const seededRandom = (seed: number): number => {
  let t = (seed + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

/**
 * Returns a seeded random integer in the range [min, max] (inclusive).
 */
export const seededRandomRange = (
  seed: number,
  min: number,
  max: number,
): number => {
  const rand = seededRandom(seed);
  return Math.floor(rand * (max - min + 1)) + min;
};

/**
 * Generate a procedurally-created enemy based on player level, fight number, and seed.
 *
 * - isBoss when fightNumber > 0 and fightNumber % 5 === 0
 * - enemyLevel = playerLevel + seededRandomRange(seed, -1, 2)
 * - Regular enemies: each stat = 10 + (enemyLevel * 3), HP = 100 + (enemyLevel * 15)
 * - Boss enemies: each stat * 1.5, HP * 2
 * - Boss enemies get an ability and tagline from the data pool
 */
export const generateEnemy = (
  playerLevel: number,
  fightNumber: number,
  seed: number,
): EnemyData => {
  const isBoss = fightNumber > 0 && fightNumber % 5 === 0;
  const enemyLevel = Math.max(1, playerLevel + seededRandomRange(seed, -1, 2));

  // Pick name from the appropriate pool
  const namePool = isBoss ? BOSS_NAMES : ENEMY_NAMES;
  const nameIndex = Math.abs(seededRandomRange(seed + 1, 0, namePool.length - 1));
  const name = namePool[nameIndex] ?? namePool[0]!;

  // Calculate base stats for the enemy
  const baseStat = 10 + enemyLevel * 3;
  const baseHp = 100 + enemyLevel * 15;

  // Boss multipliers
  const statMultiplier = isBoss ? 1.5 : 1;
  const hpMultiplier = isBoss ? 2 : 1;

  const finalStat = Math.round(baseStat * statMultiplier);
  const finalHp = Math.round(baseHp * hpMultiplier);

  const stats: RobotStats = {
    hp: finalHp,
    maxHp: finalHp,
    power: finalStat,
    defence: finalStat,
    speed: finalStat,
    wisdom: finalStat,
    creativity: finalStat,
    stability: finalStat,
    adaptability: finalStat,
    evasion: finalStat,
    blockChance: finalStat,
    counter: finalStat,
    critChance: finalStat,
    patternRead: finalStat,
    penetration: finalStat,
  };

  // Boss ability and tagline
  const bossAbility = isBoss ? (BOSS_ABILITIES[name] ?? null) : null;
  const bossTagline = isBoss ? (BOSS_TAGLINES[name] ?? null) : null;

  return {
    name,
    level: enemyLevel,
    stats,
    isBoss,
    bossAbility,
    bossTagline,
  };
};
