# Binary Boxer — Build Log

> Durable memory for the rebuild, per `docs/plans/fable-build-loop.md` §5.
> One entry per increment: what changed, why, evidence, new decisions/risks.
> Re-read this + the spec + the triage map at the start of every iteration.

---

## 2026-07-16 — Gate 0 kickoff (ORIENT + PLAN)

**Pre-flight:** clean tree; `prep/donor-cleanup` == `main` (ebbf280, merge no-op);
tag `pre-rebuild-baseline` already existed, annotated, peels to ebbf280, already on
origin — left untouched. Baseline green: type-check ✓, 84/84 tests ✓, build ✓ (2.9s).

**Branch:** `rebuild/gate-0`.

### Gate 0 increment map

| # | Increment | Commit type |
|---|-----------|-------------|
| 1 | This build log | docs |
| 2 | Devvit 0.12.12 → 0.13.8 (separate, per spec §7 Gate 0 line 1) | chore |
| 3 | devvit.json permissions: redis + reddit, realtime OFF | feat |
| 4 | zod contracts: `src/shared/contracts/` (fight protocol, profile record, common) | feat |
| 5 | persistence kit: `src/server/persistence/` (scoped keys, versioned records, migrations, store port) | feat |
| 6 | profile module: `src/server/profile/` (growth sources → derived stats) | feat |
| 7 | fight engine core: `src/server/fight/` (RNG, minimal deterministic resolution) | feat |
| 8 | fight command service + `/api/fight` routes — **cutover commit** (deletes old combat routes/engines) | feat |
| 9 | balance simulation harness + gates | feat/test |
| 10 | wrap: verify, log, STOP report | docs |

### Load-bearing decisions made at PLAN time

1. **Gate 0 is a server-side cutover for the fight path; the client is untouched.**
   New protocol lands at `/api/fight/*`; `routes/combat.ts`, `engine/combat.ts`,
   `engine/enemy.ts` (all REPLACE, imported ONLY by the old combat routes) are deleted
   in the same commit as the new service (REPLACE discipline). Consequence: the old
   client fight flow is inert (its endpoints/contracts are gone) between Gate 0 and the
   Gate 1 client wiring. The rest of the old app (init/create/corner/dynasty/leaderboard)
   keeps working on old modules. This preserves "don't preserve doomed behaviour"
   without dragging Gate 1 client work into Gate 0.

2. **Files whose replacement completes at Gate 1 are NOT deleted at Gate 0.**
   `engine/stats.ts`, `engine/inheritance.ts`, `shared/api.ts`, `shared/types.ts`,
   `utils/redis.ts` still serve the live old (non-fight) routes and the old client.
   They get no new importers: **no rebuild module imports any old module** (the only
   allowed old imports are platform plumbing: `@devvit/web/server`, `logger.ts` — both KEEP).
   `shared/api.ts` gets a LEGACY banner. Full deletion happens with the Gate 1 cutover.

3. **Scoping fix**: Devvit Redis is already namespaced per installation, so the fix is
   to *drop postId from persistent keys*: `profile:{username}`, `fight:{fightId}`,
   `fight:active:{username}`, `challenge:{challengeId}:…`. Old post-scoped dev data is
   NOT migrated (pre-launch dev data; assumption flagged in the Gate 0 report).

4. **Atomicity**: Devvit Redis exposes optimistic transactions (`watch → multi → exec`).
   The fight service is written against a narrow `KVStore` port; a `MemoryStore` with
   real watch/multi/exec semantics makes idempotency + concurrency testable in vitest
   (no @devvit/test dependency); a thin Devvit adapter binds it in production.

5. **Interventions at Gate 0 = mechanism, not policy.** The phase machine fully supports
   `awaiting_intervention` (it is in the spec §6 phase list) via an injectable pause rule;
   production Gate 0 config never pauses (fights resolve in one batched advance). Gate 1
   supplies real intervention policy. Same pattern for rewards: the resolve-once →
   staged → acknowledge-once **pipeline shape** is Gate 0; fixed-budget growth
   *attribution math* is Gate 1 (placeholder small fightLearning credit for now).

6. **Legibility is schema-level from day one**: fight events carry a `reason` string in
   the contract; the Gate 0 baseline policy emits mechanical reasons. The explainable
   decision model (state + gameplan → move + narrated why) is Gate 1.

7. **Gate 0 profile bootstrap bridge**: the new fight start creates a default
   new-model profile when none exists (new code may not read old `PlayerState` —
   `shared/types.ts` is REPLACE). Gate 1's creation/draft flow replaces the bootstrap.

### Open questions carried toward the report

- Old post-scoped dev data: fresh start assumed (no migration from old keys). Confirm.
- `devvit playtest` verification may need the owner (interactive auth / long-running).

---

## 2026-07-17 — Mid-Gate-0 pause: gym pivot absorbed, story presentation grilled

**What happened:** Gate 0 execution paused at increment 2 (Devvit update — resume command:
`npm install devvit@0.13.8 @devvit/web@0.13.8 @devvit/start@0.13.8 vite@7.3.6`). Parallel
sessions meanwhile landed: the audit/state corpus (`docs/binary-boxing/`), the UX prototype +
visual bible + tokens (storybook-industrial; Matrix retired), the Blender pipeline spec with
T4 locked and First-Cup characters BUILT (hero, Barrow, Ranger, Guardian, Chief, Boiler Club
arena, pose/WebP exports), the story canon + book draft 2, and the owner's **gym-manager
pivot** (`docs/plans/gym-pivot-decisions.md` — coach fantasy, roster ≤5, staff wakes,
lamps & generations).

**This session's grill (10 decisions):** `docs/plans/story-presentation-decisions.md`.
Headlines: Gate 0 stays foundations, **Gate 1 = "The First Cup"** (naming reconciled across
gym-pivot log, canon, pipeline spec); **Gate 0 schemas are gym-shaped v1** (gym + fighter +
bout records, installation-scoped, `storybook {pending, read}` reserved); beat system =
Spread-13 page grammar, book-voice hybrid, reuse-first plate economy, bundled content +
server read-state; wake plays result → wake → debrief.

**Gate 0 re-scope:** tasks 4/5/6/8 re-written gym-shaped (contracts, persistence keys,
gym+fighter module, bout service). Increment map otherwise unchanged; tree untouched since
72655e6 by this session.

**Note:** this commit co-mingles uncommitted parallel-session doc updates present in the
tree (canon §3 Barrow's-bucket block; pipeline §5 kit convention + §7 build completions) —
content-identical to their sessions' work, committed here to keep the doc set consistent.

---

## 2026-07-17 — Increment 2: Devvit 0.12.12 → 0.13.8 (+ vite 7.3.6)

**What:** `devvit`, `@devvit/web`, `@devvit/start` → 0.13.8; `vite` 7.3.1 → 7.3.6 (exact pins,
matching repo style). vite bump is load-bearing: `@devvit/start@0.13.8` peers `vite >=7.3.5`,
`@vitejs/plugin-react@5.1.2` caps `^7` — 7.3.6 is the only satisfying line.
**Why:** spec §7 Gate 0 line 1 ("Update Devvit separately"); audit confirmed the one
Devvit-Web breaking change (splash/loading params on submitCustomPost) doesn't apply here.
**Evidence:** type-check ✓ · 84/84 tests ✓ · build ✓ (2.5 s) — zero code changes needed.
**Open:** live `devvit playtest` needs the owner's Reddit login (auth probe declined in
session); owner verifies via `npm run dev` at convenience. Flagged for the Gate 0 report.

---

## 2026-07-17 — Increment 3: devvit.json permissions (the Gate 0 config blocker)

**What:** `permissions` block added — `redis: true`, `reddit: {enable, scope: "user"}`;
realtime omitted (= false, per spec §6 permissions precision). In the same commit, the
dormant `realtime.send` in `community.ts#broadcastEvent` was removed (it was a used-feature
that would force the realtime permission on; it has been failing silently since launch and
its feed is REMOVE-marked in the triage). The redis-list feed stays dormant until the Gate 1
cutover deletes it.
**Validation:** parsed clean by Devvit's own `parseAppConfig` (0.13.8 `@devvit/shared-types`)
— resolved permissions confirm redis on, reddit user-scope, realtime false.
**Watch-item:** if `submitCustomPost` (menu post-create) rejects under `scope: "user"` during
the owner's playtest, bump to `"moderator"` — one line, evidence first.
**Evidence:** type-check ✓ · 84/84 ✓ · build ✓ · lint ✓.
