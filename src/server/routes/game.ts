// ============================================================
// Binary Boxer — Game State Routes
// Handles player init, robot creation, stats, and retirement
// ============================================================

import { Hono } from 'hono';
import { context, redis, reddit } from '@devvit/web/server';
import { log } from '../logger';
import type {
  ApiError,
  InitResponse,
  CreateRobotRequest,
  CreateRobotResponse,
  RobotStatsResponse,
  RetireRobotResponse,
  DynastyTreeResponse,
} from '../../shared/api';
import type {
  PlayerState,
  Dynasty,
  DynastyGeneration,
  CommunityEvent,
} from '../../shared/types';
import {
  calculateStatsForLevel,
  getXpRequired,
  applyCompanionBuffs,
} from '../engine/stats';
import { calculateTotalLegacy } from '../engine/inheritance';
import { LANGUAGE_IDS } from '../data/languages';
import {
  loadPlayer,
  loadFight,
  savePlayer,
  updateLeaderboards,
} from '../utils/redis';
import { broadcastEvent } from './community';

export const game = new Hono();

// -------------------------------------------------------
// GET /init — Load or create player
// -------------------------------------------------------
game.get('/init', async (c) => {
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

    // If player is mid-fight, load the active fight state so the client can resume
    let fight = null;
    if (player?.state === 'fighting') {
      fight = await loadFight(postId, username);
      // If fight state expired (TTL), reset player to corner
      if (!fight) {
        player.state = 'corner';
        await savePlayer(postId, username, player);
      }
    }

    return c.json<InitResponse>({
      type: 'init',
      postId,
      username,
      player,
      hasPlayer: player !== null,
      fight,
    });
  } catch (error) {
    log.error('/api/init', 'Failed to initialize player', error, postId);
    const message =
      error instanceof Error
        ? `Init failed: ${error.message}`
        : 'Unknown error during initialization';
    return c.json<ApiError>({ status: 'error', message }, 500);
  }
});

// -------------------------------------------------------
// POST /create — Create a new robot
// -------------------------------------------------------
game.post('/create', async (c) => {
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

    const body = await c.req.json<CreateRobotRequest>();
    const { language1, language2 } = body;
    let { robotName } = body;

    // Validate robot name
    if (
      !robotName ||
      typeof robotName !== 'string' ||
      robotName.trim().length < 1 ||
      robotName.trim().length > 20
    ) {
      return c.json<ApiError>(
        { status: 'error', message: 'Robot name must be between 1 and 20 characters' },
        400,
      );
    }

    // Sanitize: strip HTML tags, control characters, and collapse whitespace
    robotName = robotName
      .trim()
      .replace(/<[^>]*>/g, '')
      .replace(/[^\x20-\x7E]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (robotName.length < 1) {
      return c.json<ApiError>(
        { status: 'error', message: 'Robot name contains no valid characters' },
        400,
      );
    }

    // Validate languages
    if (!LANGUAGE_IDS.includes(language1) || !LANGUAGE_IDS.includes(language2)) {
      return c.json<ApiError>(
        { status: 'error', message: 'Both languages must be valid language IDs' },
        400,
      );
    }

    if (language1 === language2) {
      return c.json<ApiError>(
        { status: 'error', message: 'Languages must be different' },
        400,
      );
    }

    // Check if player already has an active robot
    const existing = await loadPlayer(postId, username);
    if (existing && existing.state !== 'creating') {
      return c.json<ApiError>(
        { status: 'error', message: 'You already have an active robot' },
        400,
      );
    }

    // Carry over legacy stats and generation from the creating-state player (post-retirement)
    const legacyStats = existing?.legacyStats ?? {};
    const generation = existing?.generation ?? 1;
    const dynastyId = existing?.dynastyId ?? `${username}-${Date.now()}`;
    const hasKindred = existing?.hasKindred ?? false;

    // Calculate initial stats for level 1
    const stats = calculateStatsForLevel(language1, language2, 1, legacyStats);

    const player: PlayerState = {
      robotName: robotName.trim(),
      language1,
      language2,
      stats,
      level: 1,
      xp: 0,
      xpToNext: getXpRequired(1),
      totalFights: 0,
      wins: 0,
      losses: 0,
      currentStreak: 0,
      bestStreak: 0,
      hasVeil: false,
      hasEcho: false,
      hasKindred,
      fullRepairCooldown: 0,
      swapLanguageCooldown: 0,
      generation,
      dynastyId,
      legacyStats,
      createdAt: Date.now(),
      lastFightAt: 0,
      state: 'corner',
    };

    await savePlayer(postId, username, player);
    await updateLeaderboards(postId, username, player);

    // Broadcast robot creation event
    await broadcastEvent(postId, {
      type: 'robot_created',
      username,
      robotName: player.robotName,
      detail: `created ${player.robotName} (Gen ${player.generation})`,
      timestamp: Date.now(),
    });

    return c.json<CreateRobotResponse>({
      type: 'robot_created',
      player,
    });
  } catch (error) {
    log.error('/api/robot/create', 'Failed to create robot', error, postId);
    const message =
      error instanceof Error
        ? `Create failed: ${error.message}`
        : 'Unknown error during robot creation';
    return c.json<ApiError>({ status: 'error', message }, 500);
  }
});

// -------------------------------------------------------
// GET /stats — Get current robot stats with companion buffs
// -------------------------------------------------------
game.get('/stats', async (c) => {
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

    const effectiveStats = applyCompanionBuffs(
      player.stats,
      player.hasVeil,
      player.hasEcho,
      player.language1,
      player.language2,
    );

    return c.json<RobotStatsResponse>({
      type: 'robot_stats',
      player,
      effectiveStats,
    });
  } catch (error) {
    log.error('/api/robot/stats', 'Failed to get robot stats', error, postId);
    const message =
      error instanceof Error
        ? `Stats failed: ${error.message}`
        : 'Unknown error fetching stats';
    return c.json<ApiError>({ status: 'error', message }, 500);
  }
});

// -------------------------------------------------------
// POST /retire — Retire robot and start dynasty
// -------------------------------------------------------
game.post('/retire', async (c) => {
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
        { status: 'error', message: 'No player found' },
        404,
      );
    }

    if (player.state !== 'corner') {
      return c.json<ApiError>(
        { status: 'error', message: 'Robot must be in the corner to retire' },
        400,
      );
    }

    if (player.totalFights < 20) {
      return c.json<ApiError>(
        {
          status: 'error',
          message: `Robot needs at least 20 fights to retire (currently ${player.totalFights})`,
        },
        400,
      );
    }

    // Create dynasty generation entry for the retiring robot
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
      causeOfRetirement: 'voluntary',
      finalStats: { ...player.stats },
    };

    // Load or create dynasty
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

    // Calculate inheritance for the new robot
    const newGeneration = player.generation + 1;
    const hasKindred = newGeneration >= 2;
    const newLegacyStats = calculateTotalLegacy(
      dynasty.generations,
      hasKindred,
    );

    // Create new player in 'creating' state with inheritance carried over
    const newPlayer: PlayerState = {
      robotName: '',
      language1: player.language1,
      language2: player.language2,
      stats: calculateStatsForLevel(
        player.language1,
        player.language2,
        1,
        newLegacyStats,
      ),
      level: 1,
      xp: 0,
      xpToNext: getXpRequired(1),
      totalFights: 0,
      wins: 0,
      losses: 0,
      currentStreak: 0,
      bestStreak: 0,
      hasVeil: false,
      hasEcho: false,
      hasKindred,
      fullRepairCooldown: 0,
      swapLanguageCooldown: 0,
      generation: newGeneration,
      dynastyId: player.dynastyId,
      legacyStats: newLegacyStats,
      createdAt: Date.now(),
      lastFightAt: 0,
      state: 'creating',
    };

    await savePlayer(postId, username, newPlayer);
    await updateLeaderboards(postId, username, newPlayer);

    // Broadcast dynasty event
    await broadcastEvent(postId, {
      type: 'dynasty_start',
      username,
      robotName: player.robotName,
      detail: `${player.robotName} retired at Level ${player.level} — Generation ${newGeneration} begins`,
      timestamp: Date.now(),
    });

    return c.json<RetireRobotResponse>({
      type: 'robot_retired',
      dynasty,
    });
  } catch (error) {
    log.error('/api/robot/retire', 'Failed to retire robot', error, postId);
    const message =
      error instanceof Error
        ? `Retire failed: ${error.message}`
        : 'Unknown error during retirement';
    return c.json<ApiError>({ status: 'error', message }, 500);
  }
});

// -------------------------------------------------------
// GET /dynasty — Get dynasty tree
// -------------------------------------------------------
game.get('/dynasty', async (c) => {
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

    const dynastyData = await redis.get(`${postId}:dynasty:${username}`);
    const dynasty = dynastyData
      ? (JSON.parse(dynastyData) as Dynasty)
      : null;

    return c.json<DynastyTreeResponse>({
      type: 'dynasty_tree',
      dynasty,
    });
  } catch (error) {
    log.error('/api/dynasty/tree', 'Failed to get dynasty tree', error, postId);
    const message =
      error instanceof Error
        ? `Dynasty fetch failed: ${error.message}`
        : 'Unknown error fetching dynasty';
    return c.json<ApiError>({ status: 'error', message }, 500);
  }
});
