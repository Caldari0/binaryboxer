// ============================================================
// Fight engine core tests — determinism, termination, bounds,
// legibility, KO semantics, and the pause mechanism.
// ============================================================

import { describe, expect, it } from 'vitest';
import { BoutEventSchema, emptyGrowthSources } from '../../src/shared/contracts';
import { deriveStats } from '../../src/server/gym/derive';
import { MAX_INTEGRITY } from '../../src/server/gym/constants';
import { generateOpponent, LEAN_BUDGET } from '../../src/server/fight/opponent';
import {
  MAX_ROUNDS,
  resolveUntil,
  type BoutState,
} from '../../src/server/fight/resolution';
import { SeededRng, statToChance } from '../../src/server/fight/rng';

const makeState = (seed: number): BoutState => {
  const stats = deriveStats(['rust', 'go'], emptyGrowthSources());
  const opponent = generateOpponent(seed);
  return {
    round: 0,
    fighter: { name: 'Pekoe', stats, integrity: MAX_INTEGRITY, maxIntegrity: MAX_INTEGRITY },
    opponent: {
      name: opponent.name,
      stats: opponent.stats,
      integrity: opponent.maxIntegrity,
      maxIntegrity: opponent.maxIntegrity,
    },
  };
};

describe('SeededRng', () => {
  it('is deterministic per seed', () => {
    const a = new SeededRng(42);
    const b = new SeededRng(42);
    for (let i = 0; i < 100; i++) expect(a.next()).toBe(b.next());
  });
  it('range stays inclusive-bounded', () => {
    const rng = new SeededRng(7);
    for (let i = 0; i < 1000; i++) {
      const v = rng.range(1, 3);
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(3);
    }
  });
  it('statToChance is 0 at 0 and approaches 1', () => {
    expect(statToChance(0, 10)).toBe(0);
    expect(statToChance(10, 10)).toBeCloseTo(0.5);
    expect(statToChance(1000, 10)).toBeGreaterThan(0.98);
  });
});

describe('opponent generation', () => {
  it('is deterministic and budget-fair', () => {
    const a = generateOpponent(123);
    const b = generateOpponent(123);
    expect(a).toEqual(b);
    const total = Object.values(a.stats).reduce((s, v) => s + v, 0);
    expect(total).toBe(50 + LEAN_BUDGET); // 5 × BASE_STAT + the fighter lean budget
  });
});

describe('resolveUntil', () => {
  it('replays identically for the same seed', () => {
    const first = resolveUntil(makeState(9), 9);
    const second = resolveUntil(makeState(9), 9);
    expect(second).toEqual(first);
  });

  it('terminates within MAX_ROUNDS with a valid outcome, across a seed grid', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const result = resolveUntil(makeState(seed), seed);
      expect(result.status).toBe('terminal');
      expect(result.outcome).not.toBeNull();
      expect(result.state.round).toBeLessThanOrEqual(MAX_ROUNDS);
      expect(Number.isInteger(result.state.fighter.integrity)).toBe(true);
      expect(result.state.fighter.integrity).toBeGreaterThanOrEqual(0);
      expect(result.state.opponent.integrity).toBeGreaterThanOrEqual(0);
    }
  });

  it('emits schema-valid events with non-empty reasons on every action', () => {
    const { events } = resolveUntil(makeState(31), 31);
    expect(events.length).toBeGreaterThan(0);
    for (const event of events) {
      expect(BoutEventSchema.safeParse(event).success).toBe(true);
      if (event.type === 'action') expect(event.reason.length).toBeGreaterThan(0);
    }
  });

  it('ends the round instantly on a KO — no post-KO events', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const { events, outcome } = resolveUntil(makeState(seed), seed);
      if (outcome?.method !== 'ko') continue;
      const koIndex = events.findIndex((e) => e.type === 'ko');
      expect(koIndex).toBe(events.length - 1);
    }
  });

  it('pauses at an injected intervention point and resumes deterministically', () => {
    const pauseAtThree = (round: number): string | null =>
      round === 3 ? 'Corner call: press or protect?' : null;

    const paused = resolveUntil(makeState(5), 5, pauseAtThree);
    expect(paused.status).toBe('paused');
    expect(paused.outcome).toBeNull();
    expect(paused.state.round).toBe(2);
    expect(paused.events.at(-1)).toMatchObject({ type: 'intervention_point', round: 3 });

    // Resuming (no further pause) must land exactly where the
    // uninterrupted bout lands — per-round RNG makes this exact.
    const resumed = resolveUntil(paused.state, 5);
    const straight = resolveUntil(makeState(5), 5);
    expect(resumed.state).toEqual(straight.state);
    expect(resumed.outcome).toEqual(straight.outcome);
  });

  it('is not first-mover-decided: both sides win across the seed grid', () => {
    let fighterWins = 0;
    let opponentWins = 0;
    for (let seed = 1; seed <= 200; seed++) {
      const { outcome } = resolveUntil(makeState(seed), seed);
      if (outcome?.winner === 'fighter') fighterWins += 1;
      else opponentWins += 1;
    }
    expect(fighterWins).toBeGreaterThan(20);
    expect(opponentWins).toBeGreaterThan(20);
  });
});
