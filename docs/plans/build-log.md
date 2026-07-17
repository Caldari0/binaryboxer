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

---

## 2026-07-17 — Increment 4: runtime contracts (`src/shared/contracts/`, zod 4.4.3)

**What:** the rebuild's only contract source — `common` (CONTRACT_VERSION, error envelope),
`language` (10 retained IDs + distinct-pair rule), `stats` (five effectiveness-only keys:
power/speed/technique/stamina/chin + separate GrowthSources), `gym` (gym-shaped v1 records:
lamps/prestige/scrap/staff/roster≤5/storybook reservation; fighter records with languages,
sources, condition, origin), `fight` (the transactional bout protocol: 4 phases,
fightId/revision/commandId, batched-advance event union with **required non-empty `reason`**
on every action, staged rewards, command cache for byte-identical replays, revision-conflict
envelope carrying the authoritative snapshot). Legacy `shared/api.ts` got its do-not-import
banner. 16 new tests pin validation behaviour (tests/contracts/).
**Design note:** stat keys chosen to map 1:1 onto Bantam's deferred display vocabulary
(Heart = the condition gauge, not a growth stat) — spec doesn't enumerate keys; flagged in
the Gate 0 report; migrations make this cheap to change.
**Zod 4 gotcha:** enum-keyed `z.record` is exhaustive; sparse deltas need `z.partialRecord`.
**Evidence:** type-check ✓ · **100/100 tests** (84 donor + 16 contracts) ✓ · build ✓ · lint ✓.

---

## 2026-07-17 — Increment 5: persistence kit (`src/server/persistence/`)

**What:** installation-scoped key builders (`gym:{username}`, `fighter:{username}:{id}`,
`fight:{fightId}`, `fight:active:{username}`, `challenge:{id}:scores` — postId gone, fixing
the profile-fragmentation critical); `KVStore` port over the Devvit Redis subset with
buffered optimistic transactions (watch → read → queue → exec, both adapters share exact
semantics); `MemoryStore` with real WATCH behaviour (per-key versions + delete tombstones —
catches the created-then-deleted ABA case); `DevvitStore` thin adapter (conflict = exec
throw, per the donor `broadcastEvent` precedent); versioned envelope `{v, data}` + migration
runner (fail-loud on future versions, chain gaps, and post-migration invalidity;
`loadAndHeal` writes migrated envelopes back outside tx windows); kind registry (gym v1,
fighter v1, fight v1). 18 new tests: WATCH conflict matrix (write/delete/ABA/two-winners),
TTL via injected clock, migration chains, real-record round-trips.
**Design note:** no barrel export — tests and services import concrete modules so vitest
never pulls `@devvit/web/server` transitively.
**Evidence:** type-check ✓ · **118/118 tests** ✓ · build ✓ · lint ✓.

---

## 2026-07-17 — Increment 6: gym module (`src/server/gym/`)

**What:** `deriveStats` — the ONLY combiner of base + language leans + separate growth
sources (+ temp effects for Gate 1 programs); `languageLeans` — new-model identity leans,
+2/+1 per language, every language totalling exactly 3 points, so **all 45 pairs have an
identical stat budget** (the Python-dominance critical is now impossible by construction —
pinned by a whole-pair-space fairness test); gym/fighter stores over the persistence kit;
`ensureGym` bootstrap bridge (founding Kettleworks gym + placeholder PEKOE fighter until
Gate 1 onboarding); tunables in one constants module (lamps=3, base=10, integrity=100,
fight TTL 24h — v1's 600s TTL could expire mid-fight).
**Evidence:** type-check ✓ · **123/123 tests** ✓ · build ✓ · lint ✓.

---

## 2026-07-17 — Increment 7: fight engine core (`src/server/fight/`)

**What:** `SeededRng` (Mulberry32 — the KEEP donor technique reimplemented; no rebuild
import of the legacy engine) + `statToChance`; `generateOpponent` stub (deterministic,
budget-fair: opponent total = fighter pair budget, so the harness measures the engine, not
stat inflation); `resolution.ts` — pure deterministic core: 3-move baseline policy with a
reason on every action, speed-ordered rounds, chin mitigation, stamina endurance fade,
12-round cap with decision, **KO ends the round instantly** (the donor's simultaneous-KO
turn-order bug is unrepresentable), injectable `PauseRule` (intervention mechanism, no
production pauses at Gate 0), and `resolveUntil` — the batched advance core.
**Key property (tested):** per-round RNG is derived from (seed, round), so a bout paused at
an intervention and resumed lands **bit-identically** with an uninterrupted run — the
foundation for idempotent re-resolution and cached-command replay. 10 new tests incl.
200-seed grids for termination/bounds/KO-finality and a both-sides-win sanity band.
**Evidence:** type-check ✓ · **133/133 tests** ✓ · build ✓ · lint ✓.

---

## 2026-07-17 — Increment 8: bout command service + routes — THE CUTOVER

**What (new):** `fight/service.ts` — the transactional command service: start/advance/
acknowledge/current with commandId replay from a per-fight response cache (byte-identical
bodies, capped at 8), revision checks returning 409 + authoritative snapshot, phase machine
(`running → resolved → acknowledged`; `awaiting_intervention` reachable via the pause
mechanism), rewards staged once at resolve and committed **exactly once** inside a
watch/multi/exec transaction spanning fight + gym + fighter records; lamps decrement on loss
(floor 0 — generation-end flow is Gate 1); fightLearning merged into the SEPARATE source;
post-bout integrity floor 10 (repair rules are Gate 1; prevents a softlock). Ownership
checks return 404, never leaking other users' bouts. `routes/fight.ts` — thin zod-validated
HTTP surface (400 VALIDATION with the first issue path, 401/404/409/500 mapped from the
service envelope).
**What (deleted, same commit — REPLACE discipline):** `routes/combat.ts` (turn/resolve/
complete: the punch-by-punch REMOVE + the double-award path), `engine/combat.ts`
(autoPickAction, BossEffects switch, old resolution), `engine/enemy.ts` (uniform-scaling
generator), and their REPLACE'd test suites (combat, enemy, combat-math, edge-cases —
profanity tests ported verbatim to `tests/smoothness/profanity.test.ts` per their KEEP
verdict). `api.ts` mounts the new router at `/api/fight`. **No rebuild module imports any
legacy module; the legacy fight engine no longer exists.**
**Consequence (planned, kickoff decision #1):** the old client fight flow is inert until
Gate 1 wires the new protocol into the UI. init/create/corner/dynasty/leaderboard still run
on legacy modules (`stats.ts`, `inheritance.ts`, `utils/redis.ts` survive until Gate 1).
**Evidence:** type-check ✓ · **92/92 tests** ✓ (14-test service proof suite: replayed
acknowledge does not double-award; concurrent duplicate acknowledges commit exactly once;
stale revisions 409 with snapshot; zero-integrity start rejected — the donor's double-award,
zero-HP-start, and simultaneous-KO criticals are all now structurally dead) · build ✓ · lint ✓.

---

## 2026-07-17 — Increment 9: balance simulation harness + gates (`src/server/sim/`)

**What:** pure harness driving the real resolution core across **all 45 language pairs ×
200 seeds (9,000 bouts)**; `npm run simulate` prints the report table; the vitest suite
asserts the corridors in CI: overall win rate ∈ [35%, 65%] · pair win-rate spread ≤ 30 pts ·
every pair can win and lose · mean rounds ∈ [3, 12], never past the cap · KO rate ∈
[20%, 95%] · byte-identical determinism.
**The gates immediately earned their keep:** the first run failed two of them (KO rate
0.06% — damage too low to ever finish inside 12 rounds; pair spread 52 pts — power's
marginal value ~3× any other stat's). Two tuning passes fixed the FORMULAS, not the data:
damage offset `(power+14)×k` flattens power's marginal value; stamina half-point 8;
technique accuracy weight 1.0 + speed 0.5. Also learned: at 40 seeds/pair, binomial noise
alone fakes ~30 pts of spread — 200/pair makes the gate measure true imbalance (σ≈3.5 pts).
**Shipped numbers:** win rate 51.5% · KO 80.2% · mean 8.8 rounds · true spread 24.5 pts
(technique-lean pairs ~57–62%, no-technique pairs ~37–45% — texture within corridor; Gate 1
re-tunes per archetype × gameplan with tighter corridors when the real decision model lands).
**Evidence:** type-check ✓ · **99/99 tests** ✓ · build ✓ · lint ✓.

---

## 2026-07-17 — Increment 10: GATE 0 COMPLETE — wrap

**Flow driven** (build-loop VERIFY): a full bout played through the command service via a
throwaway driver — the transcript narrates every action with its reason, guard visibly cuts
incoming damage (28 → 8/6/6 while covering up), rewards commit once at acknowledge. The
harness table + 99-test suite are the standing evidence.
**CLAUDE.md accuracy pass** (this commit): stack corrected (Hono, not Express), authority
chain replaces the superseded GDD, new module map + new key schema + new endpoint table,
REPLACE-discipline and green-tree pitfalls added — future sessions no longer inherit a
stale frame (the drift failure mode this branch already hit once today).

### Gate 0 deliverables — status
| Deliverable (spec §7 + §6) | Status |
|---|---|
| Update Devvit separately; verify playtest | ✅ 0.13.8 green · playtest = **owner item** (`npm run login && npm run dev`) |
| Enable Redis + needed Reddit access, Realtime off | ✅ validated against Devvit's own parser |
| Schema versions + migrations | ✅ `{v,data}` envelope, fail-loud runner, kind registry |
| Derived stat inputs (separate sources) | ✅ gym module; pair-fairness by construction |
| Transactional/idempotent fight commands + batched advance | ✅ proven: replay, once-only rewards, races |
| Runtime-validated contracts | ✅ zod contracts, requests 400 on violation |
| Balance simulation gates | ✅ 9,000-bout grid in CI corridors |
| Redis scoping fix (installation-scoped) | ✅ new keys; legacy keys die at Gate 1 |

**STOPPED at the gate boundary. Gate 1 (The First Cup) not started, per the build loop.**

---

## 2026-07-17 — PRODUCT SPLIT v2 + Gate 1 authorized (UI-first)

**Owner playtested the Reddit app, saw the legacy v1 terminal client, and was rightly
disappointed** — Gate 0 shipped no visible surface (by plan, but the plan gave the owner
nothing to feel). The owner then delivered a Claude-design editorial prototype
(`prototype/binary-boxer-editorial.html`, committed here) that renders the redesign spec's
entire loop playably — layered fighter card, trigger-true program draft, behavioural
scouting on the rival "null", boxer-voiced gameplan, theatrical fight with a reasons feed +
live corner-call modal, and a debrief attributing a capped growth budget to the player's
decisions with derived-stat breakdowns (`seed·train·learn·legacy·prog`).

**Ruling (`product-split-decisions.md`):** Reddit = the single-fighter editorial management
game (that artifact is the UX contract; no Blender dependency). Godot/Steam standalone =
the full experience (T4 art, storybook, gym depth). Supersession banners added to
bantam-decisions (#3/#4/#9), bantam-goal-prompt (do not paste), standalone-decisions (#2
wording), story-presentation-decisions (beats → standalone-era). CLAUDE.md re-pointed.
Gate 0 foundations unaffected: gym schema serves single-fighter as roster-of-1;
lamps = the artifact's integrity lives; the bout protocol already speaks the fight
screen's language.

**Gate 1 (Reddit, editorial slice) — owner-authorized, UI-FIRST:**
1. Fight screen wired to live `/api/fight` (reasons feed, integrity/heat, 1×/2×,
   skip-to-decision, corner modal on `awaiting_intervention`)
2. Editorial tokens extracted into the production client (Matrix CSS retired)
3. Gate 1 decision model (gameplan-aware narrated reasons, heat, programs via trigger
   registry, boss tells) replaces the baseline policy
4. Remaining screens per the artifact: Fighter · Draft · Scout · Gameplan · Debrief · Corner
5. Legacy client/module cutover · balance corridors re-tuned per archetype · human playtest
   gate unchanged
Open alignment item: stat display vocabulary (artifact shows Power/Accuracy/Durability;
engine keys are 5; display-map for Reddit, rename via migration if the owner prefers).
