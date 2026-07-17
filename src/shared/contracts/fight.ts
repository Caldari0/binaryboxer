// ============================================================
// Binary Boxer — Transactional bout protocol (contract)
// fightId · revision · commandId · phases (spec §6). Rewards are
// staged once on resolve and committed exactly once by an
// idempotent acknowledge. `advance` is BATCHED: it resolves rounds
// until the next intervention point or the end and returns an
// event batch — never one HTTP request per exchange.
//
// Legibility is contractual: every `action` event carries a
// non-empty `reason`. The Gate 0 baseline policy emits mechanical
// reasons; the Gate 1 decision model replaces the policy, not the
// contract. Move/event vocabularies may evolve at Gate 1 without
// migrations because fight records are transient (TTL'd).
// ============================================================

import { z } from 'zod';
import { CONTRACT_VERSION, ErrorCodeSchema } from './common';
import { GoblinRankSchema } from './gym';
import { StatBlockSchema, StatDeltaSchema } from './stats';

export const FightPhaseSchema = z.enum([
  'running',
  'awaiting_intervention',
  'resolved',
  'acknowledged',
]);
export type FightPhase = z.infer<typeof FightPhaseSchema>;

/** Gate 0 baseline move set — deliberately tiny; Gate 1 owns the real catalog. */
export const MoveIdSchema = z.enum(['jab', 'cross', 'guard']);
export type MoveId = z.infer<typeof MoveIdSchema>;

export const BoutSideSchema = z.enum(['fighter', 'opponent']);
export type BoutSide = z.infer<typeof BoutSideSchema>;

export const OpponentSchema = z.object({
  name: z.string().min(1),
  rank: GoblinRankSchema,
  stats: StatBlockSchema,
  maxIntegrity: z.number().int().positive(),
});
export type Opponent = z.infer<typeof OpponentSchema>;

// --- Events (the advance batch) ------------------------------

export const BoutEventSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('round_start'), round: z.number().int().positive() }),
  z.object({
    type: z.literal('action'),
    round: z.number().int().positive(),
    actor: BoutSideSchema,
    move: MoveIdSchema,
    /** The narrated why — REQUIRED (legible-autonomy pillar). */
    reason: z.string().min(1),
    hit: z.boolean(),
    damage: z.number().int().min(0),
    fighterIntegrityAfter: z.number().int().min(0),
    opponentIntegrityAfter: z.number().int().min(0),
  }),
  z.object({
    type: z.literal('intervention_point'),
    round: z.number().int().positive(),
    prompt: z.string().min(1),
  }),
  z.object({
    type: z.literal('ko'),
    round: z.number().int().positive(),
    loser: BoutSideSchema,
  }),
  z.object({
    type: z.literal('decision'),
    round: z.number().int().positive(),
    winner: BoutSideSchema,
    reason: z.string().min(1),
  }),
]);
export type BoutEvent = z.infer<typeof BoutEventSchema>;

// --- Rewards (staged on resolve, committed on acknowledge) ---

export const RewardsSchema = z.object({
  /** Placeholder magnitudes at Gate 0; fixed-budget attribution is Gate 1. */
  fightLearning: StatDeltaSchema,
  scrap: z.number().int().min(0),
  prestige: z.number().int().min(0),
});
export type Rewards = z.infer<typeof RewardsSchema>;

export const OutcomeSchema = z.object({
  winner: BoutSideSchema,
  method: z.enum(['ko', 'decision']),
});
export type Outcome = z.infer<typeof OutcomeSchema>;

// --- Snapshot (client-visible fight state) -------------------

export const FightSnapshotSchema = z.object({
  fightId: z.string().min(1),
  phase: FightPhaseSchema,
  revision: z.number().int().min(0),
  round: z.number().int().min(0),
  fighter: z.object({
    fighterId: z.string().min(1),
    name: z.string().min(1),
    stats: StatBlockSchema,
    integrity: z.number().int().min(0),
    maxIntegrity: z.number().int().positive(),
  }),
  opponent: z.object({
    name: z.string().min(1),
    rank: GoblinRankSchema,
    integrity: z.number().int().min(0),
    maxIntegrity: z.number().int().positive(),
  }),
  outcome: OutcomeSchema.nullable(),
  stagedRewards: RewardsSchema.nullable(),
});
export type FightSnapshot = z.infer<typeof FightSnapshotSchema>;

// --- Persisted fight record (server-side; transient, TTL'd) --

export const FightRecordSchema = z.object({
  fightId: z.string().min(1),
  username: z.string().min(1),
  fighterId: z.string().min(1),
  seed: z.number().int(),
  revision: z.number().int().min(0),
  phase: FightPhaseSchema,
  round: z.number().int().min(0),
  fighterName: z.string().min(1),
  fighterStats: StatBlockSchema,
  fighterIntegrity: z.number().int().min(0),
  fighterMaxIntegrity: z.number().int().positive(),
  opponent: OpponentSchema,
  opponentIntegrity: z.number().int().min(0),
  outcome: OutcomeSchema.nullable(),
  stagedRewards: RewardsSchema.nullable(),
  /** commandId → serialized response; replays return byte-identical bodies. */
  commandCache: z.record(z.string(), z.string()).default({}),
  /** Insertion order of commandCache keys, oldest first (for capping). */
  commandOrder: z.array(z.string()).default([]),
  createdAt: z.number().int().positive(),
  updatedAt: z.number().int().positive(),
});
export type FightRecord = z.infer<typeof FightRecordSchema>;

// --- Requests ------------------------------------------------

const CommandIdSchema = z.string().min(8).max(64);

export const StartBoutRequestSchema = z.object({
  commandId: CommandIdSchema,
  /** Optional roster pick; defaults to the gym's first fighter at Gate 0. */
  fighterId: z.string().min(1).optional(),
});
export type StartBoutRequest = z.infer<typeof StartBoutRequestSchema>;

export const AdvanceRequestSchema = z.object({
  fightId: z.string().min(1),
  revision: z.number().int().min(0),
  commandId: CommandIdSchema,
});
export type AdvanceRequest = z.infer<typeof AdvanceRequestSchema>;

export const AcknowledgeRequestSchema = AdvanceRequestSchema;
export type AcknowledgeRequest = z.infer<typeof AcknowledgeRequestSchema>;

// --- Responses -----------------------------------------------

export const StartBoutResponseSchema = z.object({
  status: z.literal('ok'),
  type: z.literal('bout_started'),
  contractVersion: z.literal(CONTRACT_VERSION),
  fight: FightSnapshotSchema,
});
export type StartBoutResponse = z.infer<typeof StartBoutResponseSchema>;

export const AdvanceResponseSchema = z.object({
  status: z.literal('ok'),
  type: z.literal('bout_advanced'),
  contractVersion: z.literal(CONTRACT_VERSION),
  fight: FightSnapshotSchema,
  events: z.array(BoutEventSchema),
});
export type AdvanceResponse = z.infer<typeof AdvanceResponseSchema>;

export const AcknowledgeResponseSchema = z.object({
  status: z.literal('ok'),
  type: z.literal('bout_acknowledged'),
  contractVersion: z.literal(CONTRACT_VERSION),
  rewards: RewardsSchema,
  gym: z.object({
    prestige: z.number().int().min(0),
    scrap: z.number().int().min(0),
    lamps: z.number().int().min(0),
  }),
});
export type AcknowledgeResponse = z.infer<typeof AcknowledgeResponseSchema>;

export const CurrentBoutResponseSchema = z.object({
  status: z.literal('ok'),
  type: z.literal('bout_current'),
  contractVersion: z.literal(CONTRACT_VERSION),
  fight: FightSnapshotSchema.nullable(),
});
export type CurrentBoutResponse = z.infer<typeof CurrentBoutResponseSchema>;

/** Revision conflicts return the authoritative snapshot so clients resync. */
export const RevisionConflictResponseSchema = z.object({
  status: z.literal('error'),
  code: ErrorCodeSchema.extract(['REVISION_CONFLICT']),
  message: z.string().min(1),
  contractVersion: z.literal(CONTRACT_VERSION),
  fight: FightSnapshotSchema,
});
export type RevisionConflictResponse = z.infer<typeof RevisionConflictResponseSchema>;
