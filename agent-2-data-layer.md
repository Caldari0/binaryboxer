# Agent 2 — Server Routes & Data Integrity

## Scope

You own all **server route handlers** and **Redis utilities**. You fix race conditions, validation, data integrity, and endpoint correctness. You do NOT modify engine logic or client code.

### Files You Own (exclusive write access)

```
src/server/routes/combat.ts
src/server/routes/game.ts
src/server/routes/corner.ts
src/server/routes/leaderboard.ts
src/server/routes/community.ts
src/server/routes/api.ts
src/server/utils/redis.ts
```

### Files You May Read (but NOT edit)

```
src/server/engine/*            ← understand the functions you call
src/server/data/*              ← reference data
src/shared/types.ts            ← Agent 1 may add fields; your code should handle optional new fields gracefully
src/shared/api.ts              ← response type definitions
src/client/hooks/useGameState.ts ← understand what the client expects
binary-boxer-gdd.md
```

---

## Task List (ordered by priority)

### 1. [HIGH] Fix dynasty route path → 404

- **File:** `routes/game.ts:439`
- **Problem:** Server defines `GET /dynasty` but client calls `/api/dynasty/tree`. Every dynasty tree load returns 404.
- **Fix:** Change route from `game.get('/dynasty', ...)` to `game.get('/dynasty/tree', ...)`.
- **Verify:** Client at `useGameState.ts:357` calls `apiFetch('/dynasty/tree')`.

### 2. [HIGH] Add idempotency to /fight/complete

- **File:** `routes/combat.ts:340-525`
- **Problem:** Two rapid POST requests both load the same fight, both award XP, both increment totalFights. No lock or idempotency.
- **Fix:** After loading the fight, immediately delete it from Redis BEFORE processing rewards. If the fight key doesn't exist (already deleted by a concurrent request), return early with the current player state. This makes the first request win and the second become a no-op.
- **Pattern:**
  ```
  const fight = await loadFight(...)
  if (!fight) return c.json({ player }, 200)  // already completed
  await deleteFight(...)  // claim it
  // ... now safely award XP, update player, etc.
  ```

### 3. [HIGH] Fix leaderboard overwrite after retirement

- **File:** `routes/game.ts:406-407`
- **Problem:** `updateLeaderboards` is called with the NEW robot (level 1, 0 fights, 0 streak). This overwrites previous leaderboard scores with zeros.
- **Fix:** Either:
  - (a) Do NOT call `updateLeaderboards` after retirement, OR
  - (b) Call it with the RETIRING robot's final stats before creating the new robot, OR
  - (c) Use a different leaderboard key per robot (not per user)
- Recommended: Option (b) — snapshot the retiring robot's scores, update leaderboards, THEN create the new robot.

### 4. [MED] Consolidate broadcastEvent and use atomic Redis List

- **Files:** `routes/combat.ts:530-539`, `routes/game.ts:202-205 + 417-420`, `routes/community.ts:51-61`
- **Problem:** `broadcastEvent` is copy-pasted in 3 files. All use non-atomic `get→parse→unshift→set` that loses events under concurrency.
- **Fix:**
  1. Create a shared helper in `utils/redis.ts` (or a new `utils/events.ts`):
     ```typescript
     export async function broadcastEvent(postId: string, event: CommunityEvent): Promise<void> {
       const key = `${postId}:events`;
       await redis.lPush(key, JSON.stringify(event));
       await redis.lTrim(key, 0, 49);  // cap at 50
     }
     ```
  2. Update `community.ts` feed endpoint to use `redis.lRange(key, 0, 49)` and parse each element.
  3. Delete the duplicate functions from `combat.ts` and `game.ts`. Import from the shared location.

### 5. [MED] Fix fight state TTL (non-atomic)

- **File:** `utils/redis.ts:41-43`
- **Problem:** `redis.set()` then `redis.expire()` as two separate calls. If the process dies between them, the fight key persists forever.
- **Fix:** Use `redis.set(key, JSON.stringify(fight), { EX: ttlSeconds })` as a single atomic call. Check Devvit Redis API for the exact option syntax — it may be `{ expiration: ttlSeconds }` or similar.

### 6. [MED] Handle fight TTL expiry soft-lock

- **File:** `routes/game.ts:66-72` + `routes/combat.ts` + `routes/corner.ts`
- **Problem:** If fight Redis key expires (600s TTL), player state stays `'fighting'` forever. Only `/init` detects and fixes this. If the player is already loaded in the client and tries corner actions, they get rejected.
- **Fix:** In corner routes and fight routes, if `player.state === 'fighting'` but `loadFight()` returns null, reset `player.state = 'corner'` and save. Then proceed normally.

### 7. [MED] Add robot name sanitization

- **File:** `routes/game.ts:119-130`
- **Problem:** Names are length-checked (1-20) but not content-filtered. Names appear in community events.
- **Fix:** Add basic sanitization:
  - Strip leading/trailing whitespace (already done with `.trim()`)
  - Reject names that are only whitespace/special characters
  - Reject names with HTML/script-like content (`<`, `>`, `&`, etc.)
  - Optional: basic word filter for obvious slurs

### 8. [MED] Fix leaderboard N+1 query

- **File:** `routes/leaderboard.ts:69-87`
- **Problem:** 10 sequential `await loadPlayer()` calls inside a loop. Slow and risky with 30s timeout.
- **Fix:** Use `Promise.all()`:
  ```typescript
  const players = await Promise.all(
    topMembers.map(m => loadPlayer(postId, m.member))
  );
  ```

### 9. [MED] Implement forced retirement on KO after fight 30

- **File:** `routes/combat.ts` (fight complete handler)
- **Problem:** GDD says "forced retirement on KO after fight 30". Currently player always goes to corner after a loss.
- **Fix:** In `/fight/complete`, after recording a loss: if `player.totalFights >= 30 && fight.result === 'loss'`, trigger the retirement flow automatically (create dynasty entry, reset player, go to creating screen).

### 10. [LOW] Add player rank for users outside top 10

- **File:** `routes/leaderboard.ts:89-100`
- **Problem:** `playerRank` is null when user isn't in top 10. `redis.zRevRank()` can compute the actual rank.
- **Fix:** After building the top 10, call `redis.zRevRank(key, username)`. If it returns a number, set `playerRank = rank + 1` (0-indexed to 1-indexed).

### 11. [LOW] Return 400 for malformed JSON instead of 500

- **Files:** `routes/combat.ts:174`, `routes/corner.ts:201,293`
- **Problem:** `c.req.json()` throws on invalid JSON, caught by generic handler as 500.
- **Fix:** Wrap body parsing in try/catch and return `c.json({ message: 'Invalid request body' }, 400)`.

---

## Constraints

- **Do NOT edit engine files** (`src/server/engine/*`). Agent 1 owns those.
- **Do NOT edit client files**. Agent 3 owns those.
- **Do NOT edit `shared/types.ts`**. Agent 1 owns that.
- **You CAN read any file** to understand calling conventions.
- Agent 1 may add optional fields to `FightState` — your route code should continue to work since new fields will have defaults.
- **Run `npx tsc --noEmit`** after your changes to verify type safety.
- **Test your Redis operations** mentally for atomicity and race conditions.
