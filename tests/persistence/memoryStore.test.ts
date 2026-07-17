// ============================================================
// MemoryStore tests — the optimistic-transaction semantics the
// fight command service's guarantees are proven against.
// ============================================================

import { describe, expect, it } from 'vitest';
import { MemoryStore } from '../../src/server/persistence/memoryStore';

describe('MemoryStore basics', () => {
  it('round-trips get/set/del', async () => {
    const store = new MemoryStore();
    await store.set('a', '1');
    expect(await store.get('a')).toBe('1');
    await store.del('a');
    expect(await store.get('a')).toBeUndefined();
  });

  it('expires values lazily via the injected clock', async () => {
    let nowMs = 0;
    const store = new MemoryStore(() => nowMs);
    await store.set('a', '1', { ttlSeconds: 10 });
    nowMs = 9_999;
    expect(await store.get('a')).toBe('1');
    nowMs = 10_000;
    expect(await store.get('a')).toBeUndefined();
  });
});

describe('MemoryStore transactions (WATCH semantics)', () => {
  it('commits queued writes atomically when nothing changed', async () => {
    const store = new MemoryStore();
    await store.set('a', '1');
    const tx = await store.watch('a');
    tx.set('a', '2');
    tx.set('b', 'side');
    expect(await tx.exec()).toBe(true);
    expect(await store.get('a')).toBe('2');
    expect(await store.get('b')).toBe('side');
  });

  it('aborts when a watched key was written after watch', async () => {
    const store = new MemoryStore();
    await store.set('a', '1');
    const tx = await store.watch('a');
    await store.set('a', 'concurrent');
    tx.set('a', '2');
    tx.set('b', 'must-not-land');
    expect(await tx.exec()).toBe(false);
    expect(await store.get('a')).toBe('concurrent');
    expect(await store.get('b')).toBeUndefined();
  });

  it('aborts when a watched key was deleted after watch', async () => {
    const store = new MemoryStore();
    await store.set('a', '1');
    const tx = await store.watch('a');
    await store.del('a');
    tx.set('a', '2');
    expect(await tx.exec()).toBe(false);
    expect(await store.get('a')).toBeUndefined();
  });

  it('catches the ABA case: absent key created then deleted again', async () => {
    const store = new MemoryStore();
    const tx = await store.watch('ghost');
    await store.set('ghost', 'flicker');
    await store.del('ghost');
    tx.set('ghost', 'stale-claim');
    expect(await tx.exec()).toBe(false);
  });

  it('ignores writes to unwatched keys', async () => {
    const store = new MemoryStore();
    await store.set('a', '1');
    const tx = await store.watch('a');
    await store.set('unrelated', 'x');
    tx.set('a', '2');
    expect(await tx.exec()).toBe(true);
    expect(await store.get('a')).toBe('2');
  });

  it('lets exactly one of two competing transactions win', async () => {
    const store = new MemoryStore();
    await store.set('counter', '0');
    const tx1 = await store.watch('counter');
    const tx2 = await store.watch('counter');
    tx1.set('counter', '1');
    tx2.set('counter', 'clobber');
    expect(await tx1.exec()).toBe(true);
    expect(await tx2.exec()).toBe(false);
    expect(await store.get('counter')).toBe('1');
  });

  it('refuses to exec twice or after discard', async () => {
    const store = new MemoryStore();
    const tx = await store.watch('a');
    tx.set('a', '1');
    expect(await tx.exec()).toBe(true);
    expect(await tx.exec()).toBe(false);

    const tx2 = await store.watch('a');
    tx2.set('a', '2');
    await tx2.discard();
    expect(await tx2.exec()).toBe(false);
    expect(await store.get('a')).toBe('1');
  });
});
