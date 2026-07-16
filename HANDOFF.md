# HANDOFF.md — Binary Boxer

> Full codebase audit and project handoff document.
> Generated: 2025-02-10 | ~10,400 lines of TypeScript across 44 source files

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [File Inventory](#3-file-inventory)
4. [Shared Types & API Contracts](#4-shared-types--api-contracts)
5. [Server: Engine (Pure Game Logic)](#5-server-engine-pure-game-logic)
6. [Server: Routes (API Endpoints)](#6-server-routes-api-endpoints)
7. [Server: Data (Static Content)](#7-server-data-static-content)
8. [Client: Hooks & State](#8-client-hooks--state)
9. [Client: Components](#9-client-components)
10. [Client: CSS Design System](#10-client-css-design-system)
11. [Build & Config](#11-build--config)
12. [Tests](#12-tests)
13. [Known Issues & Bugs](#13-known-issues--bugs)
14. [GDD Feature Checklist](#14-gdd-feature-checklist)
15. [Recommended Next Steps](#15-recommended-next-steps)

---

## 1. Project Overview

**Binary Boxer** is a robot boxing management sim built on Reddit's Devvit platform. Players create AI fighters seeded with programming languages that determine combat stats, then manage them through an infinite gauntlet of procedurally generated enemies.

| Detail | Value |
|--------|-------|
| **Platform** | Reddit via Devvit Web (React template) |
| **Server Framework** | Hono (lightweight Express alternative) |
| **Client Framework** | React 19 + Tailwind CSS 4 |
| **Persistence** | Redis via `@devvit/web/server` |
| **Realtime** | Devvit Realtime (community event broadcast) |
| **Build** | Vite 7 + TypeScript 5.9 (strict mode) |
| **Tests** | Vitest 4 (engine unit tests) |
| **Target** | Reddit Developer Funds 2026 |

---

## 2. Architecture

```
binaryboxer/
├── src/
│   ├── shared/                    # Single source of truth for types
│   │   ├── types.ts               # All game types (261 lines)
│   │   └── api.ts                 # Request/response contracts (151 lines)
│   │
│   ├── server/                    # Hono backend (serverless, 30s max)
│   │   ├── index.ts               # App bootstrap + route mounting (23 lines)
│   │   ├── logger.ts              # Structured JSON logger (47 lines)
│   │   ├── core/post.ts           # Reddit post creation (7 lines)
│   │   ├── utils/redis.ts         # Redis I/O helpers (74 lines)
│   │   ├── engine/                # Pure functions — no I/O, fully testable
│   │   │   ├── stats.ts           # Stat formulas, XP, companion buffs (233 lines)
│   │   │   ├── combat.ts          # Combat resolution engine (813 lines)
│   │   │   ├── enemy.ts           # Enemy generation (100 lines)
│   │   │   └── inheritance.ts     # Dynasty legacy math (160 lines)
│   │   ├── data/                  # Static game data
│   │   │   ├── languages.ts       # 10 language definitions (119 lines)
│   │   │   ├── enemies.ts         # 27 regular + 10 boss names (87 lines)
│   │   │   ├── companions.ts      # Veil/Echo/Kindred (33 lines)
│   │   │   └── tips.ts            # 100 learning tips (628 lines)
│   │   └── routes/                # API handlers (Redis I/O + engine calls)
│   │       ├── api.ts             # Root router (28 lines)
│   │       ├── game.ts            # /init, /create, /stats, /retire, /dynasty (486 lines)
│   │       ├── combat.ts          # /fight/start, /turn, /resolve, /complete (613 lines)
│   │       ├── corner.ts          # /corner/repair, /train, /swap-language (396 lines)
│   │       ├── leaderboard.ts     # /leaderboard/:metric (123 lines)
│   │       ├── community.ts       # /community/feed + broadcastEvent (85 lines)
│   │       ├── menu.ts            # /internal/menu/post-create (28 lines)
│   │       ├── forms.ts           # /internal/forms (example) (22 lines)
│   │       └── triggers.ts        # /internal/triggers/on-app-install (31 lines)
│   │
│   └── client/                    # React frontend (runs in Reddit webview)
│       ├── game.html              # Full game entry point
│       ├── preview.html           # Inline feed card
│       ├── leaderboard.html       # Leaderboard entry point
│       ├── game.tsx               # Main app w/ screen router (340 lines)
│       ├── preview.tsx            # Inline preview card (127 lines)
│       ├── leaderboard-entry.tsx  # Leaderboard standalone (85 lines)
│       ├── index.css              # Full design system (1628 lines)
│       ├── styles/matrix.css      # CRT scanline effects (361 lines)
│       ├── hooks/
│       │   └── useGameState.ts    # Core state management (460 lines)
│       ├── data/
│       │   └── languages.ts       # Client-side language data (256 lines)
│       └── components/            # 14 React components
│           ├── FightScreen.tsx    # Combat visualization (242 lines)
│           ├── CornerPhase.tsx    # Training/repair hub (203 lines)
│           ├── DynastyTree.tsx    # Family tree display (196 lines)
│           ├── LearningTicker.tsx # Cycling tips (211 lines)
│           ├── RobotCreation.tsx  # Robot builder (183 lines)
│           ├── Leaderboard.tsx    # Rankings table (181 lines)
│           ├── LanguagePicker.tsx # Language grid (100 lines)
│           ├── asciiPortraits.ts  # Portrait builder (398 lines)
│           ├── CombatLog.tsx      # Fight log (80 lines)
│           ├── TerminalMenu.tsx   # Reusable menu (68 lines)
│           ├── Companion.tsx      # Companion indicator (67 lines)
│           ├── HealthBar.tsx      # HP bar (54 lines)
│           ├── BossIntro.tsx      # Boss reveal (33 lines)
│           └── AsciiPortrait.tsx  # ASCII art wrapper (21 lines)
│
└── tests/engine/                  # Vitest unit tests
    ├── combat.test.ts             # Combat engine tests (203 lines)
    ├── stats.test.ts              # Stats engine tests (133 lines)
    ├── enemy.test.ts              # Enemy gen tests (111 lines)
    └── inheritance.test.ts        # Dynasty tests (122 lines)
```

### Key Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| **Hono** over Express | Lightweight, Devvit-friendly, serverless-optimized |
| **Pure engine functions** | No side effects in `/engine/` = fully testable game logic |
| **Redis strings** (not hashes/lists) | Devvit Redis has limited primitives; JSON-in-string is safest |
| **Server-authoritative combat** | Client displays results only; prevents cheating |
| **CSS-only visuals** | No canvas/WebGL; CSP-compliant, accessible |
| **Per-post instances** | Each Reddit post is an independent game; keys scoped by postId |

---

## 3. File Inventory

### Line Counts by Module

| Module | Files | Lines |
|--------|-------|-------|
| Server: Engine | 4 | 1,306 |
| Server: Routes | 9 | 1,812 |
| Server: Data | 4 | 867 |
| Server: Utils/Core | 4 | 151 |
| Client: Components | 14 | 1,855 |
| Client: Hooks | 1 | 460 |
| Client: Entry Points | 3 | 552 |
| Client: Data | 1 | 256 |
| Client: CSS | 2 | 1,989 |
| Shared | 2 | 412 |
| Tests | 4 | 569 |
| **Total** | **48** | **~10,400** |

---

## 4. Shared Types & API Contracts

### `src/shared/types.ts` (261 lines)

**Languages:** 10 IDs — `rust`, `javascript`, `python`, `cpp`, `css`, `go`, `typescript`, `c`, `haskell`, `lua`

**Stats (14 total):**
- Core: `hp`, `maxHp`, `power`, `defence`, `speed`
- Advanced: `wisdom`, `creativity`, `stability`, `adaptability`
- Combat: `evasion`, `blockChance`, `counter`, `critChance`, `patternRead`, `penetration`
- `GrowthStatKey` = all except `hp` (13 trainable stats)

**Combat Actions (7):** `strike`, `heavy_strike`, `guard`, `analyse`, `overclock`, `combo`, `berserk`

**Player State:** Full robot identity + progression + companions + cooldowns + dynasty info

**Fight State:** Enemy data + seeded RNG + turn log + result + available actions + current HP tracking

**Dynasty:** Generations array with per-generation stats, total legacy calculation

**Leaderboard Metrics:** `level`, `streak`, `dynasty`, `fights`

**Community Events:** `boss_kill`, `level_milestone`, `dynasty_start`, `streak_record`, `robot_created`

### `src/shared/api.ts` (151 lines)

| Endpoint | Request Type | Response Type |
|----------|-------------|---------------|
| `GET /api/init` | — | `InitResponse` (player + active fight) |
| `POST /api/create` | `CreateRobotRequest` | `CreateRobotResponse` |
| `GET /api/stats` | — | `RobotStatsResponse` |
| `POST /api/retire` | — | `RetireRobotResponse` |
| `POST /api/fight/start` | — | `FightStartResponse` |
| `POST /api/fight/turn` | `FightTurnRequest` | `FightTurnResponse` |
| `POST /api/fight/resolve` | — | `FightResolveResponse` |
| `POST /api/fight/complete` | — | `FightCompleteResponse` |
| `POST /api/corner/repair` | — | `RepairResponse` |
| `POST /api/corner/full-repair` | — | `RepairResponse` |
| `POST /api/corner/train` | `TrainRequest` | `TrainResponse` |
| `POST /api/corner/swap-language` | `SwapLanguageRequest` | `SwapLanguageResponse` |
| `GET /api/dynasty/tree` | — | `DynastyTreeResponse` |
| `GET /api/leaderboard/:metric` | — | `LeaderboardResponse` |
| `GET /api/community/feed` | — | `CommunityFeedResponse` |

---

## 5. Server: Engine (Pure Game Logic)

### `stats.ts` — Stat Calculation

- **Base stats:** HP=100, maxHp=100, power=10, defence=5, speed=5, others=0
- **Per-level formula:** `base + (langBonus * level) + legacyStats + (level * 10 for maxHp)`
- **Python special:** +2 to ALL growth stats per level (stacks if both slots are Python)
- **XP required:** `level * 50`
- **XP for fight:** `10 + (enemyLevel * 2) + (won ? 5 : 0)`, boss fights x3
- **Training cost:** `currentStatValue * 10`
- **Companion buffs:**
  - Veil: +20% wisdom
  - Echo: +15% critChance, +10% to highest language bonus stat

### `combat.ts` — Combat Resolution (813 lines, largest file)

- **Seeded RNG:** Mulberry32 for deterministic replay
- **Action availability:** Based on stat thresholds (e.g., `heavy_strike` requires creativity >= 15)
- **Damage formula:** `power * (1 + level * 0.05)` with action multipliers, defence reduction, crit/block modifiers
- **Turn order:** Higher speed acts first; ties favor player
- **Boss abilities:** 10 unique bosses with stat-modifying effects
- **Max rounds:** 50 (safety valve)
- **Supports both:** Turn-by-turn (`resolveRound`) and full auto-resolve

### `enemy.ts` — Enemy Generation

- **Boss trigger:** Every 5th fight (`fightNumber % 5 === 0`)
- **Level scaling:** `playerLevel + random(-1, 2)`
- **Stats:** `10 + (level * 3)` uniform; HP: `100 + (level * 15)`
- **Boss multipliers:** Stats x1.5, HP x2

### `inheritance.ts` — Dynasty Legacy

- **Base inheritance:** 10% of parent's stats
- **Kindred boost:** x1.25 multiplier
- **Generational decay:** x(0.98 ^ generationGap)
- **Dynasty titles:** Prototype(1) -> Lineage(2) -> Legacy(3-4) -> Dynasty(5-9) -> Empire(10-24) -> Eternal(25+)

---

## 6. Server: Routes (API Endpoints)

### `game.ts` — Player Lifecycle (486 lines)

- **`GET /init`**: Loads player from Redis; resumes active fights; handles first-visit (returns `creating` screen)
- **`POST /create`**: Validates name (1-20 chars, no HTML), validates 2 distinct language IDs, calculates initial stats, broadcasts community event
- **`GET /stats`**: Returns player state with companion buffs applied
- **`POST /retire`**: Creates dynasty generation, carries legacyStats forward, resets to `creating` state, broadcasts event
- **`GET /dynasty`**: Returns full dynasty tree from Redis

### `combat.ts` — Fight System (613 lines)

- **`POST /start`**: Generates seeded enemy, initializes fight state, saves with 600s TTL
- **`POST /turn`**: Resolves one round with player's chosen action (turn-by-turn mode)
- **`POST /resolve`**: Auto-resolves all remaining rounds (auto-pilot mode)
- **`POST /complete`**: Records result, awards XP, checks level-ups (loop), checks companion unlocks (Veil at 5 fights, Echo at 12), handles forced retirement (KO at 30+ fights), updates leaderboards

### `corner.ts` — Between-Fight Actions (396 lines)

- **`POST /repair`**: Heals 50% of maxHp (free, always available)
- **`POST /full-repair`**: Heals to 100% (3-fight cooldown)
- **`POST /train`**: Spends XP to +1 any growth stat; cost = `currentValue * 10`; maxHp training also +1 current HP
- **`POST /swap-language`**: Changes one language slot (10-fight cooldown); recalculates all stats preserving HP ratio

### `leaderboard.ts` — Rankings (123 lines)

- **`GET /:metric`**: Returns top 10 + current player rank; loads player data in parallel (N+1 optimization)
- **Metrics:** level, streak, dynasty, fights

### `community.ts` — Events (85 lines)

- **`GET /feed`**: Returns 10 most recent events
- **`broadcastEvent()`**: WATCH/MULTI atomic append with 3 retries; broadcasts to realtime channel; best-effort (swallows errors)

### Redis Key Schema

```
{postId}:player:{username}     → String (JSON PlayerState)
{postId}:dynasty:{username}    → String (JSON Dynasty)
{postId}:fight:{username}      → String (JSON FightState, TTL 600s)
{postId}:lb:level              → ZSet
{postId}:lb:streak             → ZSet
{postId}:lb:dynasty            → ZSet
{postId}:lb:fights             → ZSet
{postId}:events                → String (JSON CommunityEvent[])
```

---

## 7. Server: Data (Static Content)

| File | Content |
|------|---------|
| `languages.ts` | 10 language definitions with stat modifiers matching GDD |
| `enemies.ts` | 27 regular enemy names + 10 boss names with taglines/abilities |
| `companions.ts` | Veil, Echo, Kindred definitions with unlock conditions |
| `tips.ts` | 100 programming tips (10 per language) |

---

## 8. Client: Hooks & State

### `useGameState.ts` (460 lines)

Central state management hook. Manages all screens and API communication.

**State Shape:**
```typescript
{
  screen: 'loading' | 'creating' | 'corner' | 'fighting' | 'fight_result' | 'dynasty' | 'leaderboard' | 'retired';
  postId: string | null;
  username: string | null;
  player: PlayerState | null;
  fight: FightState | null;
  lastPlayerTurn: FightTurn | null;
  lastEnemyTurn: FightTurn | null;
  dynasty: Dynasty | null;
  leaderboard: LeaderboardEntry[];
  leaderboardMetric: LeaderboardMetric;
  playerRank: number | null;
  communityEvents: CommunityEvent[];
  loading: boolean;
  error: string | null;
}
```

**Actions:** `createRobot`, `startFight`, `submitAction`, `autoPilotFight`, `completeFight`, `repair`, `trainStat`, `swapLanguage`, `retireRobot`, `loadDynasty`, `loadLeaderboard`, `loadCommunityFeed`, `goToCorner`, `goToCreating`, `clearError`

**Realtime:** Subscribes to `{postId}-events` channel for live community updates via `connectRealtime`

**Screen Flow:**
```
loading → creating → corner ↔ fighting → corner
                  ↕            ↕
              dynasty      leaderboard
                  ↕
              retired → creating (new gen)
```

---

## 9. Client: Components

### Screen Components

| Component | Props | Purpose |
|-----------|-------|---------|
| `FightScreen` | `player: FighterView, enemy: FighterView, turns: CombatTurn[], bossFight: boolean, onFightComplete` | Full combat visualization with turn-by-turn replay, damage floats, boss intro, result screen |
| `CornerPhase` | `robot: CornerRobot, onAction(action, payload?)` | Between-fight hub: repair, train, swap language, fight next |
| `RobotCreation` | `onSubmit(name, lang1, lang2), loading` | Name input + dual language selection with stat preview |
| `DynastyTree` | `dynasty, currentRobot, onBack` | ASCII family tree with generational stats |
| `Leaderboard` | `entries, metric, playerRank, onChangeMetric, onBack` | Tabbed rankings (4 metrics) |

### UI Building Blocks

| Component | Purpose |
|-----------|---------|
| `HealthBar` | Animated HP bar with low/critical states, ARIA attributes |
| `CombatLog` | Scrolling terminal-style fight log with auto-scroll |
| `Companion` | Veil/Echo/Kindred indicator with colored dot + bob animation |
| `AsciiPortrait` | `<pre>` wrapper for ASCII art with styling |
| `BossIntro` | Boss reveal overlay with CRT flicker effect |
| `TerminalMenu` | Generic numbered menu with focus tracking (used by CornerPhase) |
| `LanguagePicker` | 2-column language grid with stat preview |
| `LearningTicker` | Cycling tips (8s interval, fade transition) |

### ASCII Portrait System (`asciiPortraits.ts`, 398 lines)

- **`buildRobotPortrait(lang1, lang2)`**: 23-char wide base robot patched with language-specific modifications
- **`buildEnemyPortrait(type, level)`**: Tiered enemy art (bug/virus/system/legacy) with 3 tiers per type
- **`buildBossPortraitByName(name)`**: 10 unique boss portraits (THE_COMPILER, GARBAGE_COLLECTOR, etc.)
- **Language patches:** Each of the 10 languages has unique ASCII modifications
- **Enemy tiers:** tier 0 (level <10), tier 1 (level 10-17), tier 2 (level 18+)

---

## 10. Client: CSS Design System

### `index.css` (1628 lines) — Primary Design System

A comprehensive boxing-ring-themed UI with language-driven color identity.

**Design Tokens (60+ CSS variables):**
- Background: `#0a0a0c` base, `#12121a` surfaces
- Primary green: `#00ff41` (Matrix heritage)
- Language colors: rust=#dea584, javascript=#f7df1e, python=#3572a5, etc.
- Damage/heal/crit indicators
- Fluid typography: `clamp()` responsive sizing

**Key Systems:**
- Panel system with rivets/texture effects
- Fight "ring" layout with player/enemy zones
- Health bars with HP-dependent color shifts (green -> yellow -> red)
- Robot avatars with colored borders
- Combat log with turn-by-turn entries
- Action buttons with timer animations
- Damage float numbers (animated upward fade)
- Corner phase grid layout
- Language selection cards
- Result screen with WIN/LOSS display
- 20+ CSS animations (pulse, float, flash, fade, bob, etc.)
- CRT overlay scanline effect
- Boss intro with special styling
- Responsive breakpoints for mobile

### `styles/matrix.css` (361 lines) — CRT Effects

Supplementary CRT terminal aesthetic layer:
- Scanline overlay
- Matrix rain background animation
- Terminal-styled buttons and inputs
- Companion bob animation
- Boss fight background effects

---

## 11. Build & Config

### Dependencies

**Runtime:**
- `@devvit/start` (0.12.12), `@devvit/web` (0.12.12), `devvit` (0.12.12)
- `react` (19.2.4), `react-dom` (19.2.4)
- `hono` (4.11.7), `@hono/node-server` (1.19.9)
- `clsx` (2.1.1), `tailwind-merge` (3.4.0)

**Dev:**
- `vite` (7.3.1), `@vitejs/plugin-react`, `@tailwindcss/vite`
- `typescript` (5.9.3), `eslint` (9.39.2), `prettier` (3.8.1)
- `vitest` (4.0.18)
- `tailwindcss` (4.1.18)

### TypeScript Config

Strict mode with all safety flags enabled:
- `noUnusedLocals`, `noUnusedParameters`
- `exactOptionalPropertyTypes`
- `noUncheckedIndexedAccess`
- `noImplicitOverride`

Project references: `shared` -> `client`, `shared` -> `server` (proper module boundaries)

### Devvit Config (`devvit.json`)

Three entrypoints:
1. **`default`** (inline) -> `preview.html` — Feed card
2. **`game`** (expanded) -> `game.html` — Full game
3. **`leaderboard`** (inline) -> `leaderboard.html` — Standalone rankings

Menu action: "Create Binary Boxer Arena" (moderator)
Trigger: `onAppInstall` -> auto-creates first post

### Build Commands

```bash
npm run build        # Vite build (client + server)
npm run dev          # Devvit playtest (local)
npm run type-check   # TypeScript strict check
npm run test         # Vitest suite
npm run deploy       # type-check + lint + test + upload
npm run launch       # deploy + publish
```

---

## 12. Tests

All tests in `tests/engine/` using Vitest. Tests cover pure engine functions only.

| Test File | Lines | Coverage |
|-----------|-------|----------|
| `combat.test.ts` | 203 | RNG determinism, action availability by stat threshold, enemy AI, full round resolution |
| `stats.test.ts` | 133 | Stat scaling per level/language, XP formulas, companion buffs, Python bonus |
| `enemy.test.ts` | 111 | Boss trigger (every 5th fight), enemy level scaling, boss stat multipliers |
| `inheritance.test.ts` | 122 | Legacy inheritance (10% base), Kindred multiplier (1.25x), generational decay, dynasty titles |

**Missing test coverage:**
- Route integration tests (Redis-dependent flows)
- Client component tests
- Edge cases: forced retirement, language swap stat recalculation, leaderboard ranking

---

## 13. Known Issues & Bugs

### TypeScript Errors (Server-side, 2 remaining)

1. **`community.ts:64`** — `txn.get(key)` returns `TxClientLike` not `string`. The `redis.watch()` transaction API may not support `.get()` the way it's used. The WATCH/MULTI pattern needs to be verified against actual Devvit Redis transaction API.

2. **`game.ts:22`** — `CommunityEvent` type is imported but unused. Quick fix: remove the import.

### Potential Runtime Issues

3. **Combat turns array safety** (`combat.ts:283-284`): Non-null assertions (`!`) on `fight.turns[fight.turns.length - 2]` and `[...length - 1]` could crash when the turns array has fewer than 2 entries. Should add guard checks.

4. **Import path case sensitivity**: `game.tsx` imports from `./components/asciiPortraits` (lowercase file: `asciiPortraits.ts`). This works on Windows but could fail on case-sensitive filesystems (Linux CI/CD, Devvit deploy environment). The file on disk is lowercase so it should match, but verify in deployment.

5. **Redundant `Math.abs`** in `enemy.ts:56`: `seededRandomRange` already returns non-negative values, so the `Math.abs` wrapper is unnecessary (not a bug, just dead code).

6. **CSS duplication**: `index.css` (1628 lines) and `styles/matrix.css` (361 lines) have overlapping concerns (CRT effects, animations, color variables). Some styles may conflict or override each other.

7. **`fight_result` and `retired` screens**: These are defined in the `GameScreen` type but have no corresponding rendering branches in `game.tsx`. The `fight_result` screen is never navigated to (fights go straight from `fighting` -> `corner`). The `retired` screen has special handling that maps to `creating`.

### Design Gaps

8. **No error boundary**: If a component throws, the entire app crashes. React error boundaries would prevent full-page failures.

9. **No offline/reconnection handling**: If the Redis connection drops mid-fight, the 600s TTL on fight state could expire before the user returns.

10. **No rate limiting**: API endpoints have no rate limiting. A malicious user could spam `/fight/start` or `/corner/train` rapidly.

---

## 14. GDD Feature Checklist

Based on the Game Design Document (`binary-boxer-gdd.md`):

| Feature | Status | Notes |
|---------|--------|-------|
| 10 programming languages | DONE | All stat modifiers match GDD |
| 14 stat system | DONE | All stats implemented with correct formulas |
| Turn-based combat | DONE | Both turn-by-turn and auto-resolve modes |
| Server-authoritative combat | DONE | Client displays results only |
| Seeded RNG | DONE | Mulberry32 for deterministic replay |
| 7 combat actions | DONE | strike, heavy_strike, guard, analyse, overclock, combo, berserk |
| Action availability by stats | DONE | Threshold-based unlocking |
| Enemy generation & scaling | DONE | Level scaling, boss every 5th fight |
| 10 unique bosses | DONE | With abilities, taglines, ASCII portraits |
| Boss abilities | DONE | Stat-modifying effects per boss |
| Companion system (3) | DONE | Veil, Echo, Kindred with unlock conditions |
| Dynasty inheritance | DONE | 10% base, Kindred boost, generational decay |
| Dynasty titles | DONE | 6 tiers from Prototype to Eternal |
| Forced retirement | DONE | KO at 30+ fights triggers dynasty |
| Corner phase: Repair | DONE | 50% heal + full repair with cooldown |
| Corner phase: Train | DONE | XP spending on any growth stat |
| Corner phase: Language swap | DONE | Change one slot with cooldown |
| Leaderboard (4 metrics) | DONE | Level, streak, dynasty, fights |
| Community events | DONE | Realtime broadcast + feed |
| Learning tips | DONE | 100 tips cycling on client |
| ASCII robot portraits | DONE | Language-patched base robot |
| CRT terminal aesthetic | DONE | Scanlines, glow, matrix colors |
| Inline preview card | DONE | preview.tsx with player status |
| Per-post game instances | DONE | All Redis keys scoped by postId |
| XP and levelling | DONE | Formula: level * 50 XP required |
| Win streak tracking | DONE | Current + best streak on PlayerState |

### Not Yet Implemented

| Feature | GDD Section | Priority |
|---------|-------------|----------|
| Active combat UI (player chooses action) | Section 4 | HIGH — Turn-by-turn API exists (`/fight/turn`), but `game.tsx` auto-resolves all fights. The `submitAction` function exists in `useGameState` but is never called from the UI. Need to add action selection buttons in `FightScreen`. |
| Sound effects / audio cues | Section 6 | LOW — GDD mentions optional audio |
| Detailed fight replay | Section 6 | MEDIUM — Could allow step-through of past fights |
| Companion visual display in corner | Section 5 | LOW — `Companion.tsx` exists but isn't rendered in `CornerPhase` |
| Community event ticker in corner | Section 5 | LOW — Events are fetched but not displayed in corner UI |
| Inline leaderboard preview | Section 6 | MEDIUM — `leaderboard.html` entry point exists but `leaderboard-entry.tsx` needs verification |

---

## 15. Recommended Next Steps

### Priority 1: Fix Build Errors
1. Fix `community.ts` WATCH/MULTI transaction to match Devvit Redis API
2. Remove unused `CommunityEvent` import from `game.ts`
3. Add guard checks for combat turns array access in `combat.ts`

### Priority 2: Enable Active Combat
The most impactful gameplay improvement. The server already supports turn-by-turn combat via `/fight/turn`. To enable:
1. Add action selection buttons to `FightScreen` between turns
2. Wire buttons to `submitAction()` in `useGameState`
3. Show `availableActions` from `FightState` to the player
4. Keep auto-resolve as a "skip" option

### Priority 3: Polish & Robustness
1. Add React error boundary around `<App />`
2. Consolidate `index.css` and `matrix.css` — remove duplicates
3. Add route integration tests (mock Redis)
4. Add component snapshot tests
5. Add rate limiting middleware to Hono routes

### Priority 4: Content & Features
1. Wire `Companion.tsx` into `CornerPhase`
2. Display community event ticker in corner phase
3. Add fight history / replay viewer
4. Add more ASCII art variations for enemies
5. Sound effects (optional per GDD)

### Priority 5: Production Readiness
1. Verify deployment on Devvit staging
2. Test inline mode performance (Lighthouse > 80)
3. Test on mobile Reddit app
4. Add analytics / event tracking
5. Rate limit all POST endpoints

---

## Appendix: Quick Reference

### Language Stat Bonuses

| Language | Primary | Bonus | Secondary | Bonus | Special |
|----------|---------|-------|-----------|-------|---------|
| Rust | defence | +3/lv | stability | +1/lv | |
| JavaScript | maxHp | +3/lv | adaptability | +1/lv | |
| Python | power | +2/lv | — | — | +2 ALL stats/lv |
| C++ | wisdom | +3/lv | blockChance | +1/lv | |
| CSS | creativity | +3/lv | critChance | +1/lv | |
| Go | speed | +3/lv | counter | +1/lv | |
| TypeScript | defence | +2/lv | maxHp | +2/lv | |
| C | power | +3/lv | penetration | +1/lv | |
| Haskell | evasion | +3/lv | patternRead | +1/lv | |
| Lua | speed | +2/lv | creativity | +2/lv | |

### Companion Unlocks

| Companion | Unlock | Buff |
|-----------|--------|------|
| Veil | 5 fights | +20% wisdom |
| Echo | 12 fights | +15% critChance, +10% highest language stat |
| Kindred | Generation 2+ | +25% inheritance rate |

### Combat Action Thresholds

| Action | Requirement | Damage Multiplier |
|--------|-------------|-------------------|
| strike | Always | 1.0x |
| heavy_strike | creativity >= 15 | 1.5x |
| guard | wisdom >= 15 | 0x (blocks) |
| analyse | patternRead >= 10 | 0x (buffs next) |
| overclock | adaptability >= 15 | 1.1x |
| combo | creativity + speed > 25 | 0.7x (hits twice) |
| berserk | HP < 30% | 2.0x |
