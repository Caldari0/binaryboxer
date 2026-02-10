// ============================================================
// Binary Boxer — Core Game State Hook
// Manages all game state and API communication
// Active combat: turn-by-turn with player action choice
// ============================================================

import { useCallback, useEffect, useState, useRef } from 'react';
import { connectRealtime, disconnectRealtime } from '@devvit/web/client';
import type {
  PlayerState,
  FightState,
  FightTurn,
  Dynasty,
  LeaderboardEntry,
  LeaderboardMetric,
  CommunityEvent,
  LanguageId,
  GrowthStatKey,
  CombatAction,
} from '../../shared/types';
import type {
  InitResponse,
  CreateRobotResponse,
  FightStartResponse,
  FightTurnResponse,
  FightCompleteResponse,
  RepairResponse,
  TrainResponse,
  SwapLanguageResponse,
  DynastyTreeResponse,
  LeaderboardResponse,
  CommunityFeedResponse,
  ApiError,
} from '../../shared/api';

export type GameScreen =
  | 'loading'
  | 'creating'
  | 'corner'
  | 'fighting'
  | 'fight_result'
  | 'dynasty'
  | 'leaderboard'
  | 'retired';

export type GameState = {
  screen: GameScreen;
  postId: string | null;
  username: string | null;
  player: PlayerState | null;
  fight: FightState | null;
  lastPlayerTurn: FightTurn | null;
  lastEnemyTurn: FightTurn | null;
  dynasty: Dynasty | null;
  leaderboard: LeaderboardEntry[];
  leaderboardMetric: LeaderboardMetric;
  playerRank: number | null;
  communityEvents: CommunityEvent[];
  loading: boolean;
  error: string | null;
};

const initialState: GameState = {
  screen: 'loading',
  postId: null,
  username: null,
  player: null,
  fight: null,
  lastPlayerTurn: null,
  lastEnemyTurn: null,
  dynasty: null,
  leaderboard: [],
  leaderboardMetric: 'level',
  playerRank: null,
  communityEvents: [],
  loading: true,
  error: null,
};

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = (await res.json()) as ApiError;
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const useGameState = () => {
  const [state, setState] = useState<GameState>(initialState);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const safeSetState = useCallback((updater: (prev: GameState) => GameState) => {
    if (mountedRef.current) {
      setState(updater);
    }
  }, []);

  // --- Init ---
  useEffect(() => {
    const init = async () => {
      try {
        const data = await apiFetch<InitResponse>('/init');
        safeSetState((prev) => ({
          ...prev,
          postId: data.postId,
          username: data.username,
          player: data.player,
          fight: data.fight ?? null,
          screen: data.hasPlayer
            ? data.player?.state === 'fighting' && data.fight
              ? 'fighting'
              : data.player?.state === 'retired' || data.player?.state === 'creating'
                ? 'creating'
                : 'corner'
            : 'creating',
          loading: false,
        }));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to initialize';
        safeSetState((prev) => ({
          ...prev,
          error: message,
          loading: false,
          screen: 'loading',
        }));
      }
    };
    void init();
  }, [safeSetState]);

  // --- Realtime community events ---
  useEffect(() => {
    if (!state.postId) return;
    const channel = `${state.postId}-events`;
    connectRealtime<CommunityEvent>({
      channel,
      onMessage: (event) => {
        safeSetState((prev) => ({
          ...prev,
          communityEvents: [event, ...prev.communityEvents].slice(0, 50),
        }));
      },
    });
    return () => {
      disconnectRealtime(channel);
    };
  }, [state.postId, safeSetState]);

  // --- Robot Creation ---
  const createRobot = useCallback(
    async (name: string, language1: LanguageId, language2: LanguageId) => {
      safeSetState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const data = await apiFetch<CreateRobotResponse>('/create', {
          method: 'POST',
          body: JSON.stringify({ robotName: name, language1, language2 }),
        });
        safeSetState((prev) => ({
          ...prev,
          player: data.player,
          screen: 'corner',
          loading: false,
        }));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create robot';
        safeSetState((prev) => ({ ...prev, error: message, loading: false }));
      }
    },
    [safeSetState]
  );

  // --- Fight Start ---
  const startFight = useCallback(async () => {
    safeSetState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await apiFetch<FightStartResponse>('/fight/start', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      safeSetState((prev) => ({
        ...prev,
        fight: data.fight,
        lastPlayerTurn: null,
        lastEnemyTurn: null,
        screen: 'fighting',
        loading: false,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start fight';
      safeSetState((prev) => ({ ...prev, error: message, loading: false }));
    }
  }, [safeSetState]);

  // --- Submit Action (turn-by-turn) ---
  const submitAction = useCallback(
    async (action: CombatAction) => {
      safeSetState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const data = await apiFetch<FightTurnResponse>('/fight/turn', {
          method: 'POST',
          body: JSON.stringify({ action }),
        });
        safeSetState((prev) => ({
          ...prev,
          fight: data.fight,
          lastPlayerTurn: data.playerTurn,
          lastEnemyTurn: data.enemyTurn,
          loading: false,
        }));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to submit action';
        safeSetState((prev) => ({ ...prev, error: message, loading: false }));
      }
    },
    [safeSetState]
  );

  // --- Auto-pilot (resolve all remaining rounds) ---
  const autoPilotFight = useCallback(async () => {
    safeSetState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await apiFetch<FightTurnResponse>('/fight/resolve', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      safeSetState((prev) => ({
        ...prev,
        fight: data.fight,
        lastPlayerTurn: data.playerTurn,
        lastEnemyTurn: data.enemyTurn,
        loading: false,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to auto-resolve fight';
      safeSetState((prev) => ({ ...prev, error: message, loading: false }));
    }
  }, [safeSetState]);

  // --- Complete Fight ---
  const completeFight = useCallback(async () => {
    safeSetState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await apiFetch<FightCompleteResponse>('/fight/complete', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      safeSetState((prev) => ({
        ...prev,
        player: data.player,
        fight: null,
        lastPlayerTurn: null,
        lastEnemyTurn: null,
        screen: data.forcedRetirement ? 'retired' : 'corner',
        loading: false,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to complete fight';
      safeSetState((prev) => ({ ...prev, error: message, loading: false }));
    }
  }, [safeSetState]);

  // --- Corner Phase ---
  const repair = useCallback(
    async (full: boolean) => {
      safeSetState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const endpoint = full ? '/corner/full-repair' : '/corner/repair';
        const data = await apiFetch<RepairResponse>(endpoint, {
          method: 'POST',
          body: JSON.stringify({}),
        });
        safeSetState((prev) => {
          if (!prev.player) return prev;
          return {
            ...prev,
            player: {
              ...prev.player,
              stats: { ...prev.player.stats, hp: data.hpAfter },
              fullRepairCooldown: full ? 3 : prev.player.fullRepairCooldown,
            },
            loading: false,
          };
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to repair';
        safeSetState((prev) => ({ ...prev, error: message, loading: false }));
      }
    },
    [safeSetState]
  );

  const trainStat = useCallback(
    async (stat: GrowthStatKey) => {
      safeSetState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const data = await apiFetch<TrainResponse>('/corner/train', {
          method: 'POST',
          body: JSON.stringify({ stat }),
        });
        safeSetState((prev) => {
          if (!prev.player) return prev;
          const updatedStats = { ...prev.player.stats, [data.stat]: data.newValue };
          // When maxHp increases, also bump current hp to match server behavior
          if (data.stat === 'maxHp') {
            updatedStats.hp = prev.player.stats.hp + (data.newValue - data.oldValue);
          }
          return {
            ...prev,
            player: {
              ...prev.player,
              stats: updatedStats,
              xp: data.xpRemaining,
            },
            loading: false,
          };
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to train';
        safeSetState((prev) => ({ ...prev, error: message, loading: false }));
      }
    },
    [safeSetState]
  );

  const swapLanguage = useCallback(
    async (slot: 1 | 2, newLanguage: LanguageId) => {
      safeSetState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const data = await apiFetch<SwapLanguageResponse>('/corner/swap-language', {
          method: 'POST',
          body: JSON.stringify({ slot, newLanguage }),
        });
        safeSetState((prev) => ({
          ...prev,
          player: data.player,
          loading: false,
        }));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to swap language';
        safeSetState((prev) => ({ ...prev, error: message, loading: false }));
      }
    },
    [safeSetState]
  );

  // --- Retire ---
  const retireRobot = useCallback(async () => {
    safeSetState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await apiFetch<{ type: string; dynasty: Dynasty }>('/retire', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      safeSetState((prev) => ({
        ...prev,
        dynasty: data.dynasty,
        screen: 'creating',
        player: null,
        loading: false,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to retire';
      safeSetState((prev) => ({ ...prev, error: message, loading: false }));
    }
  }, [safeSetState]);

  // --- Dynasty ---
  const loadDynasty = useCallback(async () => {
    safeSetState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await apiFetch<DynastyTreeResponse>('/dynasty/tree');
      safeSetState((prev) => ({
        ...prev,
        dynasty: data.dynasty,
        screen: 'dynasty',
        loading: false,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load dynasty';
      safeSetState((prev) => ({ ...prev, error: message, loading: false }));
    }
  }, [safeSetState]);

  // --- Leaderboard ---
  const loadLeaderboard = useCallback(
    async (metric: LeaderboardMetric) => {
      safeSetState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const data = await apiFetch<LeaderboardResponse>(`/leaderboard/${metric}`);
        safeSetState((prev) => ({
          ...prev,
          leaderboard: data.entries,
          leaderboardMetric: metric,
          playerRank: data.playerRank,
          screen: 'leaderboard',
          loading: false,
        }));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load leaderboard';
        safeSetState((prev) => ({ ...prev, error: message, loading: false }));
      }
    },
    [safeSetState]
  );

  // --- Community ---
  const loadCommunityFeed = useCallback(async () => {
    try {
      const data = await apiFetch<CommunityFeedResponse>('/community/feed');
      safeSetState((prev) => ({
        ...prev,
        communityEvents: data.events,
      }));
    } catch {
      // Silently fail — community feed is not critical
    }
  }, [safeSetState]);

  // --- Navigation ---
  const goToCorner = useCallback(() => {
    safeSetState((prev) => ({ ...prev, screen: 'corner' }));
  }, [safeSetState]);

  const goToCreating = useCallback(() => {
    safeSetState((prev) => ({ ...prev, screen: 'creating' }));
  }, [safeSetState]);

  const clearError = useCallback(() => {
    safeSetState((prev) => ({ ...prev, error: null }));
  }, [safeSetState]);

  return {
    ...state,
    createRobot,
    startFight,
    submitAction,
    autoPilotFight,
    completeFight,
    repair,
    trainStat,
    swapLanguage,
    retireRobot,
    loadDynasty,
    loadLeaderboard,
    loadCommunityFeed,
    goToCorner,
    goToCreating,
    clearError,
  } as const;
};
