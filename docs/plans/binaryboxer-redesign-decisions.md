# Binary Boxer — Redesign Spec (reconciled)

> **Status:** north-star design, reconciled after an external design + code review.
> Sources: 59-agent codebase audit → grilling session (18 decisions) → design-lead review (2026-07-16).
> This supersedes the raw grilling log; where the review revised a grilling decision, the revision wins and the change is noted.
> Companion artifact (visual): https://claude.ai/code/artifact/0b6e1fdc-1a76-4107-9e84-7abde546ead9

---

## 1. The pivot in one paragraph

Binary Boxer's shipped code faithfully implements its GDD — but the GDD designed a **passive auto-battler**
("player watches", "auto-resolved by AI"). The owner wants a **manager sim**: you build the fighter, read the
opponent, set a gameplan, and step into the corner at the two or three moments that decide the fight — *Football
Manager* meets a roguelike boxing gauntlet, with AI fighters seeded from programming languages and upgraded with
installable programs. A full interactive combat engine already exists (`submitAction`, `/fight/turn`,
`getAvailableActions`) but was never wired to the UI. **This is a design pivot on a good engine; the GDD must be
rewritten to match this spec.**

## 2. Pillars & the north star

1. **Manage, don't micromanage.** Decisions live before/between fights + a few high-stakes corner calls. Never punch-by-punch.
2. **Legible autonomy.** The boxer acts on its own, but every action carries a one-line reason, so the player's instructions visibly shape behaviour.
3. **Identity through choices, not grind.** Who the boxer becomes reflects the programs drafted and plans committed to — not what the autopilot spammed.
4. **A gauntlet with a spine.** A finite campaign arc with a rival and evolving arenas, replayable as a roguelike.

**North star:** if a feature erodes *manager-not-micromanager*, *legible autonomy*, or *identity-from-choices*, cut it.

## 3. The layered model — each layer owns exactly one job

This is the backbone; it stops six systems becoming mush and resolves the "OS is missing" gap.

| Layer | Single responsibility |
|---|---|
| **Language** (×2) | Personality, dialogue voice, a signature move, a small growth lean. The identity seed. |
| **OS** | The boxer's brain: persistent temperament, **program capacity**, baseline action biases. The substrate programs install onto. Deliberately **not** another stat pile — keep it scheduling/capacity/temperament only. |
| **Programs** (2 slots) | Conditional triggers & rule-changers via an event registry. The headline system. |
| **Gameplan** | Temporary, per-opponent priorities for this fight. |
| **Stats** | Effectiveness only (power/accuracy/durability). Never personality. |
| **The AI** | Evaluates integrity, heat/stamina, opponent tells, recent actions + the gameplan → picks the next move **and narrates why**. |

> The current `autoPickAction` (picks one statically-preferred move, `combat.ts:804`) is **not** sufficient. Replace it
> with a small decision function that weighs state against the gameplan and emits a reason string, e.g.
> *"Guard — defensive contingency triggered below 35% integrity."* Legibility is the mechanic, not UI polish.

---

## 4. Decision verdict (from the review)

- **Keep:** Manager Mode · enemy archetypes · partial scouting · derived stats · two program slots · boss drafts · one campaign arc · evolving arenas · recurring rival · language-tinted dialogue.
- **Revise:** full gameplan · intervention cadence · fight durations · conditional perks · free swapping · style growth · KO/dynasty.
- **Defer:** third unrestricted slot · permanent-power feats · second leaderboard · community feed/realtime · multiple arcs.
- **Add (was missing):** explicit OS role · explainable boxer AI · growth-attribution rules · transactional fight protocol · multiple human playtest gates.

## 5. Decisions — reconciled

| # | Decision | Reconciled choice | Change from grilling log |
|---|----------|-------------------|--------------------------|
| 1 | Combat model | **Manager Mode** — gameplan, auto-play, intervene | keep |
| 2 | Gameplan | **Three controls:** Approach (Pressure/Counter/Technical) · Priority (Punish recovery/Drain stability/Break guard) · Contingency (Protect lead/Overclock behind/Emergency shell) | **revised** from an IF/THEN rule-builder (too much for a short mobile fight) |
| 3 | Enemies | **Archetypes _with variants_**, read via behaviour | **revised** — variants added so scouting+swapping isn't trivial equipment-matching |
| 4 | Scouting | **Behavioural evidence**, free/partial ("long recovery after heavy attacks", "guard weakens under pressure") — never a bare archetype label that gives the counter away | **revised** — behaviour, not class names/stats |
| 5 | Interventions | **Policy shifts for several rounds**, not a forced punch. **1 in ordinary fights, 2 in bosses.** Contextual tradeoffs ("Exploit the opening" vs "Recover stability"). **"Trust the boxer" = no-token option** | **revised** from "answer 2 of ~4 moments" (that's turn-by-turn with waiting) |
| 6 | Pacing | **Ordinary 20–30s, boss 45–60s.** 2× speed + skip-to-next-decision. Simulation rounds **decoupled** from presentation time; dull exchanges compress to highlights | **revised** down from 40s/90s (too ambitious pre-testing) |
| 7 | Stat model | **Derived** from *separate* persistent sources: `manualTraining`, `fightLearning`, `legacyBonuses`, installed program IDs, temporary fight effects. Combined only for display | **revised** — do **not** dump everything into one generic `trained` field |
| 8 | Programs | **Behaviour-changing** triggers/rule-changers via a composable **event/effect registry** (`onBlock`, `onCriticalHit`, `onRoundStart`, `onLowIntegrity`…). **No flat/hard-counter perks** like "+30% vs Bruisers" | **revised** — `BossEffects` is a `switch`, not a framework; build the registry. Examples below |
| 9 | Program acquisition | **Starter draft (1 of 3) before fight one**, then boss drafts later | **revised** — programs are the headline mechanic; don't hide them until fight 5 |
| 10 | Slots | **Two: one identity-core + one swappable utility.** Run-scoped bank. **One heirloom program** survives into the next generation. **Third slot deferred** (or restricted to support programs) | **revised** — core/utility split; third slot deferred |
| 11 | Style → growth | **Fixed growth budget per fight**, scaled modestly by difficulty/outcome, **attributed to the player's plan, contingency and successful interventions** — not raw action counts. Caps + diminishing returns | **revised** — **removed the consistency multiplier** (it contradicts adapt-to-opponent scouting and self-reinforces lock-in builds) |
| 12 | Scope | **Multiple human playtest gates** (see §7), not one | **revised** — one gate → staged Gates 0–3 |
| 13 | Retention meta | **Roguelike**; **one heirloom program** to next gen; leaderboards trimmed (see #14) | keep, trimmed |
| 14 | Feats + ladder | **One equal-start subreddit challenge** + personal best + top-3 community results + copyable run summary + **cosmetic/horizontal** feat unlocks | **revised** — **defer** two ladders, permanent-power feats, Endless ranking, realtime feed |
| 15 | Story | **One campaign arc first** (not "season" — avoids treadmill framing): 8–12 fights across 4 settings | **revised** wording + explicit first-arc scope |
| 16 | Backdrops | **Code-authored, SVG/CSS first**; defer Canvas until profiling proves need. Pause animation when the post is hidden; respect reduced-motion. **Prototype one arena before committing to a pipeline** | **revised** — "animation is free" was overstated; bundled AI/WebP art is also a valid path |
| 17 | Opponents / rival | **Recurring rival** who controls/corrupts the simulation; **persists across generations within the arc** and taunts the lineage. Early appearances are **transmissions/holograms/lieutenants**; the rival is only *fought* when both victory and defeat can be honoured. **Never script an escape after a legitimate win** | **revised** — a recurring rival ≠ "Zelda-like" by itself; see #18b |
| 17b | "Zelda-like" bosses | If Zelda-style is wanted: **readable tells, phases, vulnerability windows.** `Analyse` exposes the next signature sequence — making it mechanically valuable (also fixes the dead no-op action) | **added** |
| 18 | Language dialogue | **Primary-language personality tint** on shared beats + rival taunts tailored to your language | keep |
| 19 | Lives / permadeath | **2–3 integrity/loss tokens**, tutorial protection, and a distinction between an ordinary *decision loss* and terminal *system failure*. **A single KO does not end a generation** | **revised** — immediate permadeath punishes experimentation and means most players only see Act One |

**Program examples (behaviour, not stat sticks):** *Profiler* — exposes an opponent's repeated patterns · *Firewall* —
strengthens Guard but costs speed · *JIT* — rewards varied successful actions but generates heat · *Rollback* — prevents
one crash, then disables itself.

---

## 6. Technical foundations (must exist before the systems above)

- **Transactional fight command service** — `fightId` · `revision` · `commandId` · `phases: running | awaiting_intervention | resolved | acknowledged`. Rewards committed **once**, on resolve; an **acknowledge endpoint that cannot award twice**. *(Fixes the double-award critical, which stepped combat makes more likely.)*
- **Batched `fight.advance`** — resolves rounds until the next intervention or the end, returns an **event batch**. Do **not** make one HTTP request per animated exchange (latency + Redis contention).
- **Schema-validated, idempotent contracts** with runtime schemas + schema versions/migrations. *(tRPC is one way; zod-on-Hono is another — the essential property is validated + idempotent, not the specific tool. Keep Hono for internal/menu routes.)*
- **Redis scoping fix** — persistent profiles must be **installation/subreddit-scoped**, not post-scoped (current keys fragment profiles/rankings across arena posts). Challenge scores keyed by **challenge ID**.
- **Permissions precision** — enable **Redis** (required) and the needed Reddit access; **keep Realtime disabled** until a real community feature uses it.

---

## 7. Roadmap — staged gates

### Gate 0 — Foundations
- Update Devvit separately; verify playtest.
- Enable Redis + required Reddit access (Realtime stays off).
- Schema versions + migrations.
- Derived stat inputs (separate persistent sources, §5 #7).
- **Transactional / idempotent fight commands** (§6). *(Moved up from Phase 3 — this is the sequencing correction.)*
- tRPC-or-zod runtime schemas for the fight contract.
- Balance simulation gates.

### Gate 1 — Five-fight private core lab
- One OS · three enemy archetypes · three gameplan controls · one **phased** boss.
- Six programs, with a starter draft and two slots.
- One regular intervention; two boss interventions.
- Fixed-budget growth debrief.
- Two or three integrity lives.
- One readable arena.
- **Pass only if** human testers can explain *why they won or lost*, identify enemy tendencies, and voluntarily start another fight.

### Gate 2 — "Season Zero" (one complete arc)
- One 8–12-fight campaign arc; one persistent rival + a real ending beat.
- Two or three evolving arenas.
- Six to eight polished programs.
- Language voice on shared beats.
- One-program dynasty inheritance.
- One equal-start subreddit challenge.
- Multi-session save/resume + journey analytics.

### Gate 3 — Public launch
- Balance + onboarding polish.
- Mobile performance + accessibility.
- Real feed card + rankings.
- Result sharing.
- Reliability + app-review verification.

---

## 8. Deferred until post-launch evidence supports it

Third (unrestricted) program slot · permanent-power feats · second leaderboard · Endless ranking · realtime community
feed · Canvas scenes · multiple simultaneous arcs.

---

## 9. Audit fixes folded into the gates

The six criticals map into the gates above; full findings live in the artifact. The one hard blocker is **`devvit.json`
permissions (Redis)** — Gate 0. The training-wipe, no-agency, no-op-action, Python-dominance, and uniform-enemy
criticals are all addressed by Gate 0–1 (derived stats, wired Manager Mode + explainable AI, archetypes with variants,
rebalanced languages). Reliability (idempotency/atomic writes) moved to Gate 0.
