// ============================================================
// Binary Boxer — Community Routes
// Handles community event feed
// ============================================================

import { Hono } from 'hono';
import { context, redis, realtime } from '@devvit/web/server';
import { log } from '../logger';
import type { ApiError, CommunityFeedResponse } from '../../shared/api';
import type { CommunityEvent } from '../../shared/types';

export const community = new Hono();

// -------------------------------------------------------
// GET /feed — Get recent community events
// -------------------------------------------------------
community.get('/feed', async (c) => {
  const { postId } = context;

  if (!postId) {
    return c.json<ApiError>(
      { status: 'error', message: 'postId is required but missing from context' },
      400,
    );
  }

  try {
    const key = `${postId}:events`;

    // Get the 10 most recent events
    const eventsRaw = await redis.get(key);
    const allEvents: CommunityEvent[] = eventsRaw ? JSON.parse(eventsRaw) : [];
    const events: CommunityEvent[] = allEvents.slice(0, 10);

    return c.json<CommunityFeedResponse>({
      type: 'community_feed',
      events,
    });
  } catch (error) {
    log.error('/api/community/feed', 'Failed to get community feed', error, postId);
    const message =
      error instanceof Error
        ? `Community feed failed: ${error.message}`
        : 'Unknown error fetching community feed';
    return c.json<ApiError>({ status: 'error', message }, 500);
  }
});

// -------------------------------------------------------
// Exported helper: broadcast an event to the community feed
// Uses WATCH/MULTI to prevent race conditions on
// concurrent read-modify-write of the events JSON string.
// -------------------------------------------------------
export const broadcastEvent = async (
  postId: string,
  event: CommunityEvent,
): Promise<void> => {
  const key = `${postId}:events`;
  const maxRetries = 3;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const txn = await redis.watch(key);
    const eventsRaw = await txn.get(key);
    const events: CommunityEvent[] = eventsRaw ? JSON.parse(eventsRaw) : [];
    events.unshift(event);
    const trimmed = events.slice(0, 50);

    await txn.multi();
    await txn.set(key, JSON.stringify(trimmed));

    try {
      await txn.exec();
      // Push to realtime channel so connected clients get instant updates
      // Channel names cannot contain ':' — use '-' as separator
      const channel = `${postId}-events`;
      await realtime.send(channel, event).catch(() => {
        // Realtime is best-effort; don't fail the whole operation
      });
      return; // Success
    } catch {
      // WATCH detected a concurrent modification — retry
    }
  }
  // After max retries, silently drop the event rather than crashing the request
};
