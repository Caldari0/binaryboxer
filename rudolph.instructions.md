# Rudolph's Parallel Agent Instructions

## Overview

You have 4 agents that can run concurrently without file conflicts. Each agent has exclusive write access to its files — no overlaps.

## Quick Reference

| Agent | File | Focus | Tasks |
|-------|------|-------|-------|
| **1** | `agent-1-combat-engine.md` | Pure game logic fixes (combat, stats, formulas) | 14 |
| **2** | `agent-2-data-layer.md` | Server routes, Redis, validation, race conditions | 11 |
| **3** | `agent-3-client-ui.md` | React components, state management, error handling | 17 |
| **4** | `agent-4-config-cleanup.md` | Tests, dead code deletion, config, docs | 14 |

## How to Run All 4 Concurrently

Open **4 separate terminal windows**, all from the project root (`binaryboxer/`).

```bash
# Terminal 1 — Agent 1: Combat Engine
claude "You are Agent 1. Read agent-1-combat-engine.md and execute all tasks in priority order. After each file change, run npx tsc --noEmit to verify. Do not edit files outside your ownership list."

# Terminal 2 — Agent 2: Server Routes
claude "You are Agent 2. Read agent-2-data-layer.md and execute all tasks in priority order. After each file change, run npx tsc --noEmit to verify. Do not edit files outside your ownership list."

# Terminal 3 — Agent 3: Client UI
claude "You are Agent 3. Read agent-3-client-ui.md and execute all tasks in priority order. After each file change, run npx tsc --noEmit to verify. Do not edit files outside your ownership list."

# Terminal 4 — Agent 4: Config & Tests
claude "You are Agent 4. Read agent-4-config-cleanup.md and execute all tasks in priority order. After each file change, run npx tsc --noEmit to verify. Do not edit files outside your ownership list."
```

## Dependencies Between Agents

All 4 agents can start simultaneously. There is ONE soft dependency:

- **Agent 1** may add optional fields to `src/shared/types.ts` (e.g., `playerBerserk`, `playerAccuracyBuff` on `FightState`).
- **Agent 3** reads `FightState` in client code. New optional fields won't break existing code — they just won't be consumed until Agent 3 adds UI for them later.
- **Agent 2** calls engine functions. As long as Agent 1 doesn't change exported function signatures (only implementations), Agent 2 is unaffected.

**Bottom line: All 4 can run in parallel from the start. No blocking dependencies.**

## After All Agents Complete

Once all 4 agents finish, run the following verification from one terminal:

```bash
# 1. Type check
npx tsc --noEmit

# 2. Build
npx vite build

# 3. Run tests (Agent 4 will have installed vitest)
npm run test

# 4. Check for any remaining old CSS references
grep -r "crt-container\|terminal-border\|terminal-button\|terminal-text" src/client/

# 5. Verify no dead imports
grep -r "HealthBar\|CombatLog\|Companion\|AsciiPortrait\|TerminalMenu\|LanguagePicker" src/client/
```

If the type check fails after all agents complete, it's likely due to Agent 1's type additions interacting with Agent 3's code. Fix by having one agent reconcile the new optional fields.

## File Ownership Map

```
src/
├── server/
│   ├── engine/           ← AGENT 1 (exclusive)
│   │   ├── combat.ts
│   │   ├── stats.ts
│   │   ├── enemy.ts
│   │   └── inheritance.ts
│   ├── data/
│   │   └── enemies.ts    ← AGENT 1 (exclusive)
│   ├── routes/           ← AGENT 2 (exclusive)
│   │   ├── api.ts
│   │   ├── combat.ts
│   │   ├── game.ts
│   │   ├── corner.ts
│   │   ├── leaderboard.ts
│   │   └── community.ts
│   └── utils/            ← AGENT 2 (exclusive)
│       └── redis.ts
├── client/
│   ├── components/       ← AGENT 3 (active) / AGENT 4 (dead files only)
│   │   ├── FightScreen.tsx       ← Agent 3
│   │   ├── CornerPhase.tsx       ← Agent 3
│   │   ├── RobotCreation.tsx     ← Agent 3
│   │   ├── DynastyTree.tsx       ← Agent 3
│   │   ├── Leaderboard.tsx       ← Agent 3
│   │   ├── LearningTicker.tsx    ← Agent 3
│   │   ├── HealthBar.tsx         ← Agent 4 (delete)
│   │   ├── CombatLog.tsx         ← Agent 4 (delete)
│   │   ├── Companion.tsx         ← Agent 4 (delete)
│   │   ├── AsciiPortrait.tsx     ← Agent 4 (delete)
│   │   ├── TerminalMenu.tsx      ← Agent 4 (delete)
│   │   └── LanguagePicker.tsx    ← Agent 4 (delete)
│   ├── hooks/            ← AGENT 3 (exclusive)
│   │   └── useGameState.ts
│   ├── data/             ← AGENT 3 (exclusive)
│   │   └── languages.ts
│   ├── styles/
│   │   └── matrix.css    ← AGENT 4 (delete)
│   ├── game.tsx          ← AGENT 3
│   └── splash.tsx        ← AGENT 3
├── shared/
│   ├── types.ts          ← AGENT 1 (additive only)
│   └── api.ts            ← AGENT 4 (dead type removal only)
├── package.json          ← AGENT 4
├── devvit.json           ← AGENT 4
├── CLAUDE.md             ← AGENT 4
├── AGENTS.md             ← AGENT 4
└── tests/                ← AGENT 4 (create)
```

## Issue Count

- **CRITICAL/HIGH:** 10 issues
- **MEDIUM:** 22 issues
- **LOW:** 24 issues
- **Total:** 56 issues

Priority order within each agent is already set. Agents should work top-to-bottom.
