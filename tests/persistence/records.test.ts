// ============================================================
// Versioned-record + migration-runner tests.
// ============================================================

import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { emptyGrowthSources, emptyRecord } from '../../src/shared/contracts';
import { GYM_RECORD } from '../../src/server/persistence/kinds';
import { gymKey } from '../../src/server/persistence/keys';
import { MemoryStore } from '../../src/server/persistence/memoryStore';
import {
  MigrationError,
  decodeRecord,
  encodeRecord,
  loadAndHeal,
  loadRecord,
  saveRecord,
  type RecordKind,
} from '../../src/server/persistence/records';

// A synthetic kind with a real two-step migration history:
// v1 {label} → v2 {label, count: 0} → v3 {label, count, tags: []}
const V3Schema = z.object({
  label: z.string(),
  count: z.number().int(),
  tags: z.array(z.string()),
});
const SYNTH: RecordKind<z.infer<typeof V3Schema>> = {
  kind: 'synth',
  latest: 3,
  schema: V3Schema,
  migrations: {
    1: (old) => ({ ...(old as { label: string }), count: 0 }),
    2: (old) => ({ ...(old as { label: string; count: number }), tags: [] }),
  },
};

describe('record envelope + migrations', () => {
  it('round-trips the latest version without migration', () => {
    const raw = encodeRecord(SYNTH, { label: 'x', count: 2, tags: ['a'] });
    const decoded = decodeRecord(SYNTH, raw);
    expect(decoded.migrated).toBe(false);
    expect(decoded.data.tags).toEqual(['a']);
  });

  it('runs the full migration chain from v1', () => {
    const raw = JSON.stringify({ v: 1, data: { label: 'old' } });
    const decoded = decodeRecord(SYNTH, raw);
    expect(decoded.migrated).toBe(true);
    expect(decoded.data).toEqual({ label: 'old', count: 0, tags: [] });
  });

  it('refuses future versions loudly', () => {
    const raw = JSON.stringify({ v: 4, data: {} });
    expect(() => decodeRecord(SYNTH, raw)).toThrow(MigrationError);
  });

  it('refuses gaps in the migration chain', () => {
    const gappy: RecordKind<z.infer<typeof V3Schema>> = {
      ...SYNTH,
      migrations: { 2: SYNTH.migrations[2]! },
    };
    const raw = JSON.stringify({ v: 1, data: { label: 'old' } });
    expect(() => decodeRecord(gappy, raw)).toThrow(/no migration from v1/);
  });

  it('refuses records that are invalid after migration', () => {
    const raw = JSON.stringify({ v: 3, data: { label: 42, count: 0, tags: [] } });
    expect(() => decodeRecord(SYNTH, raw)).toThrow(MigrationError);
  });

  it('refuses envelopes that are not JSON or not enveloped', () => {
    expect(() => decodeRecord(SYNTH, 'not-json')).toThrow(MigrationError);
    expect(() => decodeRecord(SYNTH, JSON.stringify({ data: {} }))).toThrow(MigrationError);
  });
});

describe('store integration', () => {
  it('save/load round-trips a real gym record', async () => {
    const store = new MemoryStore();
    const gym = {
      username: 'coach',
      gymName: 'Kettleworks',
      generation: 1,
      lamps: 3,
      prestige: 0,
      scrap: 0,
      roster: ['f1'],
      staffWoken: [],
      storybook: { pending: [], read: [] },
      record: emptyRecord(),
      createdAt: 1,
      updatedAt: 1,
    };
    await saveRecord(store, gymKey('coach'), GYM_RECORD, gym);
    const loaded = await loadRecord(store, gymKey('coach'), GYM_RECORD);
    expect(loaded?.data.gymName).toBe('Kettleworks');
    expect(loaded?.migrated).toBe(false);
    expect(emptyGrowthSources().manualTraining).toEqual({});
  });

  it('loadAndHeal writes the migrated envelope back once', async () => {
    const store = new MemoryStore();
    await store.set('synth:1', JSON.stringify({ v: 1, data: { label: 'heal-me' } }));
    const healed = await loadAndHeal(store, 'synth:1', SYNTH);
    expect(healed).toEqual({ label: 'heal-me', count: 0, tags: [] });
    // The stored envelope is now at the latest version.
    const raw = await store.get('synth:1');
    expect(JSON.parse(raw!)).toEqual({ v: 3, data: { label: 'heal-me', count: 0, tags: [] } });
  });

  it('returns null for absent records', async () => {
    const store = new MemoryStore();
    expect(await loadRecord(store, 'missing', SYNTH)).toBeNull();
  });
});
