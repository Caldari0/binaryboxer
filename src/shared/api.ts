// ============================================================
// Binary Boxer — API Request/Response Types
// ============================================================

import type {
  PlayerState,
  FightState,
  Dynasty,
  LeaderboardEntry,
  LeaderboardMetric,
  CommunityEvent,
  LanguageId,
  GrowthStatKey,
  RobotStats,
} from './types';

// --- Generic ---

export type ApiError = {
  status: 'error';
  message: string;
};

// --- Init ---

export type InitResponse = {
  type: 'init';
  postId: string;
  username: string;
  player: PlayerState | null;
  hasPlayer: boolean;
  /** Active fight state, present when player.state === 'fighting' */
  fight: FightState | null;
};

// --- Robot ---

export type CreateRobotRequest = {
  robotName: string;
  language1: LanguageId;
  language2: LanguageId;
};

export type CreateRobotResponse = {
  type: 'robot_created';
  player: PlayerState;
};

export type RobotStatsResponse = {
  type: 'robot_stats';
  player: PlayerState;
  effectiveStats: RobotStats;
};

export type RetireRobotResponse = {
  type: 'robot_retired';
  dynasty: Dynasty;
};

// --- Fight ---

export type FightStartResponse = {
  type: 'fight_start';
  fight: FightState;
};

export type FightResolveResponse = {
  type: 'fight_resolved';
  fight: FightState;
};

export type FightTurnRequest = {
  action: import('./types').CombatAction;
};

export type FightTurnResponse = {
  type: 'fight_turn';
  fight: FightState;
  playerTurn: import('./types').FightTurn;
  enemyTurn: import('./types').FightTurn | null;
};

export type FightCompleteResponse = {
  type: 'fight_complete';
  player: PlayerState;
  xpGained: number;
  leveledUp: boolean;
  newLevel: number;
  companionUnlocked: string | null;
  /** True when robot was KO'd at 30+ fights and forcibly retired */
  forcedRetirement: boolean;
};

// --- Corner Phase ---

export type RepairResponse = {
  type: 'repaired';
  hpBefore: number;
  hpAfter: number;
  maxHp: number;
  fullRepair: boolean;
};

export type TrainRequest = {
  stat: GrowthStatKey;
};

export type TrainResponse = {
  type: 'trained';
  stat: GrowthStatKey;
  oldValue: number;
  newValue: number;
  xpSpent: number;
  xpRemaining: number;
};

export type SwapLanguageRequest = {
  slot: 1 | 2;
  newLanguage: LanguageId;
};

export type SwapLanguageResponse = {
  type: 'language_swapped';
  slot: 1 | 2;
  oldLanguage: LanguageId;
  newLanguage: LanguageId;
  player: PlayerState;
};

// --- Dynasty ---

export type DynastyTreeResponse = {
  type: 'dynasty_tree';
  dynasty: Dynasty | null;
};

// --- Leaderboard ---

export type LeaderboardResponse = {
  type: 'leaderboard';
  metric: LeaderboardMetric;
  entries: LeaderboardEntry[];
  playerRank: number | null;
};

// --- Community ---

export type CommunityFeedResponse = {
  type: 'community_feed';
  events: CommunityEvent[];
};
