// ============================================================
// Binary Boxer — Devvit Redis adapter for the KVStore port
// Thin by design: verified by inspection + the owner's playtest,
// while all service logic is proven against MemoryStore. Queued
// writes are buffered locally and replayed inside multi() at exec
// time, giving both stores identical transaction semantics.
// ============================================================

import { redis } from '@devvit/web/server';
import type { KVSetOptions, KVStore, KVTransaction } from './store';

const toSetOptions = (options?: KVSetOptions): { expiration?: Date } | undefined =>
  options?.ttlSeconds !== undefined
    ? { expiration: new Date(Date.now() + options.ttlSeconds * 1000) }
    : undefined;

export class DevvitStore implements KVStore {
  async get(key: string): Promise<string | undefined> {
    return await redis.get(key);
  }

  async set(key: string, value: string, options?: KVSetOptions): Promise<void> {
    await redis.set(key, value, toSetOptions(options));
  }

  async del(...keys: string[]): Promise<void> {
    await redis.del(...keys);
  }

  async watch(...keys: string[]): Promise<KVTransaction> {
    const txn = await redis.watch(...keys);
    const queued: Array<
      { op: 'set'; key: string; value: string; options?: KVSetOptions } | { op: 'del'; key: string }
    > = [];

    return {
      set: (key, value, options) => {
        queued.push({ op: 'set', key, value, options });
      },
      del: (key) => {
        queued.push({ op: 'del', key });
      },
      exec: async () => {
        await txn.multi();
        for (const cmd of queued) {
          if (cmd.op === 'set') await txn.set(cmd.key, cmd.value, toSetOptions(cmd.options));
          else await txn.del(cmd.key);
        }
        try {
          await txn.exec();
          return true;
        } catch {
          // Devvit's TxClient signals WATCH conflicts by throwing (see the
          // donor broadcastEvent pattern). Callers bound their retries, so
          // a genuine transport error surfaces as retry exhaustion.
          return false;
        }
      },
      discard: async () => {
        await txn.discard();
      },
    };
  }
}
