// ============================================================
// Binary Boxer — Derived stats (pure)
// display/effectiveness = base + language leans + Σ(separate
// growth sources) + Σ(temporary effects). Sources are NEVER stored
// combined (spec §5 #7); this function is the only combiner.
// Program-derived modifiers join at Gate 1 via tempEffects.
// ============================================================

import type {
  GrowthSources,
  LanguagePair,
  StatBlock,
  StatDelta,
} from '../../shared/contracts';
import { STAT_KEYS } from '../../shared/contracts';
import { BASE_STAT } from './constants';
import { LANGUAGE_LEANS, PRIMARY_LEAN, SECONDARY_LEAN } from './languageLeans';

export const deriveStats = (
  languages: LanguagePair,
  sources: GrowthSources,
  tempEffects: readonly StatDelta[] = [],
): StatBlock => {
  const stats = Object.fromEntries(STAT_KEYS.map((key) => [key, BASE_STAT])) as Record<
    (typeof STAT_KEYS)[number],
    number
  >;

  for (const language of languages) {
    const lean = LANGUAGE_LEANS[language];
    stats[lean.primary] += PRIMARY_LEAN;
    stats[lean.secondary] += SECONDARY_LEAN;
  }

  const deltas: readonly StatDelta[] = [
    sources.manualTraining,
    sources.fightLearning,
    sources.legacyBonuses,
    ...tempEffects,
  ];
  for (const delta of deltas) {
    for (const key of STAT_KEYS) {
      const value = delta[key];
      if (value !== undefined) stats[key] += value;
    }
  }

  return stats;
};

/** Sum of all five derived stats — the fairness/balance scalar. */
export const statTotal = (stats: StatBlock): number =>
  STAT_KEYS.reduce((sum, key) => sum + stats[key], 0);
