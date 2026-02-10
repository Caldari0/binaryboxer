// ============================================================
// Binary Boxer — API Router
// Mounts all sub-routers under /api/
// ============================================================

import { Hono } from 'hono';
import { game } from './game';
import { combat } from './combat';
import { corner } from './corner';
import { leaderboard } from './leaderboard';
import { community } from './community';

export const api = new Hono();

// Game state routes: /api/init, /api/create, /api/stats, /api/retire, /api/dynasty
api.route('/', game);

// Combat routes: /api/fight/start, /api/fight/resolve, /api/fight/complete
api.route('/fight', combat);

// Corner phase routes: /api/corner/repair, /api/corner/full-repair, /api/corner/train, /api/corner/swap-language
api.route('/corner', corner);

// Leaderboard routes: /api/leaderboard/:metric
api.route('/leaderboard', leaderboard);

// Community routes: /api/community/feed
api.route('/community', community);
