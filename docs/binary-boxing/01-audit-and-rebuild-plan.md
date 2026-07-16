# 01 — Audit Verdicts & Sequenced Rebuild Plan (2026-07-16)

> Verdict base: `docs/plans/donor-triage.md` (KEEP/ADAPT/REPLACE/REMOVE per subsystem, file:line evidence).
> **This session independently spot-checked 12 of its load-bearing claims against the code: all 12 confirmed.**
> This document records what the verification *adds or changes*, then sequences the work. It does not
> restate the full triage table — read it alongside the triage map and the redesign spec.

## 1. Salvage-versus-rebuild — the audited bottom line

**PRESERVE (proven good, keep as-is)**
Devvit config & three-entrypoint layout · Hono server topology & internal routes (menu/trigger) ·
Redis plumbing helpers · structured logger · HTML shells & inline→expanded bridge · seeded RNG
(Mulberry32) · profanity/name validation · TS-strict + ESLint + Vitest toolchain (all green) ·
conventional-commit history · `docs/plans/` authority chain.

**REPAIR / ADAPT (good shells, wrong contents)**
Language catalog (identity, colors, flavor — strip flat stat bonuses) · enemy/boss names & taglines
(27+10, strong content seeds) · FightScreen presentation shell (replay/speed/portrait patterns) ·
RobotCreation flow · init/resume account plumbing · `index.css` token/reduced-motion approach
(the *approach* survives; the Matrix look is superseded by the storybook-industrial direction).

**REPLACE (rebuild; do not patch)** — now backed by run-time proof, not just review:
combat balance & enemy generation (unwinnable: 0% win rate for most builds; enemies get 13 uniform
stats, players grow 2) · stat/progression/growth math (training wipe proven; Python 5.4× dominance
proven) · `autoPickAction` and enemy AI (static, reasonless) · `BossEffects` switch → composable
event/effect registry · fight state & protocol → transactional `fightId/revision/commandId` with
batched `fight.advance` (double-award path proven) · API contracts → runtime-validated (zod-on-Hono
acceptable) · leaderboards → one equal-start challenge · engine tests that lock in doomed formulas.

**RETIRE**
`/fight/turn` punch-by-punch route · language swapping · realtime community feed (deferred by spec) ·
companions/tips data modules (unreferenced; keep files as content provenance) · `HANDOFF.md` +
`tests/smoothness/REPORT.md` as authority (historical only) · CRT/Matrix visual identity (superseded).

## 2. What this audit adds beyond the existing docs

1. **Empirical unwinnability** (see `00-project-state.md`). Rebalancing is not polish — it is the product.
   Consequence: a **balance-simulation harness is a Gate-0 deliverable**, promoted from "nice automation".
   The audit harness already demonstrates the technique (drive pure engine functions across seeds).
2. **Platform delta is real but small**: 0.12.12 → 0.13.8 is one Devvit-Web breaking change this repo
   already conforms to. Do the update at Gate 0 as the spec says; add `"permissions": { "redis": true }`
   (confirmed required by current schema).
3. **Developer Funds window**: H1 dies 2026-07-31; H2 (Aug→Dec) pays on **daily engagement** (5,000 DQE
   → $4,000, recurring to $25k/mo). The spec's equal-start subreddit challenge + campaign arc is the right
   shape; add explicit daily-return hooks (challenge cadence, streak-safe design) at Gate 2, and make the
   inline card load <1 s (it is the acquisition surface).
4. **Licence/asset audit is clean**: BSD-3-Clause template, zero binary assets, system fonts. Nothing
   blocks commercial use. New art must keep a licence manifest (`docs/binary-boxing/asset-licences.md`).
5. **No secrets in repo**; `.claude/` is local permission config (fine to keep untracked or ignore).
6. **Windows/Linux note**: `node_modules` is Windows-native; CI or sandbox verification needs its own
   install (this audit used a clean Linux copy — all green).

## 3. Sequenced production plan

Gate structure and content stay as `fable-build-loop.md` defines. Sequencing corrections from evidence:

**Now → UX prototype (this session, owner-directed):** high-fidelity interactive prototype of the full
Manager-Mode journey in the new visual identity (see `03-ux-and-visual-bible.md`). It is the cheap way
to validate the pivot's *feel* before engine work, and doubles as the component/motion spec for Gate 1 UI.

**Gate 0 — Foundations (order matters):**
1. `npm i devvit@latest @devvit/web@latest` + `npx devvit update app`; verify playtest on 0.13.8.
2. `devvit.json`: add `permissions.redis: true` (+ `reddit` scope only if used; realtime stays off).
3. Redis re-scoping (installation-scoped profiles; challenge keys by challengeId) + schema versions/migrations.
4. Transactional fight protocol (fightId/revision/commandId; once-only rewards; idempotent acknowledge; batched advance).
5. zod runtime schemas on the fight contract.
6. **Balance-simulation harness as a test gate** (win-rate corridors per archetype × gameplan; CI-red if out of corridor).

**Gate 1 — Five-fight vertical slice:** per spec §Gate 1 (one OS, 3 archetypes+variants, 3 gameplan
controls, 6 programs/draft, interventions 1/2, phased boss, explainable actions, fixed-budget debrief,
2–3 integrity lives, one arena). UI built from the prototype's tokens/components. Human playtest gate.

**Gate 2 — Season Zero:** one 8–12-fight arc, rival, 2–3 arenas, heirloom inheritance, subreddit
challenge, save/resume, journey analytics. **Add:** daily-return cadence tuned for DQE.

**Gate 3 — Launch:** perf/accessibility, real feed card, README for review, publish (1–2 day review),
Funds enrollment.

## 4. Top risks (ranked)

1. **Balance rebuild scope** — the sim harness gate is the mitigation; never hand-tune blind again.
2. **Reward integrity under stepped combat** — transactional protocol first (Gate 0), proven necessary.
3. **Redis migration** — post-scoped → installation-scoped needs a migration path before any real players exist (cheapest now).
4. **Engagement bar for Funds H2** (5k DQE) — mitigate with inline-card quality, challenge cadence, share-able run summaries; treat Funds as upside, not the plan.
5. **Visual pivot vs performance** — storybook-industrial must stay code-authored/CSP-safe; splash stays pure SVG/CSS <1 s; heavier art only in expanded mode.
6. **Solo scope creep** — the gates + "deferred" list are the contract; prototype answers taste questions cheaply.
7. **Platform drift** — re-check the Devvit changelog at each gate (0.13.x is moving: blob storage, push notifications beta, logged-out support).

## 5. Recommended route through Prompts 2–7

| Prompt | Scope | Guarded by |
|---|---|---|
| 2 (now) | UX prototype, full journey, new identity, design tokens | click-through at 3 sizes + a11y checks |
| 3 | Gate 0 foundations (platform update, permissions, protocol, schemas, sim harness) | green chain + sim corridors |
| 4 | Gate 1 engine: archetypes/variants, gameplan, explainable AI, programs registry | sim harness + unit tests |
| 5 | Gate 1 UI: wire prototype components to real engine; debrief/growth attribution | click-through + playtest |
| 6 | Gate 1 polish + human playtest gate; fix findings | playtest pass criteria |
| 7 | Gate 2 content (arc, rival, arenas) + challenge + analytics | playtest + DQE instrumentation |

Blockers this session could not resolve: live `devvit playtest` (needs owner's Reddit login on the host)
and Blender MCP connection (addon not connected yet) — neither blocks Prompts 2–3.
