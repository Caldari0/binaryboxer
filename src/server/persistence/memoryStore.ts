// ============================================================
// Binary Boxer — In-memory KVStore with real optimistic-transaction
// semantics (per-key version counters; exec fails iff a watched key
// changed after watch). Used by tests and the balance harness;
// deterministic, no timers — expiry is lazy via an injected clock.
// ============================================================

import type { KVSetOptions, KVStore, KVTransaction } from './store';

type Entry = { value: string; version: number; expiresAtMs: number | null };

export class MemoryStore implements KVStore {
  readonly #entries = new Map<string, Entry>();
  /** Last version consumed by an explicit delete of a key — prevents the
   * ABA case where a watched-absent key is created then deleted again. */
  readonly #tombstones = new Map<string, number>();
  #versionCounter = 0;
  readonly #now: () => number;

  constructor(now: () => number = () => 0) {
    this.#now = now;
  }

  #live(key: string): Entry | undefined {
    const entry = this.#entries.get(key);
    if (!entry) return undefined;
    if (entry.expiresAtMs !== null && entry.expiresAtMs <= this.#now()) {
      this.#entries.delete(key);
      return undefined;
    }
    return entry;
  }

  /** Version of a key as observed for WATCH purposes (0 = never touched). */
  #versionOf(key: string): number {
    return this.#live(key)?.version ?? this.#tombstones.get(key) ?? 0;
  }

  #write(key: string, value: string, options?: KVSetOptions): void {
    this.#versionCounter += 1;
    this.#entries.set(key, {
      value,
      version: this.#versionCounter,
      expiresAtMs:
        options?.ttlSeconds !== undefined ? this.#now() + options.ttlSeconds * 1000 : null,
    });
  }

  #remove(key: string): void {
    // Deletion must also invalidate watchers: consume a version and
    // remember it as a tombstone.
    this.#versionCounter += 1;
    this.#tombstones.set(key, this.#versionCounter);
    this.#entries.delete(key);
  }

  get(key: string): Promise<string | undefined> {
    return Promise.resolve(this.#live(key)?.value);
  }

  set(key: string, value: string, options?: KVSetOptions): Promise<void> {
    this.#write(key, value, options);
    return Promise.resolve();
  }

  del(...keys: string[]): Promise<void> {
    for (const key of keys) this.#remove(key);
    return Promise.resolve();
  }

  watch(...keys: string[]): Promise<KVTransaction> {
    const observed = new Map<string, number>(keys.map((k) => [k, this.#versionOf(k)]));
    const queued: Array<{ op: 'set'; key: string; value: string; options?: KVSetOptions } | { op: 'del'; key: string }> = [];
    let finished = false;

    const tx: KVTransaction = {
      set: (key, value, options) => {
        queued.push({ op: 'set', key, value, options });
      },
      del: (key) => {
        queued.push({ op: 'del', key });
      },
      exec: () => {
        if (finished) return Promise.resolve(false);
        finished = true;
        for (const [key, version] of observed) {
          if (this.#versionOf(key) !== version) return Promise.resolve(false);
        }
        for (const cmd of queued) {
          if (cmd.op === 'set') this.#write(cmd.key, cmd.value, cmd.options);
          else this.#remove(cmd.key);
        }
        return Promise.resolve(true);
      },
      discard: () => {
        finished = true;
        return Promise.resolve();
      },
    };
    return Promise.resolve(tx);
  }
}
