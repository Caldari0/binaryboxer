"""Barrow fight poses — guard / lunge / hit / KO / full-bucket, facing-left + right.

Blender-track queue item 1 (bantam-decisions #9; story-presentation handoffs).
Run inside prototype/blender/bb-characters.blend via Blender MCP:

    G = {}
    exec(compile(open(r"<this file>").read(), "barrow-poses", "exec"), G)
    G["render_facing"]("right"); G["render_facing"]("left")
    G["export_webp"]()
    G["restore_all"]()

Same non-destructive pattern as hero-fight-poses.py (snapshot in the driver
namespace survives re-runs; clear with `del bpy.app.driver_namespace["_bb_barrow_snap"]`
after intentional model edits). New here: poses are defined by FIST TARGETS via
aim_arm() — the arm group rotates about the shoulder so the fist lands on the
target direction at fixed arm length — instead of hand-tuned euler deltas.

The "bucket" pose is Barrow's canon panic-guard tell (canon §3): the bucket prop
(Gob_Bucket*) is hidden by default and shown only for this pose.
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

GOB = D.collections["BB_Goblin"]
ARM_L = ["Gob_Shoulder_L","Gob_Pad_L","Gob_UpperArm_L","Gob_Elbow_L","Gob_Forearm_L",
         "Gob_Fist_L","Gob_Wrap_L","Gob_KnuckleWrap_L"]
ARM_R = ["Gob_Shoulder_R","Gob_Pad_R","Gob_UpperArm_R","Gob_Elbow_R","Gob_Forearm_R",
         "Gob_Fist_R","Gob_Wrap_R","Gob_KnuckleWrap_R"]
HEAD = ["Gob_Neck","Gob_Head","Gob_LensSocket","Gob_Lens","Gob_BoltEar","Gob_BoltWasher",
        "Gob_Mask","Gob_Tusk_L","Gob_TuskWeld_L","Gob_Tusk_R","Gob_TuskWeld_R",
        "Gob_Paint1","Gob_Paint2","Gob_PaintW"]
BUCKET = ["Gob_Bucket","Gob_BucketRim","Gob_BucketHandle"]
LEGS = ["Gob_Leg_L","Gob_Foot_L","Gob_Toe_L","Gob_Leg_R","Gob_Foot_R","Gob_Toe_R"]
BODY = [o.name for o in GOB.objects if o.name not in set(LEGS) | set(BUCKET)]

SH_L = Vector((0.27, 0.10, 0.78))
SH_R = Vector((0.75, 0.10, 0.78))
FIST_L = Vector((0.195, -0.185, 0.415))
FIST_R = Vector((0.825, -0.185, 0.415))
NECK = (0.51, 0.08, 0.80)
BELT = (0.51, 0.12, 0.42)
CTR = (0.51, 0.12, 0.60)

# ---------- snapshot / restore ----------

def _lens_strength():
    n = next(n for n in D.materials["BB_GobbleGlow"].node_tree.nodes
             if n.type == 'BSDF_PRINCIPLED')
    return n.inputs["Emission Strength"]


def _take_snapshot():
    return {
        "mats": {o.name: o.matrix_world.copy() for o in GOB.objects},
        "cam": (D.objects["BB_Cam"].matrix_world.copy(),
                D.objects["BB_Cam"].data.dof.use_dof, D.objects["BB_Cam"].data.lens),
        "res": (S.render.resolution_x, S.render.resolution_y),
        "film": S.render.film_transparent,
        "hide": {},
        "bucket_hide": {n: (D.objects[n].hide_render, D.objects[n].hide_viewport) for n in BUCKET},
        "lens": _lens_strength().default_value,
    }


_NS = bpy.app.driver_namespace
_SNAP = _NS.get("_bb_barrow_snap") or _take_snapshot()
_NS["_bb_barrow_snap"] = _SNAP


def restore_pose():
    for name, m in _SNAP["mats"].items():
        D.objects[name].matrix_world = m.copy()
    _lens_strength().default_value = _SNAP["lens"]
    for n in BUCKET:
        D.objects[n].hide_render, D.objects[n].hide_viewport = _SNAP["bucket_hide"][n]


def restore_all():
    restore_pose()
    cam = D.objects["BB_Cam"]
    cam.matrix_world = _SNAP["cam"][0].copy()
    cam.data.dof.use_dof = _SNAP["cam"][1]
    cam.data.lens = _SNAP["cam"][2]
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


def aim_arm(side, target, extend=(0, 0, 0)):
    """Rotate the whole arm group about the shoulder so the fist points at
    `target` (arm length fixed), then optionally piston-translate by `extend`."""
    sh, fist, group = (SH_L, FIST_L, ARM_L) if side == "L" else (SH_R, FIST_R, ARM_R)
    u = (fist - sh).normalized()
    v = (Vector(target) - sh).normalized()
    axis = u.cross(v)
    if axis.length < 1e-6:
        return
    ang = math.acos(max(-1.0, min(1.0, u.dot(v))))
    p = Vector(sh)
    M = Matrix.Translation(p) @ Matrix.Rotation(ang, 4, axis.normalized()) @ Matrix.Translation(-p)
    for n in group:
        D.objects[n].matrix_world = M @ D.objects[n].matrix_world
    if extend != (0, 0, 0):
        _mov(group, extend)


def show_bucket(on):
    for n in BUCKET:
        D.objects[n].hide_render = not on
        D.objects[n].hide_viewport = not on


# ---------- the five poses ----------

def pose_guard():
    aim_arm("L", (0.36, -0.26, 0.83))
    aim_arm("R", (0.66, -0.26, 0.83))
    _rot(BODY, BELT, 'X', 0.08); _mov(BODY, (0, 0, -0.02))


def pose_lunge():
    aim_arm("R", (0.72, -0.55, 0.70), extend=(0, -0.10, 0))
    aim_arm("L", (0.42, -0.26, 0.78))
    _rot(BODY, BELT, 'X', 0.16); _rot(BODY, CTR, 'Z', -0.22)


def pose_hit():
    aim_arm("L", (0.16, -0.16, 1.05))
    aim_arm("R", (0.90, -0.08, 0.45))
    _rot(HEAD, NECK, 'X', -0.20)
    _rot(BODY, BELT, 'X', -0.16); _rot(BODY, CTR, 'Z', 0.08)


def pose_ko():
    aim_arm("L", (0.20, 0.05, 0.33))
    aim_arm("R", (0.82, 0.05, 0.33))
    _rot(HEAD, NECK, 'X', 0.35)
    _rot(BODY, BELT, 'X', 0.20); _rot(BODY, CTR, 'Z', 0.08)
    _mov(BODY, (0, 0, -0.04))
    _lens_strength().default_value = 0.4          # lens-eye dims


def pose_bucket():
    """Canon panic guard: bucket over the head, mitts clutching its sides."""
    show_bucket(True)
    aim_arm("L", (0.33, -0.28, 1.00))
    aim_arm("R", (0.69, -0.28, 1.00))
    _rot(BODY, BELT, 'X', -0.08); _mov(BODY, (0, 0, -0.03))
    # bucket + head ride the body lean applied after, so cower with the body:
    _rot(BUCKET, BELT, 'X', -0.08); _mov(BUCKET, (0, 0, -0.03))


POSES = {"guard": pose_guard, "lunge": pose_lunge, "hit": pose_hit,
         "ko": pose_ko, "bucket": pose_bucket}


# ---------- camera + sprite render settings ----------

def set_cam(facing, dist=2.5, az=0.85, h=0.62, tgt=(0.51, -0.03, 0.58)):
    cam = D.objects["BB_Cam"]
    cam.data.lens = 52
    sx = 1.0 if facing == "left" else -1.0
    pos = Vector((CTR[0] + sx * dist * math.sin(az), CTR[1] - dist * math.cos(az), h))
    cam.location = pos
    cam.rotation_mode = 'QUATERNION'
    cam.rotation_quaternion = (Vector(tgt) - pos).to_track_quat('-Z', 'Y')
    cam.data.dof.use_dof = False


def _sprite_mode(on):
    hides = {"BB_Hero": True, "BB_Chief": True, "BB_Ranger": True, "BB_Guardian": True,
             "BB_Diorama": True, "BB_Arena": True}
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
        S.render.filepath = os.path.join(SPRITES, f"barrow-{name}-{facing}.png")
        bpy.ops.render.render(write_still=True)
        done.append(S.render.filepath)
    restore_pose()
    print("rendered:", *done, sep="\n  ")


def export_webp(sprite_px=384):
    report = []
    for f in sorted(os.listdir(SPRITES)):
        if not (f.startswith("barrow-") and f.endswith(".png")):
            continue
        img = D.images.load(os.path.join(SPRITES, f), check_existing=False)
        scale = sprite_px / max(img.size)
        img.scale(max(1, round(img.size[0] * scale)), max(1, round(img.size[1] * scale)))
        img.file_format = 'WEBP'
        out = os.path.join(EXPORTS, f[:-4] + ".webp")
        img.filepath_raw = out
        img.save()
        D.images.remove(img)
        report.append(f"{os.path.basename(out)}  {os.path.getsize(out)/1024:.1f} KB")
    print("\n".join(report))
