# 03 — UX & Visual Bible (prototype v1, 2026-07-16)

> The playable artifact is `prototype/ux-prototype.html` — a single dependency-free file; double-click
> to run (works offline, any modern browser, phone to desktop). Screenshots: `prototype/screenshots/`.
> Tokens: `design-tokens.md`. Design authority for mechanics: `docs/plans/binaryboxer-redesign-decisions.md`.

## 1. The identity

**Storybook-industrial, clockwork-whimsical.** The game is a warmly lit machine workshop that puts on
theatrical boxing shows: brass hardware you can almost thumb, jewel-enamel robots with expressive
kettle-dome faces, fight bills set in letterpress on parchment, a rival who interrupts by cracked
hologram. Humour lives in the copy ("Undo, as a lifestyle"); dignity lives in the typography.

Explicitly rejected: neon cyberpunk, CRT scanlines (v1's identity — retired), generic SaaS cards,
icon soup, gradients-as-decoration, tiny text.

## 2. The journey (all nine screens, all clickable)

| # | Screen | Job | Signature moment |
|---|---|---|---|
| 1 | Onboarding (4 steps) | identity → name+OS → program draft | robot assembles under a work lamp; draft of 1-from-3 programs |
| 2 | Gym (hub) | status + next bout + navigation | letterpress fight poster; integrity tokens as enamel coins |
| 3 | Roster / lineage | generational story | brass picture frames; heirloom line under each portrait |
| 4 | Workshop | 2 program slots + bank | chips click into dashed bays; install pulse |
| 5 | Training & strategy | scouting + focus + 3-call gameplan | behavioural tells pinned to parchment; levers with knobs |
| 6 | Fight | theatrical presentation, zero micromanagement | narrated actions **with reasons**; corner-call interruption; momentum needle |
| 7 | Debrief | growth attribution | budget bars credit *your* plan/priority/contingency/calls |
| 8 | Repairs | logistics between bouts | sparks fly; copy makes clear repairs never buy wins |
| 9 | League | campaign arc | four venue blocks, sealed bouts, rival transmissions, boss/rival badges |

Loop: Gym → Strategy (scout → focus → commit plan) → ring walk → Fight (1 call ordinary / 2 boss,
"trust" keeps the token) → Debrief → Repairs → next bout … across 12 bouts, 4 venues, rival at the end.
Losing costs an integrity token; at zero the generation ends and the Roster starts the next with one
heirloom program.

## 3. Interface laws

1. **The next action is always findable in seconds** — exactly one garnet CTA per screen (the ring
   walk / fight week); everything else is brass or ghost.
2. **Reasons are UI.** Every boxer action renders a one-line why (`— priority: punishing the recovery
   window`). If a feature can't explain itself, it doesn't ship.
3. **Decisions are levers, information is parchment.** Options look mechanical (knob + slide);
   evidence looks hand-written.
4. **Weight or nothing.** Everything that moves has anticipation and settle; nothing fades limply.
   Reduced-motion users get a fully static, fully functional game.
5. **One garnet, one amber.** Danger/opponent = garnet; energy/economy = amber. Never mixed.

## 4. Verification record (3 passes, evidence on disk)

**Pass 1 — build:** all 9 screens implemented in a single file (~1,750 lines); seeded-RNG fight sim
faithful to the spec's Manager-Mode loop (gameplan weights, archetype tells, policy-shift interventions,
fixed-budget attribution, integrity lives, heirloom generation reset).

**Pass 2 — automated click-through** (headless Chromium 149, script in session outputs):
- Full journey driven end-to-end at desktop 1280×860; fresh journeys at tablet 768×1024 and phone
  360×740 (touch taps) — **22 screenshots**, `prototype/screenshots/*.png`.
- **0 page errors / 0 console errors** across all three runs.
- Keyboard: 12×Tab lands on visible tab controls (focus ring verified); arrow keys traverse the tab
  rail; the corner-call dialog focuses its first option (and deliberately cannot be Escape-dismissed —
  it is a required decision).
- **0 px horizontal overflow at 360 px** (no scroll traps — a Devvit inline requirement).
- States exercised: empty (fresh gym ledger, empty bank/slots), selected, disabled (nav pre-creation,
  tab-less mobile labels), loading-free (static file), error (render boundary with reset), success
  (win debrief), failure path (loss → integrity −1) available via play.

**Pass 3 — visual polish (screenshots re-inspected, fixes applied, re-run):**
- Corner-call modal was semi-transparent over the arena → opaque card + darker veil (backdrop-filter
  removed after headless compositor made it invisible — real-browser + headless now agree).
- Tofu glyph in modal kicker removed; coach-note capitalization fixed; mount-truncation incident
  repaired and re-verified (`</script>` present, page boots).

## 5. Accessibility checklist (performed)

Focus-visible ring on every control · aria-pressed/checked on levers, cards, tabs · role=radiogroup /
tablist / dialog / log semantics · aria-live for commentary and toasts · 44 px touch targets ·
contrast: body text `#f0e2c4` on `#2a1e14` ≈ 10:1, dim text ≈ 5.6:1, ink-on-parchment ≈ 9:1 ·
reduced-motion global kill switch · no color-only meaning (win/loss also worded; meters numbered).
Known gap for Gate 1: full screen-reader narration of the fight timeline (currently a log region).

## 6. What the production build takes from this prototype

Tokens/components port into `src/client/index.css` (replacing the Matrix system) · screen composition
maps 1:1 onto the ADAPTed `game.tsx` shell · the sim's *interfaces* (gameplan, tells, interventions,
attribution, reasons) are the UI contract for the real engine · robot/enemy SVG builders are the
placeholder art pipeline until/if Blender renders replace them (slot-in, same layout).

## 7. Remaining placeholders

Code-authored SVG robots (hero art candidates for Blender/WebP later) · four arena backdrops are
gradient+ornament sketches, not full scenes · no audio (out of scope; Devvit requires tap-first audio
anyway) · rival portrait is a stylized visor, not a character rig.
