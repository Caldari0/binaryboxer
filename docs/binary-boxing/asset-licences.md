# Asset Licence Manifest

_Last audited: 2026-07-16. Rule: nothing ships without a row here._

| Asset | Source | Licence | Commercial use |
|---|---|---|---|
| All UI/robot/enemy/arena art in `prototype/ux-prototype.html` | original, code-authored SVG/CSS this session | project licence (BSD-3-Clause repo) | ✅ |
| Iconography (nav, program chips, ornaments) | original inline SVG paths | project licence | ✅ |
| Fonts | system stacks only (Georgia/Palatino/Segoe UI/Consolas et al.) | user's OS licence — nothing bundled | ✅ |
| Repo baseline (`src/`, ASCII portraits) | Devvit React starter + owner's code | BSD-3-Clause (`LICENSE`, © 2025 Reddit Inc.) + owner's contributions | ✅ |
| Hero robot 3D model (`prototype/blender/bb-hero-gen1.blend`) | original, procedurally built in Blender 5.0.1 (2026-07-16 session) | project licence | ✅ |
| Hero probe renders (`prototype/blender/probe-renders/*.png`) | original renders of the above model; no external assets, HDRIs, or textures used | project licence | ✅ |
| Story plates (`prototype/blender/story-plates/*.png`) | original cel renders of our model; text set in OS-licensed Georgia (not embedded as a font file) | project licence | ✅ |
| Character library (`prototype/blender/bb-characters.blend`: hero + Gate-0 goblin clan — Barrow, Ranger, Guardian, Chief) + renders | original, procedurally built in Blender 5.0.1 (2026-07-16/17 sessions); no external assets | project licence | ✅ |
| Hero fight-pose batch (`prototype/blender/sprites/*.png` masters, `exports/*.webp`) — guard/lunge/hit/KO × L/R, lineage + gym portraits | original renders of our model via `scripts/hero-fight-poses.py`; no external assets | project licence | ✅ |
| Arena plate #1 The Boiler Club (`probe-renders/arena-boiler-club.png` master, `exports/arena-boiler-club.webp`) | original render of our `BB_Arena` set; no external assets | project licence | ✅ |
| Barrow fight-pose batch (`sprites/barrow-*.png`, `exports/barrow-*.webp`) — guard/lunge/hit/KO + full-bucket panic guard × L/R; bucket prop modelled | original renders via `scripts/barrow-fight-poses.py`; no external assets | project licence | ✅ |
| Other binary media (audio/video) | **none in repo** | — | — |

## Rules going forward

1. Bundled fonts: OFL/Apache only (e.g., Fraunces, Inter); record exact version + file here.
2. AI-generated imagery: record generator, prompt owner, and the service's commercial-use terms
   **before** committing; prefer style-consistent batches; never mimic a living artist by name.
3. Blender renders of our own models: original works — add a row, mark original.
4. Sketchfab/PolyHaven or other downloads: CC0 only without legal review; record URL + licence per item.
5. Sound (future): CC0 or paid-licence packs only; per-file rows required.
6. Reference boards for style study stay **out of the repo** (links in design notes only) — study,
   never trace or imitate a specific commercial game's interface.
