// ============================================================
// Binary Boxer — Bout resolution core (pure, deterministic)
// Gate 0 scope: a minimal, honest engine that terminates, stays in
// bounds, and narrates every action — the substrate the command
// service batches over. The Gate 1 decision model (gameplan-aware,
// tell-reading, program-hooked) REPLACES pickBaselineMove and the
// damage shape without touching the protocol around them.
//
// Design invariants (tested):
// - Same seed + same inputs ⇒ identical event batches (replay).
// - A KO ends the round instantly (no post-KO counter events — the
//   donor's simultaneous-KO turn-order bug cannot exist here).
// - Integrity is always an integer in [0, max]; never NaN.
// - Every `action` event carries a non-empty reason.
// ============================================================

import type { BoutEvent, MoveId, Outcome, StatBlock } from '../../shared/contracts';
import { SeededRng, statToChance } from './rng';

export const MAX_ROUNDS = 12;

export type BoutSideState = {
  name: string;
  stats: StatBlock;
  integrity: number;
  maxIntegrity: number;
};

export type BoutState = {
  round: number;
  fighter: BoutSideState;
  opponent: BoutSideState;
};

/** Injectable intervention mechanism (story-presentation #5 pattern:
 * mechanism at Gate 0, policy at Gate 1). Return a prompt to pause
 * BEFORE the given round; null to continue. Production Gate 0 config
 * never pauses. */
export type PauseRule = (round: number, state: BoutState) => string | null;

export type ResolveResult = {
  events: BoutEvent[];
  state: BoutState;
  status: 'paused' | 'terminal';
  outcome: Outcome | null;
};

type Actor = 'fighter' | 'opponent';

type Pick = { move: MoveId; reason: string };

const pickBaselineMove = (
  self: BoutSideState,
  other: BoutSideState,
  rng: SeededRng,
): Pick => {
  const hurt = self.integrity <= self.maxIntegrity * 0.3;
  if (hurt && rng.chance(0.5)) {
    return { move: 'guard', reason: 'baseline: integrity low — covering up' };
  }
  const seesOpening =
    self.stats.technique >= other.stats.technique && rng.chance(0.35);
  if (seesOpening) {
    return { move: 'cross', reason: 'baseline: opening spotted — committing the cross' };
  }
  return { move: 'jab', reason: 'baseline: staying busy behind the jab' };
};

/** Endurance factor: high stamina keeps late-round output up. */
const enduranceFactor = (stamina: number, round: number): number => {
  const endurance = statToChance(stamina, 8); // ~0.56 at base 10
  const fade = (round / MAX_ROUNDS) * (1 - endurance);
  return 1 - fade * 0.75;
};

const attackDamage = (
  attacker: BoutSideState,
  defender: BoutSideState,
  move: MoveId,
  defenderGuarding: boolean,
  round: number,
  rng: SeededRng,
): { hit: boolean; damage: number } => {
  const accuracyHalf = move === 'cross' ? 14 : 8; // crosses are harder to land
  // Technique carries accuracy; speed assists (it already buys turn order).
  const accuracyStat = attacker.stats.technique * 1.0 + attacker.stats.speed * 0.5;
  const hitChance = statToChance(accuracyStat, accuracyHalf * 2);
  if (!rng.chance(hitChance)) return { hit: false, damage: 0 };

  // Damage offset keeps power's MARGINAL value comparable to the other
  // stats' (raw ×power made +1 power worth ~3× any other point).
  const base =
    move === 'cross' ? (attacker.stats.power + 14) * 2.4 : (attacker.stats.power + 14) * 1.45;
  const mitigation = 1 - statToChance(defender.stats.chin, 22); // chin soaks
  let damage = base * mitigation * enduranceFactor(attacker.stats.stamina, round);
  if (defenderGuarding) damage *= 0.4;
  const varied = damage * (0.85 + rng.next() * 0.3);
  return { hit: true, damage: Math.max(1, Math.round(varied)) };
};

/**
 * Resolve exactly one round. Returns the round's events and the next
 * state; sets `outcome` when the bout ends this round.
 */
export const resolveRound = (
  state: BoutState,
  rng: SeededRng,
): { events: BoutEvent[]; state: BoutState; outcome: Outcome | null } => {
  const round = state.round + 1;
  const events: BoutEvent[] = [{ type: 'round_start', round }];

  const fighter: BoutSideState = { ...state.fighter };
  const opponent: BoutSideState = { ...state.opponent };

  const fighterPick = pickBaselineMove(fighter, opponent, rng);
  const opponentPick = pickBaselineMove(opponent, fighter, rng);

  const fighterFirst =
    fighter.stats.speed > opponent.stats.speed ||
    (fighter.stats.speed === opponent.stats.speed && rng.chance(0.5));

  const order: Actor[] = fighterFirst ? ['fighter', 'opponent'] : ['opponent', 'fighter'];
  let outcome: Outcome | null = null;

  for (const actor of order) {
    const self = actor === 'fighter' ? fighter : opponent;
    const other = actor === 'fighter' ? opponent : fighter;
    const pick = actor === 'fighter' ? fighterPick : opponentPick;
    const otherPick = actor === 'fighter' ? opponentPick : fighterPick;

    if (pick.move === 'guard') {
      events.push({
        type: 'action',
        round,
        actor,
        move: 'guard',
        reason: pick.reason,
        hit: false,
        damage: 0,
        fighterIntegrityAfter: fighter.integrity,
        opponentIntegrityAfter: opponent.integrity,
      });
      continue;
    }

    const { hit, damage } = attackDamage(
      self,
      other,
      pick.move,
      otherPick.move === 'guard',
      round,
      rng,
    );
    other.integrity = Math.max(0, other.integrity - damage);
    events.push({
      type: 'action',
      round,
      actor,
      move: pick.move,
      reason: pick.reason,
      hit,
      damage,
      fighterIntegrityAfter: fighter.integrity,
      opponentIntegrityAfter: opponent.integrity,
    });

    if (other.integrity <= 0) {
      const loser: Actor = actor === 'fighter' ? 'opponent' : 'fighter';
      events.push({ type: 'ko', round, loser });
      outcome = { winner: actor, method: 'ko' };
      break; // a KO ends the round instantly
    }
  }

  const next: BoutState = { round, fighter, opponent };

  if (!outcome && round >= MAX_ROUNDS) {
    const fighterRatio = fighter.integrity / fighter.maxIntegrity;
    const opponentRatio = opponent.integrity / opponent.maxIntegrity;
    const winner: Actor = fighterRatio >= opponentRatio ? 'fighter' : 'opponent';
    events.push({
      type: 'decision',
      round,
      winner,
      reason: `decision: more integrity after ${MAX_ROUNDS} rounds`,
    });
    outcome = { winner, method: 'decision' };
  }

  return { events, state: next, outcome };
};

/**
 * The batched core: resolve rounds until the pause rule fires, the
 * bout ends, or the round cap is hit. One call = one event batch —
 * never one request per exchange (spec §6).
 */
export const resolveUntil = (
  initial: BoutState,
  seed: number,
  pauseRule: PauseRule | null = null,
): ResolveResult => {
  let state = initial;
  const events: BoutEvent[] = [];

  while (state.round < MAX_ROUNDS) {
    const upcoming = state.round + 1;
    const prompt = pauseRule?.(upcoming, state) ?? null;
    if (prompt !== null) {
      events.push({ type: 'intervention_point', round: upcoming, prompt });
      return { events, state, status: 'paused', outcome: null };
    }

    // Per-round RNG derived from (seed, round): re-resolution after a
    // pause or replay of a cached command is bit-identical.
    const rng = new SeededRng(seed + upcoming * 997);
    const result = resolveRound(state, rng);
    events.push(...result.events);
    state = result.state;
    if (result.outcome) {
      return { events, state, status: 'terminal', outcome: result.outcome };
    }
  }

  // Unreachable: resolveRound emits a decision at MAX_ROUNDS.
  throw new Error('bout exceeded MAX_ROUNDS without an outcome');
};
