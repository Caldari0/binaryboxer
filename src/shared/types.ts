// ============================================================
// Binary Boxer — Shared Types
// Single source of truth for client + server
// ============================================================

// --- Language System ---

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

export type GrowthStatKey = Exclude<StatKey, 'hp'>;

export type LanguageDefinition = {
  id: LanguageId;
  name: string;
  primaryStat: GrowthStatKey;
  primaryBonus: number;
  secondaryStat: GrowthStatKey | null;
  secondaryBonus: number;
  color: string;
  flavour: string;
};

// --- Robot Stats ---

export type RobotStats = Record<StatKey, number>;

export type BaseStats = {
  hp: number;
  maxHp: number;
  power: number;
  defence: number;
  speed: number;
  wisdom: number;
  creativity: number;
  stability: number;
  adaptability: number;
  evasion: number;
  blockChance: number;
  counter: number;
  critChance: number;
  patternRead: number;
  penetration: number;
};

// --- Player State ---

export type PlayerGameState = 'creating' | 'corner' | 'fighting' | 'retired';

export type PlayerState = {
  // Robot identity
  robotName: string;
  language1: LanguageId;
  language2: LanguageId;

  // Stats
  stats: RobotStats;

  // Progression
  level: number;
  xp: number;
  xpToNext: number;
  totalFights: number;
  wins: number;
  losses: number;
  currentStreak: number;
  bestStreak: number;

  // Companions
  hasVeil: boolean;
  hasEcho: boolean;
  hasKindred: boolean;

  // Corner phase cooldowns
  fullRepairCooldown: number;
  swapLanguageCooldown: number;

  // Dynasty
  generation: number;
  dynastyId: string;
  legacyStats: Partial<Record<GrowthStatKey, number>>;

  // Meta
  createdAt: number;
  lastFightAt: number;
  state: PlayerGameState;
};

// --- Combat ---

export type CombatAction =
  | 'strike'
  | 'heavy_strike'
  | 'guard'
  | 'analyse'
  | 'overclock'
  | 'combo'
  | 'berserk';

// Active combat — player choice per turn
export type AvailableAction = {
  action: CombatAction;
  name: string;
  description: string;
  riskLabel: string;
  isPrimary: boolean;
};

export type FightTurn = {
  turnNumber: number;
  attacker: 'player' | 'enemy';
  action: CombatAction;
  damage: number;
  blocked: boolean;
  dodged: boolean;
  critical: boolean;
  crashed: boolean;
  counterAttack: boolean;
  playerHpAfter: number;
  enemyHpAfter: number;
  flavourText: string;
};

export type FightResult = 'win' | 'loss' | 'pending';

export type EnemyData = {
  name: string;
  level: number;
  stats: RobotStats;
  isBoss: boolean;
  bossAbility: string | null;
  bossTagline: string | null;
};

export type FightState = {
  enemy: EnemyData;
  seed: number;
  turns: FightTurn[];
  result: FightResult;
  xpAwarded: number;
  playerStatsSnapshot: RobotStats;
  // Active combat state
  currentRound: number;
  availableActions: AvailableAction[];
  autoPilot: boolean;
  currentHp: number;
  enemyCurrentHp: number;
};

// --- Dynasty ---

export type DynastyGeneration = {
  generationNumber: number;
  robotName: string;
  language1: LanguageId;
  language2: LanguageId;
  finalLevel: number;
  totalFights: number;
  wins: number;
  bestStreak: number;
  retiredAt: number;
  causeOfRetirement: 'voluntary' | 'ko';
  finalStats: RobotStats;
};

export type Dynasty = {
  id: string;
  ownerUsername: string;
  generations: DynastyGeneration[];
  totalFights: number;
  totalWins: number;
  deepestLevel: number;
  createdAt: number;
};

export type DynastyTitle =
  | 'Prototype'
  | 'Lineage'
  | 'Legacy'
  | 'Dynasty'
  | 'Empire'
  | 'Eternal';

// --- Companions ---

export type CompanionId = 'veil' | 'echo' | 'kindred';

export type CompanionDefinition = {
  id: CompanionId;
  name: string;
  unlockCondition: string;
  buffDescription: string;
  color: string;
  lore: string;
};

// --- Leaderboard ---

export type LeaderboardMetric = 'level' | 'streak' | 'dynasty' | 'fights';

export type LeaderboardEntry = {
  rank: number;
  username: string;
  robotName: string;
  score: number;
  language1: LanguageId;
  language2: LanguageId;
  generation: number;
};

// --- Community Events ---

export type CommunityEventType =
  | 'boss_kill'
  | 'level_milestone'
  | 'dynasty_start'
  | 'streak_record'
  | 'robot_created';

export type CommunityEvent = {
  type: CommunityEventType;
  username: string;
  robotName: string;
  detail: string;
  timestamp: number;
};

// --- Learning Tips ---

export type LearningTip = {
  language: LanguageId;
  tip: string;
  detail: string;
};
