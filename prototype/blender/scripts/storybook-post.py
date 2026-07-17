"""Storybook page-finish for rendered plates: vignette + paper grain.

Numpy post-pass on the saved PNG (display-referred), deliberately NOT a
compositor graph — Blender 5's compositor node set is still shifting
(Blur options moved to sockets, MapRange removed), while Image.pixels +
numpy is stable API. Deterministic grain (fixed seed) so re-runs are
byte-reproducible.

Run inside Blender via MCP:

    G = {}
    exec(compile(open(r"<this file>").read(), "storybook-post", "exec"), G)
    G["page_finish"](r"...\\arena-boiler-club-storybook.png")           # in place
    G["page_finish"](src, dst)                                          # or to a copy

Tunables: edge darkness (VIG_MIN), where the falloff starts (VIG_START),
grain amplitude (GRAIN_AMP). The look is part of the environment recipe —
change values only with the spec.
"""

import bpy
import numpy as np

VIG_MIN = 0.74      # corner brightness multiplier
VIG_START = 0.62    # normalized ellipse radius where falloff begins
VIG_END = 1.12      # radius where it reaches VIG_MIN
GRAIN_AMP = 0.032   # +/- multiplicative grain
GRAIN_SEED = 13


def page_finish(src, dst=None):
    dst = dst or src
    img = bpy.data.images.load(src, check_existing=False)
    w, h = img.size
    px = np.empty(w * h * 4, dtype=np.float32)
    img.pixels.foreach_get(px)
    px = px.reshape(h, w, 4)

    yy, xx = np.mgrid[0:h, 0:w]
    nx = (xx / (w - 1)) * 2.0 - 1.0
    ny = (yy / (h - 1)) * 2.0 - 1.0
    r = np.sqrt(nx * nx + ny * ny)
    t = np.clip((r - VIG_START) / (VIG_END - VIG_START), 0.0, 1.0)
    t = t * t * (3.0 - 2.0 * t)                      # smoothstep
    vig = (1.0 - t * (1.0 - VIG_MIN)).astype(np.float32)

    rng = np.random.default_rng(GRAIN_SEED)
    grain = rng.uniform(1.0 - GRAIN_AMP, 1.0 + GRAIN_AMP, (h, w)).astype(np.float32)

    px[:, :, :3] *= (vig * grain)[:, :, None]
    np.clip(px, 0.0, 1.0, out=px)

    img.pixels.foreach_set(px.reshape(-1))
    img.filepath_raw = dst
    img.file_format = 'PNG'
    img.save()
    bpy.data.images.remove(img)
    print("page-finished:", dst)
