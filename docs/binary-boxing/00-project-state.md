# 00 — Project State (verified 2026-07-16)

> Forensic snapshot of what Binary Boxer **actually is today**, established by building, testing and
> driving the real code — not by reading docs. Design authority remains
> `docs/plans/binaryboxer-redesign-decisions.md`; process authority remains `docs/plans/fable-build-loop.md`.
> This folder (`docs/binary-boxing/`) holds audit/state artifacts, not design decisions.

## What the game is

A **robot boxing management sim on Reddit's Devvit Web platform**. Players create an AI fighter seeded
from two programming languages and run it through a procedurally generated gauntlet. One codebase, three
Devvit entrypoints (inline feed card `preview.html`, expanded `game.html`, inline `leaderboard.html`),
a Hono server on Devvit serverless with Redis persistence, React 19 client, 100% code-authored visuals
(ASCII portraits + CSS; **zero binary assets in the repo**).

The project is mid-pivot: v1 (a passive auto-battler, faithfully implementing its old GDD) has been
audited and declared a **donor codebase**; the approved target is a **Manager-Mode sim** (gameplan,
scouting, interventions, explainable boxer AI, programs/OS layers) per the redesign spec.

## Repository facts

| Fact | Value |
|---|---|
| Location | `C:\Users\suicu\projects\BinaryBoxing\binaryboxer` (git root) |
| Branch | `main`, up to date with `origin/main`; second branch `prep/donor-cleanup` |
| Working tree | 6 files modified — **line-ending churn only** (content-identical) + untracked `.claude/` |
| History | 12 commits: initial + smoothness fixes (2026-02-10), then 10 redesign-prep commits (2026-07-16) |
| Size | ~10.4k lines TS across ~44 source files; 14 MB excl. deps |
| Licence | BSD-3-Clause (Reddit starter template). No third-party assets. No secrets/.env found. |
| Node modules | Installed with **Windows** binaries (owner develops on Windows) |

## Verification evidence (all run 2026-07-16 on a clean Linux copy)

| Check | Command | Result |
|---|---|---|
| Types | `npx tsc --build` | ✅ exit 0 |
| Lint | `npx eslint "src/**/*.{ts,tsx}"` | ✅ exit 0 |
| Tests | `npx vitest run` | ✅ **84/84 pass** (6 files) |
| Build | `npx vite build` | ✅ complete in ~3.4 s |
| Engine playthrough | audit harness driving `generateEnemy → initFight → autoPickAction → resolveRound` | ⚠️ see below |

### The decisive finding: the shipped game is effectively unwinnable

A 12-fight autopilot campaign (rust+go, repairing between fights — exactly what the live
`/api/fight/resolve` path does) **lost every fight, including fight 1 at level 1**. A 200-seed
balance sweep at level 5:

| Build | Win rate | Note |
|---|---|---|
| python+python | 54% | the only viable build |
| python+javascript | 1% | |
| rust+go, c+cpp, css+lua, haskell+ts, js+ts | **0%** | player deals ~1 damage/hit |

Cause, verified in code: `generateEnemy` gives enemies `10 + 3×level` in **all 13 stats**
(+`100+15×level` HP), while players grow only their two language stats (Python excepted: +2 to all,
hence a 540 vs 100 growth-stat total at level 10 — **5.4×**). The owner's "not fun / awful game logic"
verdict is not taste; it is arithmetic.

### Empirically confirmed bugs (beyond the docs' claims)

- **`analyse` is a no-op** — round-2 strike damage is bit-identical whether round 1 was `analyse` or `guard`.
- **Training wipe** — +5 trained power at level 4 is erased by the level-up recalculation (15 → 10).
- **Double-award path** — `/fight/complete` saves rewards before deleting fight state; no idempotency guard.
- **Interactive combat never wired** — `submitAction` has zero callers; UI auto-resolves every fight.
- **Dead screens** — `retired`/`fight_result` states exist but render the SYSTEM ERROR fallback.
- **Fabricated inline leaderboard** — `preview.tsx` hard-codes its top-3 rows.
- **Post-scoped Redis keys** — player profiles fragment across every arena post.
- **`devvit.json` has no `permissions` block** — `"permissions": { "redis": true }` is required in the
  current schema or production validation fails ("Missing required permissions for used features").

## Platform reality (from current official docs, 2026-07-16)

- **Devvit Web is the only paradigm** — Blocks was removed from all Reddit clients on 2026-06-30. This repo is on the right side of that cut.
- Repo pins **devvit 0.12.12**; current is **0.13.8** (2026-07-13). For Devvit Web apps the only listed breaking change is `splash`/`loading` params on `submitCustomPost()` — this repo already uses the replacement entrypoint pattern. 0.13.7 adds Vite 8 support.
- Limits that shape design: 30 s serverless requests, 4 MB req / 10 MB res, client CSP blocks **all** external requests, inline entrypoint must load <1 s with mobile Lighthouse >80, tap/click only, no inline scrolling.
- **Developer Funds 2026**: H1 (install-based) ends **2026-07-31** — unreachable for this project. H2 (2026-08-01→12-31) is **engagement-based**: Tier 1 = 5,000 Daily Qualified Engagers → $4,000, recurring payouts scale to $25k/mo; install milestones pay $500–$2,000 cumulative. Design for daily engagement loops.
- Publishing: every version human-reviewed (1–2 business days), a plain-English `README.md` (≤1,000 words) is mandatory, apps unlisted by default.

## How to run the current game

```bash
cd C:\Users\suicu\projects\BinaryBoxing\binaryboxer
npm run dev        # devvit playtest — requires `npm run login` once (Reddit account)
```

Playtest serves the app into the dev subreddit `r/binaryboxer_dev`; the CLI prints the exact post URL
(`https://www.reddit.com/r/binaryboxer_dev/…?playtest=binaryboxer`). There is **no plain localhost mode** —
Devvit apps run inside Reddit. Local checks that do work standalone:
`npm run type-check`, `npm run test`, `npm run build` (outputs `dist/`).
This session verified everything except the live playtest (needs the owner's Reddit login on the host machine).

## Stale documents — do not trust

- `HANDOFF.md` (self-dated 2025-02-10): inventories removed files, blesses per-post Redis scoping.
- `tests/smoothness/REPORT.md`: grades the game "nearly launch-ready", cites a file that no longer exists,
  and missed that the game is unwinnable. Historical artifacts only.
- `binary-boxer-gdd.md`: superseded by the redesign spec (the spec says so explicitly).
