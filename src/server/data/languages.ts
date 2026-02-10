// ============================================================
// Binary Boxer — Language Definitions
// Static data: programming language stat modifiers
// ============================================================

import type { LanguageDefinition, LanguageId } from '../../shared/types';

export const LANGUAGES: LanguageDefinition[] = [
  {
    id: 'rust',
    name: 'Rust',
    primaryStat: 'defence',
    primaryBonus: 3,
    secondaryStat: 'stability',
    secondaryBonus: 1,
    color: '#dea584',
    flavour: 'Safe, defensive, rarely crashes mid-fight',
  },
  {
    id: 'javascript',
    name: 'JavaScript',
    primaryStat: 'maxHp',
    primaryBonus: 3,
    secondaryStat: 'adaptability',
    secondaryBonus: 1,
    color: '#f7df1e',
    flavour: 'Resilient, recovers fast, unpredictable',
  },
  {
    id: 'python',
    name: 'Python',
    primaryStat: 'power',
    primaryBonus: 2,
    secondaryStat: null,
    secondaryBonus: 0,
    color: '#3776ab',
    flavour: 'Jack of all trades, no spikes',
  },
  {
    id: 'cpp',
    name: 'C++',
    primaryStat: 'wisdom',
    primaryBonus: 3,
    secondaryStat: 'blockChance',
    secondaryBonus: 1,
    color: '#00599c',
    flavour: 'Knows when to block, efficient',
  },
  {
    id: 'css',
    name: 'CSS',
    primaryStat: 'creativity',
    primaryBonus: 3,
    secondaryStat: 'critChance',
    secondaryBonus: 1,
    color: '#264de4',
    flavour: 'Unpredictable, flashy, high crits',
  },
  {
    id: 'go',
    name: 'Go',
    primaryStat: 'speed',
    primaryBonus: 3,
    secondaryStat: 'counter',
    secondaryBonus: 1,
    color: '#00add8',
    flavour: 'Fast, concurrent attacks, counters well',
  },
  {
    id: 'typescript',
    name: 'TypeScript',
    primaryStat: 'defence',
    primaryBonus: 2,
    secondaryStat: 'maxHp',
    secondaryBonus: 2,
    color: '#3178c6',
    flavour: 'Like JavaScript but safer',
  },
  {
    id: 'c',
    name: 'C',
    primaryStat: 'power',
    primaryBonus: 3,
    secondaryStat: 'penetration',
    secondaryBonus: 1,
    color: '#a8b9cc',
    flavour: 'Raw damage, ignores some defence',
  },
  {
    id: 'haskell',
    name: 'Haskell',
    primaryStat: 'evasion',
    primaryBonus: 3,
    secondaryStat: 'patternRead',
    secondaryBonus: 1,
    color: '#5e5086',
    flavour: 'Pure logic, dodges through prediction',
  },
  {
    id: 'lua',
    name: 'Lua',
    primaryStat: 'speed',
    primaryBonus: 2,
    secondaryStat: 'creativity',
    secondaryBonus: 2,
    color: '#000080',
    flavour: 'Lightweight, quick, creative combos',
  },
];

export const LANGUAGE_IDS: LanguageId[] = LANGUAGES.map((lang) => lang.id);

export const getLanguage = (id: LanguageId): LanguageDefinition => {
  const lang = LANGUAGES.find((l) => l.id === id);
  if (!lang) {
    throw new Error(`Unknown language: ${id}`);
  }
  return lang;
};
