# Blender Track — Queue & Pose Sheets

_2026-07-17 · the art lane's working queue (lane split per `story-presentation-decisions.md`
§Handoffs; scope per `bantam-decisions.md` #9). Designed on paper here so Blender sessions
execute instead of deciding. Recipes are law: characters = T4, environments = storybook stage,
page finish = `scripts/storybook-post.py` (all in the pipeline spec)._

## State (done ✅ / next ⬜)

- ✅ Characters: hero + Barrow + Ranger + Guardian + Chief, kit collections, per-collection linesets
- ✅ Fight poses: hero (guard/lunge/hit/KO ×L/R) · Barrow (same + **full-bucket** ×L/R)
- ✅ Portraits, lineups, Boiler Club plate (storybook recipe locked), all WebP under budget
- ⬜ 1. Living-corner reaction poses (below)
- ⬜ 2. First Cup story plates ×7 (below)
- ⬜ 3. Fight poses for Ranger/Guardian/Chief (needed when their series unlock in the slice)
- ⬜ 4. Props batch: integrity-token coin, work-lamp vignette, poster elements (bucket ✅ built)
- ⬜ 5. Venues 2–4 (post-slice)

## 1. Living-corner reaction poses (bantam #4 — bench presence)

Three stills per chassis (idle / cheer / flinch), CSS crossfades between them; flinch doubles as
a scouting surface (the bench telegraphs). Scripted like the fight poses (targets via aim_arm,
snapshot in driver namespace, new script per character or extend existing).

| Chassis | idle | cheer | flinch |
|---|---|---|---|
| Hero (Pekoe) | mitts down, slight weight shift, needle mid-sway | both mitts up, lid-hop (lid +0.04 z, bell tilt) | shrink 3%, mitts pulled to the Heart-Gauge |
| Barrow | **polishes the bucket** (bucket at chest, wrap arm curled over it) | bucket raised overhead like a cup | **half-bucket** — bucket tipped onto head, one eye still visible (escalation toward his in-fight full-bucket) |
| Ranger | scope-scan: head yaw 15°, scope glint on | flag drawn from tube, waved overhead | hood yanked down over the scope |
| Guardian | leans on wheel like a resting shield | wheel raised + free fist thumps chest | **full turtle** — head sinks completely behind the mask into the torso |
| Chief | arms crossed, bell swaying on its hook | rings the bell (boom dips, clapper offset) | counterweight rocks back, mask dips — the boss *notices* |

Render setup: same transparent sprite mode as fight poses, both facings, 384 px WebP, ≤80 KB,
one licence row for the batch. Barrow's bucket prop already exists (`Gob_Bucket*`, hidden).

## 2. First Cup story plates ×7 (story-presentation #8, reuse-first)

All: storybook-stage recipe + Spread-13 page grammar, portrait 1080×1350, page-finish pass,
**≤150 KB WebP, lazy-loaded**. Wake plates serve both the beat reader and the sprite-theatre
KO/wake layer (one render, two duties).

| # | Plate | Content notes |
|---|---|---|
| 1 | `wake.barrow` | Kit hidden mid-swap (mask half-lifted), hearth light, the bucket held out — his one request |
| 2 | `wake.ranger` | Hood back, scope bare, a map unrolled at his feet — he finally knows where he is |
| 3 | `wake.guardian` | Mask lowered, wheel set down flat like a laid-down shield |
| 4 | `wake.chief` | Crest off, bell in open palm — the fixture-master offers his bell to the gym |
| 5 | `hearth` | The fireside cup wall — one teacup per woken friend, warm, close |
| 6 | `transplant.1` | The Heart-Gauge unscrewed from a fallen chassis — held gently, needle at rest |
| 7 | `transplant.2` | The gauge set into the new founding fighter — needle flutters awake |

Leader pre-series intros need **no new renders** (reuse gym portraits over venue plates).

## Session-start ritual (any Blender session)

Open `bb-characters.blend` → MCP Running → clear stale snapshots
(`del bpy.app.driver_namespace[k]` for `_bb_pose_snap`/`_bb_barrow_snap`) → work the queue top-down
→ save → pathspec-limited commits only (other lanes share the tree).
