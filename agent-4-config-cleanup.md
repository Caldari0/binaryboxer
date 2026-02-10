# Agent 4 — Config, Tests & Dead Code Cleanup

## Scope

You own **project configuration, test infrastructure, documentation, and dead code removal**. You do NOT modify active game logic, routes, or UI components.

### Files You Own (exclusive write access)

```
package.json
devvit.json
CLAUDE.md
AGENTS.md
.prettierrc
eslint.config.js
tests/                          ← create test files here
src/shared/api.ts               ← dead type removal ONLY
src/client/index.css            ← line 1 only (Tailwind import evaluation)
public/snoo.png                 ← delete

# Dead files to DELETE:
src/client/components/HealthBar.tsx
src/client/components/CombatLog.tsx
src/client/components/Companion.tsx
src/client/components/AsciiPortrait.tsx
src/client/components/TerminalMenu.tsx
src/client/components/LanguagePicker.tsx
src/client/styles/matrix.css
```

### Files You May Read (but NOT edit)

```
src/server/engine/*     ← understand functions to write tests for
src/server/data/*       ← understand data to write tests for
src/server/routes/*     ← understand routes for integration test stubs
src/shared/types.ts     ← reference types
src/client/**/*         ← verify dead code analysis
binary-boxer-gdd.md     ← reference for test expectations
```

---

## Task List (ordered by priority)

### 1. [CRITICAL] Install vitest and create test infrastructure

- **File:** `package.json`
- **Problem:** `"test": "vitest run"` exists but vitest is not in dependencies. Zero test files exist.
- **Fix:**
  1. Run `npm install --save-dev vitest` (add to devDependencies)
  2. Optionally install `@devvit/test` if available for integration testing
  3. Create test directory structure:
     ```
     tests/
     ├── engine/
     │   ├── combat.test.ts
     │   ├── stats.test.ts
     │   ├── enemy.test.ts
     │   └── inheritance.test.ts
     └── (future: routes/ for integration tests)
     ```

### 2. [CRITICAL] Write unit tests for combat engine

- **File:** `tests/engine/combat.test.ts`
- **Tests to write:**
  - `getAvailableActions` returns correct actions based on stat thresholds
  - `getAvailableActions` always includes 'strike'
  - `getAvailableActions` returns 'berserk' when HP < 30%
  - `resolveRound` deals damage correctly (basic strike)
  - `resolveRound` applies crit multiplier (2x)
  - `resolveRound` applies block damage reduction (0.5x)
  - `resolveRound` respects dodge/evasion
  - `resolveRound` handles guard (0 damage + block/counter boost)
  - `resolveRound` handles combo (two hits at 0.7x)
  - `resolveRound` handles heavy strike (1.5x)
  - `resolveRound` handles berserk (2x power)
  - `initFight` creates valid initial fight state
  - `autoPickAction` returns a valid action
  - Turn order respects speed
  - Fight ends when HP reaches 0
  - Fight ends at MAX_ROUNDS
  - Win/loss result is set correctly

### 3. [CRITICAL] Write unit tests for stats engine

- **File:** `tests/engine/stats.test.ts`
- **Tests to write:**
  - `getBaseStats` returns correct initial values (HP 100, Power 10, Defence 5, Speed 5, rest 0)
  - `calculateStatsForLevel` applies language bonuses correctly per level
  - `calculateStatsForLevel` handles Python all-stats bonus
  - `getXpRequired` returns `level * 50`
  - `getXpForFight` returns correct base + win bonus + boss multiplier
  - `getTrainingCost` returns `currentValue * 10` (or minimum 10 after Agent 1 fix)
  - `applyCompanionBuffs` applies Veil (+20% wisdom)
  - `applyCompanionBuffs` applies Echo (+15% crit + 10% highest stat)
  - `applyCompanionBuffs` with no companions returns unmodified stats

### 4. [CRITICAL] Write unit tests for enemy generation

- **File:** `tests/engine/enemy.test.ts`
- **Tests to write:**
  - Enemy level is within `playerLevel + [-1, 2]` range
  - Enemy level is never below 1
  - Boss flag is true when `fightNumber % 5 === 0`
  - Boss stats are 1.5x regular stats
  - Boss HP is 2x regular HP
  - Enemy name is selected from name pool
  - Boss name is selected from boss pool

### 5. [CRITICAL] Write unit tests for inheritance

- **File:** `tests/engine/inheritance.test.ts`
- **Tests to write:**
  - `calculateInheritance` gives 10% of parent stats
  - `calculateInheritance` applies Kindred 1.25x multiplier
  - `calculateTotalLegacy` applies decay factor `0.98 ^ generationGap`
  - `calculateTotalLegacy` sums contributions from all ancestors
  - `getDynastyTitle` returns correct titles for generation thresholds

### 6. [MED] Remove template boilerplate from devvit.json

- **File:** `devvit.json:29-39`
- **Problem:** "Example form" menu item and `exampleForm` handler from Devvit template.
- **Fix:** Remove the example form menu action and the forms section. Keep only the Binary Boxer menu actions.
- **Also check:** `src/server/routes/forms.ts` and `src/server/routes/menu.ts` — if they only handle example form logic, note them as potential dead code (but don't delete since Agent 2 owns route files).

### 7. [MED] Delete all dead component files

- **Files to delete:**
  - `src/client/components/HealthBar.tsx` — never imported
  - `src/client/components/CombatLog.tsx` — never imported
  - `src/client/components/Companion.tsx` — never imported
  - `src/client/components/AsciiPortrait.tsx` — never imported
  - `src/client/components/TerminalMenu.tsx` — never imported
  - `src/client/components/LanguagePicker.tsx` — never imported
- **Verify:** Search for imports of these components across `src/client/` to confirm none exist before deleting.

### 8. [MED] Delete dead CSS file

- **File:** `src/client/styles/matrix.css`
- **Problem:** 362 lines of old green matrix terminal theme. Never imported by any active file.
- **Fix:** Delete the file.

### 9. [LOW] Remove dead type from shared/api.ts

- **File:** `src/shared/api.ts:67-70`
- **Problem:** `FightResolveResponse` is defined but never used anywhere. The `/fight/resolve` endpoint returns `FightTurnResponse` instead.
- **Fix:** Delete the `FightResolveResponse` type definition.

### 10. [LOW] Remove unused packages

- **File:** `package.json`
- **Problem:** `clsx` (v2.1.1) and `tailwind-merge` (v3.4.0) are installed but no source file imports them.
- **Fix:** Run `npm uninstall clsx tailwind-merge`.

### 11. [LOW] Evaluate Tailwind import

- **File:** `src/client/index.css:1`
- **Problem:** `@import 'tailwindcss'` but no active component uses Tailwind utility classes. All UI uses custom `bb-*` classes.
- **Fix:** After deleting dead components (which were the only Tailwind users), evaluate if any remaining code uses Tailwind utilities. If not, remove the import to reduce CSS bundle size. **Be careful:** Tailwind might provide base resets that `index.css` relies on (box-sizing, margin reset, etc.). Test visually after removal.

### 12. [LOW] Delete unused template asset

- **File:** `public/snoo.png`
- **Problem:** Default Devvit Snoo image, never referenced in HTML or components.
- **Fix:** Delete the file.

### 13. [LOW] Update CLAUDE.md documentation

- **File:** `CLAUDE.md`
- **Problems:**
  - Says "Express.js (server)" but code uses Hono
  - API endpoint table has stale paths (`/api/robot/create` vs actual `/api/create`)
  - Missing endpoints: `/api/fight/turn`, `/api/corner/full-repair`
  - `preview.html` referenced but actual file is `splash.html`
- **Fix:** Update all stale references to match the actual codebase.

### 14. [LOW] Update AGENTS.md documentation

- **File:** `AGENTS.md`
- **Problem:** References tRPC in tech stack but tRPC is not used. Stack is Hono + standard REST.
- **Fix:** Update tech stack description.

---

## Constraints

- **Do NOT edit active game logic** (`src/server/engine/*`). Agent 1 owns those.
- **Do NOT edit server routes** (`src/server/routes/*`). Agent 2 owns those.
- **Do NOT edit active client components** (FightScreen, CornerPhase, etc.). Agent 3 owns those.
- **You CAN delete dead client files** listed above.
- **You CAN edit `src/shared/api.ts`** but ONLY to remove the dead `FightResolveResponse` type.
- **Test files should import from source** using relative paths.
- **Run `npx tsc --noEmit`** after your changes.
- **Run `npm run test`** (after installing vitest) to verify tests pass.
