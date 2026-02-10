// ============================================================
// Binary Boxer — Redis Utility Helpers
// Shared helpers for loading/saving player state and fight state
// ============================================================

import { redis } from '@devvit/web/server';
import type { PlayerState, FightState } from '../../shared/types';

export const loadPlayer = async (
  postId: string,
  username: string,
): Promise<PlayerState | null> => {
  const data = await redis.get(`${postId}:player:${username}`);
  if (!data) return null;
  return JSON.parse(data) as PlayerState;
};

export const savePlayer = async (
  postId: string,
  username: string,
  player: PlayerState,
): Promise<void> => {
  await redis.set(`${postId}:player:${username}`, JSON.stringify(player));
};

export const loadFight = async (
  postId: string,
  username: string,
): Promise<FightState | null> => {
  const data = await redis.get(`${postId}:fight:${username}`);
  if (!data) return null;
  return JSON.parse(data) as FightState;
};

export const saveFight = async (
  postId: string,
  username: string,
  fight: FightState,
  ttlSeconds: number = 600,
): Promise<void> => {
  const key = `${postId}:fight:${username}`;
  await redis.set(key, JSON.stringify(fight), {
    expiration: new Date(Date.now() + ttlSeconds * 1000),
  });
};

export const deleteFight = async (
  postId: string,
  username: string,
): Promise<void> => {
  await redis.del(`${postId}:fight:${username}`);
};

export const updateLeaderboards = async (
  postId: string,
  username: string,
  player: PlayerState,
): Promise<void> => {
  await Promise.all([
    redis.zAdd(`${postId}:lb:level`, { member: username, score: player.level }),
    redis.zAdd(`${postId}:lb:streak`, {
      member: username,
      score: player.bestStreak,
    }),
    redis.zAdd(`${postId}:lb:dynasty`, {
      member: username,
      score: player.generation,
    }),
    redis.zAdd(`${postId}:lb:fights`, {
      member: username,
      score: player.totalFights,
    }),
  ]);
};
