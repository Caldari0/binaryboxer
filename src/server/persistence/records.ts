// ============================================================
// Binary Boxer — Versioned records + migration runner
// Every durable record persists as { v, data }. Loading runs the
// migration chain to the kind's latest version and validates with
// the kind's schema. Unknown FUTURE versions and gaps in the chain
// fail loudly — silent downgrades corrupt saves.
// ============================================================

import type { z } from 'zod';
import type { KVSetOptions, KVStore } from './store';

export class MigrationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MigrationError';
  }
}

export type RecordKind<T> = {
  kind: string;
  latest: number;
  schema: z.ZodType<T>;
  /** migrations[n] transforms v=n data into v=n+1 data. */
  migrations: Record<number, (old: unknown) => unknown>;
};

type Envelope = { v: number; data: unknown };

export const encodeRecord = <T>(kind: RecordKind<T>, data: T): string =>
  JSON.stringify({ v: kind.latest, data } satisfies Envelope);

export type DecodedRecord<T> = { data: T; migrated: boolean };

export const decodeRecord = <T>(kind: RecordKind<T>, raw: string): DecodedRecord<T> => {
  let envelope: Envelope;
  try {
    envelope = JSON.parse(raw) as Envelope;
  } catch {
    throw new MigrationError(`${kind.kind}: stored record is not valid JSON`);
  }
  if (typeof envelope !== 'object' || envelope === null || typeof envelope.v !== 'number') {
    throw new MigrationError(`${kind.kind}: stored record has no version envelope`);
  }

  let { v } = envelope;
  let data: unknown = envelope.data;

  if (v > kind.latest) {
    throw new MigrationError(
      `${kind.kind}: stored v${v} is newer than supported v${kind.latest} — refusing to load`,
    );
  }
  const migrated = v < kind.latest;
  while (v < kind.latest) {
    const step = kind.migrations[v];
    if (!step) {
      throw new MigrationError(`${kind.kind}: no migration from v${v} to v${v + 1}`);
    }
    data = step(data);
    v += 1;
  }

  const parsed = kind.schema.safeParse(data);
  if (!parsed.success) {
    throw new MigrationError(
      `${kind.kind}: record invalid after migration to v${kind.latest}: ${parsed.error.message}`,
    );
  }
  return { data: parsed.data, migrated };
};

export const loadRecord = async <T>(
  store: KVStore,
  key: string,
  kind: RecordKind<T>,
): Promise<DecodedRecord<T> | null> => {
  const raw = await store.get(key);
  if (raw === undefined) return null;
  return decodeRecord(kind, raw);
};

export const saveRecord = async <T>(
  store: KVStore,
  key: string,
  kind: RecordKind<T>,
  data: T,
  options?: KVSetOptions,
): Promise<void> => {
  await store.set(key, encodeRecord(kind, data), options);
};

/**
 * Load outside a transaction and write back the migrated form so the
 * migration chain runs once per record, not once per read. Never use
 * inside a watch window (the write-back would race the transaction).
 */
export const loadAndHeal = async <T>(
  store: KVStore,
  key: string,
  kind: RecordKind<T>,
): Promise<T | null> => {
  const decoded = await loadRecord(store, key, kind);
  if (decoded === null) return null;
  if (decoded.migrated) {
    await saveRecord(store, key, kind, decoded.data);
  }
  return decoded.data;
};
