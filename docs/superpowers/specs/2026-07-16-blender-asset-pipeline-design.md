# Blender Asset Pipeline & Character IP — Design Spec

_Date: 2026-07-16 · Status: probe complete, art direction locked (T4) · Owner: Rudolph_
_Evidence: `prototype/blender/probe-renders/` · Source model: `prototype/blender/bb-hero-gen1.blend`_

## 1. Purpose

Replace the prototype's code-authored SVG placeholder art (visual bible §7) with **original,
Blender-rendered assets** that serve two masters:

1. **The game** — Devvit client cannot run WebGL/canvas, so all Blender output ships as
   pre-rendered stills (WebP) slotted into the existing CSS-animated layout ("slot-in, same
   layout", visual bible §6).
2. **The IP** — the owner intends a **children's book** around this character. Models are built
   and rendered at print-capable quality; the character is designed as book-first IP, not a
   game sprite.

Everything modelled in-house is an original work (licence manifest rule 3). No Sketchfab unless
CC0; AI generators (Hyper3D/Hunyuan) are opt-in later and gated by manifest rule 2.

## 2. The hero — character definition (locked at probe)

A small, plucky **boiler-bot boxer**. Underdog proportions: round kettle-boiler body-as-head,
short sturdy legs, slim arms, oversized boxing mitts.

| Element | Locked design |
|---|---|
| Body | Jewel-teal enamel boiler (player-identity colour), brass belt band, sparse chunky rivets |
| Lid | Teapot lid with brass rim — the head reads "kettle" instantly |
| Crown | **Jester's bell** finial: brass, cross-slit lower hemisphere, copper clapper glimpsed inside, collar ring at the neck (owner-specified signature detail) |
| Face | Amber lamp-eyes in brass rims + small brass brow tabs. No mouth — the gauge is the expressive element |
| Chest | **The Heart-Gauge** — brass bezel, glass dome, ivory dial with ink tick marks, garnet needle |
| Mitts | Oversized deep-garnet (gloves are canonically garnet per design tokens) |
| Feet | Copper boots with brass toe-caps |
| Spout | Side-mounted stubby spout with brass rim (origin-story canon: the steam-whistle punch tell; the front stays face + gauge) |

**Identity system ("not one entity"):** the character changes with events; each dynasty
generation is a genuinely new robot (new face, new build). Recognition is carried by the
**signature token = the Heart-Gauge**, which is simultaneously:
- the **physical heirloom vessel** — unscrewed from a fallen generation, set into the next
  (gives the existing heirloom-program mechanic a body and a ritual);
- an **emotion channel** — the needle flutters/climbs/drops with the robot's state;
- **diegetic UI** — the in-game condition meter and the character's body are the same fact.

Detail discipline: Ghibli-machine restraint — few, large, deliberate details; clean front
(face + gauge); never greebled.

## 3. The enemies — robot-goblin clan (owner lore, 2026-07-16)

Storyline: the player's robot boxer fights other robot AIs **pretending to be a goblin clan**.
Ranks (9): goblin, goblin chief, goblin paladin, goblin guardian, goblin knight, goblin ranger,
goblin shaman, goblin lord, goblin champion. Each class **talks, fights, and looks different**.

Visual system: **two-layer design** — robot chassis underneath, goblin dress-up on top (carved
masks, scrap-leather armour, welded-on tusks). The pretense must show: a glowing lens eye
through the mask's eyehole, panel seams under war paint, a bolt where an earring should be.
Production economics: one goblin base body + a gear kit per rank (same modular logic as the
hero's enamel swaps).

Mechanics mapping: ranks give faces/voices to the redesign's **archetypes-with-variants**;
class names are flavour and may appear on fight bills — scouting evidence stays behavioural
(redesign decision #4). The First Cup slice (**Gate 1** — naming reconciled 2026-07-17,
`docs/plans/story-presentation-decisions.md` #1) needs ~3 ranks + 1 phased boss (chief); the
clan grows later.

Full story canon: `docs/binary-boxing/story/the-pot-who-kept-nothing.md` (origin story,
draft 2). Wake mechanic + corner-crew unlock system + fireside-cups meta-progress:
`docs/binary-boxing/04-story-canon.md`. The **Champion** (never unmasked) is the league's
recurring rival; every defeated goblin wakes permanently and joins the corner.

## 4. Art direction — LOCKED: T4 "lacquered storybook"

Target: Ni no Kuni (Wrath of the White Witch) charm × Octopath Traveler 0 HD-2D staging.
Chosen by the owner from a 4-way shootout of the same model (see `probe-renders/`):
T1 painted miniature · T2 storybook cel · T3 soft hybrid · **T4 = T1's lacquered dimension +
T2's illustration language**. T2's cel recipe is retained for future book/print plates.

**T4 recipe (authoritative values, Blender 5.0.1, EEVEE):**

- View transform: **Khronos PBR Neutral** (never AgX — it desaturates jewel enamels to salmon)
- Materials (Principled): teal enamel rough 0.26 / coat 0.35; garnet rough 0.62; brass metallic
  rough 0.32; copper metallic rough 0.38. **Illustrative self-lift**: Emission Color = own base
  colour, strength 0.18 (enamels), 0.10–0.15 (copper/ivory). Amber eyes: emission 3.2
- Ink line: Freestyle, one lineset per character collection (`select_by_collection`, INCLUSIVE):
  `BB_Lines`→`BB_Hero`, `BB_GobLines`→`BB_Goblin`; colour `#3a2a1c`, thickness 2.2 px @ 1080×1350
- Lights: warm key area 1.1 m ~95 W (1.0, 0.86, 0.70); cool fill 22 W; amber rim 130 W;
  warm pool spot on backdrop ~140 W
- World: `#1f150c` strength 1.15
- Post: Glare **Bloom** (threshold 1.3, strength 0.3); DoF f/1.8 (tilt-shift miniature);
  camera 52 mm, slightly low 3/4 hero angle
- Staging: warm gradient backdrop + out-of-focus workshop props (pipe, ring) at diorama depth

**Palette contract:** all colours come from `design-tokens.md` (teal `#2b8c82` family, garnet,
brass `#c9963f`, copper `#b87352`, amber `#ffb84d`, ivory `#f2e4c8`, ink `#2b2118`); language
identity later maps the 10 `--lang-*` hues onto enamel materials. Goblin additions are recorded
there too: `--bb-gobble` `#b5cc4e` (Gobblestone lens glow, the enemy counterpart to amber) and the
3D material extensions (leather/pine/rope/tusk/war-paint). Enamel bases may sit slightly under
token value so that base + illustrative self-lift *reads* on-token in the final image.

## 5. Pipeline mechanics

- **Authoring**: procedural `bpy` scripts via Blender MCP; every part is a named object in the
  `BB_Hero` collection → parts and materials swap cleanly (events, generations, languages).
- **Kit convention (canon §6 wake swap)**: each goblin's costume parts are *linked* into a
  `BB_<Name>Kit` child collection while remaining in the character collection (keeps Freestyle's
  `select_by_collection` untouched). Woken form = hide the kit collection, add livery + signature
  tool. Chassis-betraying details (bolt-earring, panel seams, lens) stay on the chassis.
- **Source of truth**: `.blend` files under `prototype/blender/` during Gate 0 prototyping
  (production home decided in the implementation plan).
- **Output**: PNG masters → WebP for the client. Budget (inline <1 s, Lighthouse >80):
  portraits target ≤80 KB exported at 2× their largest in-game display size (measured at
  integration); arena backdrops ≤200 KB; **story plates ≤150 KB WebP @ 1080×1350** (2× display,
  lazy-loaded when a beat triggers, never preloaded at boot — decisions log #8); verify sizes
  at every export.
- **Render targets per character**: gym portrait, lineage-frame portrait, fight-pose L/R pair,
  and a 4K book-quality still. Fight sprites remain single images animated by existing CSS
  transforms (no spritesheets in Gate 0).
- **Licensing**: one manifest row per render batch in `docs/binary-boxing/asset-licences.md`
  (original works). PolyHaven CC0 allowed for HDRI/textures with per-item rows.

## 6. Blender 5.0.1 API notes (hard-won during the probe)

- Default view transform is AgX → set `Khronos PBR Neutral` per scene.
- Compositor: `scene.node_tree` is gone → `scene.compositing_node_group` + `NodeGroupOutput`
  (interface socket created via `ng.interface.new_socket`).
- Glare node options are **input sockets**; menu sockets take human-readable strings
  (`'Bloom'`, `'High'`).
- `bpy.ops.object.shade_auto_smooth()` is unreliable under `temp_override` → set
  `use_smooth` via `foreach_set` instead.
- Principled sockets: "Coat Weight", "Transmission Weight", "Emission Color/Strength".

## 7. Asset inventory & order of production (input to the implementation plan)

1. ~~Hero gen-1 model + T4 art direction~~ ✅ probe complete
2. ~~**Goblin grunt** (basic rank) in T4 — validates the two-design-language world~~ ✅ built as
   **Barrow** (canon rank 1, `bb-characters.blend` `BB_Goblin`): pine mask with lens through the
   eyehole, welded tusks, bolt-earring, war paint crossing the torso seam; goblin kit isolated in
   the linked `BB_GoblinKit` collection so the wake swap = hide kit (+ later livery/tool). Evidence:
   `probe-renders/goblin-barrow-v2.png`, duo validation `probe-renders/duo-fight-bill.png`
3. ~~Hero fight poses (guard/lunge/hit/KO) + portrait crops → WebP export pass~~ ✅ scripted,
   rig-free posing (`scripts/hero-fight-poses.py`, non-destructive world-matrix transforms;
   guard = peek-a-boo over the Heart-Gauge): 4 poses × L/R facing on transparent film +
   lineage head portrait + gym portrait. Masters in `sprites/`, WebP in `exports/` —
   every file 7.8–9.6 KB at 384/256 px (budget ≤80 KB). Facing pair is true 3/4 renders,
   not mirrors: left-facing shows the spout (the punch tell) to the opponent
4. ~~Two more goblin ranks (one defensive, one tricky)~~ ✅ **Ranger/Waymark** (tricky,
   `BB_Ranger` + kit + lineset): stilt legs on spike feet, telescope eye under the hood,
   map-tube "quiver" with marker flags, chevron trail-mark paint crossing the seam — evidence
   `probe-renders/goblin-ranger.png`. **Guardian/Bulwark** (defensive, `BB_Guardian` + kit +
   lineset): riveted wall torso, rope-bound, slit-visor turtle head, sluice **handwheel worn
   as a shield** (his future Hold-the-Door emblem), anchor feet — evidence
   `probe-renders/goblin-guardian.png`. Full Gate-0 roster: `probe-renders/first-cup-clan.png`.
   + ~~**goblin chief** (phased boss)~~ ✅ Chief
   built (`BB_Chief`, kit in linked `BB_ChiefKit`, own Freestyle lineset): Foreman-crane chassis
   truth (crawler tracks, brass slewing ring, counterweight, cab head, shoulder boom whose hook
   carries the **series bell** — his future fixture-master tool), chief regalia (wide mask with
   visor slit, four tusks, metal-feather war crest, mantle, trophy rope with a **stolen teacup**),
   paint over the chest seam, twin bolt-earrings. Evidence: `probe-renders/goblin-chief.png`,
   `probe-renders/first-series-lineup.png`. Staging note for boss-scale subjects: big flat panels
   catch an axial key at full incidence — raise/steepen the key, trim key/fill (~70 W / 10 W),
   and aim the key at the chest; recipe values stay canonical for hero-scale shots
5. ~~Arena backdrop #1 (The Boiler Club)~~ ✅ built (`BB_Arena`, own stage at x=6 with
   practical lights — hanging work lamps + porthole fire lights; house pressure-gauge echoes
   the Heart-Gauge motif). Plate master `probe-renders/arena-boiler-club.png` (1800×600),
   export `exports/arena-boiler-club.webp` 30.8 KB (budget ≤200 KB) → then remaining three venues
6. Rival transmission portrait
7. **Story plates** (reuse-first — `docs/plans/story-presentation-decisions.md` #4/#8): one
   wake-reveal plate per leader (the mask-off moment; kit-hide over the existing chassis) +
   **one shared hearth plate** (cups by the fire — reused by every wake/rescue with
   per-character text) + ~2 transplant plates. Leader intro pages reuse gym portraits over
   venue backdrops; origin pages reuse the book's plates (no new renders)
8. Props: gym lamps (integrity — lamps replaced tokens, gym-pivot #8), work-lamp onboarding
   vignette, poster elements, **Barrow's bucket** (sacred regalia + his full-bucket
   panic-guard tell — canon doc §3)

## 8. Out of scope (this spec)

Rigging/skeletal animation and multi-frame spritesheets; audio; AI-generated geometry
(manifest-gated); production client integration details (Gate 1 concern); naming the hero
(player-named in game; book name is the owner's call).

## 9. Verification

Every render batch is checked against §4's recipe values (transform, line, lights, bloom, DoF),
against the palette contract (§4), and against the export weight budget (§5) before a licence
row is added and the asset is considered shippable.
