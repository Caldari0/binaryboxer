# CLAUDE.md — Binary Boxer

## Project Overview
Binary Boxer is a robot boxing management sim built on Reddit's Devvit platform. Players create AI fighters seeded with programming languages that determine combat stats, then manage them through an infinite gauntlet of procedurally generated enemies. Features dynasty mode (generational progression), companions, and per-community leaderboards.

**Owner:** Rudolph — ASPECT Research Ltd
**Platform:** Reddit via Devvit Web (React template)
**Stack:** React (client) + Express.js (server) + Redis (persistence) + Devvit Realtime (community features)
**Target:** Reddit Developer Funds 2026 ($500+ at Tier 1, scaling to $167k at Tier 8)

## Architecture

### Devvit Web Structure
```
binaryboxer/
├── CLAUDE.md              ← You are here
├── devvit.json            ← Devvit config (permissions, entry points)
├── vite.config.ts
├── package.json
├── src/
│   ├── client/            ← React frontend (runs in Reddit post webview)
│   │   ├── preview.html   ← Inline feed card (leaderboard + "tap to fight")
│   │   ├── game.html      ← Expanded mode (full game)
│   │   ├── leaderboard.html
│   │   ├── components/    ← React components
│   │   ├── hooks/         ← Custom React hooks
│   │   └── styles/        ← CSS (Matrix cyberpunk theme)
│   ├── server/            ← Express.js backend (serverless, max 30s per request)
│   │   ├── index.ts       ← Express app + route mounting
│   │   ├── routes/        ← API route handlers
│   │   ├── engine/        ← Pure game logic (no Redis, no side effects)
│   │   └── data/          ← Static game data (languages, tips, enemies)
│   └── shared/
│       └── types.ts       ← TypeScript types shared between client and server
└── tests/                 ← Vitest tests using @devvit/test
```

### Key Devvit Constraints
- **Serverless endpoints**: Server runs just long enough to handle one request. No long-running connections.
- **Max request time**: 30 seconds
- **Max payload**: 4MB request, 10MB response
- **No client-side external requests**: CSP blocks all external fetches from client. Server can fetch externally.
- **All endpoints must start with `/api/`**
- **Redis via `@devvit/redis`** or `import { redis } from '@devvit/web/server'`
- **Reddit API via** `import { reddit } from '@devvit/web/server'`
- **Realtime via** `import { realtime } from '@devvit/web/server'` (server) and `import { connectRealtime } from '@devvit/web/client'` (client)
- **Inline mode requirements**: Lighthouse >80, only tap/click input, no scroll traps, load <1s

### Redis Key Schema
All keys scoped by postId (each Reddit post is an independent game instance):
```
{postId}:player:{username}     → Hash    — Player/robot state
{postId}:dynasty:{username}    → String  — JSON dynasty tree
{postId}:fight:{username}      → String  — JSON fight state (TTL 600s)
{postId}:lb:level              → ZSet    — Leaderboard by level
{postId}:lb:streak             → ZSet    — Leaderboard by win streak
{postId}:lb:dynasty            → ZSet    — Leaderboard by generation
{postId}:lb:fights             → ZSet    — Leaderboard by total fights
{postId}:events                → List    — Community event feed (capped at 50)
```

### API Endpoints
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/init` | Load or create player state |
| POST | `/api/robot/create` | Create robot (name + 2 languages) |
| GET | `/api/robot/stats` | Get current robot stats |
| POST | `/api/robot/retire` | Retire robot → dynasty |
| POST | `/api/fight/start` | Generate enemy, return setup |
| POST | `/api/fight/resolve` | Resolve full fight server-side |
| POST | `/api/fight/complete` | Record result, award XP |
| POST | `/api/corner/repair` | Heal robot |
| POST | `/api/corner/train` | Spend XP on stat |
| POST | `/api/corner/swap-language` | Change one language |
| GET | `/api/dynasty/tree` | Full family tree |
| GET | `/api/leaderboard/:metric` | Top players by metric |

## Code Style & Conventions

### TypeScript
- Strict mode enabled
- All game logic in `server/engine/` must be **pure functions** — no Redis, no side effects, fully testable
- Routes in `server/routes/` handle Redis I/O and call engine functions
- Shared types in `shared/types.ts` — single source of truth for both client and server
- Use explicit return types on all exported functions

### Testing
- Use `@devvit/test` with Vitest
- Engine functions get unit tests (pure input/output)
- Routes get integration tests (Redis mocked by @devvit/test harness)
- Test file naming: `{module}.test.ts` in `/tests/`

### React (Client)
- Functional components with hooks only
- State management via custom hooks (useGameState, useCombat)
- CSS animations for all visual effects (no canvas, no WebGL)
- Monospace font stack: `'JetBrains Mono', 'Fira Code', monospace`
- Matrix cyberpunk colour palette (see GDD Section 6)

### Git
- Conventional commits: `feat:`, `fix:`, `test:`, `docs:`
- Branch per feature when working with multiple agents

## Game Design Reference
The full Game Design Document (binary-boxer-gdd.md) contains:
- All 10 programming languages with stat modifiers
- 14 stat definitions and formulas
- Combat system (turn-based, server-authoritative)
- Enemy generation and scaling
- Companion unlock conditions and buffs
- Dynasty inheritance math
- Corner phase actions and cooldowns
- XP and levelling formulas
- UI layout specifications
- Learning tips content
- Enemy name pool

**Always reference the GDD for game design decisions. Do not improvise game mechanics.**

## Common Pitfalls
1. **Don't restructure the Devvit template** — keep the client/server/shared split as-is
2. **All server endpoints must start with `/api/`** — Devvit routing requires this
3. **Combat must be server-authoritative** — client displays results, server calculates them
4. **Redis data is per-post** — each Reddit post is an independent game instance, always scope keys by postId
5. **No `fs` or native packages** — Devvit serverless doesn't support them
6. **Inline mode must be lightweight** — preview.html should load fast with minimal data
7. **Realtime channel names cannot contain `:`** — use `-` as separator in channel names if needed
