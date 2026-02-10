import { describe, it, expect } from 'vitest';
import {
  getBaseStats,
  calculateStatsForLevel,
  getXpRequired,
  getXpForFight,
  getTrainingCost,
  applyCompanionBuffs,
} from '../../src/server/engine/stats';

describe('getBaseStats', () => {
  it('returns correct base values', () => {
    const stats = getBaseStats();
    expect(stats.hp).toBe(100);
    expect(stats.maxHp).toBe(100);
    expect(stats.power).toBe(10);
    expect(stats.defence).toBe(5);
    expect(stats.speed).toBe(5);
    expect(stats.wisdom).toBe(0);
    expect(stats.creativity).toBe(0);
    expect(stats.stability).toBe(0);
  });
});

describe('calculateStatsForLevel', () => {
  it('level 1 rust+go has correct stats', () => {
    const stats = calculateStatsForLevel('rust', 'go', 1, {});
    // Rust primary: defence +3/lvl, secondary: stability +1/lvl
    // Go primary: speed +3/lvl, secondary: counter +1/lvl
    // maxHp = 100 + (1 * 10) = 110
    expect(stats.maxHp).toBe(110);
    expect(stats.hp).toBe(stats.maxHp);
    expect(stats.defence).toBe(5 + 3); // base 5 + rust primary 3
    expect(stats.speed).toBe(5 + 3);   // base 5 + go primary 3
    expect(stats.stability).toBe(0 + 1); // base 0 + rust secondary 1
    expect(stats.counter).toBe(0 + 1);   // base 0 + go secondary 1
    expect(stats.power).toBe(10);         // unchanged
  });

  it('python gives +2 to all growth stats per level', () => {
    const stats = calculateStatsForLevel('python', 'rust', 1, {});
    // Python: primary power +2, secondary null, allStatBonus +2 to ALL growth stats
    // Rust: primary defence +3, secondary stability +1
    // Every growth stat gets +2 from python allStat bonus
    expect(stats.power).toBe(10 + 2 + 2);    // base 10 + python primary 2 + python allStat 2
    expect(stats.defence).toBe(5 + 3 + 2);   // base 5 + rust primary 3 + python allStat 2
    expect(stats.stability).toBe(0 + 1 + 2); // base 0 + rust secondary 1 + python allStat 2
    expect(stats.creativity).toBe(0 + 2);    // base 0 + python allStat 2
    expect(stats.evasion).toBe(0 + 2);       // base 0 + python allStat 2
  });

  it('legacy stats are added', () => {
    const legacy = { power: 5, speed: 3 };
    const stats = calculateStatsForLevel('rust', 'go', 1, legacy);
    expect(stats.power).toBe(10 + 5);      // base 10 + legacy 5 (rust primary is defence)
    expect(stats.speed).toBe(5 + 3 + 3);   // base 5 + go primary 3 + legacy 3
    expect(stats.defence).toBe(5 + 3);     // base 5 + rust primary 3
  });

  it('HP scales with level', () => {
    const stats5 = calculateStatsForLevel('rust', 'go', 5, {});
    const stats10 = calculateStatsForLevel('rust', 'go', 10, {});
    // maxHp = 100 + (level * 10) + language HP bonuses
    expect(stats5.maxHp).toBe(100 + 50); // 150
    expect(stats10.maxHp).toBe(100 + 100); // 200
  });
});

describe('getXpRequired', () => {
  it('follows level * 50 formula', () => {
    expect(getXpRequired(1)).toBe(50);
    expect(getXpRequired(5)).toBe(250);
    expect(getXpRequired(10)).toBe(500);
  });
});

describe('getXpForFight', () => {
  it('win gives more XP than loss', () => {
    const winXp = getXpForFight(5, true, false);
    const lossXp = getXpForFight(5, false, false);
    expect(winXp).toBeGreaterThan(lossXp);
    expect(winXp - lossXp).toBe(5);
  });

  it('boss fights award 3x XP', () => {
    const normal = getXpForFight(5, true, false);
    const boss = getXpForFight(5, true, true);
    expect(boss).toBe(normal * 3);
  });

  it('formula: 10 + enemyLevel*2 + (won ? 5 : 0)', () => {
    expect(getXpForFight(1, false, false)).toBe(10 + 2);
    expect(getXpForFight(1, true, false)).toBe(10 + 2 + 5);
    expect(getXpForFight(10, true, false)).toBe(10 + 20 + 5);
  });
});

describe('getTrainingCost', () => {
  it('cost is currentValue * 10', () => {
    expect(getTrainingCost(1)).toBe(10);
    expect(getTrainingCost(10)).toBe(100);
    expect(getTrainingCost(0)).toBe(0);
  });
});

describe('applyCompanionBuffs', () => {
  const baseStats = getBaseStats();

  it('veil boosts wisdom by 20%', () => {
    const stats = { ...baseStats, wisdom: 100 };
    const buffed = applyCompanionBuffs(stats, true, false, 'rust', 'go');
    expect(buffed.wisdom).toBe(120);
  });

  it('echo boosts critChance by 15%', () => {
    const stats = { ...baseStats, critChance: 100 };
    const buffed = applyCompanionBuffs(stats, false, true, 'rust', 'go');
    expect(buffed.critChance).toBe(115);
  });

  it('no companions means no changes', () => {
    const stats = { ...baseStats };
    const buffed = applyCompanionBuffs(stats, false, false, 'rust', 'go');
    expect(buffed).toEqual(stats);
  });

  it('does not mutate input', () => {
    const stats = { ...baseStats, wisdom: 100 };
    const original = { ...stats };
    applyCompanionBuffs(stats, true, true, 'rust', 'go');
    expect(stats).toEqual(original);
  });
});
