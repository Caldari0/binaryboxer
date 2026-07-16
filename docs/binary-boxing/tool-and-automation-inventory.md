# Tool & Automation Inventory (session-verified 2026-07-16)

## Repo toolchain (verified green)

`tsc --build` (strict, project refs) · ESLint 9 flat config · Vitest 4 (84 tests) · Vite 7 build ·
Prettier · conventional commits · `npm run deploy` already chains type-check → lint → test → upload.
Node ≥22.2 required (host has Windows-native node_modules; Linux environments must reinstall).

## Session tools available for production work

| Tool | State | Use for |
|---|---|---|
| Sandboxed Linux shell (Node 22, npm, esbuild) | ✅ working | builds, tests, simulation harnesses. Note: no state between calls except `/tmp` and mounts; foreground runs only |
| File tools on the real repo | ✅ working | all code/doc work (preserves owner's tree) |
| Web search + fetch | ✅ working | platform docs (Devvit changelog re-checks each gate) |
| Parallel agents (Explore / general-purpose) | ✅ working | claim verification, doc research, bounded reviews — used twice this session, both high-value |
| Chrome MCP (user's browser) | ✅ available | click-through testing of prototypes via `file://`, screenshots at mobile/tablet/desktop, Devvit playtest driving once logged in |
| Blender MCP | ⚠️ not connected (addon not started) | hero robot/arena renders → bundled WebP for expanded mode. Optional; visuals are code-authored by policy |
| Image generation | ❌ none connected | if adopted later: licence manifest entry mandatory |
| Devvit CLI | ✅ in repo deps | `login/playtest/upload/publish` — needs owner's Reddit auth on host |
| Computer use (desktop) | ✅ available | last-resort UI driving; prefer Chrome MCP |

## Automation opportunities (ranked by leverage)

1. **Balance-simulation harness → CI gate** (Gate 0, promoted by audit evidence). Extend this session's
   `outputs/harness.ts` technique into `sim/` — sweep archetype × gameplan × programs across seeds,
   assert win-rate corridors + fight-length envelopes. Kill blind hand-tuning forever.
2. **Content validation at build time**: zod schemas for programs/archetypes/tells/dialogue data files;
   `npm run validate-content` in the deploy chain (catches free-text drift like the old boss abilities).
3. **Click-through + screenshot regression**: scripted Chrome MCP pass over the prototype (and later the
   playtest post) at 360/768/1280 widths; archive PNGs per milestone for visual diffing.
4. **Release preparation**: script that regenerates the review-mandatory plain-English `README.md`
   (≤1,000 words) from the spec + version notes; bump + `devvit publish` checklist.
5. **Engine regression corpus**: seed-locked replay fixtures — any combat change must reproduce or
   intentionally re-bless canonical fight transcripts (leverages the deterministic RNG, a KEEP asset).
6. **Agentic review loop**: the owner's existing multi-agent audit pattern works (this session's two
   agents confirmed 12/12 claims). Keep using bounded, evidence-demanding prompts.
7. **Blender asset pipeline (optional)**: once the addon connects — parameterized robot builds →
   orthographic renders → WebP → `asset-licences.md` entries. Expanded-mode only (inline stays <1 s).

## Explicitly rejected

- Hand-rolled HTTP fetching of Reddit APIs from the client (CSP forbids; server-side only, admin-approved domains).
- Heavy UI frameworks/design systems (bundle budget + the "generic SaaS" failure mode).
- localStorage persistence (wiped per version by platform; Redis is the store).
