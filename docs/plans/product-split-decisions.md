# Product Split v2 — Owner Ruling (2026-07-17)

_Owner ruling delivered after playtesting the Reddit app (the legacy v1 terminal client) and
reviewing the Claude-design editorial prototype. Supersedes earlier docs **only** where
enumerated below. This is the frame every lane builds against from now on._

## The ruling

| Product | What it is | Design contract | Art |
|---|---|---|---|
| **Reddit / Devvit** | A **fun web management game** — the single-fighter manager loop, "not the full experience." Fast, typographic, light | `prototype/binary-boxer-editorial.html` (the owner's Claude-design artifact, committed this commit) — **the UX contract**: Fighter · Draft · Scout · Gameplan · Fight · Debrief · Corner, integrity lives, generations | **Editorial ivory/ink identity** from the artifact. No Blender-render dependency |
| **Godot / Steam standalone** | The **full experience** | Post-Gate-1 design doc (per `standalone-decisions.md` #3) | **All T4 Blender art** (Pekoe, goblins, arenas, story plates), the storybook IP, the wake system, gym/roster/market depth |

## Why (the owner's words, paraphrased)

The Reddit game playtest "came up as a poor terminal" — the legacy v1 client, which Gate 1
replaces. The editorial prototype is what the Reddit game is supposed to feel like. The
Blender art is for Godot and Steam. The two products were meant to be separated.

## What this supersedes (dated notes added in each doc)

1. **`bantam-decisions.md` #3 (sprite theatre)** — Blender WebP pose sprites are NO LONGER
   the Devvit fight presentation; the Reddit fight screen is the editorial artifact's
   theatre (typographic, CSS). The sprite pipeline continues as **standalone-era** asset
   production. The public-Reddit-debut-waits-for-sprites clause (#9) is void.
2. **`bantam-decisions.md` #4 (living corner)** — standalone-era (roster staging is gym-era).
3. **`standalone-decisions.md` #2 (two-product shape)** — refined: Devvit = the single-fighter
   editorial management game (not "lite/bout edition of the gym sim"); standalone = the gym
   sim + storybook full experience.
4. **`story-presentation-decisions.md`** — the storybook-plate beat system (wakes, transplant,
   hub book) is **standalone-era presentation**; the Reddit game keeps at most light
   text-flavour beats in the editorial voice. The beat data-model reservation
   (`storybook {pending, read}`) stays in the schema (cheap, forward-compatible).
5. **Gym-pivot scope on Reddit** — gym/roster/market/leader-ladder depth moves to the
   standalone. The Reddit game runs the redesign spec's single-fighter loop (the artifact).
   The Gate 0 **gym-shaped schemas stand unchanged**: a single-fighter game is a gym with
   roster of 1; `lamps` = the artifact's integrity lives; generations = the cairn.
6. **Visual identity for the Reddit client** — the editorial system replaces
   storybook-industrial *for the Devvit client only*; storybook-industrial + design tokens
   remain the standalone/book bible. `prototype/ux-prototype.html` becomes a
   standalone-era reference.

## What stands untouched

- Engine-level decisions (`binaryboxer-redesign-decisions.md`): layered model, behavioural
  scouting, three-control gameplan, policy-shift interventions (1 ordinary / 2 boss + trust),
  fixed-budget attributed growth, derived stats, integrity lives, explainable AI. The
  editorial artifact IS these decisions, rendered.
- All Gate 0 foundations (protocol, schemas, migrations, balance harness) — the artifact's
  backend, already built and green.
- `fable-build-loop.md` process, gates, and guardrails.
- Anti-targets (no gacha/loot language, no realtime 3D, no hard counters, no bare labels).

## Gate 1 (Reddit) — re-scoped to the editorial slice, UI-first (owner's pick)

1. Fight screen first, wired to the live `/api/fight` protocol (reasons feed, integrity/heat,
   1×/2×, skip-to-decision, corner-call modal on `awaiting_intervention`).
2. Editorial design tokens extracted from the artifact into the production client.
3. Gate 1 decision model replaces the baseline policy (gameplan-aware narrated reasons,
   heat, programs via the trigger registry, boss tells) — the artifact's vocabulary.
4. Remaining screens per the artifact: Fighter, Draft, Scout, Gameplan, Debrief, Corner.
5. Legacy client + legacy modules deleted at cutover; human playtest gate unchanged —
   pass only if testers can explain why the boxer acted, why they won/lost, name tendencies,
   and voluntarily go again.

Stat-vocabulary alignment (open, cheap while pre-launch): the artifact displays
Power/Accuracy/Durability (3); the engine keys are power/speed/technique/stamina/chin (5);
`bantam-decisions.md` deferred a 6-stat display grouping. The display layer maps engine keys
→ the artifact's three for Reddit; rename/regroup via migration if the owner prefers.
