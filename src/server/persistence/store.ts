// ============================================================
// Binary Boxer — KVStore port
// A narrow interface over the Devvit Redis subset the rebuild uses,
// including optimistic transactions (watch → read → queue → exec).
// The fight command service is written against this port so its
// idempotency and concurrency guarantees are provable in vitest via
// MemoryStore; DevvitStore binds the real client in production.
// ============================================================

export type KVSetOptions = {
  /** Time-to-live in seconds; omitted = no expiry. */
  ttlSeconds?: number;
};

/**
 * A buffered optimistic transaction. Queue writes with set/del, then
 * exec(): true = committed atomically; false = a watched key changed
 * after watch() (standard Redis WATCH semantics) — re-read and retry.
 */
export type KVTransaction = {
  set(key: string, value: string, options?: KVSetOptions): void;
  del(key: string): void;
  exec(): Promise<boolean>;
  discard(): Promise<void>;
};

export type KVStore = {
  get(key: string): Promise<string | undefined>;
  set(key: string, value: string, options?: KVSetOptions): Promise<void>;
  del(...keys: string[]): Promise<void>;
  /** Begin an optimistic transaction over the given keys. Reads AFTER
   * watch() use plain get(); any concurrent write to a watched key
   * between watch() and exec() aborts the exec. */
  watch(...keys: string[]): Promise<KVTransaction>;
};
