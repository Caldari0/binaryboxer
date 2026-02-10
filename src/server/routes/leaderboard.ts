// ============================================================
// Binary Boxer — Leaderboard Routes
// Handles leaderboard queries by metric
// ============================================================

import { Hono } from 'hono';
import { context, redis, reddit } from '@devvit/web/server';
import { log } from '../logger';
import type {
  ApiError,
  LeaderboardResponse,
} from '../../shared/api';
import type {
  LeaderboardMetric,
  LeaderboardEntry,
} from '../../shared/types';
import { loadPlayer } from '../utils/redis';

const VALID_METRICS: readonly string[] = [
  'level',
  'streak',
  'dynasty',
  'fights',
];

const isValidMetric = (value: string): value is LeaderboardMetric =>
  VALID_METRICS.includes(value);

export const leaderboard = new Hono();

// -------------------------------------------------------
// GET /:metric — Get top 10 leaderboard entries
// -------------------------------------------------------
leaderboard.get('/:metric', async (c) => {
  const { postId } = context;

  if (!postId) {
    return c.json<ApiError>(
      { status: 'error', message: 'postId is required but missing from context' },
      400,
    );
  }

  try {
    const metricParam = c.req.param('metric');

    if (!isValidMetric(metricParam)) {
      return c.json<ApiError>(
        {
          status: 'error',
          message: `Invalid metric: ${metricParam}. Must be one of: ${VALID_METRICS.join(', ')}`,
        },
        400,
      );
    }

    // After the type guard, metricParam is narrowed to LeaderboardMetric
    const metric: LeaderboardMetric = metricParam;
    const key = `${postId}:lb:${metric}`;

    // Get top 10 entries (reverse sorted — highest first)
    const rawEntries = await redis.zRange(key, 0, 9, {
      by: 'rank',
      reverse: true,
    });

    // Load all player data in parallel (fixes N+1 query)
    const validEntries = rawEntries.filter(
      (e): e is { member: string; score: number } => e != null,
    );
    const players = await Promise.all(
      validEntries.map((e) => loadPlayer(postId, e.member)),
    );

    const entries: LeaderboardEntry[] = validEntries.map((entry, i) => {
      const player = players[i];
      return {
        rank: i + 1,
        username: entry.member,
        robotName: player?.robotName ?? 'Unknown',
        score: entry.score,
        language1: player?.language1 ?? 'rust',
        language2: player?.language2 ?? 'javascript',
        generation: player?.generation ?? 1,
      };
    });

    // Get current player's rank (including outside top 10)
    let playerRank: number | null = null;

    const username = await reddit.getCurrentUsername();
    if (username) {
      const existingEntry = entries.find((e) => e.username === username);
      if (existingEntry) {
        playerRank = existingEntry.rank;
      } else {
        // Player not in top 10 — compute their rank from sorted set
        const [rank, total] = await Promise.all([
          redis.zRank(key, username),
          redis.zCard(key),
        ]);
        if (rank !== undefined && total > 0) {
          // zRank is 0-based ascending; reverse it for descending leaderboard
          playerRank = total - rank;
        }
      }
    }

    return c.json<LeaderboardResponse>({
      type: 'leaderboard',
      metric,
      entries,
      playerRank,
    });
  } catch (error) {
    log.error('/api/leaderboard', 'Failed to get leaderboard', error, postId);
    const message =
      error instanceof Error
        ? `Leaderboard failed: ${error.message}`
        : 'Unknown error fetching leaderboard';
    return c.json<ApiError>({ status: 'error', message }, 500);
  }
});
