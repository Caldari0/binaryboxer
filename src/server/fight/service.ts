// ============================================================
// Binary Boxer — Transactional bout command service
// The Gate 0 heart: fightId · revision · commandId · phase machine.
// Guarantees (all proven against MemoryStore in tests):
// - commandId replay returns the CACHED response — never re-executes.
// - Rewards are staged once at resolve and committed exactly once by
//   acknowledge inside a watch/multi/exec transaction over the
//   fight + gym + fighter records; a second acknowledge (new
//   commandId) is PHASE_INVALID and changes nothing.
// - Stale revisions get a 409 carrying the authoritative snapshot.
// - `advance` is batched: one command resolves to the next
//   intervention point or the end (Gate 0 config never pauses).
// Written against the KVStore port; routes bind DevvitStore.
// ============================================================

import {
  CONTRACT_VERSION,
  errorResponse,
  type AcknowledgeRequest,
  type AcknowledgeResponse,
  type AdvanceRequest,
  type AdvanceResponse,
  type CurrentBoutResponse,
  type ErrorResponse,
  type FightRecord,
  type FightSnapshot,
  type FighterRecord,
  type GymRecord,
  type Rewards,
  type RevisionConflictResponse,
  type StartBoutRequest,
  type StartBoutResponse,
} from '../../shared/contracts';
import { FIGHT_TTL_SECONDS, MAX_INTEGRITY } from '../gym/constants';
import { deriveStats } from '../gym/derive';
import { ensureGym, loadFighter, loadGym } from '../gym/store';
import { activeFightKey, fightKey, fighterKey, gymKey } from '../persistence/keys';
import { FIGHT_RECORD, FIGHTER_RECORD, GYM_RECORD } from '../persistence/kinds';
import { decodeRecord, encodeRecord, loadRecord } from '../persistence/records';
import type { KVStore } from '../persistence/store';
import { generateOpponent } from './opponent';
import { resolveUntil, type BoutState } from './resolution';

// --- Gate 0 placeholder reward table -------------------------
// The SHAPE (staged → committed-once) is the Gate 0 deliverable;
// fixed-budget growth attribution replaces these numbers at Gate 1.
const REWARD_WIN: Rewards = { fightLearning: { technique: 1 }, scrap: 12, prestige: 5 };
const REWARD_LOSS: Rewards = { fightLearning: {}, scrap: 5, prestige: 1 };

/** Post-bout chassis floor: the corner patches a beaten fighter up
 * enough to stand (prevents a repair-less Gate 0 softlock; real
 * recovery rules arrive with Gate 1's corner). */
const POST_BOUT_INTEGRITY_FLOOR = 10;

const COMMAND_CACHE_LIMIT = 8;
const TX_RETRIES = 3;

export type ServiceOk<T> = { ok: true; response: T };
export type ServiceError = {
  ok: false;
  status: 400 | 401 | 404 | 409 | 500;
  response: ErrorResponse | RevisionConflictResponse;
};
export type ServiceResult<T> = ServiceOk<T> | ServiceError;

const err = (
  status: ServiceError['status'],
  code: Parameters<typeof errorResponse>[0],
  message: string,
): ServiceError => ({ ok: false, status, response: errorResponse(code, message) });

const toSnapshot = (fight: FightRecord): FightSnapshot => ({
  fightId: fight.fightId,
  phase: fight.phase,
  revision: fight.revision,
  round: fight.round,
  fighter: {
    fighterId: fight.fighterId,
    name: fight.fighterName,
    stats: fight.fighterStats,
    integrity: fight.fighterIntegrity,
    maxIntegrity: fight.fighterMaxIntegrity,
  },
  opponent: {
    name: fight.opponent.name,
    rank: fight.opponent.rank,
    integrity: fight.opponentIntegrity,
    maxIntegrity: fight.opponent.maxIntegrity,
  },
  outcome: fight.outcome,
  stagedRewards: fight.stagedRewards,
});

const revisionConflict = (fight: FightRecord): ServiceError => ({
  ok: false,
  status: 409,
  response: {
    status: 'error',
    code: 'REVISION_CONFLICT',
    message: `stale revision: fight is at ${fight.revision}`,
    contractVersion: CONTRACT_VERSION,
    fight: toSnapshot(fight),
  },
});

const cachedResponse = <T>(fight: FightRecord, commandId: string): T | null => {
  const raw = fight.commandCache[commandId];
  return raw === undefined ? null : (JSON.parse(raw) as T);
};

const cacheCommand = (fight: FightRecord, commandId: string, response: unknown): void => {
  fight.commandCache[commandId] = JSON.stringify(response);
  fight.commandOrder.push(commandId);
  while (fight.commandOrder.length > COMMAND_CACHE_LIMIT) {
    const evicted = fight.commandOrder.shift();
    if (evicted !== undefined) delete fight.commandCache[evicted];
  }
};

const hashString = (input: string): number => {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (Math.imul(hash, 31) + input.charCodeAt(i)) | 0;
  }
  return hash;
};

const loadOwnedFight = async (
  store: KVStore,
  username: string,
  fightId: string,
): Promise<FightRecord | null> => {
  const decoded = await loadRecord(store, fightKey(fightId), FIGHT_RECORD);
  if (!decoded) return null;
  // Ownership check: never leak another user's bout (return null → 404).
  if (decoded.data.username !== username) return null;
  return decoded.data;
};

// --- start ---------------------------------------------------

export const startBout = async (
  store: KVStore,
  username: string,
  request: StartBoutRequest,
  now: number,
): Promise<ServiceResult<StartBoutResponse>> => {
  for (let attempt = 0; attempt < TX_RETRIES; attempt++) {
    const pointerKey = activeFightKey(username);
    const tx = await store.watch(pointerKey);

    const activeId = await store.get(pointerKey);
    if (activeId !== undefined) {
      const active = await loadOwnedFight(store, username, activeId);
      if (active) {
        const replay = cachedResponse<StartBoutResponse>(active, request.commandId);
        if (replay) {
          await tx.discard();
          return { ok: true, response: replay };
        }
        if (active.phase !== 'acknowledged') {
          await tx.discard();
          return err(409, 'CONFLICT', 'a bout is already in progress');
        }
        // Acknowledged bout: fall through and start a fresh one.
      }
      // Dangling pointer (fight TTL'd away): fall through.
    }

    const { gym, foundingFighter } = await ensureGym(store, username, now);
    const fighterId = request.fighterId ?? gym.roster[0] ?? foundingFighter.fighterId;
    if (!gym.roster.includes(fighterId)) {
      await tx.discard();
      return err(404, 'NOT_FOUND', `fighter ${fighterId} is not on the roster`);
    }
    const fighter = await loadFighter(store, username, fighterId);
    if (!fighter) {
      await tx.discard();
      return err(404, 'NOT_FOUND', `fighter ${fighterId} not found`);
    }
    if (fighter.condition.integrity <= 0) {
      await tx.discard();
      return err(409, 'CONFLICT', `${fighter.name} cannot answer the bell at 0 integrity`);
    }

    const seed = (now ^ hashString(username)) | 0;
    const fight: FightRecord = {
      fightId: `bout-${username}-${now.toString(36)}`,
      username,
      fighterId,
      seed,
      revision: 0,
      phase: 'running',
      round: 0,
      fighterName: fighter.name,
      fighterStats: deriveStats(fighter.languages, fighter.growthSources),
      fighterIntegrity: fighter.condition.integrity,
      fighterMaxIntegrity: MAX_INTEGRITY,
      opponent: generateOpponent(seed),
      opponentIntegrity: MAX_INTEGRITY,
      outcome: null,
      stagedRewards: null,
      commandCache: {},
      commandOrder: [],
      createdAt: now,
      updatedAt: now,
    };

    const response: StartBoutResponse = {
      status: 'ok',
      type: 'bout_started',
      contractVersion: CONTRACT_VERSION,
      fight: toSnapshot(fight),
    };
    cacheCommand(fight, request.commandId, response);

    tx.set(fightKey(fight.fightId), encodeRecord(FIGHT_RECORD, fight), {
      ttlSeconds: FIGHT_TTL_SECONDS,
    });
    tx.set(pointerKey, fight.fightId, { ttlSeconds: FIGHT_TTL_SECONDS });
    if (await tx.exec()) {
      return { ok: true, response };
    }
    // Pointer raced (concurrent start) — loop re-reads and replays/rejects.
  }
  return err(409, 'CONFLICT', 'could not start the bout — please retry');
};

// --- advance -------------------------------------------------

export const advanceBout = async (
  store: KVStore,
  username: string,
  request: AdvanceRequest,
  now: number,
): Promise<ServiceResult<AdvanceResponse>> => {
  for (let attempt = 0; attempt < TX_RETRIES; attempt++) {
    const key = fightKey(request.fightId);
    const tx = await store.watch(key);

    const fight = await loadOwnedFight(store, username, request.fightId);
    if (!fight) {
      await tx.discard();
      return err(404, 'NOT_FOUND', 'no such bout');
    }
    const replay = cachedResponse<AdvanceResponse>(fight, request.commandId);
    if (replay) {
      await tx.discard();
      return { ok: true, response: replay };
    }
    if (fight.phase !== 'running') {
      await tx.discard();
      return err(409, 'PHASE_INVALID', `cannot advance a ${fight.phase} bout`);
    }
    if (fight.revision !== request.revision) {
      await tx.discard();
      return revisionConflict(fight);
    }

    const initial: BoutState = {
      round: fight.round,
      fighter: {
        name: fight.fighterName,
        stats: fight.fighterStats,
        integrity: fight.fighterIntegrity,
        maxIntegrity: fight.fighterMaxIntegrity,
      },
      opponent: {
        name: fight.opponent.name,
        stats: fight.opponent.stats,
        integrity: fight.opponentIntegrity,
        maxIntegrity: fight.opponent.maxIntegrity,
      },
    };
    // Gate 0 config: no pause rule — the bout resolves in one batch.
    const result = resolveUntil(initial, fight.seed, null);

    fight.round = result.state.round;
    fight.fighterIntegrity = result.state.fighter.integrity;
    fight.opponentIntegrity = result.state.opponent.integrity;
    fight.revision += 1;
    fight.updatedAt = now;
    if (result.status === 'terminal' && result.outcome) {
      fight.phase = 'resolved';
      fight.outcome = result.outcome;
      fight.stagedRewards = result.outcome.winner === 'fighter' ? REWARD_WIN : REWARD_LOSS;
    } else {
      fight.phase = 'awaiting_intervention';
    }

    const response: AdvanceResponse = {
      status: 'ok',
      type: 'bout_advanced',
      contractVersion: CONTRACT_VERSION,
      fight: toSnapshot(fight),
      events: result.events,
    };
    cacheCommand(fight, request.commandId, response);

    tx.set(key, encodeRecord(FIGHT_RECORD, fight), { ttlSeconds: FIGHT_TTL_SECONDS });
    if (await tx.exec()) {
      return { ok: true, response };
    }
    // Concurrent command raced — loop re-reads (replay or conflict).
  }
  return err(409, 'CONFLICT', 'could not advance the bout — please retry');
};

// --- acknowledge ---------------------------------------------

export const acknowledgeBout = async (
  store: KVStore,
  username: string,
  request: AcknowledgeRequest,
  now: number,
): Promise<ServiceResult<AcknowledgeResponse>> => {
  for (let attempt = 0; attempt < TX_RETRIES; attempt++) {
    const fKey = fightKey(request.fightId);
    const gKey = gymKey(username);

    const fight = await loadOwnedFight(store, username, request.fightId);
    if (!fight) {
      return err(404, 'NOT_FOUND', 'no such bout');
    }
    const frKey = fighterKey(username, fight.fighterId);
    const tx = await store.watch(fKey, gKey, frKey);

    // Re-read inside the watch window so the transaction is sound.
    const watched = await loadOwnedFight(store, username, request.fightId);
    if (!watched) {
      await tx.discard();
      return err(404, 'NOT_FOUND', 'no such bout');
    }
    const replay = cachedResponse<AcknowledgeResponse>(watched, request.commandId);
    if (replay) {
      await tx.discard();
      return { ok: true, response: replay };
    }
    if (watched.phase !== 'resolved') {
      await tx.discard();
      return err(
        409,
        'PHASE_INVALID',
        watched.phase === 'acknowledged'
          ? 'bout already acknowledged — rewards were committed once'
          : `cannot acknowledge a ${watched.phase} bout`,
      );
    }
    if (watched.revision !== request.revision) {
      await tx.discard();
      return revisionConflict(watched);
    }
    const rewards = watched.stagedRewards;
    const outcome = watched.outcome;
    if (!rewards || !outcome) {
      await tx.discard();
      return err(500, 'INTERNAL', 'resolved bout is missing staged rewards');
    }

    const gymRaw = await store.get(gKey);
    const fighterRaw = await store.get(frKey);
    if (gymRaw === undefined || fighterRaw === undefined) {
      await tx.discard();
      return err(500, 'INTERNAL', 'gym or fighter record missing at acknowledge');
    }
    const gym: GymRecord = decodeRecord(GYM_RECORD, gymRaw).data;
    const fighter: FighterRecord = decodeRecord(FIGHTER_RECORD, fighterRaw).data;

    const won = outcome.winner === 'fighter';
    gym.scrap += rewards.scrap;
    gym.prestige += rewards.prestige;
    gym.record.bouts += 1;
    if (won) gym.record.wins += 1;
    else {
      gym.record.losses += 1;
      // A lost fixture takes a light (gym-pivot #8). Generation-end
      // flow (Heart-Gauge transplant) is Gate 1; floor at 0 for now.
      gym.lamps = Math.max(0, gym.lamps - 1);
    }
    gym.updatedAt = now;

    fighter.record.bouts += 1;
    if (won) fighter.record.wins += 1;
    else fighter.record.losses += 1;
    for (const [statKey, delta] of Object.entries(rewards.fightLearning)) {
      const key = statKey as keyof typeof fighter.growthSources.fightLearning;
      fighter.growthSources.fightLearning[key] =
        (fighter.growthSources.fightLearning[key] ?? 0) + (delta ?? 0);
    }
    fighter.condition.integrity = Math.max(POST_BOUT_INTEGRITY_FLOOR, watched.fighterIntegrity);

    const response: AcknowledgeResponse = {
      status: 'ok',
      type: 'bout_acknowledged',
      contractVersion: CONTRACT_VERSION,
      rewards,
      gym: { prestige: gym.prestige, scrap: gym.scrap, lamps: gym.lamps },
    };

    watched.phase = 'acknowledged';
    watched.revision += 1;
    watched.updatedAt = now;
    cacheCommand(watched, request.commandId, response);

    tx.set(fKey, encodeRecord(FIGHT_RECORD, watched), { ttlSeconds: FIGHT_TTL_SECONDS });
    tx.set(gKey, encodeRecord(GYM_RECORD, gym));
    tx.set(frKey, encodeRecord(FIGHTER_RECORD, fighter));
    if (await tx.exec()) {
      return { ok: true, response };
    }
    // A concurrent acknowledge raced us — loop: its cache/phase decides.
  }
  return err(409, 'CONFLICT', 'could not acknowledge the bout — please retry');
};

// --- current (resume support) --------------------------------

export const currentBout = async (
  store: KVStore,
  username: string,
): Promise<ServiceResult<CurrentBoutResponse>> => {
  const gym = await loadGym(store, username);
  const empty: CurrentBoutResponse = {
    status: 'ok',
    type: 'bout_current',
    contractVersion: CONTRACT_VERSION,
    fight: null,
  };
  if (!gym) return { ok: true, response: empty };

  const activeId = await store.get(activeFightKey(username));
  if (activeId === undefined) return { ok: true, response: empty };
  const fight = await loadOwnedFight(store, username, activeId);
  if (!fight || fight.phase === 'acknowledged') return { ok: true, response: empty };
  return {
    ok: true,
    response: { ...empty, fight: toSnapshot(fight) },
  };
};
