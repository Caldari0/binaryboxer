import { describe, it, expect } from 'vitest';
import {
  initFight,
  resolveRound,
  getAvailableActions,
  MAX_ROUNDS,
} from '../../src/server/engine/combat';
import { calculateStatsForLevel, getBaseStats } from '../../src/server/engine/stats';
import { generateEnemy } from '../../src/server/engine/enemy';
import { calculateInheritance, calculateTotalLegacy } from '../../src/server/engine/inheritance';
import { checkProfanity } from '../../src/server/data/profanity';
import type { RobotStats } from '../../src/shared/types';

const makeStats = (overrides: Partial<RobotStats> = {}): RobotStats => ({
  ...getBaseStats(),
  power: 20,
  defence: 10,
  speed: 10,
  ...overrides,
});

// -------------------------------------------------------
// 1. BOUNDARY VALUES
// -------------------------------------------------------

describe('Boundary values', () => {
  it('robot at 1 HP can fight without auto-KO', () => {
    const stats = makeStats({ hp: 1, maxHp: 100 });
    const enemy = generateEnemy(5, 3, 42);
    const fight = initFight(stats, enemy, 42);
    // Fight should start in pending, not immediately end
    expect(fight.result).toBe('pending');
    expect(fight.currentHp).toBe(1);
  });

  it('all stats at 0 except HP/Power still resolves', () => {
    const stats = makeStats({
      hp: 50, maxHp: 50, power: 5, defence: 0, speed: 0,
      wisdom: 0, creativity: 0, stability: 0, adaptability: 0,
      evasion: 0, blockChance: 0, counter: 0, critChance: 0,
      patternRead: 0, penetration: 0,
    });
    const enemy = generateEnemy(1, 1, 42);
    let fight = initFight(stats, enemy, 42);

    for (let i = 0; i < MAX_ROUNDS; i++) {
      if (fight.result !== 'pending') break;
      const result = resolveRound(fight, 'strike', 1, 'TestBot');
      fight = result.state;
    }
    expect(fight.result).not.toBe('pending');
  });

  it('generation 25 inheritance does not produce NaN', () => {
    const parent = calculateStatsForLevel('python', 'rust', 50, {});
    const legacy = calculateInheritance(parent, 25, true);
    for (const [key, value] of Object.entries(legacy)) {
      if (value !== undefined) {
        expect(Number.isNaN(value), `${key} is NaN`).toBe(false);
        expect(Number.isFinite(value), `${key} is not finite`).toBe(true);
      }
    }
  });

  it('calculateTotalLegacy with 25 generations does not overflow', () => {
    const generations = Array.from({ length: 25 }, (_, i) => ({
      generationNumber: i + 1,
      robotName: `Bot-${i + 1}`,
      language1: 'rust' as const,
      language2: 'go' as const,
      finalLevel: 50,
      totalFights: 100,
      wins: 80,
      bestStreak: 20,
      retiredAt: Date.now(),
      causeOfRetirement: 'voluntary' as const,
      finalStats: calculateStatsForLevel('rust', 'go', 50, {}),
    }));

    const totalLegacy = calculateTotalLegacy(generations, true);
    for (const [key, value] of Object.entries(totalLegacy)) {
      if (value !== undefined) {
        expect(Number.isNaN(value), `${key} is NaN`).toBe(false);
        expect(Number.isFinite(value), `${key} is infinite`).toBe(true);
        expect(value, `${key} is negative`).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('enemy level is always at least 1 even with player level 1', () => {
    for (let seed = 0; seed < 100; seed++) {
      const enemy = generateEnemy(1, 1, seed);
      expect(enemy.level).toBeGreaterThanOrEqual(1);
    }
  });

  it('berserk only available below 30% HP', () => {
    const stats = makeStats();
    const at31 = getAvailableActions(stats, 31, 100);
    const at29 = getAvailableActions(stats, 29, 100);
    expect(at31.some((a) => a.action === 'berserk')).toBe(false);
    expect(at29.some((a) => a.action === 'berserk')).toBe(true);
  });
});

// -------------------------------------------------------
// 2. PROFANITY FILTER
// -------------------------------------------------------

describe('Profanity filter', () => {
  it('blocks obvious slurs', () => {
    expect(checkProfanity('fuck')).not.toBeNull();
    expect(checkProfanity('SHIT')).not.toBeNull();
    expect(checkProfanity('my robot nigger')).not.toBeNull();
  });

  it('blocks leet-speak substitutions', () => {
    expect(checkProfanity('f4gg0t')).not.toBeNull();
    expect(checkProfanity('$h1t')).not.toBeNull();
  });

  it('allows legitimate programming terms', () => {
    expect(checkProfanity('MASTER')).toBeNull();
    expect(checkProfanity('Assassin')).toBeNull();
    expect(checkProfanity('ClassBot')).toBeNull();
    expect(checkProfanity('RustCrusher')).toBeNull();
    expect(checkProfanity('ByteStrike')).toBeNull();
  });

  it('allows normal robot names', () => {
    expect(checkProfanity('Thunderbolt')).toBeNull();
    expect(checkProfanity('CyberPunch')).toBeNull();
    expect(checkProfanity('RoboFist-X')).toBeNull();
    expect(checkProfanity('Unit 42')).toBeNull();
    expect(checkProfanity('Python Power')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(checkProfanity('')).toBeNull();
  });
});

// -------------------------------------------------------
// 3. FIGHT RESOLUTION EDGE CASES
// -------------------------------------------------------

describe('Fight resolution edge cases', () => {
  it('fight resolves within MAX_ROUNDS', () => {
    const stats = makeStats({ power: 15 });
    const enemy = generateEnemy(5, 3, 12345);
    let fight = initFight(stats, enemy, 12345);

    for (let i = 0; i < MAX_ROUNDS; i++) {
      if (fight.result !== 'pending') break;
      const result = resolveRound(fight, 'strike', 5, 'TestBot');
      fight = result.state;
    }

    expect(fight.result).not.toBe('pending');
    expect(['win', 'loss']).toContain(fight.result);
  });

  it('HP never goes below 0', () => {
    const stats = makeStats({ power: 50 });
    const enemy = generateEnemy(3, 3, 42);
    let fight = initFight(stats, enemy, 42);

    for (let i = 0; i < MAX_ROUNDS; i++) {
      if (fight.result !== 'pending') break;
      expect(fight.currentHp).toBeGreaterThanOrEqual(0);
      expect(fight.enemyCurrentHp).toBeGreaterThanOrEqual(0);
      const result = resolveRound(fight, 'strike', 5, 'TestBot');
      fight = result.state;
    }

    expect(fight.currentHp).toBeGreaterThanOrEqual(0);
    expect(fight.enemyCurrentHp).toBeGreaterThanOrEqual(0);
  });

  it('round counter increments correctly over full fight', () => {
    const stats = makeStats({ power: 10 });
    const enemy = generateEnemy(5, 3, 99);
    let fight = initFight(stats, enemy, 99);
    let expectedRound = 0;

    for (let i = 0; i < MAX_ROUNDS; i++) {
      if (fight.result !== 'pending') break;
      expect(fight.currentRound).toBe(expectedRound);
      const result = resolveRound(fight, 'strike', 5, 'TestBot');
      fight = result.state;
      expectedRound++;
    }
  });

  it('turns array grows by 1 or 2 each round', () => {
    const stats = makeStats({ power: 10 });
    const enemy = generateEnemy(5, 3, 77);
    let fight = initFight(stats, enemy, 77);

    for (let i = 0; i < 5; i++) {
      if (fight.result !== 'pending') break;
      const prevTurns = fight.turns.length;
      const result = resolveRound(fight, 'strike', 5, 'TestBot');
      fight = result.state;
      // 2 turns normally, 1 if first attacker KOs the defender
      const added = fight.turns.length - prevTurns;
      expect(added).toBeGreaterThanOrEqual(1);
      expect(added).toBeLessThanOrEqual(2);
    }
  });
});
