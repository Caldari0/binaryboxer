# Design Tokens — storybook-industrial / clockwork-whimsical

> Source of truth: the `:root` block in `prototype/ux-prototype.html`. This file explains intent so the
> tokens can be ported to the production client (`src/client/index.css`) at Gate 1 without relitigating taste.

## Identity in one line

A handcrafted machine world: warm workshop darks, brass and copper hardware, jewel-enamel accents,
parchment for anything written by humans, and motion with real weight. Never neon, never SaaS-gray.

## Color

| Token | Value | Role |
|---|---|---|
| `--bb-bg` / `--bb-bg-deep` | `#1c140e` / `#140e09` | warm umber darks — never pure black |
| `--bb-surface` → `--bb-surface-3` | `#2a1e14` → `#3f2f1f` | riveted plate panels, 3 elevations |
| `--bb-brass` / `-hi` / `-lo` | `#c9963f` / `#ecc06a` / `#8a6425` | hardware: frames, buttons, tabs, rivets |
| `--bb-copper`, `--bb-iron` | `#b87352`, `#57493c` | secondary metals, neutral borders |
| `--bb-teal` / `-hi` | `#2b8c82` / `#46b3a7` | player identity, positive actions, meters |
| `--bb-garnet` / `-hi` | `#b04353` / `#d4687a` | opponents, rival, danger CTAs, gloves |
| `--bb-royal`, `--bb-moss` | `#3d6fa8`, `#6d8a3f` | boss badges · wins/success |
| `--bb-amber` | `#ffb84d` | energy: eyes, sparks, tokens, highlights |
| `--bb-gobble` | `#b5cc4e` | Gobblestone energy: goblin lens-eyes, shard glow — the enemy counterpart to amber (3D-side today; add to `:root` when the UI first needs it) |
| `--bb-parchment` / `--bb-ink` | `#f2e4c8` / `#2b2118` | human-written surfaces (scout notes, posters, toasts) |
| `--lang-*` | 10 hues | language identity, re-tuned to enamel saturation (e.g. python `#4879a8`, css `#c25f8a`) |

Rules: text on dark ≥ `--bb-text-dim` for body, `--bb-text-faint` only for whispers; parchment blocks
always use `--bb-ink`; one garnet CTA per screen maximum (the ring walk).

**3D material extensions** (Blender character pipeline, not in the UI `:root`): leather `#6b4a2f` ·
pine mask `#cdb488` · rope `#96784f` · tusk `#e6ddc6` · war-paint `#8a3142` / `#e8e0cc`. Goblin iron
uses `--bb-iron` exactly; goblin lens glow is `--bb-gobble`. Promote to `:root` only when the UI needs them.

## Typography

| Token | Stack | Use |
|---|---|---|
| `--font-display` | Georgia, Iowan Old Style, Palatino, serif | titles, verdicts, nameplates, quotes |
| `--font-ui` | Segoe UI, system-ui | controls, body, labels |
| `--font-mono` | Cascadia/Consolas/JetBrains | numbers, records, triggers (`onGuard`) |

Fluid scale via `clamp()`: `--fs-hero` 1.7–2.6rem · `--fs-title` 1.25–1.7rem · `--fs-sub` · `--fs-body`
0.92–1rem · `--fs-small` · `--fs-tiny` 0.72rem. System stacks are deliberate (Devvit CSP + <1 s inline
budget); a bundled OFL display face (e.g., Fraunces) is an approved Gate-1 upgrade if measured affordable.

## Geometry, depth, texture

Radii `--r-sm/md/lg/pill` (6/10/16/999). Bevels: `--bevel-out` (raised plate), `--bevel-in` (recessed
channel) — every interactive surface gets one. Shadows `--shadow-1..3`. Texture = subtle radial rivet
dots on the body backdrop + parchment ruling lines; no image files.

## Motion — "weight & anticipation"

| Token | Value | Meaning |
|---|---|---|
| `--ease-spring` | `cubic-bezier(.28,1.4,.42,1)` | arrivals: modals, toasts, round numbers (slight overshoot) |
| `--ease-heavy` | `cubic-bezier(.2,.8,.2,1)` | movement of mass: screens, meters, lunges |
| `--t-fast/med/slow` | 140/260/420 ms | hover · component · screen |

Signature moves: buttons sink 2px on press (`0 3px 0` edge → `0 1px 0`); levers slide 3px; robots lunge
with anticipation frames (`lungeR/L`), hit-shake, KO fall (rotate 84°); impact stars; repair sparks.
`prefers-reduced-motion` collapses every animation/transition to ≤1 ms — verified in CSS.

## Component inventory (all in the prototype)

`plate` (riveted panel) · `parchment` · `btn` (brass / teal / garnet / ghost / big / small) · `badge`
(6 enamels) · `meter` (+warn/crit) · `pips` · `lever` (radio option row) · `lang-card` · `program-card`
· `slot` bay · `ticket` stub · `next-poster` (letterpress fight bill) · `frame` (lineage portrait) ·
`bout` map node · `rival-transmission` · fight kit (`arena`, `fight-hud`, `momentum`, `commentary`,
`call` with reason line, `intervene-veil`/`corner-card`) · `toast` · `token` (integrity) · tab rail.

States delivered per interactive component: default / hover / active / focus-visible (3px `--bb-focus`
ring) / disabled / selected (`aria-pressed`).

## Breakpoints

≤640 px phone (single column, icon-only tabs, 110 px robots) · 641–900 tablet (two-column collapses) ·
>900 desktop (max 1180 px shell). Touch targets ≥44 px height on all `btn`/`lever`/`tab`.
