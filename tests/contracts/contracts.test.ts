// ============================================================
// Contract schema tests — the fight protocol and gym records are
// runtime-validated; these tests pin the validation behaviour.
// ============================================================

import { describe, expect, it } from 'vitest';
import {
  AcknowledgeResponseSchema,
  AdvanceRequestSchema,
  BoutEventSchema,
  CONTRACT_VERSION,
  FightRecordSchema,
  FightSnapshotSchema,
  FighterRecordSchema,
  GymRecordSchema,
  LanguagePairSchema,
  RevisionConflictResponseSchema,
  StartBoutRequestSchema,
  StatKeySchema,
  emptyGrowthSources,
  emptyRecord,
  errorResponse,
} from '../../src/shared/contracts';

const validFighter = () => ({
  fighterId: 'f-pekoe-1',
  name: 'Pekoe',
  languages: ['python', 'lua'] as const,
  growthSources: emptyGrowthSources(),
  installedPrograms: [],
  condition: { integrity: 100 },
  origin: 'founding' as const,
  record: emptyRecord(),
  createdAt: 1_752_000_000_000,
});

const validGym = () => ({
  username: 'testcoach',
  gymName: 'Kettleworks',
  generation: 1,
  lamps: 3,
  prestige: 0,
  scrap: 0,
  roster: ['f-pekoe-1'],
  staffWoken: [],
  storybook: { pending: [], read: [] },
  record: emptyRecord(),
  createdAt: 1_752_000_000_000,
  updatedAt: 1_752_000_000_000,
});

describe('language pair', () => {
  it('accepts two distinct languages', () => {
    expect(LanguagePairSchema.parse(['rust', 'go'])).toEqual(['rust', 'go']);
  });
  it('rejects identical languages', () => {
    expect(LanguagePairSchema.safeParse(['rust', 'rust']).success).toBe(false);
  });
  it('rejects unknown languages', () => {
    expect(LanguagePairSchema.safeParse(['rust', 'cobol']).success).toBe(false);
  });
});

describe('gym + fighter records', () => {
  it('parses a valid fighter', () => {
    expect(FighterRecordSchema.parse(validFighter()).name).toBe('Pekoe');
  });
  it('rejects integrity outside 0-100', () => {
    const bad = { ...validFighter(), condition: { integrity: 101 } };
    expect(FighterRecordSchema.safeParse(bad).success).toBe(false);
  });
  it('parses a valid gym and caps roster at 5', () => {
    expect(GymRecordSchema.parse(validGym()).lamps).toBe(3);
    const overfull = { ...validGym(), roster: ['a', 'b', 'c', 'd', 'e', 'f'] };
    expect(GymRecordSchema.safeParse(overfull).success).toBe(false);
  });
  it('rejects unknown staff ranks', () => {
    const bad = { ...validGym(), staffWoken: ['dragon'] };
    expect(GymRecordSchema.safeParse(bad).success).toBe(false);
  });
});

describe('bout protocol', () => {
  it('requires a non-trivial commandId', () => {
    expect(StartBoutRequestSchema.safeParse({ commandId: 'short' }).success).toBe(false);
    expect(StartBoutRequestSchema.safeParse({ commandId: 'cmd-0123456789' }).success).toBe(true);
  });
  it('rejects a negative revision', () => {
    const bad = { fightId: 'x', revision: -1, commandId: 'cmd-0123456789' };
    expect(AdvanceRequestSchema.safeParse(bad).success).toBe(false);
  });
  it('action events REQUIRE a non-empty reason (legibility is contractual)', () => {
    const base = {
      type: 'action',
      round: 1,
      actor: 'fighter',
      move: 'jab',
      hit: true,
      damage: 4,
      fighterIntegrityAfter: 100,
      opponentIntegrityAfter: 96,
    };
    expect(BoutEventSchema.safeParse({ ...base, reason: '' }).success).toBe(false);
    expect(BoutEventSchema.safeParse({ ...base, reason: 'baseline: opening jab' }).success).toBe(
      true,
    );
  });
  it('round-trips a fight record with a command cache', () => {
    const record = {
      fightId: 'bout-1',
      username: 'testcoach',
      fighterId: 'f-pekoe-1',
      seed: 42,
      revision: 3,
      phase: 'resolved',
      round: 5,
      fighterName: 'Pekoe',
      fighterStats: { power: 10, speed: 10, technique: 10, stamina: 10, chin: 10 },
      fighterIntegrity: 61,
      fighterMaxIntegrity: 100,
      opponent: {
        name: 'Gob',
        rank: 'goblin',
        stats: { power: 9, speed: 9, technique: 9, stamina: 9, chin: 9 },
        maxIntegrity: 100,
      },
      opponentIntegrity: 0,
      outcome: { winner: 'fighter', method: 'ko' },
      stagedRewards: { fightLearning: { technique: 1 }, scrap: 10, prestige: 5 },
      commandCache: { 'cmd-0123456789': '{"cached":"response"}' },
      commandOrder: ['cmd-0123456789'],
      createdAt: 1_752_000_000_000,
      updatedAt: 1_752_000_000_001,
    };
    const parsed = FightRecordSchema.parse(record);
    expect(parsed.stagedRewards?.scrap).toBe(10);
    expect(FightSnapshotSchema.safeParse({
      fightId: parsed.fightId,
      phase: parsed.phase,
      revision: parsed.revision,
      round: parsed.round,
      fighter: {
        fighterId: parsed.fighterId,
        name: parsed.fighterName,
        stats: parsed.fighterStats,
        integrity: parsed.fighterIntegrity,
        maxIntegrity: parsed.fighterMaxIntegrity,
      },
      opponent: {
        name: parsed.opponent.name,
        rank: parsed.opponent.rank,
        integrity: parsed.opponentIntegrity,
        maxIntegrity: parsed.opponent.maxIntegrity,
      },
      outcome: parsed.outcome,
      stagedRewards: parsed.stagedRewards,
    }).success).toBe(true);
  });
  it('phase enum covers exactly the spec §6 set', () => {
    expect(FightRecordSchema.shape.phase.options).toEqual([
      'running',
      'awaiting_intervention',
      'resolved',
      'acknowledged',
    ]);
  });
});

describe('envelopes', () => {
  it('stamps the contract version on errors', () => {
    const err = errorResponse('NOT_FOUND', 'no gym');
    expect(err.contractVersion).toBe(CONTRACT_VERSION);
  });
  it('revision conflicts carry the authoritative snapshot', () => {
    const snapshot = {
      fightId: 'bout-1',
      phase: 'running',
      revision: 4,
      round: 2,
      fighter: {
        fighterId: 'f1',
        name: 'Pekoe',
        stats: { power: 1, speed: 1, technique: 1, stamina: 1, chin: 1 },
        integrity: 50,
        maxIntegrity: 100,
      },
      opponent: {
        name: 'Gob',
        rank: 'goblin',
        integrity: 40,
        maxIntegrity: 100,
      },
      outcome: null,
      stagedRewards: null,
    };
    const conflict = {
      status: 'error',
      code: 'REVISION_CONFLICT',
      message: 'stale revision',
      contractVersion: CONTRACT_VERSION,
      fight: snapshot,
    };
    expect(RevisionConflictResponseSchema.safeParse(conflict).success).toBe(true);
  });
  it('acknowledge responses expose committed gym totals', () => {
    const ok = {
      status: 'ok',
      type: 'bout_acknowledged',
      contractVersion: CONTRACT_VERSION,
      rewards: { fightLearning: {}, scrap: 10, prestige: 5 },
      gym: { prestige: 5, scrap: 10, lamps: 3 },
    };
    expect(AcknowledgeResponseSchema.safeParse(ok).success).toBe(true);
  });
});

describe('stat keys', () => {
  it('are the five effectiveness-only keys', () => {
    expect(StatKeySchema.options).toEqual(['power', 'speed', 'technique', 'stamina', 'chin']);
  });
});
