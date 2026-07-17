# Story Presentation — Grilled Decisions

> **⚠ Re-scoped 2026-07-17 by `product-split-decisions.md`:** the plate/beat system designed
> here is **standalone-era presentation** (Godot/Steam, where the T4 art lives). The schema
> reservation (`storybook {pending, read}`) and decisions #1–#2 (gate naming, gym-shaped
> records) stand; the Reddit game keeps at most light text beats in the editorial voice.

_2026-07-17 · owner grilling session (10 questions, all resolved) · governs how the story
canon is **presented in-game** (beats, plates, voice, state) and reconciles gate naming across
docs. Authority chain: story truth = `../binary-boxing/04-story-canon.md` · UI law =
`../binary-boxing/03-ux-and-visual-bible.md` + `design-tokens.md` · art law =
`../superpowers/specs/2026-07-16-blender-asset-pipeline-design.md` · mechanics =
`gym-pivot-decisions.md` over `binaryboxer-redesign-decisions.md` where they conflict._

## Resolved decisions

| # | Decision | Choice | Why |
|---|---|---|---|
| 1 | **Gate naming** | Gate 0 = engineering foundations (unchanged, per fable-build-loop). **Gate 1 = "The First Cup"** slice (replaces the old five-fight definition; same human playtest gate). Full market + 5-roster + remaining leaders → Gate 2 with the arc | Two docs had drifted into using "Gate 0" for the content slice; build-loop's approved stop-points win. Losing docs edited this commit |
| 2 | **Foundation schema shape** | **Gym-shaped v1 at Gate 0**: gym record (generation, lamps, prestige, scrap, staff-woken, storybook reservation) + fighter records (2 languages, growth sources, condition) + bouts keyed by gymId/fighterId, installation-scoped. Market/ransom/series *logic* stays Gate 1 | Grilled shapes are locked; re-scoping before real players is the cheapest it will ever be (audit risk #3); no throwaway single-fighter protocol |
| 3 | **Where the intro system is designed** | **Extend `prototype/ux-prototype.html`** in its own session, parallel to Gate 0 — beat reader, hub storybook, onboarding origin join the 9-screen journey | Prototype-first is owner-ratified precedent; one design surface (drift lesson); validates the wake moment's feel before Gate 1 commits |
| 4 | **Which moments get plates** | **Tiered by meaning.** Full multi-plate beats: wakes + Heart-Gauge transplant. Single plate + parchment: leader pre-series intros, scripted ransom offers. **Transmissions stay hologram** (dream vs woken visual split). Onboarding: abridged origin (3–4 pages, skippable); full book + earned pages re-readable at the hub storybook | Plates are the language of truth/warmth; the hologram keeps the Champion "still dreaming" until his unmasking. Bounded render load |
| 5 | **Beat voice** | **Book-voice hybrid**: storyteller narration + spoken lines (the book's register). Diegetic frame: each beat is a **new page written into the hearth storybook**; replay = rereading it | Preserves the read-aloud IP voice; direct address lives inside spoken lines; thematically answers "a story with nobody to tell it to" |
| 6 | **Per-player conditioning** | Text-only, three axes: (1) bout-winning fighter's name + **language epithet** (10-entry table authored once); (2) gym-fact inserts (gym name, generation, lamps when dramatic); (3) at most **one cast staff reaction line** per beat with a fallback. Champion taunts key on founding fighter's primary language + generation | Art never varies (production symmetry canon). Epithets buy per-player warmth everywhere for one table's cost; bounded QA |
| 7 | **Page grammar** | **Spread-13 page card**: portrait card, plate art top (~4:5), narration below on page ground, spoken lines bold. Tap/click anywhere advances; whole-text reveal (no typewriter); page-turn = weighty slide-and-settle, static swap under reduced-motion; ghost "read later" skip always visible. Caps: intros/ransoms 1 page · wakes 2–3 · transplant/origin 3–4 | The rendered spread already proved the anatomy; phone-first; insert-length safe; motion law #4 honoured |
| 8 | **Plate economy** | **Reuse-first**: bespoke renders only for wake-reveal plates (1/leader) + 1 shared hearth plate + ~2 transplant plates. Leader intros reuse gym-portrait targets over venue backdrops; origin reuses book art. Budget row added to pipeline spec: **plates ≤150 KB WebP @ 1080×1350 (2× display), lazy-loaded per beat, never preloaded** | First Cup incremental render cost ≈ 7 images; piggybacks on renders already planned |
| 9 | **Beat data & state** | **Content client-bundled** (typed, zod-validated, stable IDs e.g. `wake.barrow`, versioned with the app). **Read-state server-side on the gym record**: pending-beats queue written on server triggers + idempotent read-acknowledge (same command machinery as bouts). Gym schema v1 reserves `storybook: {pending, read}` | Beats are static content; cross-device continuity is non-negotiable on Reddit; schema slot now costs pennies, migration later costs a release |
| 10 | **Wake timing** | **Result → wake → debrief** (story before spreadsheet). Leader intro plays on series **acceptance**; storybook = third hub fixture; abridged origin fronts onboarding; transmissions League-anchored for First Cup | Payoff lands at peak emotion; numbers close the loop; same reader component reused for ransom wakes (no debrief) |

## Superseded (do not build from these)

- The pre-pivot grill resolutions of 2026-07-16 (manga-noir × Matrix framing, "no ally NPCs",
  VN text bar, `proto/story-intros` branch) — superseded by canon v2 + T4 + this log.
- The **retired /goal prompt** ("hero-conditioned manga-intro prototype on proto/story-intros")
  drafted before the gym pivot was read. Do not paste it; a replacement must be written from
  this log if a goal-style session is wanted.

## Deferred (not silently dropped)

- The 10-entry language epithet table (authoring; owner voice pass)
- **UX-prototype gym retrofit** — the 9-screen prototype predates the pivot (single fighter,
  integrity tokens, no roster/series). The extension session scopes the retrofit (lamps,
  roster board, series/League reshape) alongside the beat reader; not part of this grill
- Per-beat staff-line casting (author-time choice, made when beats are written)
- ~~In-world sport name~~ — resolved in parallel: **Bantam** (`bantam-decisions.md` #2)
- Transmission interrupt cadence beyond the League screen (Gate 2 tuning)
- Remaining origin pages beyond the abridged set (Gate 2, with the book's print pass)

## Handoffs

- **UX-prototype extension session** builds: beat-reader component (Spread-13 card grammar),
  hub storybook (fixture + reread), onboarding origin pages, template-insert engine
  (fighter/epithet/gym-facts/staff-line), skip/reread affordances, reduced-motion behaviour —
  using placeholder plate crops from `prototype/blender/story-plates/`.
- **Gate 0 session** consumes: gym/fighter/bout schema shapes (decision 2), the
  `storybook {pending, read}` reservation (decision 9), installation-scoped keys — plus
  **cross-user-readable gym snapshots** (`bantam-decisions.md` #8, the only Gate 0 cost taken
  for future async raids).
- **Boundary with Bantam #3:** its "cinematic plates" for KOs belong to the sprite-theatre
  fight-spectacle layer, not this narrative-beat list; wake and leader-intro plates are shared
  by both layers (one render serves both).
- **Blender track** consumes: the reuse-first render list (decision 8) — wake-reveal plates
  ride the per-character render targets already in the pipeline spec §5.
