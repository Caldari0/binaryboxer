# Binary Boxer donor triage

> Status: donor-preparation map for the full manager-sim rebuild.
>
> Authority: docs/plans/binaryboxer-redesign-decisions.md. This document maps the current donor; it does not authorize Gate 0/1 implementation or preservation of old game rules.

## Verdicts

| Verdict | Meaning |
|---|---|
| **KEEP** | Reuse as-is unless ordinary integration changes are required. |
| **ADAPT** | Preserve a useful shell, technique, or content base, but reshape it for the redesign. |
| **REPLACE** | Rebuild the subsystem; map it, but do not polish its current logic. |
| **REMOVE** | Exclude it from the target design. A REMOVE verdict is not permission to delete ambiguous donor material during prep. |

The hard boundary is deliberate: Devvit/platform plumbing is donor material; combat AI, boss-effect dispatch, stat/progression/growth rules, and old player-facing game loops are rebuild material.

## Layered model

| Layer | Verdict | One-line rationale | Evidence |
|---|---|---|---|
| Language | **ADAPT** | Retain two-language IDs, names, color, and flavor, but replace flat growth bonuses with personality, dialogue voice, a signature move, and a small growth lean. | src/shared/types.ts:8; src/shared/types.ts:39; src/server/data/languages.ts:8; src/client/data/languages.ts:80 |
| OS | **REPLACE** | No OS substrate exists: PlayerState has no temperament, program capacity, or baseline action biases. | src/shared/types.ts:78; src/server/routes/game.ts:192 |
| Programs | **REPLACE** | No two-slot program model exists; companion flags/buffs and hard-coded boss effects are not a composable event/effect registry. | src/shared/types.ts:97; src/server/engine/stats.ts:172; src/server/engine/combat.ts:408 |
| Gameplan | **REPLACE** | FightState exposes punch actions and autopilot but stores no Approach, Priority, or Contingency. | src/shared/types.ts:163; src/server/engine/combat.ts:98 |
| Stats | **REPLACE** | The current 15-stat object mixes identity, effectiveness, training, level growth, companions, and legacy instead of deriving display stats from separate persistent sources. | src/shared/types.ts:20; src/server/engine/stats.ts:35; src/server/routes/corner.ts:231 |
| AI | **REPLACE** | Enemy choice is a shallow weighted pool and player autopilot selects one static primary action without a reason string. | src/server/engine/combat.ts:274; src/server/engine/combat.ts:804 |

## Platform and application foundations

| Subsystem | Verdict | One-line rationale | Evidence |
|---|---|---|---|
| Devvit post/server configuration | **KEEP** | Preserve the inline/expanded entrypoints, server entry, menu mapping, install trigger, and build scripts; permissions remain a later Gate 0 change. | devvit.json:4; devvit.json:22; devvit.json:26; devvit.json:37 |
| Vite/React/Devvit build scaffold | **KEEP** | The current plugin stack is valid donor build plumbing. | vite.config.ts:1; package.json:7 |
| Hono server and router topology | **KEEP** | Preserve the server startup and nested internal/API router pattern. | src/server/index.ts:9; src/server/routes/api.ts:13 |
| Redis SDK integration | **KEEP** | Keep @devvit/web Redis access and serialization helpers as platform plumbing. | src/server/utils/redis.ts:6; src/server/utils/redis.ts:9 |
| Redis key/storage model | **ADAPT** | Player, fight, dynasty, leaderboard, and event keys are post-scoped and must later become installation/subreddit/challenge scoped with schemas and migrations. | src/server/utils/redis.ts:13; src/server/utils/redis.ts:23; src/server/utils/redis.ts:41; src/server/utils/redis.ts:60; src/server/routes/game.ts:364 |
| Menu/install post creation | **KEEP** | These routes are clean Devvit platform plumbing independent of old game rules. | src/server/routes/menu.ts:9; src/server/routes/triggers.ts:9; src/server/core/post.ts:3 |
| Init/account plumbing | **ADAPT** | Preserve username lookup, resume behavior, robot-name validation, and profanity checks while changing persistence scope and versioned state. | src/server/routes/game.ts:44; src/server/routes/game.ts:98; src/server/routes/game.ts:141 |
| Structured logger | **KEEP** | Route-aware JSON logging is independent of the rebuild domain. | src/server/logger.ts:17; src/server/logger.ts:28 |
| Client HTML shells | **KEEP** | Separate lightweight inline and expanded bundles remain the right Devvit delivery model. | src/client/game.html:11; src/client/preview.html:11; src/client/leaderboard.html:11 |
| Expanded-mode/toast plumbing | **KEEP** | Devvit client APIs and the inline-to-expanded bridge are reusable platform behavior. | src/client/preview.tsx:72; src/client/leaderboard-entry.tsx:49 |
| Shared compile-time API types | **REPLACE** | Current Hono request typing is not runtime validation; the fight protocol needs versioned schemas and idempotent contracts. | src/shared/api.ts:19; src/server/routes/game.ts:118 |
| Shared domain types | **REPLACE** | Retain LanguageId, but rebuild player, fight, dynasty, leaderboard, and community shapes around the new model. | src/shared/types.ts:8; src/shared/types.ts:78; src/shared/types.ts:119; src/shared/types.ts:180 |
| tRPC layer | **REPLACE** | No tRPC router/procedure layer currently exists; the donor API is entirely Hono. | src/server/routes/api.ts:6; package.json:21 |

Do not “fix” the missing Devvit permissions, Redis scope, schemas, or transactional command protocol during donor prep: those are explicitly Gate 0.

## Engines and combat internals

| Subsystem | Verdict | One-line rationale | Evidence |
|---|---|---|---|
| Seeded randomness | **KEEP** | Determinism is useful for simulation, replay, and balance testing. | src/server/engine/combat.ts:18; src/server/engine/enemy.ts:18 |
| Combat resolution / resolveRound | **ADAPT** | Preserve the deterministic pure-resolution technique, but feed it gameplan/program/AI decisions and return batched reasoned events rather than punch-by-punch responses. | src/server/engine/combat.ts:552; src/server/engine/combat.ts:782 |
| Action catalog / getAvailableActions | **REPLACE** | Stat-gated punch selection conflicts with manager-not-micromanager play. | src/server/engine/combat.ts:49; src/server/engine/combat.ts:98 |
| autoPickAction | **REPLACE** | It merely returns the statically primary action and cannot weigh state/gameplan or narrate why. | src/server/engine/combat.ts:804 |
| Enemy action picker | **REPLACE** | It has no archetype variants, behavioral tells, scouting evidence, gameplan response, or explanation. | src/server/engine/combat.ts:274 |
| BossEffects / getBossEffects switch | **REPLACE** | The name-based switch is not the required composable program/boss event registry. | src/server/engine/combat.ts:408; src/server/engine/combat.ts:447 |
| Combat flavor generation | **ADAPT** | Existing event text is presentation donor material, but it needs language tint and explicit AI reason strings. | src/server/engine/combat.ts:301 |
| Fight initialization and state | **REPLACE** | Current state lacks fightId, revision, commandId, transactional phases, gameplan, programs, interventions, and schema version. | src/server/engine/combat.ts:522; src/shared/types.ts:163 |
| Stats/progression/growth engine | **REPLACE** | Level formulas, XP, generic training, and flat companion buffs violate separate derived sources and fixed-budget attributed growth. | src/server/engine/stats.ts:35; src/server/engine/stats.ts:63; src/server/engine/stats.ts:136; src/server/engine/stats.ts:161; src/server/engine/stats.ts:172 |
| Inheritance engine | **REPLACE** | It compounds stat percentages across ancestors instead of carrying one heirloom program. | src/server/engine/inheritance.ts:49; src/server/engine/inheritance.ts:105 |
| Enemy engine | **REPLACE** | Enemies share uniform scaled stats and lack archetypes, variants, tells, phases, and scouting evidence; only deterministic seeding is a donor technique. | src/server/engine/enemy.ts:46; src/server/engine/enemy.ts:70 |
| Enemy/boss content catalog | **ADAPT** | Names and taglines are reusable flavor, but free-text abilities must become archetypes, tells, phases, and registry effects. | src/server/data/enemies.ts:6; src/server/data/enemies.ts:50; src/server/data/enemies.ts:63; src/server/data/enemies.ts:76 |

## Complete backend route map

The route shell may be retained even when the old behavior is REPLACE. No target route was changed or removed during donor prep.

| Route | Verdict | One-line rationale | Evidence |
|---|---|---|---|
| GET /api/init | **ADAPT** | Keep account/resume initialization, then add scoped/versioned state and new fight phases. | src/server/routes/game.ts:44 |
| POST /api/create | **ADAPT** | Keep validated name/two-language creation, then add OS and starter-program state and replace stat construction. | src/server/routes/game.ts:98 |
| GET /api/stats | **REPLACE** | It returns companion-buffed combined stats rather than derived stats with separate sources. | src/server/routes/game.ts:247 |
| POST /api/retire | **REPLACE** | The 20-fight retirement and stat-inheritance flow conflicts with integrity lives and heirloom programs. | src/server/routes/game.ts:302 |
| GET /api/dynasty | **ADAPT** | Preserve lineage read/display capability but change the stored model and campaign semantics. | src/server/routes/game.ts:458 |
| POST /api/fight/start | **ADAPT** | Preserve the command role, but add scouting/gameplan input and transactional fight identity/revision. | src/server/routes/combat.ts:51 |
| POST /api/fight/turn | **REMOVE** | Punch-by-punch player commands directly conflict with Manager Mode. | src/server/routes/combat.ts:138 |
| POST /api/fight/resolve | **REPLACE** | Replace the whole-fight autoPickAction loop with batched fight.advance to intervention or resolution. | src/server/routes/combat.ts:249 |
| POST /api/fight/complete | **REPLACE** | Rewards and cleanup are non-transactional; replace with once-only resolution and idempotent acknowledgement. | src/server/routes/combat.ts:343 |
| POST /api/corner/repair | **ADAPT** | The endpoint shell may support between-fight recovery, but the redesign has not settled the persistent-HP rule. | src/server/routes/corner.ts:45 |
| POST /api/corner/full-repair | **ADAPT** | Retain pending the recovery/integrity-life design; do not preserve the current cooldown by assumption. | src/server/routes/corner.ts:110 |
| POST /api/corner/train | **REPLACE** | Generic XP-for-+1 mutation conflicts with separate inputs and fixed-budget growth attribution. | src/server/routes/corner.ts:184 |
| POST /api/corner/swap-language | **REMOVE** | Language is an identity seed; swappable loadout choice belongs to utility programs. | src/server/routes/corner.ts:276 |
| GET /api/leaderboard/:metric | **REPLACE** | Four persistent ladders conflict with one equal-start challenge, personal best, and top-three results. | src/server/routes/leaderboard.ts:34 |
| GET /api/community/feed | **REMOVE** | Realtime/community feed is explicitly deferred beyond launch evidence. | src/server/routes/community.ts:17 |
| broadcastEvent helper | **REMOVE** | It only supports the deferred post-scoped realtime feed and remains coupled to old routes. | src/server/routes/community.ts:54 |
| POST /internal/menu/post-create | **KEEP** | It is registered, reusable Devvit moderator plumbing. | src/server/routes/menu.ts:9; devvit.json:31 |
| POST /internal/triggers/on-app-install | **KEEP** | It is registered, reusable Devvit installation plumbing. | src/server/routes/triggers.ts:9; devvit.json:37 |
| POST /internal/form/example-submit | **REMOVE** | It is template-only, has no devvit.json form mapping, but remains mounted and was therefore not deleted speculatively. | src/server/routes/forms.ts:4; src/server/routes/forms.ts:10; src/server/index.ts:13 |

## React entrypoints, screens, hook, and components

| Surface | Verdict | One-line rationale | Evidence |
|---|---|---|---|
| game.tsx / App composition | **ADAPT** | Keep a small screen-composition shell but replace the old state flow with scouting, programs, gameplan, interventions, debrief, and arc navigation. | src/client/game.tsx:19 |
| Loading/retry UI | **KEEP** | Generic request failure and retry presentation is reusable. | src/client/game.tsx:47 |
| Creation screen / RobotCreation | **ADAPT** | Keep name and two-language selection; replace stat previews with personality/signature/growth lean and connect the starter draft. | src/client/game.tsx:83; src/client/components/RobotCreation.tsx:28 |
| Fight screen / FightScreen | **ADAPT** | Replay, speed control, portraits, and presentation are donors; consume event batches, reasons, interventions, skip-to-decision, tells, and phases. | src/client/game.tsx:99; src/client/components/FightScreen.tsx:56 |
| Corner screen / CornerPhase | **REPLACE** | Its repair/training/language-swap menu must become opponent scouting, gameplan, programs, and campaign management. | src/client/game.tsx:146; src/client/components/CornerPhase.tsx:91 |
| Dynasty screen / DynastyTree | **ADAPT** | Preserve lineage presentation but replace stat legacy, immediate-KO, and title assumptions with heirloom/integrity semantics. | src/client/game.tsx:242; src/client/components/DynastyTree.tsx:75 |
| Expanded leaderboard / Leaderboard | **ADAPT** | Preserve compact ranking presentation but retarget it to challenge, personal-best, and top-three semantics. | src/client/game.tsx:267; src/client/components/Leaderboard.tsx:59 |
| Inline splash / Splash | **ADAPT** | Preserve fast initialization and expanded-mode bridge; replace old level/streak copy and fabricated ranking rows. | src/client/preview.tsx:23; src/client/preview.tsx:56; src/client/preview.tsx:72 |
| Inline leaderboard / LeaderboardInline | **ADAPT** | Preserve the lightweight entrypoint shell and retarget it to the later public challenge surface. | src/client/leaderboard-entry.tsx:19 |
| useGameState transport/error/init shell | **KEEP** | Timeout, cancellation, safe state update, and initialization patterns are reusable client plumbing. | src/client/hooks/useGameState.ts:84; src/client/hooks/useGameState.ts:141 |
| useGameState domain state and fight commands | **REPLACE** | Old screens and /turn-/resolve-/complete calls must become validated revisioned commands with batched event/intervention state. | src/client/hooks/useGameState.ts:36; src/client/hooks/useGameState.ts:250; src/client/hooks/useGameState.ts:272 |
| useGameState realtime branch | **REMOVE** | It is disabled, its events are not rendered, and realtime is deferred. | src/client/hooks/useGameState.ts:80; src/client/hooks/useGameState.ts:209 |
| TerminalMenu | **KEEP** | Generic keyboard-accessible menu behavior is reusable. | src/client/components/TerminalMenu.tsx:3; src/client/components/TerminalMenu.tsx:15 |
| AsciiPortrait renderer | **KEEP** | Generic code-authored text rendering is reusable visual plumbing. | src/client/components/AsciiPortrait.tsx:3; src/client/components/AsciiPortrait.tsx:9 |
| asciiPortraits catalog/builders | **ADAPT** | Language patches and code-authored art are useful, but enemy tiers/bosses must express variants, tells, and the arena direction. | src/client/components/asciiPortraits.ts:29; src/client/components/asciiPortraits.ts:359; src/client/components/asciiPortraits.ts:369; src/client/components/asciiPortraits.ts:376 |
| BossIntro | **ADAPT** | Keep the presentation shell and add phases, tells, rival continuity, and language-tinted dialogue. | src/client/components/BossIntro.tsx:9 |
| Root CSS/image ambient declarations | **KEEP** | The CSS declaration is required by compilation; generic image declarations remain valid platform plumbing while bundled art stays an allowed path. | src/client/global.ts:1; src/client/module.d.ts:1 |

### Removed orphaned React modules

These REMOVE decisions were proven from the donor import graph and committed in f874df1. Donor evidence refers to parent commit 04f6b79; live integrated alternatives are cited where applicable.

| Removed module | Verdict | One-line rationale | Donor evidence |
|---|---|---|---|
| HealthBar | **REMOVE** | It had zero importers; FightScreen already renders both health tracks. | src/client/components/HealthBar.tsx:16; src/client/components/FightScreen.tsx:144 |
| CombatLog | **REMOVE** | It had zero importers; FightScreen already owns the rendered event log. | src/client/components/CombatLog.tsx:20; src/client/components/FightScreen.tsx:202 |
| LanguagePicker | **REMOVE** | It had zero importers and duplicated RobotCreation language selection. | src/client/components/LanguagePicker.tsx:27; src/client/components/RobotCreation.tsx:28 |
| Companion | **REMOVE** | It had zero importers and represented a flat-buff system outside the layered model. | src/client/components/Companion.tsx:37 |
| LearningTicker | **REMOVE** | It had zero importers and was unrelated to language-tinted character dialogue. | src/client/components/LearningTicker.tsx:141 |

## CSS and visual system

| Surface | Verdict | One-line rationale | Evidence |
|---|---|---|---|
| index.css design system | **ADAPT** | Keep Tailwind integration, tokens, responsive shell, and reduced-motion safeguards; prune old domain selectors during the rebuild and prototype one CSS/SVG arena. | src/client/index.css:1; src/client/index.css:11; src/client/index.css:1639 |
| matrix.css | **REMOVE** | The dead second stylesheet had no importer; all three entrypoints import only index.css. | src/client/game.tsx:5; src/client/preview.tsx:6; src/client/leaderboard-entry.tsx:6 |
| Tailwind/Vite CSS pipeline | **KEEP** | Tailwind is imported by the live stylesheet and its Vite plugin is configured. | src/client/index.css:1; vite.config.ts:3 |
| HTML entrypoint styling hooks | **KEEP** | The root shells and external module scripts comply with Devvit web constraints. | src/client/game.html:2; src/client/game.html:13; src/client/preview.html:13; src/client/leaderboard.html:13 |

matrix.css was removed in be37b01 after the import check; no live CSS behavior was refactored.

## Data files

| File/domain | Verdict | One-line rationale | Evidence |
|---|---|---|---|
| Server language definitions | **ADAPT** | Preserve catalog/identity metadata but replace stat-bonus schema and rebalance the Python all-stat advantage. | src/server/data/languages.ts:8; src/server/data/languages.ts:32; src/server/data/languages.ts:38 |
| Client language profiles | **ADAPT** | Preserve display names, colors, quotes, and identity flavor; consolidate duplicate types and remove preview-stat math during the rebuild. | src/client/data/languages.ts:1; src/client/data/languages.ts:80; src/client/data/languages.ts:238 |
| Enemy/boss definitions | **ADAPT** | Preserve names/taglines as content seeds and replace free-text ability data with archetypes, variants, tells, phases, and registry effects. | src/server/data/enemies.ts:6; src/server/data/enemies.ts:50; src/server/data/enemies.ts:76 |
| Companion definitions | **REMOVE** | The module is unreferenced and encodes the superseded flat-buff model; retain for human review as possible program flavor provenance. | src/server/data/companions.ts:8 |
| Learning tips | **REMOVE** | The module is unreferenced and is not part of the target language-dialogue system; retain for human content review. | src/server/data/tips.ts:8 |
| Profanity data/check | **KEEP** | It is active account-creation validation independent of old combat design. | src/server/data/profanity.ts:20; src/server/data/profanity.ts:28; src/server/routes/game.ts:150 |

## Tests and audit artifacts

| Test/audit area | Verdict | One-line rationale | Evidence |
|---|---|---|---|
| Deterministic RNG and generic combat invariants | **ADAPT** | Preserve useful determinism/finite-number invariants while rewriting assertions around Manager Mode. | tests/engine/combat.test.ts:33; tests/smoothness/combat-math.test.ts:193 |
| Exact action/autoPick expectations | **REPLACE** | They specify the punch-by-punch and static-autopilot model being discarded. | tests/engine/combat.test.ts:70 |
| Stat/XP/training formula tests | **REPLACE** | They lock in progression math explicitly marked for replacement. | tests/engine/stats.test.ts:25 |
| Inheritance formula tests | **REPLACE** | They lock in compounded stat legacy rather than heirloom programs. | tests/engine/inheritance.test.ts:18 |
| Enemy scaling/boss cadence tests | **REPLACE** | They lock in uniform scaling and every-fifth-fight boss assumptions rather than archetypes/variants/arc pacing. | tests/engine/enemy.test.ts:29 |
| Profanity/edge validation tests | **KEEP** | Account-validation coverage remains useful donor protection. | tests/smoothness/edge-cases.test.ts:110 |
| Vitest/TypeScript/ESLint configuration | **KEEP** | The existing verification toolchain is green and independent of the domain rewrite. | vitest.config.ts:1; tsconfig.json:1; eslint.config.js:1 |

Later tests must cover migrations, revision conflicts, idempotent resolve/acknowledge, batched advance, AI reason strings, registry ordering, and fixed-budget growth attribution. That is rebuild work, not donor prep.

## Known bugs and rebuild blockers - reported, not fixed

No trivial bug was found in KEEP code that was both unambiguous and outside Gate 0. The following belong to Gate 0 or REPLACE/ADAPT domains and were intentionally left unchanged:

- **Gate 0 config blocker:** server code uses Redis, but devvit.json has no permissions block. Evidence: src/server/utils/redis.ts:6; devvit.json:45.
- **Gate 0 scope bug:** postId is embedded in player, fight, leaderboard, dynasty, and community keys, fragmenting profiles across arena posts. Evidence: src/server/utils/redis.ts:13; src/server/utils/redis.ts:23; src/server/utils/redis.ts:60; src/server/routes/game.ts:364; src/server/routes/community.ts:29.
- **Gate 0 reward race:** /fight/complete mutates and saves rewards before leaderboard work and fight deletion; concurrent completion or retry after partial failure can award twice. Evidence: src/server/routes/combat.ts:363; src/server/routes/combat.ts:388; src/server/routes/combat.ts:544; src/server/routes/combat.ts:547.
- **Resolved-turn response bug:** a first-attacker KO can record one turn, while route responses index the final two turns and can return undefined/mislabel the player/enemy turns. Evidence: src/server/engine/combat.ts:674; src/server/routes/combat.ts:167; src/server/routes/combat.ts:278.
- **Analyse no-op:** its description promises a two-turn accuracy effect, but resolution returns zero damage and persists no modifier. Evidence: src/server/engine/combat.ts:65; src/server/engine/combat.ts:202.
- **Overclock mismatch:** its description promises two turns of +50% speed, but current resolution only changes damage/crash behavior. Evidence: src/server/engine/combat.ts:70; src/server/engine/combat.ts:221; src/server/engine/combat.ts:580.
- **Training wipe:** training mutates the combined stats object; level-up and language-swap recalculation rebuild it from language/legacy and erase training. Evidence: src/server/routes/corner.ts:244; src/server/routes/combat.ts:424; src/server/routes/corner.ts:368.
- **Zero-HP start edge:** fight start does not reject zero HP, initialization copies it, and resolution does not pre-check KO before a faster player acts. Evidence: src/server/routes/combat.ts:80; src/server/engine/combat.ts:529; src/server/engine/combat.ts:567.
- **Counter/simultaneous-KO edge:** a counter can KO the attacker, but the first KO check only tests the defender and can decide the outcome solely by turn order. Evidence: src/server/engine/combat.ts:635; src/server/engine/combat.ts:674; src/server/engine/combat.ts:770.
- **Unwired player agency:** the main UI immediately calls whole-fight resolution; submitAction exists but has no caller. Evidence: src/client/game.tsx:24; src/client/hooks/useGameState.ts:272.
- **Dead screen states:** fight_result is declared but never entered/rendered; forced retirement sets retired, for which App has no branch and falls through to system error. Evidence: src/client/hooks/useGameState.ts:36; src/client/hooks/useGameState.ts:325; src/client/game.tsx:288.
- **Fabricated inline rankings:** the splash presents hard-coded top-three rows instead of persisted challenge results. Evidence: src/client/preview.tsx:56.
- **Uniform enemy behavior/Python dominance:** enemies differ mostly by scale and Python alone receives +2 to every growth stat, both already identified for replacement/rebalance. Evidence: src/server/engine/enemy.ts:70; src/server/data/languages.ts:32; src/server/data/languages.ts:38.

## Candidates, NOT removed

These items are intentionally retained because runtime reachability alone does not settle their donor value or because they are mounted/coupled:

- **Companion and learning-tip data:** COMPANIONS and LEARNING_TIPS have no live references, but their content provenance may inform program flavor or future copy. Evidence: src/server/data/companions.ts:8; src/server/data/tips.ts:8.
- **BaseStats type:** no reference was found, but it sits inside the Stats REPLACE domain, where prep must map rather than polish. Evidence: src/shared/types.ts:56.
- **Example form route:** template-only and unregistered in devvit.json, but still mounted and HTTP-reachable. Evidence: src/server/routes/forms.ts:10; src/server/index.ts:13.
- **Repair/full-repair behavior:** target recovery and integrity-life rules are not settled enough for deletion. Evidence: src/server/routes/corner.ts:45; src/server/routes/corner.ts:110.
- **Dynasty/leaderboard UI and dormant hook commands:** currently difficult or impossible to reach from the corner UI, but lineage and challenge results remain target concepts. Evidence: src/client/game.tsx:242; src/client/game.tsx:267; src/client/hooks/useGameState.ts:510.
- **asciiPortraits:** active and potentially useful code-authored art; keep until the single-arena CSS/SVG prototype establishes the visual pipeline. Evidence: src/client/game.tsx:16; src/client/components/asciiPortraits.ts:359.
- **Image module declarations:** no current image imports remain, but bundled WebP/raster art is explicitly still allowed. Evidence: src/client/module.d.ts:1.
- **Historical audit/provenance documents:** README (2).md, agent-1-combat-engine.md, agent-2-data-layer.md, agent-3-client-ui.md, agent-4-config-cleanup.md, bb-smoothness-tester.md, rudolph.instructions.md, and tests/smoothness/REPORT.md are odd or stale but informationally ambiguous.
- **Ignored generated output:** dist/ is untracked and may contain stale local files after older builds; it is disposable build output, not a committed donor change.

## Stale handoff warning

HANDOFF.md is retained but is not redesign authority. It is dated 2025-02-10 (HANDOFF.md:4), treats per-post isolation as intentional (HANDOFF.md:125; HANDOFF.md:538), and inventories donor code that this cleanup has since removed. The rebuild must follow docs/plans/binaryboxer-redesign-decisions.md instead.

## Cleanup ledger

- f874df1 - removed five import-orphaned React modules.
- be37b01 - removed the unimported second stylesheet.
- a8886c7 - removed the unused FightResolveResponse export.
- 8aac608 - removed unused clsx, tailwind-merge, and prettier-plugin-tailwindcss dependencies and lockfile entries.
- 03ca287 - removed unreferenced public/snoo.png.
- 52c9205 - made dist/node_modules/env and Windows reserved-device ignores explicit.

No combat AI, BossEffects switch, stat/progression/growth math, Gate 0 foundation, or Gate 1 feature was refactored or implemented.