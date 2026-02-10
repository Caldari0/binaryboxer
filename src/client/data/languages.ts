export type StatKey =
  | 'hp'
  | 'maxHp'
  | 'power'
  | 'defence'
  | 'speed'
  | 'wisdom'
  | 'creativity'
  | 'stability'
  | 'adaptability'
  | 'evasion'
  | 'blockChance'
  | 'counter'
  | 'critChance'
  | 'patternRead'
  | 'penetration';

export type LanguageId =
  | 'rust'
  | 'javascript'
  | 'python'
  | 'cpp'
  | 'css'
  | 'go'
  | 'typescript'
  | 'c'
  | 'haskell'
  | 'lua';

/** Extends shared LanguageDefinition with UI-specific fields (quote, token) */
export type LanguageProfile = {
  id: LanguageId;
  name: string;
  color: string;
  primaryStat: StatKey;
  primaryBonus: number;
  secondaryStat: StatKey | null;
  secondaryBonus: number;
  /** Bonus applied to ALL growth stats per level (Python special) */
  allStatBonus: number;
  /** Short flavour text shown on language card */
  quote: string;
  /** 2-3 char abbreviation shown when selected */
  token: string;
};

export type PreviewStats = Record<StatKey, number>;

export const BASE_PREVIEW_STATS: PreviewStats = {
  hp: 100,
  maxHp: 100,
  power: 10,
  defence: 5,
  speed: 5,
  wisdom: 0,
  creativity: 0,
  stability: 0,
  adaptability: 0,
  evasion: 0,
  blockChance: 0,
  counter: 0,
  critChance: 0,
  patternRead: 0,
  penetration: 0,
};

export const LANGUAGE_ORDER: LanguageId[] = [
  'rust',
  'javascript',
  'python',
  'cpp',
  'css',
  'go',
  'typescript',
  'c',
  'haskell',
  'lua',
];

export const LANGUAGE_PROFILES: Record<LanguageId, LanguageProfile> = {
  rust: {
    id: 'rust',
    name: 'Rust',
    color: '#f97316',
    primaryStat: 'defence',
    primaryBonus: 3,
    secondaryStat: 'stability',
    secondaryBonus: 1,
    allStatBonus: 0,
    quote: 'Fearless memory safety under pressure.',
    token: 'RS',
  },
  javascript: {
    id: 'javascript',
    name: 'JavaScript',
    color: '#facc15',
    primaryStat: 'maxHp',
    primaryBonus: 3,
    secondaryStat: 'adaptability',
    secondaryBonus: 1,
    allStatBonus: 0,
    quote: 'Flexible runtime, unpredictable flow.',
    token: 'JS',
  },
  python: {
    id: 'python',
    name: 'Python',
    color: '#60a5fa',
    primaryStat: 'power',
    primaryBonus: 2,
    secondaryStat: null,
    secondaryBonus: 0,
    allStatBonus: 2,
    quote: 'Jack of all trades, no spikes.',
    token: 'PY',
  },
  cpp: {
    id: 'cpp',
    name: 'C++',
    color: '#3b82f6',
    primaryStat: 'wisdom',
    primaryBonus: 3,
    secondaryStat: 'blockChance',
    secondaryBonus: 1,
    allStatBonus: 0,
    quote: 'Precise control with veteran instincts.',
    token: 'C++',
  },
  css: {
    id: 'css',
    name: 'CSS',
    color: '#06b6d4',
    primaryStat: 'creativity',
    primaryBonus: 3,
    secondaryStat: 'critChance',
    secondaryBonus: 1,
    allStatBonus: 0,
    quote: 'Style-first chaos with highlight reels.',
    token: 'CSS',
  },
  go: {
    id: 'go',
    name: 'Go',
    color: '#22d3ee',
    primaryStat: 'speed',
    primaryBonus: 3,
    secondaryStat: 'counter',
    secondaryBonus: 1,
    allStatBonus: 0,
    quote: 'Fast, direct strikes with clean timing.',
    token: 'GO',
  },
  typescript: {
    id: 'typescript',
    name: 'TypeScript',
    color: '#2563eb',
    primaryStat: 'defence',
    primaryBonus: 2,
    secondaryStat: 'maxHp',
    secondaryBonus: 2,
    allStatBonus: 0,
    quote: 'Typed armor over dynamic aggression.',
    token: 'TS',
  },
  c: {
    id: 'c',
    name: 'C',
    color: '#94a3b8',
    primaryStat: 'power',
    primaryBonus: 3,
    secondaryStat: 'penetration',
    secondaryBonus: 1,
    allStatBonus: 0,
    quote: 'Raw metal damage without guardrails.',
    token: 'C',
  },
  haskell: {
    id: 'haskell',
    name: 'Haskell',
    color: '#a78bfa',
    primaryStat: 'evasion',
    primaryBonus: 3,
    secondaryStat: 'patternRead',
    secondaryBonus: 1,
    allStatBonus: 0,
    quote: 'Pure logic predicts every feint.',
    token: 'HS',
  },
  lua: {
    id: 'lua',
    name: 'Lua',
    color: '#6366f1',
    primaryStat: 'speed',
    primaryBonus: 2,
    secondaryStat: 'creativity',
    secondaryBonus: 2,
    allStatBonus: 0,
    quote: 'Lightweight scripting, fast improvisation.',
    token: 'LU',
  },
};

const previewStatLabels: Record<StatKey, string> = {
  hp: 'HP',
  maxHp: 'MAX HP',
  power: 'PWR',
  defence: 'DEF',
  speed: 'SPD',
  wisdom: 'WIS',
  creativity: 'CRT',
  stability: 'STB',
  adaptability: 'ADA',
  evasion: 'EVA',
  blockChance: 'BLK',
  counter: 'CTR',
  critChance: 'CRIT',
  patternRead: 'READ',
  penetration: 'PEN',
};

const synergyFlavour: Record<string, string> = {
  'javascript-typescript': 'Full Stack: rapid prototyping with typed armor.',
  'c-rust': 'Systems Core: low-level precision meets memory discipline.',
  'lua-python': 'Scripting Duo: flexible utility with fast adaptation.',
  'cpp-haskell': 'Compiler Mind: analysis-heavy tactical intelligence.',
  'css-go': 'Motion Pipeline: flashy attacks at runtime speed.',
};

export const previewStatLabel = (stat: StatKey): string => previewStatLabels[stat];

/** Growth stats affected by allStatBonus (everything except 'hp') */
const GROWTH_STATS: StatKey[] = [
  'maxHp', 'power', 'defence', 'speed', 'wisdom', 'creativity',
  'stability', 'adaptability', 'evasion', 'blockChance', 'counter',
  'critChance', 'patternRead', 'penetration',
];

export const computePreviewStats = (languageIds: LanguageId[]): PreviewStats => {
  const stats: PreviewStats = { ...BASE_PREVIEW_STATS };
  for (const languageId of languageIds) {
    const profile = LANGUAGE_PROFILES[languageId];
    stats[profile.primaryStat] += profile.primaryBonus;
    if (profile.secondaryStat) {
      stats[profile.secondaryStat] += profile.secondaryBonus;
    }
    // Apply all-stat bonus (e.g. Python +2 to every growth stat)
    if (profile.allStatBonus > 0) {
      for (const key of GROWTH_STATS) {
        stats[key] += profile.allStatBonus;
      }
    }
  }
  return stats;
};

export const findLanguageSynergy = (languageA: LanguageId, languageB: LanguageId): string | null => {
  const key = [languageA, languageB].sort().join('-');
  return synergyFlavour[key] ?? null;
};
