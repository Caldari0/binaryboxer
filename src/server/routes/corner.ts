// ============================================================
// Binary Boxer — Corner Phase Routes
// Handles repair, training, and language swaps between fights
// ============================================================

import { Hono } from 'hono';
import { context, reddit } from '@devvit/web/server';
import { log } from '../logger';
import type {
  ApiError,
  RepairResponse,
  TrainRequest,
  TrainResponse,
  SwapLanguageRequest,
  SwapLanguageResponse,
} from '../../shared/api';
import type { GrowthStatKey } from '../../shared/types';
import { getTrainingCost, calculateStatsForLevel } from '../engine/stats';
import { LANGUAGE_IDS } from '../data/languages';
import { loadPlayer, savePlayer } from '../utils/redis';

// Valid stats that can be trained (all growth stats)
const TRAINABLE_STATS: GrowthStatKey[] = [
  'maxHp',
  'power',
  'defence',
  'speed',
  'wisdom',
  'creativity',
  'stability',
  'adaptability',
  'evasion',
  'blockChance',
  'counter',
  'critChance',
  'patternRead',
  'penetration',
];

export const corner = new Hono();

// -------------------------------------------------------
// POST /repair — Heal 50% of max HP
// -------------------------------------------------------
corner.post('/repair', async (c) => {
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
        { status: 'error', message: 'Robot must be in the corner to repair' },
        400,
      );
    }

    const hpBefore = player.stats.hp;
    const maxHp = player.stats.maxHp;
    const healAmount = Math.floor(maxHp * 0.5);
    const hpAfter = Math.min(maxHp, hpBefore + healAmount);

    player.stats.hp = hpAfter;
    await savePlayer(postId, username, player);

    return c.json<RepairResponse>({
      type: 'repaired',
      hpBefore,
      hpAfter,
      maxHp,
      fullRepair: false,
    });
  } catch (error) {
    log.error('/api/corner/repair', 'Failed to repair robot', error, postId);
    const message =
      error instanceof Error
        ? `Repair failed: ${error.message}`
        : 'Unknown error during repair';
    return c.json<ApiError>({ status: 'error', message }, 500);
  }
});

// -------------------------------------------------------
// POST /full-repair — Heal 100% HP (cooldown: 3 fights)
// -------------------------------------------------------
corner.post('/full-repair', async (c) => {
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
        { status: 'error', message: 'Robot must be in the corner to repair' },
        400,
      );
    }

    if (player.fullRepairCooldown > 0) {
      return c.json<ApiError>(
        {
          status: 'error',
          message: `Full repair on cooldown (${player.fullRepairCooldown} fights remaining)`,
        },
        400,
      );
    }

    const hpBefore = player.stats.hp;
    const maxHp = player.stats.maxHp;

    player.stats.hp = maxHp;
    player.fullRepairCooldown = 3;
    await savePlayer(postId, username, player);

    return c.json<RepairResponse>({
      type: 'repaired',
      hpBefore,
      hpAfter: maxHp,
      maxHp,
      fullRepair: true,
    });
  } catch (error) {
    log.error('/api/corner/full-repair', 'Failed to full-repair robot', error, postId);
    const message =
      error instanceof Error
        ? `Full repair failed: ${error.message}`
        : 'Unknown error during full repair';
    return c.json<ApiError>({ status: 'error', message }, 500);
  }
});

// -------------------------------------------------------
// POST /train — Spend XP to boost a stat
// -------------------------------------------------------
corner.post('/train', async (c) => {
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

    const body = await c.req.json<TrainRequest>();
    const { stat } = body;

    // Validate stat is trainable
    if (!TRAINABLE_STATS.includes(stat)) {
      return c.json<ApiError>(
        { status: 'error', message: `Invalid stat: ${stat}` },
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

    if (player.state !== 'corner') {
      return c.json<ApiError>(
        { status: 'error', message: 'Robot must be in the corner to train' },
        400,
      );
    }

    const currentValue = player.stats[stat];
    const cost = getTrainingCost(currentValue);

    if (player.xp < cost) {
      return c.json<ApiError>(
        {
          status: 'error',
          message: `Not enough XP. Need ${cost}, have ${player.xp}`,
        },
        400,
      );
    }

    // Deduct XP and increment stat
    player.xp -= cost;
    player.stats[stat] += 1;

    // If maxHp increased, also increase current hp by 1
    if (stat === 'maxHp') {
      player.stats.hp += 1;
    }

    await savePlayer(postId, username, player);

    return c.json<TrainResponse>({
      type: 'trained',
      stat,
      oldValue: currentValue,
      newValue: player.stats[stat],
      xpSpent: cost,
      xpRemaining: player.xp,
    });
  } catch (error) {
    log.error('/api/corner/train', 'Failed to train stat', error, postId);
    const message =
      error instanceof Error
        ? `Training failed: ${error.message}`
        : 'Unknown error during training';
    return c.json<ApiError>({ status: 'error', message }, 500);
  }
});

// -------------------------------------------------------
// POST /swap-language — Change one language (cooldown: 10 fights)
// -------------------------------------------------------
corner.post('/swap-language', async (c) => {
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

    const body = await c.req.json<SwapLanguageRequest>();
    const { slot, newLanguage } = body;

    // Validate slot
    if (slot !== 1 && slot !== 2) {
      return c.json<ApiError>(
        { status: 'error', message: 'Slot must be 1 or 2' },
        400,
      );
    }

    // Validate new language
    if (!LANGUAGE_IDS.includes(newLanguage)) {
      return c.json<ApiError>(
        { status: 'error', message: `Invalid language: ${newLanguage}` },
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

    if (player.state !== 'corner') {
      return c.json<ApiError>(
        { status: 'error', message: 'Robot must be in the corner to swap languages' },
        400,
      );
    }

    if (player.swapLanguageCooldown > 0) {
      return c.json<ApiError>(
        {
          status: 'error',
          message: `Language swap on cooldown (${player.swapLanguageCooldown} fights remaining)`,
        },
        400,
      );
    }

    // Check that the new language differs from the current one in that slot
    const currentLanguage = slot === 1 ? player.language1 : player.language2;
    if (newLanguage === currentLanguage) {
      return c.json<ApiError>(
        { status: 'error', message: 'New language must be different from the current one' },
        400,
      );
    }

    // Check that the new language is different from the other slot
    const otherLanguage = slot === 1 ? player.language2 : player.language1;
    if (newLanguage === otherLanguage) {
      return c.json<ApiError>(
        { status: 'error', message: 'New language must be different from the other slot' },
        400,
      );
    }

    const oldLanguage = currentLanguage;

    // Update the language
    if (slot === 1) {
      player.language1 = newLanguage;
    } else {
      player.language2 = newLanguage;
    }

    // Recalculate stats with new language (preserve current HP ratio)
    const hpRatio = player.stats.hp / player.stats.maxHp;
    player.stats = calculateStatsForLevel(
      player.language1,
      player.language2,
      player.level,
      player.legacyStats,
    );
    player.stats.hp = Math.max(1, Math.floor(player.stats.maxHp * hpRatio));

    // Set cooldown
    player.swapLanguageCooldown = 10;

    await savePlayer(postId, username, player);

    return c.json<SwapLanguageResponse>({
      type: 'language_swapped',
      slot,
      oldLanguage,
      newLanguage,
      player,
    });
  } catch (error) {
    log.error('/api/corner/swap-language', 'Failed to swap language', error, postId);
    const message =
      error instanceof Error
        ? `Language swap failed: ${error.message}`
        : 'Unknown error during language swap';
    return c.json<ApiError>({ status: 'error', message }, 500);
  }
});
