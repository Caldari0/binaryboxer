import { describe, it, expect } from 'vitest';
import {
  SeededRNG,
  getAvailableActions,
  getEnemyAction,
  initFight,
  resolveRound,
  autoPickAction,
  MAX_ROUNDS,
} from '../../src/server/engine/combat';
import { getBaseStats } from '../../src/server/engine/stats';
import { generateEnemy } from '../../src/server/engine/enemy';
import type { RobotStats, EnemyData, CombatAction } from '../../src/shared/types';

const makeStats = (overrides: Partial<RobotStats> = {}): RobotStats => ({
  ...getBaseStats(),
  power: 20,
  defence: 10,
  speed: 10,
  wisdom: 10,
  creativity: 10,
  stability: 10,
  adaptability: 10,
  evasion: 5,
  blockChance: 5,
  counter: 5,
  critChance: 5,
  patternRead: 5,
  penetration: 5,
  ...overrides,
});

describe('SeededRNG', () => {
  it('is deterministic', () => {
    const rng1 = new SeededRNG(42);
    const rng2 = new SeededRNG(42);
    for (let i = 0; i < 10; i++) {
      expect(rng1.next()).toBe(rng2.next());
    }
  });

  it('next() returns values in [0, 1)', () => {
    const rng = new SeededRNG(12345);
    for (let i = 0; i < 100; i++) {
      const val = rng.next();
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(1);
    }
  });

  it('range() returns values within bounds', () => {
    const rng = new SeededRNG(999);
    for (let i = 0; i < 100; i++) {
      const val = rng.range(5, 15);
      expect(val).toBeGreaterThanOrEqual(5);
      expect(val).toBeLessThanOrEqual(15);
    }
  });

  it('chance() respects probability', () => {
    const rng = new SeededRNG(42);
    // chance(0) should always be false
    expect(rng.chance(0)).toBe(false);
    // chance(1) should always be true
    const rng2 = new SeededRNG(42);
    expect(rng2.chance(1)).toBe(true);
  });
});

describe('getAvailableActions', () => {
  it('always includes strike', () => {
    const stats = makeStats();
    const actions = getAvailableActions(stats, 100, 100);
    expect(actions.some((a) => a.action === 'strike')).toBe(true);
  });

  it('returns at most 3 actions', () => {
    const stats = makeStats({
      creativity: 100,
      wisdom: 100,
      patternRead: 100,
      adaptability: 100,
      speed: 100,
    });
    const actions = getAvailableActions(stats, 100, 100);
    expect(actions.length).toBeLessThanOrEqual(3);
  });

  it('berserk only available at low HP', () => {
    const stats = makeStats();
    const highHp = getAvailableActions(stats, 100, 100);
    const lowHp = getAvailableActions(stats, 20, 100);
    expect(highHp.some((a) => a.action === 'berserk')).toBe(false);
    expect(lowHp.some((a) => a.action === 'berserk')).toBe(true);
  });

  it('guard requires wisdom >= 15', () => {
    const lowWis = getAvailableActions(makeStats({ wisdom: 5 }), 100, 100);
    const highWis = getAvailableActions(makeStats({ wisdom: 20 }), 100, 100);
    expect(lowWis.some((a) => a.action === 'guard')).toBe(false);
    expect(highWis.some((a) => a.action === 'guard')).toBe(true);
  });
});

describe('getEnemyAction', () => {
  it('returns a valid combat action', () => {
    const rng = new SeededRNG(42);
    const stats = makeStats();
    const action = getEnemyAction(stats, 0.5, rng);
    const validActions: CombatAction[] = [
      'strike', 'heavy_strike', 'guard', 'analyse', 'overclock', 'combo', 'berserk',
    ];
    expect(validActions).toContain(action);
  });

  it('favors berserk at low HP', () => {
    let berserkCount = 0;
    for (let seed = 0; seed < 100; seed++) {
      const rng = new SeededRNG(seed);
      const action = getEnemyAction(makeStats(), 0.1, rng);
      if (action === 'berserk') berserkCount++;
    }
    // With 60% chance at <30% HP and HP is 10%, most should be berserk
    expect(berserkCount).toBeGreaterThan(40);
  });
});

describe('initFight', () => {
  it('creates a fresh fight state', () => {
    const stats = makeStats();
    const enemy = generateEnemy(5, 3, 12345);
    const fight = initFight(stats, enemy, 12345);

    expect(fight.turns).toHaveLength(0);
    expect(fight.result).toBe('pending');
    expect(fight.currentRound).toBe(0);
    expect(fight.currentHp).toBe(stats.hp);
    expect(fight.enemyCurrentHp).toBe(enemy.stats.hp);
    expect(fight.availableActions.length).toBeGreaterThanOrEqual(1);
  });
});

describe('resolveRound', () => {
  it('produces two turns per round', () => {
    const stats = makeStats();
    const enemy = generateEnemy(5, 3, 12345);
    const fight = initFight(stats, enemy, 12345);
    const result = resolveRound(fight, 'strike', 5, 'TestBot');

    expect(result.state.turns.length).toBe(2);
    expect(result.playerTurn).toBeDefined();
    expect(result.enemyTurn).toBeDefined();
  });

  it('increments round counter', () => {
    const stats = makeStats();
    const enemy = generateEnemy(5, 3, 12345);
    const fight = initFight(stats, enemy, 12345);
    const result = resolveRound(fight, 'strike', 5, 'TestBot');
    expect(result.state.currentRound).toBe(1);
  });

  it('is deterministic with same seed', () => {
    const stats = makeStats();
    const enemy = generateEnemy(5, 3, 42);
    const fight1 = initFight(stats, enemy, 42);
    const fight2 = initFight(stats, enemy, 42);
    const r1 = resolveRound(fight1, 'strike', 5, 'TestBot');
    const r2 = resolveRound(fight2, 'strike', 5, 'TestBot');
    expect(r1.state.currentHp).toBe(r2.state.currentHp);
    expect(r1.state.enemyCurrentHp).toBe(r2.state.enemyCurrentHp);
  });

  it('eventually resolves a fight', () => {
    const stats = makeStats({ power: 30 });
    const enemy = generateEnemy(3, 3, 12345);
    let fight = initFight(stats, enemy, 12345);

    for (let i = 0; i < MAX_ROUNDS; i++) {
      if (fight.result !== 'pending') break;
      const result = resolveRound(fight, 'strike', 5, 'TestBot');
      fight = result.state;
    }

    expect(fight.result).not.toBe('pending');
    expect(['win', 'loss']).toContain(fight.result);
  });
});

describe('autoPickAction', () => {
  it('picks the primary action', () => {
    const stats = makeStats();
    const actions = getAvailableActions(stats, 100, 100);
    const picked = autoPickAction(actions);
    const primary = actions.find((a) => a.isPrimary);
    expect(picked).toBe(primary?.action);
  });

  it('defaults to strike if no primary', () => {
    const picked = autoPickAction([]);
    expect(picked).toBe('strike');
  });
});
