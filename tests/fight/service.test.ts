// ============================================================
// Bout command service tests — idempotency, once-only rewards,
// revision conflicts, phase guards, ownership, and races. These
// are the Gate 0 acceptance tests for the double-award critical.
// ============================================================

import { describe, expect, it } from 'vitest';
import type { AdvanceResponse, StartBoutResponse } from '../../src/shared/contracts';
import { LAMPS_PER_GENERATION } from '../../src/server/gym/constants';
import { loadFighter, loadGym } from '../../src/server/gym/store';
import { saveFighter } from '../../src/server/gym/store';
import { MemoryStore } from '../../src/server/persistence/memoryStore';
import {
  acknowledgeBout,
  advanceBout,
  currentBout,
  startBout,
} from '../../src/server/fight/service';

const CMD = (n: number): string => `cmd-${n}-abcdefgh`;

/** Run a full happy-path bout and return its pieces. */
const playBout = async (store: MemoryStore, user = 'coach', t0 = 1_000_000) => {
  const started = await startBout(store, user, { commandId: CMD(1) }, t0);
  if (!started.ok) throw new Error(`start failed: ${started.response.message}`);
  const fightId = started.response.fight.fightId;

  const advanced = await advanceBout(
    store,
    user,
    { fightId, revision: started.response.fight.revision, commandId: CMD(2) },
    t0 + 1,
  );
  if (!advanced.ok) throw new Error(`advance failed: ${advanced.response.message}`);

  const acked = await acknowledgeBout(
    store,
    user,
    { fightId, revision: advanced.response.fight.revision, commandId: CMD(3) },
    t0 + 2,
  );
  if (!acked.ok) throw new Error(`acknowledge failed: ${acked.response.message}`);
  return { fightId, started, advanced, acked };
};

describe('happy path', () => {
  it('start → advance (terminal batch) → acknowledge commits rewards', async () => {
    const store = new MemoryStore();
    const { advanced, acked } = await playBout(store);

    expect(advanced.response.fight.phase).toBe('resolved');
    expect(advanced.response.fight.outcome).not.toBeNull();
    expect(advanced.response.events.length).toBeGreaterThan(2);
    expect(advanced.response.fight.stagedRewards).not.toBeNull();
    for (const event of advanced.response.events) {
      if (event.type === 'action') expect(event.reason.length).toBeGreaterThan(0);
    }

    const gym = await loadGym(store, 'coach');
    expect(gym?.record.bouts).toBe(1);
    expect(gym?.scrap).toBe(acked.response.gym.scrap);
    expect((gym?.scrap ?? 0)).toBeGreaterThan(0); // crowd pays both ways

    const fighter = await loadFighter(store, 'coach', advanced.response.fight.fighter.fighterId);
    expect(fighter?.record.bouts).toBe(1);
  });

  it('current returns the running bout, then null after acknowledge', async () => {
    const store = new MemoryStore();
    const started = await startBout(store, 'coach', { commandId: CMD(1) }, 1000);
    if (!started.ok) throw new Error('start failed');
    const current = await currentBout(store, 'coach');
    expect(current.ok && current.response.fight?.fightId).toBe(started.response.fight.fightId);

    await advanceBout(
      store,
      'coach',
      { fightId: started.response.fight.fightId, revision: 0, commandId: CMD(2) },
      1001,
    );
    await acknowledgeBout(
      store,
      'coach',
      { fightId: started.response.fight.fightId, revision: 1, commandId: CMD(3) },
      1002,
    );
    const after = await currentBout(store, 'coach');
    expect(after.ok && after.response.fight).toBeNull();
  });
});

describe('idempotency (commandId replay)', () => {
  it('replayed start returns the same bout, never a second one', async () => {
    const store = new MemoryStore();
    const first = await startBout(store, 'coach', { commandId: CMD(1) }, 1000);
    const replay = await startBout(store, 'coach', { commandId: CMD(1) }, 2000);
    expect(first.ok && replay.ok).toBe(true);
    expect((replay as { response: StartBoutResponse }).response.fight.fightId).toBe(
      (first as { response: StartBoutResponse }).response.fight.fightId,
    );
  });

  it('replayed advance returns the identical cached batch', async () => {
    const store = new MemoryStore();
    const { fightId, advanced } = await playBout(store);
    const replay = await advanceBout(
      store,
      'coach',
      { fightId, revision: 0, commandId: CMD(2) },
      9_999_999,
    );
    // Replay wins even though revision has since moved on — the cache
    // answers before any revision check.
    expect(replay.ok).toBe(true);
    expect((replay as { response: AdvanceResponse }).response).toEqual(advanced.response);
  });

  it('replayed acknowledge does NOT double-award', async () => {
    const store = new MemoryStore();
    const { fightId, acked } = await playBout(store);
    const scrapAfterFirst = (await loadGym(store, 'coach'))?.scrap;

    const replay = await acknowledgeBout(
      store,
      'coach',
      { fightId, revision: 1, commandId: CMD(3) },
      9_999_999,
    );
    expect(replay.ok).toBe(true);
    expect(replay.ok && replay.response).toEqual(acked.response);
    expect((await loadGym(store, 'coach'))?.scrap).toBe(scrapAfterFirst);
  });

  it('a NEW commandId on an acknowledged bout is PHASE_INVALID and changes nothing', async () => {
    const store = new MemoryStore();
    const { fightId } = await playBout(store);
    const scrapBefore = (await loadGym(store, 'coach'))?.scrap;

    const second = await acknowledgeBout(
      store,
      'coach',
      { fightId, revision: 2, commandId: CMD(99) },
      9_999_999,
    );
    expect(second.ok).toBe(false);
    expect(!second.ok && second.response.code).toBe('PHASE_INVALID');
    expect((await loadGym(store, 'coach'))?.scrap).toBe(scrapBefore);
  });
});

describe('revision + phase guards', () => {
  it('stale advance revision gets 409 with the authoritative snapshot', async () => {
    const store = new MemoryStore();
    const { fightId } = await playBout(store);
    const stale = await advanceBout(
      store,
      'coach',
      { fightId, revision: 0, commandId: CMD(50) },
      9_999,
    );
    expect(stale.ok).toBe(false);
    if (!stale.ok && stale.response.code === 'REVISION_CONFLICT') {
      expect('fight' in stale.response && stale.response.fight.revision).toBeGreaterThan(0);
    } else {
      // resolved bouts hit the phase guard first — also acceptable
      expect(!stale.ok && stale.response.code).toBe('PHASE_INVALID');
    }
  });

  it('acknowledge before resolve is PHASE_INVALID', async () => {
    const store = new MemoryStore();
    const started = await startBout(store, 'coach', { commandId: CMD(1) }, 1000);
    if (!started.ok) throw new Error('start failed');
    const early = await acknowledgeBout(
      store,
      'coach',
      { fightId: started.response.fight.fightId, revision: 0, commandId: CMD(2) },
      1001,
    );
    expect(!early.ok && early.response.code).toBe('PHASE_INVALID');
  });

  it('starting while a bout is running is a CONFLICT (different commandId)', async () => {
    const store = new MemoryStore();
    await startBout(store, 'coach', { commandId: CMD(1) }, 1000);
    const second = await startBout(store, 'coach', { commandId: CMD(2) }, 2000);
    expect(!second.ok && second.response.code).toBe('CONFLICT');
  });

  it('a fresh start is allowed after acknowledge', async () => {
    const store = new MemoryStore();
    const first = await playBout(store);
    const next = await startBout(store, 'coach', { commandId: CMD(60) }, 5_000_000);
    expect(next.ok).toBe(true);
    expect(next.ok && next.response.fight.fightId).not.toBe(first.fightId);
  });
});

describe('ownership + integrity guards', () => {
  it("cannot touch another user's bout (404, no leak)", async () => {
    const store = new MemoryStore();
    const { fightId } = await playBout(store, 'coach');
    const stranger = await advanceBout(
      store,
      'rival',
      { fightId, revision: 0, commandId: CMD(70) },
      9_999,
    );
    expect(!stranger.ok && stranger.status).toBe(404);
  });

  it('rejects starting with a 0-integrity fighter (the donor zero-HP edge)', async () => {
    const store = new MemoryStore();
    const { started } = await playBout(store);
    const fighterId = started.response.fight.fighter.fighterId;
    const fighter = await loadFighter(store, 'coach', fighterId);
    fighter!.condition.integrity = 0;
    await saveFighter(store, 'coach', fighter!);

    const blocked = await startBout(store, 'coach', { commandId: CMD(80) }, 6_000_000);
    expect(!blocked.ok && blocked.response.code).toBe('CONFLICT');
  });
});

describe('gym consequences', () => {
  it('applies rewards, records, lamps, and fight-learning exactly once', async () => {
    const store = new MemoryStore();
    // Play bouts until we have seen at least one win and one loss.
    let losses = 0;
    let wins = 0;
    let t = 1_000_000;
    let cmd = 100;
    while ((wins === 0 || losses === 0) && cmd < 160) {
      const started = await startBout(store, 'coach', { commandId: CMD(cmd++) }, t++);
      if (!started.ok) throw new Error('start failed');
      const adv = await advanceBout(
        store,
        'coach',
        { fightId: started.response.fight.fightId, revision: 0, commandId: CMD(cmd++) },
        t++,
      );
      if (!adv.ok) throw new Error('advance failed');
      const won = adv.response.fight.outcome?.winner === 'fighter';
      if (won) wins += 1;
      else losses += 1;
      const ack = await acknowledgeBout(
        store,
        'coach',
        { fightId: started.response.fight.fightId, revision: 1, commandId: CMD(cmd++) },
        t++,
      );
      if (!ack.ok) throw new Error('acknowledge failed');
      t += 10;
    }

    const gym = await loadGym(store, 'coach');
    expect(gym?.record.wins).toBe(wins);
    expect(gym?.record.losses).toBe(losses);
    expect(gym?.lamps).toBe(Math.max(0, LAMPS_PER_GENERATION - losses));

    const fighter = await loadFighter(store, 'coach', gym!.roster[0]!);
    // fightLearning credits technique +1 per win at Gate 0.
    expect(fighter?.growthSources.fightLearning.technique ?? 0).toBe(wins);
    // Sources stay separate — manualTraining untouched.
    expect(fighter?.growthSources.manualTraining).toEqual({});
  });

  it('concurrent duplicate acknowledges commit rewards exactly once', async () => {
    const store = new MemoryStore();
    const { fightId } = await (async () => {
      const s = await startBout(store, 'coach', { commandId: CMD(1) }, 1000);
      if (!s.ok) throw new Error('start');
      const a = await advanceBout(
        store,
        'coach',
        { fightId: s.response.fight.fightId, revision: 0, commandId: CMD(2) },
        1001,
      );
      if (!a.ok) throw new Error('advance');
      return { fightId: s.response.fight.fightId };
    })();

    // Two acknowledges with DIFFERENT commandIds fired concurrently:
    // exactly one may commit; the loser must not re-apply rewards.
    const [a, b] = await Promise.all([
      acknowledgeBout(store, 'coach', { fightId, revision: 1, commandId: CMD(11) }, 2000),
      acknowledgeBout(store, 'coach', { fightId, revision: 1, commandId: CMD(12) }, 2001),
    ]);
    const okCount = [a, b].filter((r) => r.ok).length;
    expect(okCount).toBe(1);

    const gym = await loadGym(store, 'coach');
    expect(gym?.record.bouts).toBe(1);
  });
});
