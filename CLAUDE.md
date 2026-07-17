# CLAUDE.md — Binary Boxer

## Project Overview
Binary Boxer ("Bantam") is a robot boxing **gym-manager sim** on Reddit's Devvit platform,
mid-rebuild from a passive auto-battler (v1, the donor) to a coach fantasy: you run the
Kettleworks gym, field Remnant fighters seeded by programming-language pairs, and wake the
goblin gym-leader ladder into your staff.

**⚠ REBUILD IN PROGRESS — read before touching code:** design authority, in precedence
order: `docs/plans/binaryboxer-redesign-decisions.md` (engine) → `docs/plans/gym-pivot-decisions.md`
(gym structure) → `docs/plans/bantam-decisions.md` (delta layer + anti-targets) →
`docs/plans/story-presentation-decisions.md` (gate naming, beats). Process:
`docs/plans/fable-build-loop.md`. Progress + evidence: `docs/plans/build-log.md`. Donor
salvage map: `docs/plans/donor-triage.md` — **REPLACE discipline: rebuild modules never
import legacy modules** (`shared/types.ts`, `shared/api.ts`, `server/engine/*`,
`server/utils/redis.ts` are legacy, deleted at the Gate 1 cutover). `binary-boxer-gdd.md`
and `HANDOFF.md` are superseded — do not follow them.

**Owner:** Rudolph — ASPECT Research Ltd
**Platform:** Reddit via Devvit Web (React template), Devvit 0.13.8
**Stack:** React (client) + Hono (server, serverless) + Redis (persistence) + zod contracts
**Target:** Reddit Developer Funds 2026 H2 (engagement-based; window opens 2026-08-01)

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
│   ├── server/            ← Hono backend (serverless, max 30s per request)
│   │   ├── index.ts       ← Hono app + route mounting
│   │   ├── routes/        ← API route handlers (fight.ts = new bout protocol)
│   │   ├── fight/         ← NEW: rng, resolution core, transactional bout service
│   │   ├── gym/           ← NEW: derived stats, language leans, gym/fighter stores
│   │   ├── persistence/   ← NEW: scoped keys, KVStore port, versioned records + migrations
│   │   ├── sim/           ← NEW: balance-simulation harness (npm run simulate)
│   │   ├── engine/        ← LEGACY pure logic (stats/inheritance; deleted at Gate 1)
│   │   └── data/          ← Static data (languages, enemies — ADAPT at Gate 1)
│   └── shared/
│       ├── contracts/     ← NEW: zod runtime contracts (the only rebuild contract source)
│       └── types.ts       ← LEGACY compile-time types (deleted at Gate 1)
└── tests/                 ← Vitest (pure engine/service tests over MemoryStore; no @devvit/test)
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

### Redis Key Schema (new model — installation-scoped, no postId)
Devvit Redis is already namespaced per installation; embedding postId was the v1 bug that
fragmented profiles across posts. New keys (see `src/server/persistence/keys.ts`; all
durable values are `{v, data}` envelopes run through the migration registry):
```
gym:{username}                 → versioned GymRecord (cross-user readable by design)
fighter:{username}:{fighterId} → versioned FighterRecord
fight:{fightId}                → versioned FightRecord (transient, TTL 24h)
fight:active:{username}        → fightId pointer
challenge:{challengeId}:scores → ZSet (Gate 2 consumer)
```
Legacy post-scoped keys (`{postId}:player:…` etc.) are still written by the surviving old
routes (init/create/corner/dynasty/leaderboard) until the Gate 1 cutover; they are dev data
and will not be migrated.

### API Endpoints
**New bout protocol** (zod-validated, idempotent via `commandId`, revision-checked;
`src/server/routes/fight.ts`):
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/fight/start` | Start a bout (creates gym on first contact at Gate 0) |
| POST | `/api/fight/advance` | Batched: resolve to next intervention or the end; returns event batch |
| POST | `/api/fight/acknowledge` | Commit staged rewards exactly once |
| GET | `/api/fight/current` | Resume support: the active bout, if any |

**Legacy routes** (serve the old client until the Gate 1 cutover; do not extend):
`/api/init` · `/api/create` · `/api/stats` · `/api/retire` · `/api/dynasty` ·
`/api/corner/*` · `/api/leaderboard/:metric` · `/api/community/feed`

## Code Style & Conventions

### TypeScript
- Strict mode enabled
- Game logic (`server/fight/`, `server/gym/`, `server/sim/`) is **pure functions** — no
  Redis, no side effects, fully testable; services depend on the `KVStore` port
- Routes are thin: zod-parse → call service → map result to status codes
- Rebuild contracts live in `shared/contracts/` (zod, runtime-validated) — the single
  source of truth; `shared/types.ts` is legacy
- Use explicit return types on all exported functions

### Testing
- Vitest; no @devvit/test — service logic is proven against `MemoryStore` (real
  watch/multi/exec semantics), the Devvit adapter stays thin
- Balance is machine-checked: `npm run simulate` (CI gates in `tests/simulation/`)
- Test file naming: `{module}.test.ts` in `/tests/`

### React (Client)
- Functional components with hooks only
- CSS animations for all visual effects (no canvas, no WebGL)
- Visual identity: **storybook-industrial / clockwork-whimsical** — tokens and component
  inventory in `docs/binary-boxing/design-tokens.md` + `prototype/ux-prototype.html`
  (the Matrix/CRT theme is retired; current `src/client` styling is legacy until Gate 1)

### Git
- Conventional commits: `feat:`, `fix:`, `test:`, `docs:`
- Branch per feature when working with multiple agents

## Game Design Reference
**The GDD (binary-boxer-gdd.md) is superseded** — it specified the passive auto-battler the
audit condemned. Design decisions come from the authority chain in the Project Overview
above; story canon lives in `docs/binary-boxing/04-story-canon.md` and the book at
`docs/binary-boxing/story/the-pot-who-kept-nothing.md`. Do not improvise game mechanics —
if the docs don't settle it, surface it as an open question.

## Common Pitfalls
1. **Don't restructure the Devvit template** — keep the client/server/shared split as-is
2. **All server endpoints must start with `/api/`** — Devvit routing requires this
3. **Combat must be server-authoritative** — client displays results, server calculates them
4. **Persistent keys are installation-scoped, never postId-scoped** — postId-in-key was the
   v1 fragmentation bug; Devvit Redis already isolates per installation
5. **No `fs` or native packages** — Devvit serverless doesn't support them
6. **Inline mode must be lightweight** — preview.html should load fast with minimal data
7. **Realtime stays OFF** (spec §6 permissions precision) — don't reintroduce
   `realtime.*` usage without enabling the permission and a real community feature
8. **Never import legacy modules from rebuild code** — REPLACE discipline; the legacy set
   is listed in the Project Overview
9. **Keep the tree green** — `npm run type-check && npm run test && npm run build` after
   every commit; balance changes must keep `npm run simulate` inside its corridors
