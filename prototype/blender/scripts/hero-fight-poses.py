"""Hero fight poses — guard / lunge / hit / KO, facing-left + facing-right pair.

Pipeline spec item 3 (docs/superpowers/specs/2026-07-16-blender-asset-pipeline-design.md).
Run inside prototype/blender/bb-characters.blend via Blender MCP:

    G = {}
    exec(compile(open(r"<this file>").read(), "hero-poses", "exec"), G)
    G["render_facing"]("right")   # 4 sprite masters
    G["render_facing"]("left")    # 4 sprite masters
    G["render_lineage"]()         # lineage-frame portrait master
    G["export_webp"]()            # PNG masters -> WebP at 2x display size
    G["restore_all"]()            # put the scene back exactly as found

Posing is non-destructive: every BB_Hero matrix_world (+ camera, render settings,
eye emission) is snapshotted on load and restored between/after renders.
No rig (spec §8): poses are per-part world-matrix transforms around fixed pivots.
Sprites render with transparent film, DoF off, diorama/goblin/ground hidden;
T4 materials, lights and Freestyle ink stay on.
"""

import bpy, math, os
from mathutils import Matrix, Vector

D = bpy.data
S = bpy.context.scene

BLEND_DIR = os.path.dirname(bpy.data.filepath)
SPRITES = os.path.join(BLEND_DIR, "sprites")
EXPORTS = os.path.join(BLEND_DIR, "exports")
os.makedirs(SPRITES, exist_ok=True)
os.makedirs(EXPORTS, exist_ok=True)

HERO = D.collections["BB_Hero"]
ARM_L = ["Shoulder_L", "Arm_L", "Cuff_L", "Mitt_L"]
ARM_R = ["Shoulder_R", "Arm_R", "Cuff_R", "Mitt_R"]
LID = ["LidCap", "LidRim", "LidRivet_0", "LidRivet_1",
       "FinialStem", "JesterBell", "BellClapper", "BellCollar"]
LEGS = ["Leg_L", "Leg_R", "Foot_L", "Foot_R", "ToeCap_L", "ToeCap_R"]
STATIC = set(LEGS) | {"Ground"}
BODY = [o.name for o in HERO.objects if o.name not in STATIC]

SH_L = (-0.488, -0.015, 0.405)   # shoulder pivots
SH_R = (-0.072, -0.015, 0.405)
HUB = (-0.28, -0.216, 0.265)     # gauge needle pivot (dial hub)
LIDP = (-0.28, 0.0, 0.512)       # lid pivot
BELT = (-0.28, 0.0, 0.315)       # body lean pivot
CTR = (-0.28, 0.0, 0.34)         # body twist pivot
REST_NEEDLE = 0.61               # needle rest angle on the dial arc (±0.87)

# ---------- snapshot / restore ----------
# The rest-state snapshot lives in the driver namespace so RE-RUNNING this file
# never re-snapshots a posed scene as "rest" (poses would compound). After an
# intentional model change, clear it:  del bpy.app.driver_namespace["_bb_pose_snap"]


def _amber_strength():
    n = next(n for n in D.materials["BB_AmberGlow"].node_tree.nodes
             if n.type == 'BSDF_PRINCIPLED')
    return n.inputs["Emission Strength"]


def _take_snapshot():
    return {
        "mats": {o.name: o.matrix_world.copy() for o in HERO.objects},
        "cam": (D.objects["BB_Cam"].matrix_world.copy(),
                D.objects["BB_Cam"].data.dof.use_dof),
        "res": (S.render.resolution_x, S.render.resolution_y),
        "film": S.render.film_transparent,
        "hide": {},
        "amber": _amber_strength().default_value,
    }


_NS = bpy.app.driver_namespace
_SNAP = _NS.get("_bb_pose_snap") or _take_snapshot()
_NS["_bb_pose_snap"] = _SNAP


def restore_pose():
    for name, m in _SNAP["mats"].items():
        D.objects[name].matrix_world = m.copy()
    _amber_strength().default_value = _SNAP["amber"]


def restore_all():
    restore_pose()
    cam = D.objects["BB_Cam"]
    cam.matrix_world = _SNAP["cam"][0].copy()
    cam.data.dof.use_dof = _SNAP["cam"][1]
    S.render.resolution_x, S.render.resolution_y = _SNAP["res"]
    S.render.film_transparent = _SNAP["film"]
    for name, flag in _SNAP["hide"].items():
        (D.collections[name] if name in D.collections else D.objects[name]).hide_render = flag
    print("scene restored")


# ---------- transform helpers ----------

def _rot(names, pivot, axis, ang):
    p = Vector(pivot)
    M = Matrix.Translation(p) @ Matrix.Rotation(ang, 4, axis) @ Matrix.Translation(-p)
    for n in names:
        D.objects[n].matrix_world = M @ D.objects[n].matrix_world


def _mov(names, dv):
    M = Matrix.Translation(Vector(dv))
    for n in names:
        D.objects[n].matrix_world = M @ D.objects[n].matrix_world


def _needle(target):
    _rot(["GaugeNeedle"], HUB, 'Y', target - REST_NEEDLE)


# ---------- the four poses (applied from rest; order matters:
#            needle/lid/arms first, body lean last so parts ride it) ----------

# NOTE: rest stance already carries the arms ~66 deg forward of straight-down
# (mitts-forward idle), so these X deltas are small.

def pose_guard():
    # peek-a-boo guard: mitts squeeze together over the Heart-Gauge,
    # eyes stay visible above the glove line
    _needle(0.20)
    _rot(ARM_L, SH_L, 'X', -0.10); _mov(ARM_L, (0.115, -0.04, -0.01))
    _rot(ARM_R, SH_R, 'X', -0.10); _mov(ARM_R, (-0.115, -0.04, -0.01))
    _rot(BODY, BELT, 'X', 0.10); _mov(BODY, (0, 0, -0.012))


def pose_lunge():
    _needle(0.45)
    _rot(ARM_R, SH_R, 'X', -0.70); _mov(ARM_R, (0, -0.17, 0.0))    # piston extend
    _rot(ARM_L, SH_L, 'X', -0.35); _mov(ARM_L, (0.10, 0, 0.04))    # tuck to cheek
    _rot(BODY, BELT, 'X', 0.20); _rot(BODY, CTR, 'Z', -0.26)


def pose_hit():
    _needle(-0.85)
    _rot(LID, LIDP, 'X', -0.12); _mov(LID, (0, 0.01, 0.05))        # lid pop
    _rot(ARM_L, SH_L, 'X', -1.05); _rot(ARM_L, SH_L, 'Z', 0.35)    # flail up-out
    _rot(ARM_R, SH_R, 'X', 0.45); _rot(ARM_R, SH_R, 'Z', -0.30)    # drop back
    _rot(BODY, BELT, 'X', -0.18); _rot(BODY, CTR, 'Z', 0.10)


def pose_ko():
    _needle(-0.87)
    _rot(LID, LIDP, 'X', -0.08); _mov(LID, (0, 0, 0.02))
    _rot(ARM_L, SH_L, 'X', 0.75); _rot(ARM_L, SH_L, 'Y', 0.28)     # slack hang
    _rot(ARM_R, SH_R, 'X', 0.75); _rot(ARM_R, SH_R, 'Y', -0.28)
    _rot(BODY, BELT, 'X', 0.24); _rot(BODY, CTR, 'Z', 0.10)
    _mov(BODY, (0, 0, -0.03))
    _amber_strength().default_value = 0.35                          # eyes dim


POSES = {"guard": pose_guard, "lunge": pose_lunge, "hit": pose_hit, "ko": pose_ko}


# ---------- camera + sprite render settings ----------

def set_cam(facing, dist=2.05, az=0.85, h=0.52, tgt=(-0.28, -0.03, 0.36)):
    """facing='right' -> hero points screen-right (camera on his front-left)."""
    cam = D.objects["BB_Cam"]
    sx = 1.0 if facing == "left" else -1.0
    pos = Vector((CTR[0] + sx * dist * math.sin(az), -dist * math.cos(az), h))
    cam.location = pos
    cam.rotation_mode = 'QUATERNION'
    cam.rotation_quaternion = (Vector(tgt) - pos).to_track_quat('-Z', 'Y')
    cam.data.dof.use_dof = False


def _sprite_mode(on):
    hides = {"BB_Goblin": True, "BB_Diorama": True,
             "Ground": True, "ContactShadow": True}
    for name, flag in hides.items():
        thing = D.collections[name] if name in D.collections else D.objects[name]
        if name not in _SNAP["hide"]:
            _SNAP["hide"][name] = thing.hide_render
        thing.hide_render = flag if on else _SNAP["hide"][name]
    S.render.film_transparent = on if on else _SNAP["film"]
    if on:
        S.render.resolution_x = S.render.resolution_y = 1024
    else:
        S.render.resolution_x, S.render.resolution_y = _SNAP["res"]


def render_facing(facing):
    _sprite_mode(True)
    set_cam(facing)
    done = []
    for name, fn in POSES.items():
        restore_pose()
        fn()
        S.render.filepath = os.path.join(SPRITES, f"hero-{name}-{facing}.png")
        bpy.ops.render.render(write_still=True)
        done.append(S.render.filepath)
    restore_pose()
    print("rendered:", *done, sep="\n  ")


def render_lineage():
    """Head-and-shoulders portrait for the lineage frame — diorama on, DoF on,
    goblin hidden (he photobombs close-ups), slightly high angle so the rest-pose
    mitts stay out of frame."""
    restore_pose()
    _rot(ARM_L, SH_L, 'X', 0.45)   # drop mitts to the sides so the
    _rot(ARM_R, SH_R, 'X', 0.45)   # face + Heart-Gauge own the frame
    _sprite_mode(False)
    if "BB_Goblin" not in _SNAP["hide"]:
        _SNAP["hide"]["BB_Goblin"] = D.collections["BB_Goblin"].hide_render
    D.collections["BB_Goblin"].hide_render = True
    cam = D.objects["BB_Cam"]
    tgt = Vector((-0.28, -0.02, 0.44))
    pos = Vector((-0.28 + 0.30, -0.92, 0.64))
    cam.location = pos
    cam.rotation_mode = 'QUATERNION'
    cam.rotation_quaternion = (tgt - pos).to_track_quat('-Z', 'Y')
    cam.data.dof.use_dof = True
    cam.data.dof.focus_object = D.objects["Body"]
    S.render.resolution_x = S.render.resolution_y = 1024
    S.render.filepath = os.path.join(SPRITES, "hero-lineage.png")
    bpy.ops.render.render(write_still=True)
    D.collections["BB_Goblin"].hide_render = _SNAP["hide"]["BB_Goblin"]
    print("rendered:", S.render.filepath)


# ---------- WebP export pass (masters -> 2x display size) ----------

def export_webp(sprite_px=384, lineage_px=256):
    report = []
    for f in sorted(os.listdir(SPRITES)):
        if not f.endswith(".png"):
            continue
        img = D.images.load(os.path.join(SPRITES, f), check_existing=False)
        target = lineage_px if "lineage" in f else sprite_px
        scale = target / max(img.size)
        img.scale(max(1, round(img.size[0] * scale)), max(1, round(img.size[1] * scale)))
        img.file_format = 'WEBP'
        out = os.path.join(EXPORTS, f[:-4] + ".webp")
        img.filepath_raw = out
        img.save()
        D.images.remove(img)
        kb = os.path.getsize(out) / 1024
        report.append(f"{os.path.basename(out)}  {kb:.1f} KB")
    print("\n".join(report))
