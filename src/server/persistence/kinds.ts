// ============================================================
// Binary Boxer — Durable record kinds (v1)
// The registry the migration runner operates on. Bump `latest` and
// add a migrations[n] entry whenever a shape changes; contracts
// always describe the CURRENT shape.
// ============================================================

import {
  FightRecordSchema,
  FighterRecordSchema,
  GymRecordSchema,
  type FightRecord,
  type FighterRecord,
  type GymRecord,
} from '../../shared/contracts';
import type { RecordKind } from './records';

export const GYM_RECORD: RecordKind<GymRecord> = {
  kind: 'gym',
  latest: 1,
  schema: GymRecordSchema,
  migrations: {},
};

export const FIGHTER_RECORD: RecordKind<FighterRecord> = {
  kind: 'fighter',
  latest: 1,
  schema: FighterRecordSchema,
  migrations: {},
};

/** Transient (TTL'd) but still enveloped: a mid-bout deploy must not
 * misread an in-flight fight. */
export const FIGHT_RECORD: RecordKind<FightRecord> = {
  kind: 'fight',
  latest: 1,
  schema: FightRecordSchema,
  migrations: {},
};
