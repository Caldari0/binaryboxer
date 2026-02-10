// ============================================================
// Binary Boxer — Combat Routes
// Handles fight start, turn-by-turn resolution, and completion
// ============================================================

import { Hono } from 'hono';
import { context, redis, reddit } from '@devvit/web/server';
import { log } from '../logger';
import type {
  ApiError,
  FightStartResponse,
  FightTurnRequest,
  FightTurnResponse,
  FightCompleteResponse,
} from '../../shared/api';
import type { CombatAction, Dynasty, DynastyGeneration } from '../../shared/types';
import { calculateTotalLegacy } from '../engine/inheritance';
import { generateEnemy } from '../engine/enemy';
import { initFight, resolveRound, autoPickAction } from '../engine/combat';
import {
  applyCompanionBuffs,
  getXpForFight,
  getXpRequired,
  calculateStatsForLevel,
} from '../engine/stats';
import {
  loadPlayer,
  savePlayer,
  loadFight,
  saveFight,
  deleteFight,
  updateLeaderboards,
} from '../utils/redis';
import { broadcastEvent } from './community';

export const combat = new Hono();

const VALID_ACTIONS: CombatAction[] = [
  'strike',
  'heavy_strike',
  'guard',
  'analyse',
  'overclock',
  'combo',
  'berserk',
];

// -------------------------------------------------------
// POST /start — Generate enemy and begin fight
// -------------------------------------------------------
combat.post('/start', async (c) => {
  const { postId } = context;

  if (!postId) {
    return c.json<ApiError>(
      { status: 'error', message: 'postId is required but missing from context' },
      400,
    );
  }

  try {
    const username = await reddit.getCurrentUsername();

    if (!username) {
      return c.json<ApiError>(
        { status: 'error', message: 'Could not determine username' },
        401,
      );
    }

    const player = await loadPlayer(postId, username);

    if (!player) {
      return c.json<ApiError>(
        { status: 'error', message: 'No player found. Create a robot first.' },
        404,
      );
    }

    if (player.state !== 'corner') {
      return c.json<ApiError>(
        { status: 'error', message: 'Robot must be in the corner to start a fight' },
        400,
      );
    }

    // Check for an existing active fight
    const existingFight = await loadFight(postId, username);
    if (existingFight) {
      return c.json<ApiError>(
        { status: 'error', message: 'A fight is already in progress' },
        400,
      );
    }

    // Generate a seed and enemy
    const seed = Date.now();
    const fightNumber = player.totalFights + 1;
    const enemy = generateEnemy(player.level, fightNumber, seed);

    // Calculate effective player stats with companion buffs
    const effectiveStats = applyCompanionBuffs(
      player.stats,
      player.hasVeil,
      player.hasEcho,
      player.language1,
      player.language2,
    );

    // Initialize fight state with active combat
    const fight = initFight(effectiveStats, enemy, seed);

    // Save fight with 600s TTL
    await saveFight(postId, username, fight, 600);

    // Update player state to fighting
    player.state = 'fighting';
    player.lastFightAt = Date.now();
    await savePlayer(postId, username, player);

    return c.json<FightStartResponse>({
      type: 'fight_start',
      fight,
    });
  } catch (error) {
    log.error('/api/fight/start', 'Failed to start fight', error, postId);
    const message =
      error instanceof Error
        ? `Fight start failed: ${error.message}`
        : 'Unknown error starting fight';
    return c.json<ApiError>({ status: 'error', message }, 500);
  }
});

// -------------------------------------------------------
// POST /turn — Resolve one round with player's chosen action
// -------------------------------------------------------
combat.post('/turn', async (c) => {
  const { postId } = context;

  if (!postId) {
    return c.json<ApiError>(
      { status: 'error', message: 'postId is required but missing from context' },
      400,
    );
  }

  try {
    const username = await reddit.getCurrentUsername();

    if (!username) {
      return c.json<ApiError>(
        { status: 'error', message: 'Could not determine username' },
        401,
      );
    }

    const fight = await loadFight(postId, username);

    if (!fight) {
      return c.json<ApiError>(
        { status: 'error', message: 'No active fight found' },
        404,
      );
    }

    if (fight.result !== 'pending') {
      return c.json<FightTurnResponse>({
        type: 'fight_turn',
        fight,
        playerTurn: fight.turns[fight.turns.length - 2]!,
        enemyTurn: fight.turns[fight.turns.length - 1] ?? null,
      });
    }

    // Parse action from request body
    const body = await c.req.json<FightTurnRequest>();
    const playerAction = body.action;

    if (!VALID_ACTIONS.includes(playerAction)) {
      return c.json<ApiError>(
        { status: 'error', message: `Invalid action: ${playerAction}` },
        400,
      );
    }

    // Validate the action is available
    const isAvailable = fight.availableActions.some(
      (a) => a.action === playerAction,
    );
    if (!isAvailable) {
      return c.json<ApiError>(
        { status: 'error', message: `Action not available: ${playerAction}` },
        400,
      );
    }

    // Load player for level and robot name
    const player = await loadPlayer(postId, username);
    if (!player) {
      return c.json<ApiError>(
        { status: 'error', message: 'No player found' },
        404,
      );
    }

    // Resolve one round
    const roundResult = resolveRound(
      fight,
      playerAction,
      player.level,
      player.robotName,
    );

    const updatedFight = roundResult.state;

    // If fight ended, calculate XP
    if (updatedFight.result !== 'pending') {
      const won = updatedFight.result === 'win';
      updatedFight.xpAwarded = getXpForFight(
        updatedFight.enemy.level,
        won,
        updatedFight.enemy.isBoss,
      );
    }

    // Save updated fight state
    await saveFight(postId, username, updatedFight, 600);

    return c.json<FightTurnResponse>({
      type: 'fight_turn',
      fight: updatedFight,
      playerTurn: roundResult.playerTurn,
      enemyTurn: roundResult.enemyTurn,
    });
  } catch (error) {
    log.error('/api/fight/turn', 'Failed to resolve turn', error, postId);
    const message =
      error instanceof Error
        ? `Fight turn failed: ${error.message}`
        : 'Unknown error resolving turn';
    return c.json<ApiError>({ status: 'error', message }, 500);
  }
});

// -------------------------------------------------------
// POST /resolve — Auto-pilot: resolve all remaining rounds
// -------------------------------------------------------
combat.post('/resolve', async (c) => {
  const { postId } = context;

  if (!postId) {
    return c.json<ApiError>(
      { status: 'error', message: 'postId is required but missing from context' },
      400,
    );
  }

  try {
    const username = await reddit.getCurrentUsername();

    if (!username) {
      return c.json<ApiError>(
        { status: 'error', message: 'Could not determine username' },
        401,
      );
    }

    let fight = await loadFight(postId, username);

    if (!fight) {
      return c.json<ApiError>(
        { status: 'error', message: 'No active fight found' },
        404,
      );
    }

    // If already resolved, return existing result
    if (fight.result !== 'pending') {
      return c.json<FightTurnResponse>({
        type: 'fight_turn',
        fight,
        playerTurn: fight.turns[fight.turns.length - 2]!,
        enemyTurn: fight.turns[fight.turns.length - 1] ?? null,
      });
    }

    const player = await loadPlayer(postId, username);
    if (!player) {
      return c.json<ApiError>(
        { status: 'error', message: 'No player found' },
        404,
      );
    }

    // Auto-resolve all remaining rounds
    let lastPlayerTurn = fight.turns[fight.turns.length - 1] ?? null;
    let lastEnemyTurn = null;

    while (fight.result === 'pending') {
      const action = autoPickAction(fight.availableActions);
      const roundResult = resolveRound(
        fight,
        action,
        player.level,
        player.robotName,
      );
      fight = roundResult.state;
      lastPlayerTurn = roundResult.playerTurn;
      lastEnemyTurn = roundResult.enemyTurn;
    }

    // Calculate XP
    const won = fight.result === 'win';
    fight.xpAwarded = getXpForFight(
      fight.enemy.level,
      won,
      fight.enemy.isBoss,
    );

    // Save
    await saveFight(postId, username, fight, 600);

    return c.json<FightTurnResponse>({
      type: 'fight_turn',
      fight,
      playerTurn: lastPlayerTurn!,
      enemyTurn: lastEnemyTurn,
    });
  } catch (error) {
    log.error('/api/fight/resolve', 'Failed to resolve fight', error, postId);
    const message =
      error instanceof Error
        ? `Fight resolve failed: ${error.message}`
        : 'Unknown error resolving fight';
    return c.json<ApiError>({ status: 'error', message }, 500);
  }
});

// -------------------------------------------------------
// POST /complete — Record result and award XP
// -------------------------------------------------------
combat.post('/complete', async (c) => {
  const { postId } = context;

  if (!postId) {
    return c.json<ApiError>(
      { status: 'error', message: 'postId is required but missing from context' },
      400,
    );
  }

  try {
    const username = await reddit.getCurrentUsername();

    if (!username) {
      return c.json<ApiError>(
        { status: 'error', message: 'Could not determine username' },
        401,
      );
    }

    const fight = await loadFight(postId, username);

    if (!fight) {
      return c.json<ApiError>(
        { status: 'error', message: 'No active fight found' },
        404,
      );
    }

    if (fight.result === 'pending') {
      return c.json<ApiError>(
        { status: 'error', message: 'Fight has not been resolved yet. Submit actions or call /fight/resolve first.' },
        400,
      );
    }

    const player = await loadPlayer(postId, username);

    if (!player) {
      return c.json<ApiError>(
        { status: 'error', message: 'No player found' },
        404,
      );
    }

    const won = fight.result === 'win';
    const xpGained = fight.xpAwarded;

    // Update player stats
    player.xp += xpGained;
    player.totalFights += 1;

    if (won) {
      player.wins += 1;
      player.currentStreak += 1;
      if (player.currentStreak > player.bestStreak) {
        player.bestStreak = player.currentStreak;
      }
    } else {
      player.losses += 1;
      player.currentStreak = 0;
    }

    // Update HP from fight result
    player.stats.hp = Math.max(0, fight.currentHp);

    // Check for level up
    let leveledUp = false;
    let newLevel = player.level;

    while (player.xp >= player.xpToNext) {
      player.xp -= player.xpToNext;
      player.level += 1;
      newLevel = player.level;
      player.xpToNext = getXpRequired(player.level);
      leveledUp = true;

      // Recalculate stats on level up
      player.stats = calculateStatsForLevel(
        player.language1,
        player.language2,
        player.level,
        player.legacyStats,
      );

      // Preserve current HP ratio on level up
      const hpRatio = fight.currentHp / fight.playerStatsSnapshot.maxHp;
      player.stats.hp = Math.max(
        1,
        Math.floor(player.stats.maxHp * hpRatio),
      );
    }

    // Check for companion unlocks
    let companionUnlocked: string | null = null;

    if (!player.hasVeil && player.totalFights >= 5) {
      player.hasVeil = true;
      companionUnlocked = 'veil';
    }

    if (!player.hasEcho && player.totalFights >= 12) {
      player.hasEcho = true;
      companionUnlocked = 'echo';
    }

    // Reduce cooldowns
    if (player.fullRepairCooldown > 0) {
      player.fullRepairCooldown -= 1;
    }
    if (player.swapLanguageCooldown > 0) {
      player.swapLanguageCooldown -= 1;
    }

    // Check for forced retirement: KO'd (HP 0) at 30+ total fights
    const isKo = !won && player.stats.hp <= 0;
    const forcedRetirement = isKo && player.totalFights >= 30;

    if (forcedRetirement) {
      // Trigger forced retirement flow
      const gen: DynastyGeneration = {
        generationNumber: player.generation,
        robotName: player.robotName,
        language1: player.language1,
        language2: player.language2,
        finalLevel: player.level,
        totalFights: player.totalFights,
        wins: player.wins,
        bestStreak: player.bestStreak,
        retiredAt: Date.now(),
        causeOfRetirement: 'ko',
        finalStats: { ...player.stats },
      };

      const dynastyKey = `${postId}:dynasty:${username}`;
      const dynastyData = await redis.get(dynastyKey);
      let dynasty: Dynasty;

      if (dynastyData) {
        dynasty = JSON.parse(dynastyData) as Dynasty;
      } else {
        dynasty = {
          id: player.dynastyId,
          ownerUsername: username,
          generations: [],
          totalFights: 0,
          totalWins: 0,
          deepestLevel: 0,
          createdAt: Date.now(),
        };
      }

      dynasty.generations.push(gen);
      dynasty.totalFights += player.totalFights;
      dynasty.totalWins += player.wins;
      dynasty.deepestLevel = Math.max(dynasty.deepestLevel, player.level);
      await redis.set(dynastyKey, JSON.stringify(dynasty));

      const newGeneration = player.generation + 1;
      const hasKindred = newGeneration >= 2;
      const newLegacyStats = calculateTotalLegacy(dynasty.generations, hasKindred);

      // Reset player to 'creating' state with inheritance
      player.robotName = '';
      player.stats = calculateStatsForLevel(player.language1, player.language2, 1, newLegacyStats);
      player.level = 1;
      player.xp = 0;
      player.xpToNext = getXpRequired(1);
      player.totalFights = 0;
      player.wins = 0;
      player.losses = 0;
      player.currentStreak = 0;
      player.bestStreak = 0;
      player.hasVeil = false;
      player.hasEcho = false;
      player.hasKindred = hasKindred;
      player.fullRepairCooldown = 0;
      player.swapLanguageCooldown = 0;
      player.generation = newGeneration;
      player.legacyStats = newLegacyStats;
      player.createdAt = Date.now();
      player.lastFightAt = 0;
      player.state = 'creating';
    } else {
      // Normal: return to corner
      player.state = 'corner';
    }

    // Save player
    await savePlayer(postId, username, player);

    // Update leaderboards
    await updateLeaderboards(postId, username, player);

    // Delete fight state from Redis
    await deleteFight(postId, username);

    // Broadcast community events for milestones
    const events: Promise<void>[] = [];

    if (forcedRetirement) {
      events.push(
        broadcastEvent(postId, {
          type: 'dynasty_start',
          username,
          robotName: player.robotName || 'Unknown',
          detail: `KO'd at Level ${newLevel} after ${player.totalFights || 30}+ fights — forced retirement, Generation ${player.generation} begins`,
          timestamp: Date.now(),
        }),
      );
    }

    if (won && fight.enemy.isBoss) {
      events.push(
        broadcastEvent(postId, {
          type: 'boss_kill',
          username,
          robotName: player.robotName,
          detail: `defeated ${fight.enemy.name} at Level ${player.level}`,
          timestamp: Date.now(),
        }),
      );
    }

    if (leveledUp && newLevel % 5 === 0) {
      events.push(
        broadcastEvent(postId, {
          type: 'level_milestone',
          username,
          robotName: player.robotName,
          detail: `reached Level ${newLevel}`,
          timestamp: Date.now(),
        }),
      );
    }

    if (won && player.currentStreak > 0 && player.currentStreak % 10 === 0) {
      events.push(
        broadcastEvent(postId, {
          type: 'streak_record',
          username,
          robotName: player.robotName,
          detail: `${player.currentStreak} win streak`,
          timestamp: Date.now(),
        }),
      );
    }

    if (events.length > 0) {
      await Promise.all(events);
    }

    return c.json<FightCompleteResponse>({
      type: 'fight_complete',
      player,
      xpGained,
      leveledUp,
      newLevel,
      companionUnlocked,
      forcedRetirement,
    });
  } catch (error) {
    log.error('/api/fight/complete', 'Failed to complete fight', error, postId);
    const message =
      error instanceof Error
        ? `Fight complete failed: ${error.message}`
        : 'Unknown error completing fight';
    return c.json<ApiError>({ status: 'error', message }, 500);
  }
});

