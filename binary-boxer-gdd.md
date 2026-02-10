# BINARY BOXER — Game Design Document
## Devvit Web (React Template) | ASPECT Research Ltd

**Version:** 1.0.0
**Author:** Rudolph (ASPECT Research Ltd)
**Platform:** Reddit via Devvit Web
**Stack:** React (client) + Express (server) + Redis (persistence) + Realtime (community features)
**Target:** Reddit Developer Funds 2026 Program

---

## 1. GAME OVERVIEW

### Concept
Binary Boxer is a robot boxing management sim where players create, train, and evolve AI fighters seeded with programming languages that determine their combat DNA. Players are the unseen creator/manager of their robot, making strategic decisions between fights in a "Corner Phase" and watching their creation battle through an infinite gauntlet of increasingly powerful opponents.

### Core Fantasy
You are a programmer who builds fighting robots. Your choice of programming languages literally shapes how your robot fights. Rust makes it defensive. JavaScript makes it resilient. C++ makes it wise. Your robot is an expression of your code.

### Why Reddit
- Tech-heavy audience that gets the programming language metaphor instantly
- Each subreddit becomes its own arena with local leaderboards
- Community meta emerges naturally (r/rust players vs r/javascript players debating optimal builds)
- Management sim format works perfectly within a Reddit post embed
- Infinite replayability through dynasty mode and enemy scaling

### Monetisation Path
- Reddit Developer Fund tiers (target: 500+ Daily Qualified Engagers within first month)
- Reddit Gold payments for cosmetic robot skins (future, requires @devvit/payments approval)
- Install spread across programming subreddits for Qualified Install tiers

---

## 2. GAME SYSTEMS

### 2.1 Robot Creation

On first play, the user creates their robot:

**Step 1: Name Your Robot**
- Free text input (filtered for Reddit content policy compliance)
- Max 20 characters

**Step 2: Choose 2 Programming Languages**
- Player selects exactly 2 languages from the pool
- Languages determine base stat modifiers AND which learning tips appear during fights
- Choice is permanent for this robot's lifetime (can only change in Corner Phase with restrictions)

**Language Pool & Stat Modifiers:**

| Language | Primary Stat | Secondary Stat | Combat Flavour |
|----------|-------------|----------------|----------------|
| Rust | +3 Defence/level | +1 Stability/level | Safe, defensive, rarely crashes mid-fight |
| JavaScript | +3 HP/level | +1 Adaptability/level | Resilient, recovers fast, unpredictable |
| Python | +2 All Stats/level | +0 Special | Jack of all trades, no spikes |
| C++ | +3 Wisdom/level | +1 Block Chance/level | Knows when to block, efficient |
| CSS | +3 Creativity/level | +1 Crit Chance/level | Unpredictable, flashy, high crits |
| Go | +3 Speed/level | +1 Counter/level | Fast, concurrent attacks, counters well |
| TypeScript | +2 Defence/level | +2 HP/level | Like JavaScript but safer |
| C | +3 Power/level | +1 Penetration/level | Raw damage, ignores some defence |
| Haskell | +3 Evasion/level | +1 Pattern Read/level | Pure logic, dodges through prediction |
| Lua | +2 Speed/level | +2 Creativity/level | Lightweight, quick, creative combos |

**Stat Definitions:**

| Stat | Effect |
|------|--------|
| HP | Total health pool. At 0, robot is KO'd |
| Power | Base damage dealt per hit |
| Defence | Flat damage reduction per hit received |
| Speed | Determines turn order and dodge chance |
| Wisdom | Increases block success rate and tactical decisions |
| Creativity | Increases critical hit chance and combo variety |
| Stability | Reduces chance of "crash" (stun for 1 turn) |
| Adaptability | Chance to gain temporary buff after taking damage |
| Evasion | Chance to fully dodge an attack |
| Block Chance | Chance to block (50% damage reduction) |
| Counter | Chance to counter-attack after blocking |
| Crit Chance | Chance to deal 2x damage |
| Pattern Read | Increases accuracy of predicting enemy moves |
| Penetration | Percentage of enemy Defence ignored |

**Base Stats (all robots start with):**
- HP: 100
- Power: 10
- Defence: 5
- Speed: 5
- All other stats: 0

### 2.2 Combat System

**Format:** Turn-based, server-authoritative, deterministic from seed

**Turn Structure:**
1. Speed comparison determines who acts first (ties broken by Wisdom)
2. Attacker chooses action (auto-resolved by AI based on stats — player watches)
3. Defender responds (block/dodge/absorb based on stats)
4. Damage calculation
5. Status effects applied
6. Check for KO
7. Swap turns
8. Repeat until KO

**Actions (auto-selected by combat AI based on robot stats):**

| Action | Trigger Condition | Effect |
|--------|-------------------|--------|
| Strike | Default | Base Power damage |
| Heavy Strike | Creativity > threshold | 1.5x damage, -20% accuracy |
| Guard | Wisdom > threshold | Block next attack, +50% counter chance |
| Analyse | Pattern Read > threshold | +30% accuracy next 2 turns |
| Overclock | Adaptability > threshold | +50% Speed for 2 turns, risk crash |
| Combo | Creativity + Speed > threshold | 2 hits at 70% damage each |
| Berserk | HP < 30% | +100% Power, -50% Defence for rest of fight |

**Damage Formula:**
```
baseDamage = attacker.power * (1 + attacker.level * 0.05)
reduction = defender.defence * (1 - attacker.penetration / 100)
finalDamage = max(1, baseDamage - reduction)
if (crit) finalDamage *= 2
if (blocked) finalDamage *= 0.5
```

**Enemy Generation:**
- Enemies are procedurally generated with names from a programming/tech word pool
- Enemy stats scale with player level: `enemyStat = baseStat + (playerLevel * scalingFactor)`
- Every 5th fight is a "Boss" with 1.5x stats and a unique ability
- Enemy names: NULLPTR, SEGFAULT, STACK_OVERFLOW, DEADLOCK, RACE_CONDITION, BUFFER_OVERFLOW, MEMORY_LEAK, SYNTAX_ERROR, INFINITE_LOOP, KERNEL_PANIC, etc.

**Combat Log:**
- Every action produces a flavour text line displayed in the combat log
- Language-specific flavour: "UNIT-7's Rust armour absorbs the blow!" / "NULLPTR crashes mid-attack!"
- This is where the personality lives

### 2.3 Companions

Companions are small AI entities (fairy-like) that appear beside your robot during fights.

**Veil** — Unlocks after surviving 5 fights
- Buffs robot's Wisdom by 20%
- Provides tactical analysis between rounds
- Visual: Small purple floating entity
- Lore: "A whisper of pattern recognition from the void"

**Echo** — Unlocks after surviving 12 fights
- Buffs robot's Crit Chance by 15%
- Amplifies the robot's strongest language stat by 10%
- Visual: Small cyan floating entity
- Lore: "The resonance of every fight your robot has survived"

**Kindred** — Unlocks in Dynasty Mode (generation 2+)
- Buffs inheritance bonus by 25%
- Connects generations through shared memory
- Visual: Small gold floating entity
- Lore: "The bridge between what was and what will be"

### 2.4 Learning Tips System

During combat, a ticker above the fight arena displays cycling learning tips related to the player's chosen languages.

**Format:**
```
💡 [RUST] Ownership means each value has exactly one owner at a time
💡 [JS] Array.map() creates a new array by transforming each element
```

**Implementation:**
- Tips stored in shared types as JSON arrays per language
- 30-50 tips per language (beginner level)
- Cycle every 8 seconds during combat
- Only show tips for the player's chosen 2 languages
- Tips are educational but not intrusive — they're ambient learning

### 2.5 Corner Phase

Between every fight, the player enters the Corner Phase — a calmer UI screen where strategic decisions are made.

**Available Actions:**

| Action | Description | Cooldown |
|--------|-------------|----------|
| Repair | Restore 50% of max HP | Free, always available |
| Full Repair | Restore 100% HP | Once per 3 fights |
| Swap Language | Replace one of your 2 languages | Once per 10 fights |
| Train Stat | Spend XP to boost a specific stat | Per level |
| View Stats | Inspect detailed robot stats | Always |
| View Dynasty | See family tree (Dynasty mode) | Always |
| Retire Robot | End this robot's career, start Dynasty | After fight 20 |

**XP System:**
- Earn XP per fight: `baseXP = 10 + (enemyLevel * 2) + (winBonus ? 5 : 0)`
- Boss fights award 3x XP
- XP required per stat point: `currentStatValue * 10`

### 2.6 Dynasty Mode

The core long-term progression system. When a robot retires (player choice after fight 20, or forced on KO after fight 30), the dynasty continues.

**Retirement:**
- Robot enters Hall of Fame with final stats, fight record, and generation number
- Player creates a new robot (new name, new language choices)
- New robot inherits bonuses from predecessor

**Inheritance System:**
```
inheritedBonus = parentFinalStat * inheritanceRate
inheritanceRate = 0.10 + (kindredBonus ? 0.025 : 0)
decayPerGeneration = 0.02

effectiveInheritance = inheritedBonus * (1 - decayPerGeneration * generationGap)
```

- New robot starts with inherited bonuses added to base stats
- Inherited bonuses are visible as "Legacy Stats" in the UI
- Family tree tracks all generations

**Dynasty Milestones:**

| Generation | Unlock |
|------------|--------|
| 2 | Kindred companion |
| 3 | Dynasty title suffix (e.g., "III") |
| 5 | Legacy Perk slot (passive bonus) |
| 10 | Dynasty Crest (visual badge) |
| 25 | Eternal status (never decays from leaderboard) |

### 2.7 Community Features (Devvit-Specific)

**Per-Community Leaderboards:**
- Highest level reached (current robot)
- Longest win streak
- Deepest dynasty (most generations)
- Most total fights across all generations

**Realtime Fight Results:**
- When a player wins a boss fight or reaches a milestone, broadcast to the community channel
- Other players see: "🥊 UNIT-7 just defeated KERNEL_PANIC at Level 25!"

**Weekly Community Challenges:**
- Configurable by subreddit moderators via app settings
- Example: "This week: all robots get +50% stats from Python"
- Drives engagement spikes and meta discussion

---

## 3. DEVVIT ARCHITECTURE

### 3.1 Entry Points (devvit.json)

```json
{
  "name": "binary-boxer",
  "version": "0.0.1",
  "permissions": {
    "reddit": true
  },
  "post": {
    "dir": "dist/client",
    "entrypoints": {
      "default": {
        "entry": "preview.html",
        "height": "regular",
        "inline": true
      },
      "game": {
        "entry": "game.html"
      },
      "leaderboard": {
        "entry": "leaderboard.html"
      }
    }
  }
}
```

**Preview (inline):** Shows in the Reddit feed. Displays:
- Community leaderboard top 5
- Player's current robot name + level (if they have one)
- "TAP TO FIGHT" button that opens expanded mode

**Game (expanded):** Full game experience — fight screen, corner phase, dynasty view

**Leaderboard (expanded):** Full community leaderboard with dynasty trees

### 3.2 File Structure

```
binary-boxer/
├── devvit.json
├── vite.config.ts
├── package.json
├── tsconfig.json
├── src/
│   ├── client/
│   │   ├── preview.html          # Inline feed preview
│   │   ├── preview.tsx           # Preview React app
│   │   ├── game.html             # Full game
│   │   ├── game.tsx              # Game React app
│   │   ├── leaderboard.html      # Leaderboard view
│   │   ├── leaderboard.tsx       # Leaderboard React app
│   │   ├── components/
│   │   │   ├── FightScreen.tsx    # Main combat UI
│   │   │   ├── CornerPhase.tsx    # Between-fight decisions
│   │   │   ├── RobotCreation.tsx  # New robot setup
│   │   │   ├── DynastyTree.tsx    # Family tree visualisation
│   │   │   ├── CombatLog.tsx      # Fight text log
│   │   │   ├── HealthBar.tsx      # Animated health bars
│   │   │   ├── Companion.tsx      # Veil/Echo/Kindred display
│   │   │   ├── LearningTicker.tsx # Cycling education tips
│   │   │   ├── RobotAvatar.tsx    # CSS-drawn robot visual
│   │   │   └── Leaderboard.tsx    # Rankings display
│   │   ├── hooks/
│   │   │   ├── useGameState.ts    # Core game state management
│   │   │   ├── useCombat.ts       # Combat animation/display logic
│   │   │   └── useRealtime.ts     # Community event subscriptions
│   │   └── styles/
│   │       └── matrix.css         # Matrix/cyberpunk theme
│   ├── server/
│   │   ├── index.ts               # Express server + all API routes
│   │   ├── routes/
│   │   │   ├── game.ts            # Game state CRUD
│   │   │   ├── combat.ts          # Combat resolution
│   │   │   ├── dynasty.ts         # Dynasty management
│   │   │   └── leaderboard.ts     # Leaderboard queries
│   │   ├── engine/
│   │   │   ├── combat.ts          # Combat calculation engine
│   │   │   ├── enemy.ts           # Enemy generation
│   │   │   ├── stats.ts           # Stat calculation
│   │   │   └── inheritance.ts     # Dynasty inheritance math
│   │   └── data/
│   │       ├── languages.ts       # Language definitions + modifiers
│   │       ├── tips.ts            # Learning tips per language
│   │       ├── enemies.ts         # Enemy name pool + templates
│   │       └── companions.ts      # Companion definitions
│   └── shared/
│       └── types.ts               # All shared TypeScript types
└── tests/
    ├── combat.test.ts
    ├── dynasty.test.ts
    ├── enemy.test.ts
    └── leaderboard.test.ts
```

### 3.3 API Endpoints

All endpoints prefixed with `/api/`

**Game State:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/init` | Load or create player state |
| POST | `/api/robot/create` | Create new robot with name + languages |
| GET | `/api/robot/stats` | Get current robot full stats |
| POST | `/api/robot/retire` | Retire robot, trigger dynasty |

**Combat:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/fight/start` | Generate enemy, return fight setup |
| POST | `/api/fight/resolve` | Server resolves entire fight, returns turn log |
| POST | `/api/fight/complete` | Record fight result, award XP |

**Corner Phase:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/corner/repair` | Heal robot |
| POST | `/api/corner/train` | Spend XP on stat |
| POST | `/api/corner/swap-language` | Change one language |

**Dynasty:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dynasty/tree` | Get full family tree |
| GET | `/api/dynasty/hall-of-fame` | Get retired robots |

**Leaderboard:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/leaderboard/level` | Top players by level |
| GET | `/api/leaderboard/streak` | Top players by win streak |
| GET | `/api/leaderboard/dynasty` | Top players by generation depth |
| GET | `/api/leaderboard/fights` | Top players by total fights |

**Community:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/community/feed` | Recent community events |
| POST | `/api/community/broadcast` | Send milestone to realtime channel |

---

## 4. REDIS DATA SCHEMA

### Key Naming Convention
All keys scoped by postId (each post is an independent game instance):
```
{postId}:{namespace}:{identifier}
```

### 4.1 Player State

**Key:** `{postId}:player:{username}`
**Type:** Hash (HSET/HGET)

```typescript
interface PlayerState {
  // Robot identity
  robotName: string;
  language1: string;
  language2: string;
  
  // Base stats (before modifiers)
  hp: number;
  maxHp: number;
  power: number;
  defence: number;
  speed: number;
  wisdom: number;
  creativity: number;
  stability: number;
  adaptability: number;
  evasion: number;
  blockChance: number;
  counter: number;
  critChance: number;
  patternRead: number;
  penetration: number;
  
  // Progression
  level: number;
  xp: number;
  xpToNext: number;
  totalFights: number;
  wins: number;
  losses: number;
  currentStreak: number;
  bestStreak: number;
  
  // Companions
  hasVeil: boolean;       // unlocked at fight 5
  hasEcho: boolean;       // unlocked at fight 12
  hasKindred: boolean;    // unlocked at generation 2+
  
  // Corner phase cooldowns
  fullRepairCooldown: number;    // fights until available
  swapLanguageCooldown: number;  // fights until available
  
  // Dynasty
  generation: number;
  dynastyId: string;
  legacyPower: number;      // inherited bonus
  legacyDefence: number;
  legacyHp: number;
  legacySpeed: number;
  // ... one legacy field per stat
  
  // Meta
  createdAt: number;       // timestamp
  lastFightAt: number;     // timestamp
  state: 'creating' | 'corner' | 'fighting' | 'retired';
}
```

### 4.2 Dynasty Data

**Key:** `{postId}:dynasty:{username}`
**Type:** String (SET/GET) — JSON blob

```typescript
interface Dynasty {
  id: string;
  ownerUsername: string;
  generations: DynastyGeneration[];
  totalFights: number;
  totalWins: number;
  deepestLevel: number;
  createdAt: number;
}

interface DynastyGeneration {
  generationNumber: number;
  robotName: string;
  language1: string;
  language2: string;
  finalLevel: number;
  totalFights: number;
  wins: number;
  bestStreak: number;
  retiredAt: number;
  causeOfRetirement: 'voluntary' | 'ko';
  finalStats: Record<string, number>;
}
```

### 4.3 Leaderboards (Sorted Sets)

**Per-community, per-metric:**

```
{postId}:lb:level          → ZADD {postId}:lb:level {level} {username}
{postId}:lb:streak         → ZADD {postId}:lb:streak {bestStreak} {username}
{postId}:lb:dynasty        → ZADD {postId}:lb:dynasty {generation} {username}
{postId}:lb:fights         → ZADD {postId}:lb:fights {totalFights} {username}
```

**Queries:**
```
Top 10 by level:    ZREVRANGE {postId}:lb:level 0 9 WITHSCORES
Player rank:        ZREVRANK {postId}:lb:level {username}
```

### 4.4 Community Event Feed

**Key:** `{postId}:events`
**Type:** List (LPUSH/LRANGE) — capped at 50 entries

```typescript
interface CommunityEvent {
  type: 'boss_kill' | 'level_milestone' | 'dynasty_start' | 'streak_record';
  username: string;
  robotName: string;
  detail: string;       // "defeated KERNEL_PANIC at Level 25"
  timestamp: number;
}
```

**Operations:**
```
Add event:    LPUSH {postId}:events {JSON}
Trim to 50:  LTRIM {postId}:events 0 49
Get recent:  LRANGE {postId}:events 0 9
```

### 4.5 Fight State (Temporary)

**Key:** `{postId}:fight:{username}`
**Type:** String (SET/GET with TTL) — JSON blob, expires after 10 minutes

```typescript
interface FightState {
  enemyName: string;
  enemyLevel: number;
  enemyStats: Record<string, number>;
  enemyIsBoss: boolean;
  seed: number;           // deterministic RNG seed
  turns: FightTurn[];     // full fight log
  result: 'win' | 'loss' | 'pending';
  xpAwarded: number;
}

interface FightTurn {
  turnNumber: number;
  attacker: 'player' | 'enemy';
  action: string;
  damage: number;
  blocked: boolean;
  dodged: boolean;
  critical: boolean;
  crashed: boolean;
  playerHpAfter: number;
  enemyHpAfter: number;
  flavourText: string;
}
```

**TTL:** `SET {postId}:fight:{username} {JSON} EX 600`

---

## 5. REALTIME CHANNELS

### Channel: `{postId}:community`

**Purpose:** Broadcast milestones to all connected players in the same post

**Server sends:**
```typescript
await realtime.send(`${postId}:community`, {
  type: 'milestone',
  username: 'player123',
  robotName: 'UNIT-7',
  event: 'boss_kill',
  detail: 'defeated KERNEL_PANIC at Level 25',
  timestamp: Date.now()
});
```

**Client subscribes:**
```typescript
const connection = await connectRealtime({
  channel: `${postId}:community`,
  onMessage: (data) => {
    addToEventFeed(data);
  }
});
```

---

## 6. UI DESIGN SPECIFICATION

### Visual Theme: Matrix Cyberpunk

**Colour Palette:**
- Background: `#0a0a0a` (near-black)
- Grid lines: `#0d2818` (dark matrix green)
- Primary text: `#00ff41` (matrix green)
- Secondary text: `#00b4d8` (cyan)
- Accent: `#ff6b35` (warning orange)
- Health bar (player): `#00ff41`
- Health bar (enemy): `#ff0040`
- Veil: `#9b5de5` (purple)
- Echo: `#00f5d4` (cyan)
- Kindred: `#ffd60a` (gold)
- Crit flash: `#ffffff`

**Typography:**
- Primary: `'JetBrains Mono', 'Fira Code', monospace`
- Headers: Same, bold
- Combat log: Same, smaller

**Fight Screen Layout:**
```
┌──────────────────────────────────────────┐
│  💡 [RUST] Tip text cycles here...       │  ← Learning Ticker
├──────────────────────────────────────────┤
│                                          │
│  [PLAYER ROBOT]          [ENEMY ROBOT]   │
│  ██████████ 85/100    ██████ 45/120      │  ← Health Bars
│  UNIT-7 (Lv.12)       NULLPTR (Lv.13)    │
│  🟣 Veil  🔵 Echo                        │  ← Companions
│                                          │
├──────────────────────────────────────────┤
│  > UNIT-7 strikes! 23 DMG               │
│  > NULLPTR blocks! (-50% DMG)           │  ← Combat Log
│  > Rust armour absorbs impact (-3 DMG)  │
│  > NULLPTR goes BERSERK! Critical!      │
│                                          │
├──────────────────────────────────────────┤
│  LANGUAGES: RUST + JS  │ LEVEL: 12      │
│  STREAK: 8  │  GENERATION: III          │  ← Status Bar
└──────────────────────────────────────────┘
```

**Corner Phase Layout:**
```
┌──────────────────────────────────────────┐
│         ⚙️ CORNER PHASE                  │
│         Fight 13 | Level 12              │
├──────────────────────────────────────────┤
│                                          │
│  [ROBOT RESTING]     STATS PANEL:        │
│   HP: 85/100         PWR: 34             │
│   Repairing...       DEF: 28             │
│                      SPD: 19             │
│                      WIS: 22             │
│                      CRT: 31             │
│                                          │
├──────────────────────────────────────────┤
│  [REPAIR]  [TRAIN]  [SWAP LANG]         │
│  [VIEW DYNASTY]  [RETIRE ROBOT]         │  ← Action Buttons
├──────────────────────────────────────────┤
│  XP: 340/500 to next level              │
│  Languages: Rust + CSS                   │
└──────────────────────────────────────────┘
```

### Inline Preview (Feed Card):
```
┌──────────────────────────────────────────┐
│  🥊 BINARY BOXER                         │
│                                          │
│  🏆 LEADERBOARD          YOUR ROBOT:     │
│  1. xXCoderXx  Lv.45    UNIT-7 (Lv.12) │
│  2. rustacean   Lv.38    Streak: 8      │
│  3. js_warrior  Lv.31    Gen III        │
│                                          │
│         [ ▶ TAP TO FIGHT ]               │
└──────────────────────────────────────────┘
```

### Animations (CSS only, no canvas):
- Robot eyes: `pulsing glow` (CSS animation, 2s loop)
- Health bar: `smooth width transition` (300ms ease)
- Damage numbers: `float up + fade out` (CSS keyframes)
- Crit flash: `white flash overlay` (100ms)
- Companion float: `gentle bob` (CSS animation, 3s loop)
- Combat log: `slide in from bottom` (200ms)
- Matrix rain: `background animation` (optional, performance-dependent)

---

## 7. COMBAT MATH REFERENCE

### Level-Up Formula
```
xpRequired = level * 50
```

### Stat Growth Per Level
```
statGrowth = languageBonus + (level * 0.5)
// where languageBonus is from the language table (e.g., Rust gives +3 Defence)
```

### Enemy Scaling
```
enemyLevel = playerLevel + random(-1, 2)
enemyBaseStat = 10 + (enemyLevel * 3)
// Boss: enemyBaseStat * 1.5
// Boss HP: baseHP * 2
```

### Inheritance Calculation
```
for each stat:
  inheritedBonus = parentFinalStat * 0.10
  if hasKindred: inheritedBonus *= 1.25
  
  // Decay from distant ancestors
  totalLegacy = sum of all ancestor bonuses * (0.98 ^ generationGap)
```

### Win Probability (for preview display)
```
playerPower = sum(allStats) + (level * 10)
enemyPower = sum(enemyStats) + (enemyLevel * 10)
winProbability = playerPower / (playerPower + enemyPower)
```

---

## 8. TESTING STRATEGY

Using `@devvit/test` with Vitest:

### Unit Tests (server/engine/)
- Combat damage calculation (various stat combinations)
- Enemy generation at each level bracket
- Inheritance math across multiple generations
- XP calculations
- Stat growth per level per language

### Integration Tests (server/routes/)
- Full fight resolution → Redis state update
- Robot creation → initial stats correct
- Retirement → dynasty creation → new robot with inheritance
- Leaderboard updates after fight completion

### Edge Cases
- Robot at 1 HP entering fight
- Language swap during cooldown (should reject)
- Dynasty with 25+ generations (performance)
- Concurrent fights from same user (should prevent)
- Empty leaderboard on first install

---

## 9. LAUNCH STRATEGY

### Phase 1: Core Loop (Week 1-2)
Ship: Robot creation, combat, corner phase, leaderboard
Target subreddits: r/webdev, r/learnprogramming (small, engaged)

### Phase 2: Companions + Depth (Week 3-4)
Ship: Veil, Echo, expanded combat actions, more languages
Target: r/programming, r/javascript, r/rust

### Phase 3: Dynasty Mode (Week 5-6)
Ship: Full dynasty system, Kindred, family tree, hall of fame
Target: r/gamedev, r/incremental_games, r/IndieGaming

### Phase 4: Community Features (Week 7-8)
Ship: Realtime broadcasts, weekly challenges, moderator settings
Target: Wide push across tech subreddits for Qualified Installs

### Success Metrics
- 500 DQE (Tier 1: $500) — achievable with 2-3 active subreddits
- 1,000 DQE (Tier 2: $1,500) — achievable with 5+ active subreddits
- 10,000 DQE (Tier 3: $6,500) — requires viral spread or large subreddit adoption

---

## 10. CONTENT: ENEMY NAME POOL

```typescript
const ENEMY_NAMES = [
  // Error types
  'NULLPTR', 'SEGFAULT', 'STACK_OVERFLOW', 'DEADLOCK', 'RACE_CONDITION',
  'BUFFER_OVERFLOW', 'MEMORY_LEAK', 'SYNTAX_ERROR', 'INFINITE_LOOP',
  'KERNEL_PANIC', 'HEAP_CORRUPTION', 'TYPE_ERROR', 'OFF_BY_ONE',
  'DANGLING_PTR', 'DOUBLE_FREE', 'USE_AFTER_FREE', 'UNDERFLOW',
  
  // Threat types
  'MALWARE_X', 'ROOTKIT', 'TROJAN_HORSE', 'WORM_PROTOCOL', 'RANSOMWARE',
  'ZERO_DAY', 'SQL_INJECT', 'XSS_PHANTOM', 'CSRF_GHOST', 'DDOS_STORM',
  
  // System types
  'DAEMON_9', 'CRON_REAPER', 'FORK_BOMB', 'ZOMBIE_PROC', 'ORPHAN_THREAD',
  'MUTEX_LOCK', 'SEMAPHORE', 'CALLBACK_HELL', 'PROMISE_REJECT',
  
  // Boss names (every 5th fight)
  'THE_COMPILER', 'GARBAGE_COLLECTOR', 'RUNTIME_EXCEPTION',
  'THE_DEBUGGER', 'CORE_DUMP', 'BLUE_SCREEN', 'THE_REWRITE',
  'TECH_DEBT', 'LEGACY_CODE', 'THE_MONOLITH'
];
```

---

## 11. CONTENT: LEARNING TIPS (SAMPLE)

### Rust (30 tips)
```
"Ownership means each value has exactly one owner at a time"
"Use &reference to borrow a value without taking ownership"
"match expressions must cover every possible case"
"String is heap-allocated, &str is a string slice reference"
"The compiler catches data races at compile time"
"Option<T> replaces null — use Some(value) or None"
"Result<T, E> handles errors — use Ok(value) or Err(error)"
"Lifetimes tell the compiler how long references are valid"
"impl adds methods to a struct or enum"
"Vec<T> is a growable array stored on the heap"
```

### JavaScript (30 tips)
```
"const prevents reassignment, but objects/arrays can still be mutated"
"Array.map() creates a new array by transforming each element"
"=== checks both value and type, == only checks value"
"Promises represent a value that may not exist yet"
"async/await makes asynchronous code read like synchronous"
"Destructuring lets you unpack values: const {a, b} = obj"
"Arrow functions don't have their own 'this' context"
"The spread operator ... copies arrays and objects"
"null is intentional absence, undefined means not yet assigned"
"Array.filter() creates a new array with elements that pass a test"
```

(Similar pools for all 10 languages — 30-50 tips each)

---

## END OF DOCUMENT

**This document should be provided as context to all Claude Code agents working on Binary Boxer. Each agent should reference the relevant sections for their domain (combat engine, UI, data layer, etc.).**
