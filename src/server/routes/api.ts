// ============================================================
// Binary Boxer — API Router
// Mounts all sub-routers under /api/
// ============================================================

import { Hono } from 'hono';
import { game } from './game';
import { fight } from './fight';
import { corner } from './corner';
import { leaderboard } from './leaderboard';
import { community } from './community';

export const api = new Hono();

// Game state routes: /api/init, /api/create, /api/stats, /api/retire, /api/dynasty
api.route('/', game);

// Transactional bout routes: /api/fight/start, /advance, /acknowledge, /current
api.route('/fight', fight);

// Corner phase routes: /api/corner/repair, /api/corner/full-repair, /api/corner/train, /api/corner/swap-language
api.route('/corner', corner);

// Leaderboard routes: /api/leaderboard/:metric
api.route('/leaderboard', leaderboard);

// Community routes: /api/community/feed
api.route('/community', community);
