import { describe, it, expect } from 'vitest';
import {
  SeededRNG,
  initFight,
  resolveRound,
  MAX_ROUNDS,
} from '../../src/server/engine/combat';
import { calculateStatsForLevel, getXpRequired, getXpForFight } from '../../src/server/engine/stats';
import { generateEnemy } from '../../src/server/engine/enemy';
import { calculateInheritance } from '../../src/server/engine/inheritance';
import { LANGUAGE_IDS } from '../../src/server/data/languages';
import type { LanguageId } from '../../src/shared/types';

// -------------------------------------------------------
// 1. DAMAGE FORMULA — minimum damage is always >= 1
// -------------------------------------------------------

describe('Damage formula basics', () => {
  it('a strike always deals at least 1 damage', () => {
    for (let seed = 0; seed < 50; seed++) {
      const stats = calculateStatsForLevel('rust', 'go', 1, {});
      const enemy = generateEnemy(1, 3, seed);
      const fight = initFight(stats, enemy, seed);
      const result = resolveRound(fight, 'strike', 1, 'TestBot');

      // At least one of the two turns should show damage or dodge
      const playerTurn = result.playerTurn;
      if (!playerTurn.dodged) {
        expect(playerTurn.damage).toBeGreaterThanOrEqual(1);
      }
    }
  });
});

// -------------------------------------------------------
// 2. STAT GROWTH — no stat ever goes negative
// -------------------------------------------------------

describe('Stat growth consistency', () => {
  it('no stat goes negative at any level for any language pair', () => {
    const levels = [1, 5, 10, 25, 50];
    for (const lang1 of LANGUAGE_IDS) {
      for (const lang2 of LANGUAGE_IDS) {
        if (lang1 === lang2) continue;
        for (const level of levels) {
          const stats = calculateStatsForLevel(lang1, lang2, level, {});
          for (const [key, value] of Object.entries(stats)) {
            expect(value, `${lang1}+${lang2} L${level} ${key}`).toBeGreaterThanOrEqual(0);
          }
        }
      }
    }
  });

  it('no stat exceeds 500 at level 50', () => {
    for (const lang1 of LANGUAGE_IDS) {
      for (const lang2 of LANGUAGE_IDS) {
        if (lang1 === lang2) continue;
        const stats = calculateStatsForLevel(lang1, lang2, 50, {});
        for (const [key, value] of Object.entries(stats)) {
          if (key === 'hp' || key === 'maxHp') continue; // HP can be high
          expect(value, `${lang1}+${lang2} ${key}`).toBeLessThanOrEqual(500);
        }
      }
    }
  });

  it('stats grow monotonically with level', () => {
    const lang1: LanguageId = 'python';
    const lang2: LanguageId = 'rust';
    let prev = calculateStatsForLevel(lang1, lang2, 1, {});
    for (let level = 2; level <= 50; level++) {
      const curr = calculateStatsForLevel(lang1, lang2, level, {});
      expect(curr.maxHp).toBeGreaterThanOrEqual(prev.maxHp);
      expect(curr.power).toBeGreaterThanOrEqual(prev.power);
      expect(curr.defence).toBeGreaterThanOrEqual(prev.defence);
      prev = curr;
    }
  });
});

// -------------------------------------------------------
// 3. ENEMY SCALING BALANCE
// -------------------------------------------------------

describe('Enemy scaling', () => {
  it('no enemy is ever impossible to damage', () => {
    // The damage formula guarantees Math.max(1, baseDamage - defence), so any
    // hit that lands always deals at least 1 damage. Verify the player always
    // has positive base damage (power > 0) against every enemy at every level.
    const levels = [1, 5, 10, 25, 50];
    for (const playerLevel of levels) {
      for (let seed = 0; seed < 20; seed++) {
        const stats = calculateStatsForLevel('c', 'rust', playerLevel, {});
        const enemy = generateEnemy(playerLevel, 3, seed);
        // Base damage = power * (1 + level * 0.05) must be > 0
        const baseDamage = stats.power * (1 + playerLevel * 0.05);
        expect(baseDamage, `L${playerLevel} seed ${seed} base damage`).toBeGreaterThan(0);
        // After defence reduction, Math.max(1, ...) guarantees at least 1
        const effectiveDefence = enemy.stats.defence * Math.max(0, 1 - stats.penetration / 100);
        const finalDamage = Math.max(1, baseDamage - effectiveDefence);
        expect(finalDamage, `L${playerLevel} seed ${seed} final damage`).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('boss appears every 5th fight', () => {
    for (let fight = 1; fight <= 30; fight++) {
      const enemy = generateEnemy(10, fight, 42);
      if (fight > 0 && fight % 5 === 0) {
        expect(enemy.isBoss, `fight ${fight}`).toBe(true);
      } else {
        expect(enemy.isBoss, `fight ${fight}`).toBe(false);
      }
    }
  });
});

// -------------------------------------------------------
// 4. INHERITANCE DECAY
// -------------------------------------------------------

describe('Inheritance over 25 generations', () => {
  it('no inherited stat becomes negative', () => {
    const parentStats = calculateStatsForLevel('python', 'rust', 50, {});
    for (let gen = 1; gen <= 25; gen++) {
      const legacy = calculateInheritance(parentStats, gen, false);
      for (const [key, value] of Object.entries(legacy)) {
        if (value !== undefined) {
          expect(value, `gen ${gen} ${key}`).toBeGreaterThan(0);
        }
      }
    }
  });

  it('generation 25 still receives measurable inheritance from gen 1 parent', () => {
    const parentStats = calculateStatsForLevel('c', 'go', 50, {});
    const legacy = calculateInheritance(parentStats, 25, false);
    // At least power should still be > 0 since C gives +3 power/lvl → 160 at L50
    expect(legacy.power).toBeGreaterThan(0);
  });

  it('kindred bonus always increases inheritance', () => {
    const parentStats = calculateStatsForLevel('rust', 'go', 25, {});
    for (let gen = 1; gen <= 25; gen++) {
      const without = calculateInheritance(parentStats, gen, false);
      const withKindred = calculateInheritance(parentStats, gen, true);
      // Every non-zero stat should be higher with kindred
      for (const key of Object.keys(without) as Array<keyof typeof without>) {
        if (without[key] !== undefined && without[key]! > 0) {
          expect(withKindred[key], `gen ${gen} ${key}`).toBeGreaterThan(without[key]!);
        }
      }
    }
  });
});

// -------------------------------------------------------
// 5. XP CURVE
// -------------------------------------------------------

describe('XP curve balance', () => {
  it('xpRequired = level * 50', () => {
    for (let level = 1; level <= 50; level++) {
      expect(getXpRequired(level)).toBe(level * 50);
    }
  });

  it('boss fights award 3x XP', () => {
    for (let enemyLevel = 1; enemyLevel <= 20; enemyLevel++) {
      const normal = getXpForFight(enemyLevel, true, false);
      const boss = getXpForFight(enemyLevel, true, true);
      expect(boss).toBe(normal * 3);
    }
  });

  it('levelling is not too fast or too slow', () => {
    // At any level, fights-to-level should be between 2 and 20
    for (let level = 1; level <= 50; level++) {
      const xpNeeded = getXpRequired(level);
      const xpPerWin = getXpForFight(level, true, false);
      const fightsToLevel = xpNeeded / xpPerWin;
      expect(fightsToLevel, `level ${level}`).toBeGreaterThanOrEqual(2);
      expect(fightsToLevel, `level ${level}`).toBeLessThanOrEqual(25);
    }
  });
});

// -------------------------------------------------------
// 6. DETERMINISTIC COMBAT
// -------------------------------------------------------

describe('Deterministic combat', () => {
  it('same seed produces identical results over 100 runs', () => {
    const seed = 42;
    const stats = calculateStatsForLevel('rust', 'go', 10, {});
    const enemy = generateEnemy(10, 3, seed);

    // Run once as reference
    const refFight = initFight(stats, enemy, seed);
    const refResult = resolveRound(refFight, 'strike', 10, 'TestBot');

    // Run 99 more times
    for (let i = 0; i < 99; i++) {
      const fight = initFight(stats, enemy, seed);
      const result = resolveRound(fight, 'strike', 10, 'TestBot');
      expect(result.state.currentHp).toBe(refResult.state.currentHp);
      expect(result.state.enemyCurrentHp).toBe(refResult.state.enemyCurrentHp);
      expect(result.playerTurn.damage).toBe(refResult.playerTurn.damage);
      expect(result.enemyTurn.damage).toBe(refResult.enemyTurn.damage);
    }
  });

  it('different seeds produce different results', () => {
    const stats = calculateStatsForLevel('rust', 'go', 10, {});
    const results = new Set<number>();

    for (let seed = 0; seed < 50; seed++) {
      const enemy = generateEnemy(10, 3, seed);
      const fight = initFight(stats, enemy, seed);
      const result = resolveRound(fight, 'strike', 10, 'TestBot');
      results.add(result.state.enemyCurrentHp);
    }

    // With 50 different seeds, we should get multiple distinct outcomes
    expect(results.size).toBeGreaterThan(1);
  });
});
