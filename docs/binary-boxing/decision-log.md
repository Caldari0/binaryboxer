# Decision Log — audit & prototype session

Format: date · decision · rationale · reversibility.

## 2026-07-16

1. **Docs placement**: audit/state artifacts live in `docs/binary-boxing/`; design authority stays in
   `docs/plans/` (spec > build-loop > triage). Explicitly requested paths win over inferred convention;
   cross-links added. *Reversible (file moves).*
2. **Trust the existing triage**: 12 load-bearing claims independently verified against code — all
   confirmed. The triage map is adopted as the salvage baseline instead of re-deriving it. *Low risk;
   evidence recorded in 01.*
3. **Promote balance simulation to Gate 0** (was "automation opportunity"): playthrough harness proved
   the shipped tuning is unwinnable (0% win rate for most builds; 12/12 autopilot losses). Balance is
   product-critical and must be machine-checked. *Irreversible in spirit — hand-tuning is retired.*
4. **Skip deep click-through of the v1 UI**: it is scheduled for replacement, `devvit playtest` needs
   the owner's Reddit login, and the engine evidence already condemns the loop it renders. Recorded as
   an audit limitation. *Reversible (owner can playtest anytime via `npm run dev`).*
5. **Preserve the owner's working tree**: no commits, no dependency changes, no line-ending
   normalization; verification ran on a disposable Linux copy. New work = new files only
   (`docs/binary-boxing/`, `prototype/`). *Fully reversible.*
6. **Visual north star = storybook-industrial / clockwork-whimsical** (owner's direction this session),
   superseding the CRT/Matrix identity. Constraints kept from spec: code-authored SVG/CSS-first,
   CSP-safe, reduced-motion respected, inline card <1 s. ASCII-portrait *technique* retired from the
   player journey; language-color identity retained. *Reversible at token level (single tokens file).*
7. **Prototype-first sequencing**: build the UX prototype (Prompt 2) before Gate 0 engine work — it
   validates the pivot's feel at lowest cost and yields the component/motion spec for Gate 1. The
   build-loop's "stop for owner approval before implementation" is satisfied: the owner directed this.
   *Reversible.*
8. **Prototype form factor**: one self-contained `prototype/ux-prototype.html` (no build step, no
   dependencies, runs from `file://`) with an in-file simulation faithful to the redesign spec's
   Manager-Mode loop. Rationale: instantly viewable by the owner, testable via Chrome at any viewport,
   and immune to sandbox/network constraints. *Reversible; componentization happens at Gate 1.*
9. **Devvit update deferred to Gate 0** (not done in this session): platform research confirms one
   breaking change that this repo already conforms to; bumping dependencies mid-audit on the owner's
   Windows tree without a playtest available would violate "verify green" discipline. *Deferred, not dropped.*
10. **Blender**: optional asset track only; addon not connected this session (retried 3×). Prototype
    ships with code-authored SVG robots; Blender renders can replace hero art later without layout
    changes. *Reversible.*
