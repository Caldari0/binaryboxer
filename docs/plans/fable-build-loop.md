# Binary Boxer — Build Loop for Fable

> **What this is:** the complete, self-contained briefing and working protocol for rebuilding
> Binary Boxer. You (Fable) were not present for the design work that produced it; this document
> plus the files it points to are your full context. Read it end-to-end before touching code.
>
> **How to use it:** this is a *context-engineering loop*. A few durable files are your working
> memory — the spec, the triage map, and a build log you keep. Re-anchor to them at the start of
> every iteration so context never drifts, especially after any summarization/compaction.

---

## 0. Source-of-truth files — read these first, in full

| File | What it is |
|---|---|
| `docs/plans/binaryboxer-redesign-decisions.md` | **The spec.** 19 reconciled decisions, the layered model, technical foundations, the Gate 0–3 roadmap. This is the design contract. |
| `docs/plans/donor-triage.md` | The KEEP/ADAPT/REPLACE/REMOVE map of the existing code. *If it doesn't exist yet, producing it is your first task (Phase A).* |
| This file | The context wrapper + the working loop + the gates + the guardrails. |
| Diagnosis & redesign artifact | https://claude.ai/code/artifact/0b6e1fdc-1a76-4107-9e84-7abde546ead9 — visual summary of the audit + design. |

If anything in this document conflicts with the spec, **the spec wins** for *design*; **this document wins** for *process/guardrails*.

---

## 1. What Binary Boxer is (the target product)

A **boxing management sim** for Reddit (Devvit). You don't throw the punches — you **build the fighter, read the
opponent, set a gameplan, and step into the corner at the two or three moments that decide the fight.** *Football
Manager* meets a roguelike boxing gauntlet, with AI fighters seeded from programming languages and upgraded with
installable **programs**.

**Pillars (protect these):**
1. **Manage, don't micromanage** — decisions before/between fights + a few high-stakes corner calls. Never punch-by-punch.
2. **Legible autonomy** — the boxer acts on its own, but *every action carries a one-line reason* so the manager's instructions visibly shape it.
3. **Identity through choices** — who the boxer becomes reflects the programs drafted and plans committed to, not autopilot spam.
4. **A gauntlet with a spine** — a finite campaign arc, a recurring rival, evolving arenas.

**North star:** if a feature erodes *manage-not-micromanage*, *legible autonomy*, or *identity-from-choices* — cut it.

**The layered model (each layer owns exactly one job — see the spec §3):**
Language (personality/voice/signature/growth-lean) · OS (temperament, program capacity, action biases — *not a stat pile*) ·
Programs (conditional triggers/rule-changers via an event registry) · Gameplan (per-opponent priorities) ·
Stats (effectiveness only) · AI (reads state + gameplan → chooses a move **and narrates why**).

---

## 2. The full story — how we got here (so you have the "why")

1. **Origin.** The owner built Binary Boxer as an FM-style sim with AI boxers seeded from programming languages, then found it "not fun, poorly optimised, bad graphics, awful game logic."
2. **Audit (59-agent adversarial review).** 48 confirmed issues, 6 critical. The pivotal finding: **the code faithfully implements its GDD — and the GDD designed a *passive auto-battler*** ("player watches", "auto-resolved by AI"). The lifelessness is the design working as written, not a bug. The engine itself is *good* (pure functions, deterministic RNG, real tests, server-authoritative combat) — but a full interactive combat path (`submitAction`, `/fight/turn`, `getAvailableActions`) was built and never wired to the UI.
3. **The pivot.** The owner's real desire is an **active manager sim** — which *diverges from their own GDD*. So this is a deliberate design pivot on a good engine; **the GDD is being replaced by the spec.**
4. **Grilling → 18 decisions**, then an **external design + code review**, then **reconciliation → 19 decisions**. The review corrected real errors and is now folded into the spec. The non-negotiable corrections:
   - **Reliability first.** Stepped combat multiplies request volume — idempotent/transactional fight commands move to Gate 0, not late.
   - **Explainable AI.** `autoPickAction` (returns one statically-preferred move) is insufficient; without narrated decisions Manager Mode feels ceremonial.
   - **Programs are a real framework.** `BossEffects` is a `switch`, *not* a reusable system — build a composable trigger/effect registry.
   - **No consistency-growth multiplier** — it fights the adapt-to-opponent loop; growth is a fixed budget attributed to the player's plan and interventions.
   - **Integrity lives, not instant permadeath** — a single KO must not end a generation.
   - **Behavioural scouting + archetype variants** — never a bare archetype label that hands over the counter.
   - **Lean launch meta** — defer two ladders, permanent-power feats, realtime feed, third slot, multiple arcs.

---

## 3. Your stance toward the existing code: DONOR, not gospel

Treat the redesign as the **target product** and the current implementation as a **donor codebase** — *not* behaviour
that must be preserved. Classify every subsystem:

- **KEEP** — stable Devvit config, Redis integration, routing, UI/platform plumbing, init/account flow.
- **ADAPT** — screens/hooks/CSS that can be reshaped to the new loop.
- **REPLACE** — the combat AI (`autoPickAction`), the `BossEffects` switch, combat resolution, and the stat/progression/growth math. **Do not stretch these into the new architecture** — replacement is cleaner. Map them, then rebuild.
- **REMOVE** — dead code, orphaned components/assets, stale docs (`HANDOFF.md` is stale — ignore it).

---

## 4. Open decisions you must resolve BEFORE implementing

Resolve each in the spec (edit it) with a concrete answer, or surface it as blocking if it needs the owner:

1. **Language vs OS** — exact split of responsibilities and data (keep OS to temperament/capacity/scheduling, *not* another stat source).
2. **Explainable boxer decision model** — the scoring/priority function that turns (state + gameplan) into a move + a reason string.
3. **Gameplan & intervention behaviour** — the three gameplan controls; interventions as multi-round *policy shifts* (1 ordinary / 2 boss) + a "trust the boxer" no-token option.
4. **Composable program trigger/effect framework** — the event registry (`onRoundStart`, `onBlock`, `onCriticalHit`, `onLowIntegrity`, …) and how programs subscribe.
5. **Fixed-budget growth + attribution** — the per-fight budget, its scaling, and how it credits plan/contingency/successful interventions (with caps + diminishing returns). Separate persistent sources (`manualTraining`, `fightLearning`, `legacyBonuses`, program IDs, temp effects).
6. **Integrity lives + dynasty inheritance** — token count, decision-loss vs terminal-failure, one-program heirloom.
7. **Transactional & idempotent fight commands** — `fightId` / `revision` / `commandId` / `phases: running | awaiting_intervention | resolved | acknowledged`; rewards committed once on resolve; an acknowledge endpoint that cannot award twice; a batched `fight.advance` that resolves to the next intervention and returns an event batch (never one HTTP request per animated exchange).
8. **Save/resume + schema migration** — schema versions and migrations; installation/subreddit-scoped persistent profiles (current post-scoped keys fragment profiles/rankings); challenge scores keyed by challenge ID.

---

## 5. THE BUILD LOOP

Run this cycle for every increment. The point is that the **durable files carry the context** so quality never
degrades across a long build.

```
┌─ ORIENT ─ Re-read the spec, the triage map, and your build log. State the one increment
│           you're about to do and which decision/gate it serves.
│
├─ PLAN ──── Smallest next slice. Name the files and their KEEP/ADAPT/REPLACE status. If it
│           touches REPLACE code, write the new module — don't patch the old one.
│
├─ BUILD ─── Test-first where practical. Small, single-purpose commits (conventional-commit
│           messages). For anything with player-facing behaviour, wire the *legibility*
│           (the narrated reason) in the same increment — it is a requirement, not polish.
│
├─ VERIFY ── `npm run type-check`, `npm run test`, `npm run build` must ALL pass. For runtime
│           behaviour, actually DRIVE the flow (play the fight, read the debrief) — tests
│           alone don't prove it's fun or legible. Revert anything that breaks green.
│
├─ LOG ───── Append to `docs/plans/build-log.md`: what changed, why, evidence (test/build
│           output), and any new decision or risk. This is your memory across iterations.
│
└─ GATE? ─── At a gate boundary, STOP. Present the gate deliverables + any blocking decisions.
            Wait for the owner's approval before starting the next gate. Do not run ahead.
```

**Discipline that makes the loop work:**
- **Re-anchor every iteration** by re-reading the spec + build log. Never rely on memory of the conversation.
- **One increment in flight.** Finish → verify → log → next. No broad half-done refactors.
- **Keep the tree green at every commit.** A red baseline poisons the whole loop.
- **Legibility is not optional.** If an action can't explain itself, the increment isn't done.
- **Surface, don't guess.** If a decision is ambiguous or an assumption load-bearing, stop and ask.

---

## 6. The gates (with hard stop-and-approve boundaries)

### Phase A — Orient & specify (do this first, then STOP for approval)
Deliver, then wait:
- **A.** The reuse/replace assessment (`docs/plans/donor-triage.md` if not already present).
- **B.** The revised, build-ready spec — the 8 open decisions in §4 resolved in-file.
- **C.** A Gate 0 + Gate 1 implementation plan (only these two).
- **D.** Any genuinely blocking decisions that need the owner.
> **Do not begin implementation until the owner approves this plan.**

### Gate 0 — Foundations
Enable Redis + required Reddit access (Realtime stays OFF) · schema versions + migrations · derived stat inputs
(separate persistent sources) · **transactional/idempotent fight commands + batched `fight.advance`** · runtime-validated
contracts · balance-simulation harness. → verify green → STOP, report.

### Gate 1 — Five-fight private vertical slice
Build a **coherent, playable** slice:
- one OS · three enemy archetypes **with behavioural variants** · three gameplan controls ·
- six programs, with **one-from-three selection before fight one** · two program slots ·
- **one intervention in ordinary fights, two during the boss** · one **phased** boss ·
- **explainable boxer actions** · **fixed-budget growth** debrief · **two or three integrity lives** ·
- one readable arena · automated tests + balance simulations.

**Human playtest gate — pass ONLY if testers can:** explain *why the boxer acted as it did*, explain *why they won or
lost*, name enemy tendencies, and *voluntarily start another fight.* → STOP, report, wait.

### Do NOT build yet (deferred)
Season Zero / the full 8–12-fight campaign · multiple ladders · realtime community features · a third program slot ·
permanent-power feats · multiple campaign arcs · Canvas scenes. Build these only after Gate 1 passes and the owner approves.

---

## 7. Guardrails / do-nots

- **Don't preserve doomed behaviour.** REPLACE code (`autoPickAction`, `BossEffects`, combat/progression math) gets rebuilt, not patched.
- **Don't skip explainability, reliability, or the playtest gate** to move faster — they are the point.
- **Don't reintroduce** the consistency-growth multiplier, instant-KO permadeath, flat "+X% vs archetype" hard-counter perks, bare archetype labels in scouting, or one-HTTP-per-exchange combat.
- **Don't dump growth into one generic `trained` field** — keep the persistent sources separate; combine only for display.
- **Don't add tRPC dogmatically** — the requirement is validated + idempotent contracts; zod-on-Hono is acceptable. Keep Hono for internal/menu routes.
- **Don't touch the owner's committed WIP checkpoint** except through clean, reviewable commits.
- **Don't claim done without evidence** — paste the passing type-check/test/build output and describe the flow you drove.

---

## 8. Definition of done for this engagement

Gate 1 passes its human playtest with the owner's sign-off, on a green tree (type-check + tests + build), with:
a resolved spec, a `donor-triage.md`, a `build-log.md` telling the story of the build, and a short handoff describing
what exists, what's stubbed, and what's next (Season Zero). Then stop and await direction.
