// ============================================================
// Derived-stats + gym store tests. The pair-fairness invariant is
// the structural fix for the v1 Python-dominance critical.
// ============================================================

import { describe, expect, it } from 'vitest';
import {
  LanguageIdSchema,
  emptyGrowthSources,
  type LanguagePair,
} from '../../src/shared/contracts';
import { BASE_STAT } from '../../src/server/gym/constants';
import { deriveStats, statTotal } from '../../src/server/gym/derive';
import { ensureGym, loadFighter, loadGym } from '../../src/server/gym/store';
import { MemoryStore } from '../../src/server/persistence/memoryStore';

const LANGS = LanguageIdSchema.options;

describe('deriveStats', () => {
  it('applies base + leans with empty sources', () => {
    const stats = deriveStats(['rust', 'cpp'], emptyGrowthSources());
    // rust: chin+2 power+1 · cpp: power+2 speed+1
    expect(stats.chin).toBe(BASE_STAT + 2);
    expect(stats.power).toBe(BASE_STAT + 3);
    expect(stats.speed).toBe(BASE_STAT + 1);
    expect(stats.technique).toBe(BASE_STAT);
    expect(stats.stamina).toBe(BASE_STAT);
  });

  it('EVERY language pair has an identical stat total (no dominant pick)', () => {
    const totals = new Set<number>();
    for (const a of LANGS) {
      for (const b of LANGS) {
        if (a === b) continue;
        totals.add(statTotal(deriveStats([a, b] as LanguagePair, emptyGrowthSources())));
      }
    }
    expect(totals.size).toBe(1);
  });

  it('combines all three sources and temp effects, without mutating inputs', () => {
    const sources = {
      manualTraining: { power: 2 },
      fightLearning: { power: 1, technique: 3 },
      legacyBonuses: { chin: 4 },
    };
    const frozen = JSON.parse(JSON.stringify(sources));
    const stats = deriveStats(['javascript', 'go'], sources, [{ speed: 5 }]);
    // javascript: speed+2 technique+1 · go: stamina+2 speed+1
    expect(stats.power).toBe(BASE_STAT + 3);
    expect(stats.technique).toBe(BASE_STAT + 1 + 3);
    expect(stats.chin).toBe(BASE_STAT + 4);
    expect(stats.speed).toBe(BASE_STAT + 3 + 5);
    expect(stats.stamina).toBe(BASE_STAT + 2);
    expect(sources).toEqual(frozen);
  });
});

describe('ensureGym (Gate 0 bootstrap bridge)', () => {
  it('creates a founding gym + fighter on first contact', async () => {
    const store = new MemoryStore();
    const { gym, foundingFighter } = await ensureGym(store, 'coach', 1000);
    expect(gym.gymName).toBe('Kettleworks');
    expect(gym.lamps).toBe(3);
    expect(gym.roster).toEqual([foundingFighter.fighterId]);
    expect(foundingFighter.origin).toBe('founding');
    expect(await loadGym(store, 'coach')).not.toBeNull();
    expect(await loadFighter(store, 'coach', foundingFighter.fighterId)).not.toBeNull();
  });

  it('is idempotent — a second call returns the existing gym untouched', async () => {
    const store = new MemoryStore();
    const first = await ensureGym(store, 'coach', 1000);
    first.gym.scrap = 999; // mutate the returned copy only
    const second = await ensureGym(store, 'coach', 2000);
    expect(second.gym.createdAt).toBe(1000);
    expect(second.gym.scrap).toBe(0);
    expect(second.foundingFighter.fighterId).toBe(first.foundingFighter.fighterId);
  });
});
