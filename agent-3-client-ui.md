# Agent 3 — Client UI & State Management

## Scope

You own all **React components, hooks, and client-side data**. You fix UI bugs, state management issues, error handling, and missing user-facing features. You do NOT modify server or config files.

### Files You Own (exclusive write access)

```
src/client/components/FightScreen.tsx
src/client/components/CornerPhase.tsx
src/client/components/RobotCreation.tsx
src/client/components/DynastyTree.tsx
src/client/components/Leaderboard.tsx
src/client/components/LearningTicker.tsx
src/client/hooks/useGameState.ts
src/client/game.tsx
src/client/splash.tsx
src/client/data/languages.ts
```

### Files You May Read (but NOT edit)

```
src/shared/types.ts            ← Agent 1 may add fields; handle them gracefully
src/shared/api.ts              ← response type definitions (Agent 4 may remove dead types)
src/client/index.css           ← reference for available CSS classes
src/server/routes/*            ← understand server response shapes
binary-boxer-gdd.md
```

### Files You Must NOT Touch (owned by Agent 4)

```
src/client/components/HealthBar.tsx      ← dead code, Agent 4 deletes
src/client/components/CombatLog.tsx      ← dead code, Agent 4 deletes
src/client/components/Companion.tsx      ← dead code, Agent 4 deletes
src/client/components/AsciiPortrait.tsx  ← dead code, Agent 4 deletes
src/client/components/TerminalMenu.tsx   ← dead code, Agent 4 deletes
src/client/components/LanguagePicker.tsx ← dead code, Agent 4 deletes
src/client/styles/matrix.css             ← dead code, Agent 4 deletes
```

---

## Task List (ordered by priority)

### 1. [HIGH] Show error toast on ALL screens, not just Corner

- **File:** `game.tsx:130-156`
- **Problem:** The dismissable error banner only renders inside the `game.screen === 'corner'` branch. Errors from fight actions, robot creation, dynasty loading, and leaderboard loading are set in state but invisible.
- **Fix:** Extract the error banner into a shared element that renders at the bottom of every screen. Place it outside the screen-specific `if` blocks but inside `<div className="bb-app">`. Example:
  ```tsx
  return (
    <div className="bb-app">
      {/* screen-specific content */}
      {game.error && <ErrorBanner error={game.error} onDismiss={game.clearError} />}
    </div>
  );
  ```

### 2. [HIGH] Show level-up, XP gain, and companion unlock feedback

- **File:** `useGameState.ts:234-246`
- **Problem:** `FightCompleteResponse` includes `xpGained`, `leveledUp`, `newLevel`, and `companionUnlocked` fields. All are silently discarded. Players get zero feedback on progression.
- **Fix:**
  1. Add `lastFightReward` to `GameState`:
     ```typescript
     lastFightReward: {
       xpGained: number;
       leveledUp: boolean;
       newLevel?: number;
       companionUnlocked?: string;
     } | null;
     ```
  2. In `completeFight`, store the reward data.
  3. In `game.tsx` corner screen, render a toast/banner showing the reward info if `lastFightReward` is non-null.
  4. Clear `lastFightReward` after it's been displayed (e.g., on next user action or after a timeout).

### 3. [MED] Fix timer side-effect inside React state updater

- **File:** `FightScreen.tsx:147-151`
- **Problem:** `onSubmitAction(primary)` is called inside `setTimerMs`'s updater function. Side effects inside state updaters are unpredictable.
- **Fix:** Move the auto-submit logic out of the state updater. Use a ref to track the timer and a separate `useEffect` that watches `timerMs`:
  ```tsx
  useEffect(() => {
    if (timerMs <= 0 && isPending && !loading) {
      const primary = fight.availableActions.find(a => a.isPrimary);
      if (primary) onSubmitAction(primary.action);
      setTimerMs(ACTION_TIMER_MS);
    }
  }, [timerMs, isPending, loading, fight.availableActions, onSubmitAction]);
  ```

### 4. [MED] Clean up setTimeout calls on unmount

- **File:** `FightScreen.tsx:107, 113, 124-126`
- **Problem:** Three `setTimeout` calls (shake 250ms, crit flash 150ms, damage float 1000ms) are never cleaned up. If the component unmounts mid-timeout, they'll call setState on an unmounted component.
- **Fix:** Store timeout IDs in refs and clear them in useEffect cleanup:
  ```tsx
  const shakeTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const critTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const floatTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    return () => {
      if (shakeTimeoutRef.current) clearTimeout(shakeTimeoutRef.current);
      if (critTimeoutRef.current) clearTimeout(critTimeoutRef.current);
      if (floatTimeoutRef.current) clearTimeout(floatTimeoutRef.current);
    };
  }, []);
  ```

### 5. [MED] Add retry button to loading screen

- **File:** `game.tsx:30-52`
- **Problem:** If `/api/init` fails, user sees "ERROR: {message}" with no way to retry or recover.
- **Fix:** Add a retry button that re-triggers the init flow:
  ```tsx
  <button type="button" className="bb-btn bb-btn--primary" onClick={() => window.location.reload()}>
    RETRY
  </button>
  ```
  Or better: add a `retryInit` function to `useGameState` that re-runs the init logic.

### 6. [MED] Fix repair/train stale state

- **File:** `useGameState.ts:254-309`
- **Problem:**
  - `repair`: Hardcodes `fullRepairCooldown: 3` for full repairs. If server changes cooldown, client diverges.
  - `trainStat`: Only patches one stat + XP. Doesn't update `xpToNext` or handle level-ups.
- **Fix:** Ideally, both `/corner/repair` and `/corner/train` should return the full `PlayerState` from the server. If you can't change server responses (Agent 2 owns routes), at minimum:
  - For repair: Use `data.fullRepair` to determine cooldown instead of hardcoding.
  - For train: After training, if `xp < 0` something went wrong. Add a comment noting the limitation.
- **Coordination note:** If Agent 2 updates these endpoints to return full player state, your code should use it.

### 7. [MED] Fix premature navigation on Train/Swap

- **File:** `CornerPhase.tsx:219, 233`
- **Problem:** `setMenuView('main')` fires synchronously alongside async API calls. If the API fails, the error shows on the main menu with no context.
- **Fix:** Don't navigate back immediately. Let the parent's loading state keep the menu open. Navigate back only after the API succeeds. One approach:
  ```tsx
  onTrain={(stat) => { onTrain(stat); }}
  ```
  Then in `useGameState.trainStat`, after success, the screen stays on corner and the train menu can detect the stat changed. Or add a `onTrainComplete` callback.

### 8. [MED] Handle empty availableActions array

- **File:** `FightScreen.tsx:139, 278-289`
- **Problem:** If server returns empty actions while fight is pending, timer exits early, action grid is empty, and UI appears frozen.
- **Fix:** Add a fallback message:
  ```tsx
  {fight.availableActions.length === 0 && isPending && (
    <div style={{ textAlign: 'center', color: 'var(--bb-text-muted)', fontSize: '0.75rem' }}>
      Waiting for combat data...
    </div>
  )}
  ```

### 9. [MED] Remove duplicate CSS variable setting

- **Files:** `game.tsx:21-27` + `FightScreen.tsx:78-82`
- **Problem:** Both set `--bb-lang1`/`--bb-lang2` on `document.documentElement`.
- **Fix:** Delete the `useEffect` in `FightScreen.tsx` (lines 78-82). The one in `game.tsx` is sufficient.

### 10. [LOW] Fix LearningTicker useCallback → useMemo

- **File:** `LearningTicker.tsx:96, 114`
- **Problem:** `tipPool` is a `useCallback` that's called every render. The array is rebuilt each time.
- **Fix:** Change to `useMemo`:
  ```tsx
  const pool = useMemo(() => {
    // ... build pool array ...
    return pool;
  }, [language1, language2]);
  ```

### 11. [LOW] Import language list in CornerPhase instead of duplicating

- **File:** `CornerPhase.tsx:58-69`
- **Problem:** Hardcoded `LANGUAGE_OPTIONS` duplicates data from `data/languages.ts`.
- **Fix:** Import `LANGUAGE_ORDER` and `LANGUAGE_PROFILES` from `../data/languages` and derive the options.

### 12. [LOW] Fix stat key inconsistency (hp vs maxHp)

- **File:** `RobotCreation.tsx:23`
- **Problem:** `STAT_KEYS` includes `'hp'` but CornerPhase uses `'maxHp'` for the HP display.
- **Fix:** Change `'hp'` to `'maxHp'` in `STAT_KEYS` (or remove `'hp'` and keep only `'maxHp'`).

### 13. [LOW] Import shared types in DynastyTree and Leaderboard

- **Files:** `DynastyTree.tsx:6-31`, `Leaderboard.tsx:6-14`
- **Problem:** Both define local types instead of importing from `shared/types.ts`.
- **Fix:** Import `Dynasty`, `DynastyGeneration`, `LeaderboardEntry`, `LeaderboardMetric` from `../../shared/types`.

### 14. [LOW] Add missing type="button" attributes

- **File:** `game.tsx:211, 148`
- **Problem:** "REBOOT" and "DISMISS" buttons are missing `type="button"`.
- **Fix:** Add `type="button"` to both.

### 15. [LOW] Remove unused exports from useGameState

- **File:** `useGameState.ts`
- **Problem:** `goToCreating` (line 411), `loadCommunityFeed` (line 393), and `communityEvents` (line 57) are exported but never consumed.
- **Fix:** Remove the unused callbacks and state field. If community feed is wanted later, it can be re-added.

### 16. [LOW] Remove unused GameScreen types

- **File:** `useGameState.ts:40, 43`
- **Problem:** `'fight_result'` and `'retired'` are in the `GameScreen` union but never set or rendered.
- **Fix:** Remove them from the union type.

### 17. [LOW] Use RetireRobotResponse import instead of inline type

- **File:** `useGameState.ts:336`
- **Problem:** Uses `apiFetch<{ type: string; dynasty: Dynasty }>` instead of `RetireRobotResponse`.
- **Fix:** Import and use `RetireRobotResponse` from `../../shared/api`.

---

## Constraints

- **Do NOT edit server files**. Agent 2 owns routes, Agent 1 owns engine.
- **Do NOT edit config files** (package.json, devvit.json, etc.). Agent 4 owns those.
- **Do NOT delete dead component files**. Agent 4 handles that.
- Agent 1 may add optional fields to `FightState` in `shared/types.ts`. Your components should handle missing/undefined fields gracefully.
- **Use existing `bb-*` CSS classes** from `index.css`. Do not introduce new classes.
- **Run `npx tsc --noEmit`** after your changes to verify type safety.
