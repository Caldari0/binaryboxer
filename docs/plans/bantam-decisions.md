# Bantam — Grilled Decisions (the delta layer)

> **⚠ Partially superseded 2026-07-17 by `product-split-decisions.md`:** #3 sprite theatre
> and #4 living corner are **standalone-era** (the Reddit fight presentation is the editorial
> artifact's, no Blender dependency); #9's "public debut waits for the sprite theatre" is
> void. #2 (the name Bantam), #5–#7 concepts, and all anti-targets stand.

_2026-07-16 · produced by an owner grilling session (9 branches, all resolved) · investigates the
"Bantam v0.1" sketch (an external model's riff, mistakenly framed as a new game — the owner's
vision was always inside Binary Boxer) · **supersedes nothing**: this is a delta layer on
`gym-pivot-decisions.md` and `binaryboxer-redesign-decisions.md`, which both stand in full ·
canon: `../binary-boxing/04-story-canon.md` · process: `fable-build-loop.md`_

## Verdict: worth pursuing — because ~85% of it already was

Mapped against the repo, Bantam v0.1 is largely a re-description of the approved gym pivot:
stable of five = the Kettleworks roster (canon), scout & sign = hiring pool + ransom-rescue,
the 5-fight card = the resolved series format, lineup gambit = counter-picking (#2), game plans
= the three levers, shouts = interventions, divisions = prestige/venues, math+luck = the engine.
The grill therefore resolved only the genuine deltas below. Three ideas were **rejected** (see
anti-targets). The real risk identified: design keeps displacing build — Gate 0 is not started
and the Funds H2 window opens 2026-08-01. Bantam is a **build mandate, not a redesign**.

## Resolved decisions

| # | Decision | Choice | Why |
|---|---|---|---|
| 1 | **Scope** | **Delta layer** — all gym-pivot + redesign decisions stand; Bantam adds presentation/collector layers and changes nothing resolved | ~85% overlap; re-litigating a same-day grilling session burns the Aug-1 runway |
| 2 | **Name** | **"Bantam" is the sport's in-world name** (retires placeholder "Fives"; closes canon §7.4) and the codename for this update | Bantamweight = the little guys; scrappy-rooster register fits a sport invented from miners' goblin stories; one name, two duties |
| 3 | **Spectacle** | **Sprite theatre: 3D-crafted, 2D-delivered.** Blender-rendered WebP pose sprites are the *shipping* fight presentation (expanded mode), plus a few cinematic plates (KOs, wakes, leader intros). SVG builders remain the dev fallback; inline entrypoint stays static/light | Pipeline already proven today (~9 KB/pose, `hero-fight-poses.py`); fits every Devvit budget (CSP/bundle/Lighthouse); honours reduced-motion; realtime 3D would fight the painted-miniature look |
| 4 | **Five on screen** | **The living corner** — sequential card stands; the full roster is staged ringside with reactive poses (idle/cheer/flinch, ~3 extra poses per chassis); bench reactions double as scouting surfaces (the Analyst points at a tell). A rare all-five "Rumble" exhibition is parked post-Gate-2 | Presence without illegibility: 5v5 melee is cheap to compute but expensive to read, and it guts counter-picking. Canon §6 already budgets ≤10 on-screen characters. Ni no Kuni's warmth is presence + swapping, not simultaneity |
| 5 | **Collector surfaces** | **Scout stars + cups.** Potential-as-rarity: ability/potential star ratings shown as scouting-uncertainty ranges ("3½–5★") that staff tiers tighten. Collection depth = the teacup wall + staff ladder; roster stays hard-capped at 5 (it's the sport); injuries arrive with the Physio unlock | FM-native, diegetic on parchment; gives the Waymark scout unlock a concrete payoff; no loot colours (bible) |
| 6 | **Style wheel** | **Soft, simulation-derived.** Three styles at the slice, mapped to the Pressure/Counter/Technical levers. Own roster's styles fully visible; opponent style is scouting intel *with variants*. Advantage emerges from the sim (stamina, recovery windows, guard) — never a type-chart multiplier | Keeps counter-picking meaningful while honouring redesign #4 (no bare labels) and #8 (no hard counters). "Styles make fights," without a lookup table |
| 7 | **Economy** | **Market only.** Ransom/transfer economy as resolved; add a rotating weekly hiring pool and rare "knock at the door" fighter events for the reveal moment. Gacha rejected | Canon: the market moves contracts, not souls; the cast is authored, not pull-pool; Funds pays engagement, not revenue; loot-box optics risk Reddit review. The "pull" thrill = the scouting reveal |
| 8 | **PvP** | **Async gym-vs-gym raids committed — design now, build Gate 2/3.** Your card vs a snapshot of another gym (their roster + committed gameplans, AI corner). Only cost taken now: the Gate-0 Redis schema keeps gym snapshots cross-user readable. Sync/realtime PvP stays rejected; equal-start challenge remains the Gate-2 bridge | Strongest daily-return driver for engagement-based Funds H2 — but raiding an unproven balance multiplies unfun (v1's exact failure). Prove the loop first; the schema hook is nearly free inside the existing scoping fix |
| 9 | **Sequencing** | **Parallel lanes.** Engine lane: Foundations → First Cup slice on SVG placeholders, never blocked by art. Sprite lane alongside: hero + Barrow → leaders 1–4 + goblin kits → living-corner reaction poses. Private playtests run on whatever art is ready; the **public Reddit debut waits for the sprite theatre**. Scout stars, soft styles, rotating market ship with the slice; raids at Gate 2/3 | Gate-1's pass condition is mechanical (testers explain outcomes) — testable on SVG. A Reddit first impression happens once; the sprite theatre is Bantam's differentiator |

## Anti-targets (rejected — do not reintroduce)

Realtime WebGL/Three.js fight rendering · simultaneous 5v5 melee as the standard bout ·
gacha/loot-box acquisition **or presentation language** · loot-rarity colour tiers ·
synchronous/realtime PvP. (These join the build loop §7 do-nots.)

## Gate map (terminology reconciled)

The redesign spec and the gym-pivot doc both say "Gate 0" and mean different things. Canonical
sequence from here: **Foundations** (redesign Gate 0: schema/idempotency/derived stats/balance
harness, + cross-user-readable gym snapshots from #8) → **First Cup slice** (gym-pivot "Gate-0
scope" ≈ redesign Gate 1: roster 2–3, staff rows 1–4, lamps, crowd meter) → **Full gym**
(market/sell-side/5-roster) → **Season Zero** (+ raid design→build) → **Public debut** (sprite
theatre required). The sprite lane runs across all of them in parallel.

## Deferred (explicit, not dropped)

- Rumble exhibition design (post-Gate-2, evidence-gated)
- Raid rules: attack/defence flow, rewards, anti-farm decay (Gate-2 design work)
- Mid-series lineup audible (one order-swap after bout 3) — Gate-1 tuning candidate
- Doorstep-event frequency/eligibility — slice tuning
- **Six-stat display vocabulary** (Power/Speed/Technique/Stamina/Chin/Heart) as a *presentation
  grouping* over the 13-stat engine — a UI decision at slice time, no engine change; "Heart"
  maps naturally to the Heart-Gauge canon
- The gym-pivot deferred list stands untouched (ransom curve, sell-side rules, wages, overflow,
  PA curves, lamp count, champion endgame)

## Stale-doc notes

- Canon §9's open questions are answered: entertainment scoring (gym-pivot #4), dynasty
  (gym-pivot #8), currencies (gym-pivot #3), and the sport name (**Bantam**, here #2). Canon
  §7.4 and §9 should point at this doc on next edit.
- `fable-build-loop.md` §1 still frames a single-fighter sim; per gym-pivot it reads
  "fighter" → "gym". Its process, gates, and guardrails are unchanged and remain authoritative.
