import { describe, it, expect } from 'vitest';
import {
  calculateInheritance,
  getDynastyTitle,
  calculateTotalLegacy,
} from '../../src/server/engine/inheritance';
import { getBaseStats } from '../../src/server/engine/stats';
import type { DynastyGeneration, RobotStats } from '../../src/shared/types';

const makeStats = (overrides: Partial<RobotStats> = {}): RobotStats => ({
  ...getBaseStats(),
  power: 30,
  defence: 20,
  speed: 20,
  ...overrides,
});

describe('calculateInheritance', () => {
  it('returns 10% of parent stats at generation 1', () => {
    const parent = makeStats({ power: 100 });
    const legacy = calculateInheritance(parent, 1, false);
    // 100 * 0.10 * 0.98^1 = 9.8
    expect(legacy.power).toBe(9.8);
  });

  it('kindred multiplies by 1.25', () => {
    const parent = makeStats({ power: 100 });
    const withoutKindred = calculateInheritance(parent, 1, false);
    const withKindred = calculateInheritance(parent, 1, true);
    // without: 100 * 0.10 * 0.98 = 9.8
    // with: 100 * 0.10 * 1.25 * 0.98 = 12.25 → rounds to 12.3
    expect(withKindred.power!).toBeGreaterThan(withoutKindred.power!);
  });

  it('decays with generation', () => {
    const parent = makeStats({ power: 100 });
    const gen1 = calculateInheritance(parent, 1, false);
    const gen10 = calculateInheritance(parent, 10, false);
    const gen25 = calculateInheritance(parent, 25, false);
    expect(gen1.power!).toBeGreaterThan(gen10.power!);
    expect(gen10.power!).toBeGreaterThan(gen25.power!);
  });

  it('generation 25 still yields positive values', () => {
    const parent = makeStats({ power: 100, defence: 100 });
    const legacy = calculateInheritance(parent, 25, false);
    // 100 * 0.10 * 0.98^25 ≈ 6.03
    expect(legacy.power).toBeGreaterThan(0);
    expect(legacy.defence).toBeGreaterThan(0);
  });

  it('zero stats produce no legacy', () => {
    const parent = makeStats({ creativity: 0, evasion: 0 });
    const legacy = calculateInheritance(parent, 1, false);
    expect(legacy.creativity).toBeUndefined();
    expect(legacy.evasion).toBeUndefined();
  });
});

describe('getDynastyTitle', () => {
  it('returns correct titles for generation thresholds', () => {
    expect(getDynastyTitle(1)).toBe('Prototype');
    expect(getDynastyTitle(2)).toBe('Lineage');
    expect(getDynastyTitle(3)).toBe('Legacy');
    expect(getDynastyTitle(4)).toBe('Legacy');
    expect(getDynastyTitle(5)).toBe('Dynasty');
    expect(getDynastyTitle(9)).toBe('Dynasty');
    expect(getDynastyTitle(10)).toBe('Empire');
    expect(getDynastyTitle(24)).toBe('Empire');
    expect(getDynastyTitle(25)).toBe('Eternal');
    expect(getDynastyTitle(100)).toBe('Eternal');
  });
});

describe('calculateTotalLegacy', () => {
  const makeGeneration = (
    genNum: number,
    stats: Partial<RobotStats> = {},
  ): DynastyGeneration => ({
    generationNumber: genNum,
    robotName: `TestBot-${genNum}`,
    language1: 'rust',
    language2: 'go',
    finalLevel: 10,
    totalFights: 20,
    wins: 15,
    bestStreak: 5,
    retiredAt: Date.now(),
    causeOfRetirement: 'voluntary',
    finalStats: makeStats(stats),
  });

  it('returns empty for no ancestors', () => {
    expect(calculateTotalLegacy([], false)).toEqual({});
  });

  it('single ancestor contributes legacy', () => {
    const gen = makeGeneration(1, { power: 100 });
    const legacy = calculateTotalLegacy([gen], false);
    // power: 100 * 0.10 * 0.98^1 = 9.8
    expect(legacy.power).toBe(9.8);
  });

  it('multiple ancestors stack with decay', () => {
    const gens = [
      makeGeneration(1, { power: 100 }),
      makeGeneration(2, { power: 100 }),
    ];
    const legacy = calculateTotalLegacy(gens, false);
    // Gen 1: 100 * 0.10 * 0.98^2 = 9.604 (gap of 2 from current gen 3)
    // Gen 2: 100 * 0.10 * 0.98^1 = 9.8 (gap of 1 from current gen 3)
    // Total: 19.404, rounded to 19.4
    expect(legacy.power).toBe(19.4);
  });

  it('kindred multiplier applies to total legacy', () => {
    const gen = makeGeneration(1, { power: 100 });
    const without = calculateTotalLegacy([gen], false);
    const with_ = calculateTotalLegacy([gen], true);
    expect(with_.power!).toBeGreaterThan(without.power!);
  });
});
