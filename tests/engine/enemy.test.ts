import { describe, it, expect } from 'vitest';
import { generateEnemy, seededRandom, seededRandomRange } from '../../src/server/engine/enemy';

describe('seededRandom', () => {
  it('returns a value in [0, 1)', () => {
    for (let seed = 0; seed < 100; seed++) {
      const val = seededRandom(seed);
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(1);
    }
  });

  it('is deterministic', () => {
    expect(seededRandom(42)).toBe(seededRandom(42));
    expect(seededRandom(999)).toBe(seededRandom(999));
  });
});

describe('seededRandomRange', () => {
  it('returns values within range', () => {
    for (let seed = 0; seed < 100; seed++) {
      const val = seededRandomRange(seed, 5, 10);
      expect(val).toBeGreaterThanOrEqual(5);
      expect(val).toBeLessThanOrEqual(10);
    }
  });
});

describe('generateEnemy', () => {
  it('generates a regular enemy for non-boss fights', () => {
    const enemy = generateEnemy(5, 3, 12345);
    expect(enemy.isBoss).toBe(false);
    expect(enemy.bossAbility).toBeNull();
    expect(enemy.bossTagline).toBeNull();
    expect(enemy.level).toBeGreaterThanOrEqual(1);
  });

  it('generates a boss on every 5th fight', () => {
    const enemy5 = generateEnemy(5, 5, 12345);
    const enemy10 = generateEnemy(5, 10, 12345);
    const enemy15 = generateEnemy(5, 15, 12345);
    expect(enemy5.isBoss).toBe(true);
    expect(enemy10.isBoss).toBe(true);
    expect(enemy15.isBoss).toBe(true);
  });

  it('fight 0 is not a boss', () => {
    const enemy = generateEnemy(5, 0, 12345);
    expect(enemy.isBoss).toBe(false);
  });

  it('boss has higher stats than regular enemy', () => {
    const regular = generateEnemy(10, 3, 12345);
    const boss = generateEnemy(10, 5, 12345);
    // Boss gets 1.5x stat multiplier
    expect(boss.stats.power).toBeGreaterThanOrEqual(regular.stats.power);
    // Boss gets 2x HP multiplier
    expect(boss.stats.maxHp).toBeGreaterThanOrEqual(regular.stats.maxHp);
  });

  it('enemy level is near player level', () => {
    const enemy = generateEnemy(10, 3, 12345);
    // Level range: playerLevel + [-1, 2], min 1
    expect(enemy.level).toBeGreaterThanOrEqual(9);
    expect(enemy.level).toBeLessThanOrEqual(12);
  });

  it('enemy level is always at least 1', () => {
    // Even at player level 1, enemy should be >= 1
    for (let seed = 0; seed < 50; seed++) {
      const enemy = generateEnemy(1, 1, seed);
      expect(enemy.level).toBeGreaterThanOrEqual(1);
    }
  });

  it('is deterministic with same seed', () => {
    const a = generateEnemy(5, 3, 42);
    const b = generateEnemy(5, 3, 42);
    expect(a).toEqual(b);
  });

  it('stats follow base formula: baseStat = 10 + level * 3', () => {
    const enemy = generateEnemy(10, 3, 12345);
    const expected = 10 + enemy.level * 3;
    expect(enemy.stats.power).toBe(expected);
    expect(enemy.stats.defence).toBe(expected);
    expect(enemy.stats.speed).toBe(expected);
  });

  it('boss stats are 1.5x regular', () => {
    // Generate a boss and verify stat multiplier
    const boss = generateEnemy(10, 5, 12345);
    const expectedBase = 10 + boss.level * 3;
    const expectedBossStat = Math.round(expectedBase * 1.5);
    expect(boss.stats.power).toBe(expectedBossStat);
  });

  it('HP follows formula: baseHp = 100 + level * 15', () => {
    const enemy = generateEnemy(10, 3, 12345);
    const expectedHp = 100 + enemy.level * 15;
    expect(enemy.stats.maxHp).toBe(expectedHp);
    expect(enemy.stats.hp).toBe(expectedHp);
  });

  it('boss HP is 2x regular', () => {
    const boss = generateEnemy(10, 5, 12345);
    const expectedBase = 100 + boss.level * 15;
    const expectedBossHp = Math.round(expectedBase * 2);
    expect(boss.stats.maxHp).toBe(expectedBossHp);
  });
});
