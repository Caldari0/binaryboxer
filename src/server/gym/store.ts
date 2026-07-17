// ============================================================
// Binary Boxer — Gym & fighter stores (over the persistence kit)
// Includes the documented Gate 0 bootstrap bridge: a founding gym
// with one default fighter is created on first contact, because the
// rebuild's creation/onboarding flow arrives with Gate 1. The Gate 1
// onboarding replaces the defaults (player names their fighter and
// drafts a starter program); nothing here survives as player-facing.
// ============================================================

import {
  emptyGrowthSources,
  emptyRecord,
  type FighterRecord,
  type GymRecord,
} from '../../shared/contracts';
import { fighterKey, gymKey } from '../persistence/keys';
import { FIGHTER_RECORD, GYM_RECORD } from '../persistence/kinds';
import { loadAndHeal, saveRecord } from '../persistence/records';
import type { KVStore } from '../persistence/store';
import { LAMPS_PER_GENERATION, MAX_INTEGRITY } from './constants';

export const loadGym = (store: KVStore, username: string): Promise<GymRecord | null> =>
  loadAndHeal(store, gymKey(username), GYM_RECORD);

export const saveGym = (store: KVStore, gym: GymRecord): Promise<void> =>
  saveRecord(store, gymKey(gym.username), GYM_RECORD, gym);

export const loadFighter = (
  store: KVStore,
  username: string,
  fighterId: string,
): Promise<FighterRecord | null> =>
  loadAndHeal(store, fighterKey(username, fighterId), FIGHTER_RECORD);

export const saveFighter = (
  store: KVStore,
  username: string,
  fighter: FighterRecord,
): Promise<void> =>
  saveRecord(store, fighterKey(username, fighter.fighterId), FIGHTER_RECORD, fighter);

export type GymBundle = { gym: GymRecord; foundingFighter: FighterRecord };

/**
 * Gate 0 bootstrap bridge: load the gym, creating a founding gym +
 * fighter when none exists. Defaults are placeholders (canon names
 * arrive with Gate 1 onboarding).
 */
export const ensureGym = async (
  store: KVStore,
  username: string,
  now: number,
): Promise<GymBundle> => {
  const existing = await loadGym(store, username);
  if (existing) {
    const firstId = existing.roster[0];
    const fighter = firstId ? await loadFighter(store, username, firstId) : null;
    if (!fighter) {
      throw new Error(`gym for ${username} has no loadable founding fighter`);
    }
    return { gym: existing, foundingFighter: fighter };
  }

  const fighterId = `f-${username}-g1`;
  const foundingFighter: FighterRecord = {
    fighterId,
    name: 'PEKOE',
    languages: ['python', 'lua'],
    growthSources: emptyGrowthSources(),
    installedPrograms: [],
    condition: { integrity: MAX_INTEGRITY },
    origin: 'founding',
    record: emptyRecord(),
    createdAt: now,
  };
  const gym: GymRecord = {
    username,
    gymName: 'Kettleworks',
    generation: 1,
    lamps: LAMPS_PER_GENERATION,
    prestige: 0,
    scrap: 0,
    roster: [fighterId],
    staffWoken: [],
    storybook: { pending: [], read: [] },
    record: emptyRecord(),
    createdAt: now,
    updatedAt: now,
  };

  await saveFighter(store, username, foundingFighter);
  await saveGym(store, gym);
  return { gym, foundingFighter };
};
