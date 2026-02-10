// ============================================================
// Binary Boxer — Companion Definitions
// Static data: companion unlock conditions, buffs, and lore
// ============================================================

import type { CompanionDefinition } from '../../shared/types';

export const COMPANIONS: CompanionDefinition[] = [
  {
    id: 'veil',
    name: 'Veil',
    unlockCondition: 'Survive 5 fights',
    buffDescription: 'Buffs Wisdom by 20%',
    color: '#9b5de5',
    lore: 'A whisper of pattern recognition from the void',
  },
  {
    id: 'echo',
    name: 'Echo',
    unlockCondition: 'Survive 12 fights',
    buffDescription: 'Buffs Crit Chance by 15% and amplifies strongest language stat by 10%',
    color: '#00f5d4',
    lore: 'The resonance of every fight your robot has survived',
  },
  {
    id: 'kindred',
    name: 'Kindred',
    unlockCondition: 'Reach generation 2 or higher in Dynasty Mode',
    buffDescription: 'Buffs inheritance bonus by 25%',
    color: '#ffd60a',
    lore: 'The bridge between what was and what will be',
  },
];
