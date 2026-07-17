# Standalone Port — Grilled Decisions (light)

_2026-07-17 · owner interrogation (2 questions + free-text) · scope: whether/when Binary Boxer
("Bantam") gets a standalone management-sim edition, and what that means for the current build ·
delta layer on `bantam-decisions.md`; changes nothing about the Devvit lanes._

> **2026-07-17 (later) — roles refined by `product-split-decisions.md`:** Devvit = the
> single-fighter **editorial** management game (UX contract:
> `prototype/binary-boxer-editorial.html`); ALL Blender/T4 art + the storybook + gym/roster
> depth = this standalone. Decision #2's "lite/bout edition" wording is superseded.

## Resolved decisions

| # | Decision | Choice | Why |
|---|---|---|---|
| 1 | **Godot for the Reddit game** | **No.** Sprite theatre stands (bantam #3); realtime engine rendering stays an anti-target | Arithmetic, not taste: Godot 4 web export ships ~30–50 MB WASM vs Devvit's 10 MB response cap, <1 s inline load, Lighthouse >80, CSP-blocked fetches. The rejection was already resolved 2026-07-16 |
| 2 | **Two-product shape** | **Devvit = the lite/bout edition** (First Cup slice → Season Zero → public debut, per the reconciled gate map). **Standalone = the full management sim**, a separate future product | Owner's framing: "still send web sim to Devvit which is a bout and a lite version… this one a management sim game" |
| 3 | **Standalone timing + engine** | **Godot 4.x, design-transfer lane, opens after the Gate 1 (First Cup) human playtest passes**; build begins after the Funds submission. Until then: this one deferred line, no design doc, no code | The standalone inherits a *proven* loop and finished art; forking earlier duplicates unproven design into two codebases and burns the Aug-1 runway. The "fourth design doc" failure mode stays dead |
| 4 | **What transfers** | Everything: `.blend` sources re-render at any resolution, WebP sprites/plates are engine-agnostic, the pure-TS engine functions port as the sim spec, canon/tokens/bible are platform-neutral | Nothing being built now is wasted work for the standalone |
| 5 | **Fight-feel worry** | **No pre-playtest work.** Feel levers already exist in the sprite theatre (token motion curves, anticipation/hit-shake/KO fall, cinematic KO plates, living corner); if the slice feels stiff at playtest, densify poses (script makes each new pose ~a one-liner). Owner's own weighting: sim-fun > spectacle | The drama engine of a management sim is commentary + Heart-Gauge + crowd meter — the reasons-as-UI pillar, already mandated |
| 6 | **Who codes the standalone** | Same working model as today: AI session builds (GDScript/C#), owner directs. "I can't code games" is not a constraint on engine choice | Proven this week across engine/UX/Blender lanes |
| 7 | **ACE crowd-bridge (Binary Boxing × ACE sketch)** | **Standalone-era feature, not Devvit.** One-way bridge (cards/results out → betting/settlement/pundit in ACE; sentiment back only as presentation "weather"). Post-core even in the standalone | The Devvit edition's crowd is real Redditors — simulated crowds near engagement-paid metrics are a review and product-thesis risk; ACE + Blender reels + pundit LLM live on owner infra, which Devvit's 30 s serverless sandbox cannot host; it is the FM fan/media layer = full-sim depth |

## Lane note (resolved from docs, not grilled)

`story-presentation-decisions.md` §Handoffs already splits ownership: Gate 0 session = engine ·
UX-prototype extension session = beat reader · **Blender track = this art lane** (Barrow fight
poses → living-corner reactions → the ~7 First Cup plates). Caution for the owner: the pasted
`bantam-goal-prompt.md` also mentions driving the sprite lane — when relaying, tell that session
sprites are *consumed from* the art lane, so two sessions never open the same `.blend`.

## Unresolved / deferred

- Standalone design doc — deliberately deferred to post-Gate-1 (decision 3).
- Godot minor version, distribution targets (Steam/itch/mobile), and whether the Devvit server
  logic is ported or re-specced — all belong to that future design doc.
- ACE bridge specifics (odds model: recommend bookmaker-set first, crowd-derived as post-proof
  experiment; event schema; sentiment-weather presentation) — future ACE-bridge design doc.
  Free hook now: the engine's crowd-share/entertainment number is the natural card-event field.
