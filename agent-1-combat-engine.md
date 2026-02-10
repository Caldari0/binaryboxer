# Agent 1 — Combat Engine & Game Logic

## Scope

You own all **pure game logic** files. No Redis, no routes, no client code.

### Files You Own (exclusive write access)

```
src/server/engine/combat.ts
src/server/engine/stats.ts
src/server/engine/enemy.ts
src/server/engine/inheritance.ts
src/server/data/enemies.ts
src/shared/types.ts          ← only for adding new fields (backward-compatible additions only)
```

### Files You May Read (but NOT edit)

```
src/server/data/languages.ts
src/server/routes/*           ← understand how your functions are called
src/shared/api.ts
binary-boxer-gdd.md           ← the source of truth for game design
```

---

## Task List (ordered by priority)

### 1. [HIGH] Fix Python double Power bug

- **File:** `stats.ts` (lines 89-98) + check `languages.ts`
- **Problem:** Python has `primaryStat: 'power', primaryBonus: 2` AND the all-stats special case adds +2 to ALL growth stats including power. Result: +4 Power/level instead of +2.
- **Fix:** In `calculateStatsForLevel`, when the Python special-case fires, skip the normal `primaryStat` bonus application for that language. Python should get exactly +2 to every stat per level, no spike.
- **GDD Reference:** Section 2.1 — "Python: +2 All Stats/level"

### 2. [HIGH] Fix training cost of 0 for zero-value stats

- **File:** `stats.ts:162`
- **Problem:** `getTrainingCost(0)` returns `0 * 10 = 0`. Players train 6+ stats from 0→1 for free.
- **Fix:** `return Math.max(10, currentStatValue * 10)` — minimum cost of 10 XP.

### 3. [HIGH] Implement boss ability effects in combat

- **File:** `combat.ts` + `enemies.ts`
- **Problem:** 10 boss abilities are defined as strings in `enemies.ts` but `resolveRound()` never reads or applies them.
- **Fix:** In `resolveRound`, check `state.enemy.bossAbility` and apply the mechanical effect each round. The bosses and their abilities from `enemies.ts`:
  - THE_COMPILER: Reduce player defence by 25%
  - SEGFAULT: Bonus damage = 10% of player max HP
  - STACK_OVERFLOW: Gains +5% stats each round
  - GARBAGE_COLLECTOR: Heals 5% max HP per round
  - RACE_CONDITION: Acts twice per round (30% chance)
  - DEADLOCK: 20% chance to stun player for 1 turn
  - BUFFER_OVERFLOW: Attacks ignore 50% of player defence
  - MEMORY_LEAK: Player loses 2% max HP per round (permanent drain)
  - NULL_POINTER: 15% chance to "crash" player (skip turn)
  - INFINITE_LOOP: Fight has no round limit (override MAX_ROUNDS)
- You may need to add a `bossAbilityApplied` or per-round tracking field to `FightState` in `shared/types.ts`.

### 4. [MED] Implement berserk persistence across rounds

- **File:** `combat.ts` + `shared/types.ts`
- **Problem:** Berserk only applies for the single round it's chosen. GDD says "+100% Power, -50% Defence for rest of fight."
- **Fix:** Add `playerBerserk: boolean` and `enemyBerserk: boolean` to `FightState` in `shared/types.ts`. Once berserk is chosen, set the flag. In `resolveRound`, check these flags to apply the power/defence modifiers every subsequent round, not just the berserk round.

### 5. [MED] Implement analyse accuracy buff

- **File:** `combat.ts` + `shared/types.ts`
- **Problem:** Analyse returns 0 damage and does nothing else. GDD says "+30% accuracy next 2 turns."
- **Fix:** Add `playerAccuracyBuff: number` (turns remaining) to `FightState`. When analyse is chosen, set to 2. Each round, if buff > 0, reduce evasion check by 30% for the buffed side, then decrement.

### 6. [MED] Implement overclock speed buff

- **File:** `combat.ts` + `shared/types.ts`
- **Problem:** Crash risk works but "+50% Speed for 2 turns" is missing. An undocumented 1.1x damage bonus exists instead.
- **Fix:** Add `playerSpeedBuff: number` (turns remaining) to `FightState`. When overclock is chosen, set to 2. Apply +50% speed when determining turn order for buffed rounds. Remove the undocumented 1.1x damage multiplier.

### 7. [MED] Fix guard counter bonus (30% → 50%)

- **File:** `combat.ts:253`
- **Problem:** `counterChance + 0.3` but GDD says +50%.
- **Fix:** Change to `counterChance + 0.5`.

### 8. [MED] Fix playerTurn assignment on enemy-first KO

- **File:** `combat.ts:530-544`
- **Problem:** When enemy goes first (`!playerFirst`) and KOs player, `playerTurn` is set to the enemy's turn object. Comment says "// will fix below" — never fixed.
- **Fix:** When `!playerFirst` and `firstKo` (enemy killed player on first strike), return `playerTurn: null` and `enemyTurn: firstTurn`.

### 9. [MED] Add base stat growth formula

- **File:** `stats.ts`
- **Problem:** GDD says `statGrowth = languageBonus + (level * 0.5)` but only language bonuses are applied. Stats without language bonuses never grow from 0.
- **Fix:** In `calculateStatsForLevel`, after applying language bonuses, add `Math.floor(level * 0.5)` to each growth stat (all stats except `hp`/`maxHp`).

### 10. [LOW] Fix speed tie-breaking by Wisdom

- **File:** `combat.ts:452`
- **Problem:** `playerFirst = playerStats.speed >= enemyStats.speed` always favors player on ties.
- **Fix:** `playerFirst = playerStats.speed > enemyStats.speed || (playerStats.speed === enemyStats.speed && playerStats.wisdom >= enemyStats.wisdom)`

### 11. [LOW] Add language-specific combat flavour text

- **File:** `combat.ts:301-363`
- **Problem:** Flavour text is generic. GDD says it should reference language themes (e.g., "Rust armour absorbs the blow!").
- **Fix:** Add language-aware flavour templates. The `resolveRound` function has access to `state.enemy` and can receive language info. Add templates that reference language identity.

### 12. [LOW] Enable enemy crash mechanic

- **File:** `combat.ts`
- **Problem:** Only player can crash (on overclock). Enemies should also be able to crash based on their stability stat.
- **Fix:** Add a crash check for the enemy side using `statToChance(enemyStats.stability, 60)`.

### 13. [LOW] Implement adaptability "buff after damage" mechanic

- **File:** `combat.ts`
- **Problem:** Adaptability only gates overclock. GDD says "Chance to gain temporary buff after taking damage."
- **Fix:** After a fighter takes damage, roll against `statToChance(adaptability, 40)`. On success, grant a small temporary buff (e.g., +10% to a random stat for 2 turns).

### 14. [LOW] Implement pattern read prediction mechanic

- **File:** `combat.ts`
- **Problem:** Pattern Read only gates analyse (which itself does nothing). GDD says "Increases accuracy of predicting enemy moves."
- **Fix:** Use pattern read to influence enemy action selection visibility or dodge/block rates. Could increase block/counter chance based on `statToChance(patternRead, 50)`.

---

## Constraints

- **All functions must remain pure** — no Redis, no HTTP, no side effects.
- **Do not change function signatures** of exported functions. Agent 2 calls your functions from routes.
- **Adding fields to `FightState`** in `shared/types.ts` is fine — make them optional with defaults so existing code doesn't break.
- **Always reference `binary-boxer-gdd.md`** for design decisions. Do not improvise mechanics.
- **Run `npx tsc --noEmit`** after your changes to verify type safety.
