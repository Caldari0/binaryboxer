// ============================================================
// Binary Boxer — Combat Engine
// Pure functions only: no Redis, no side effects
// Supports active player choice (2-3 actions per turn)
// ============================================================

import type {
  RobotStats,
  CombatAction,
  FightTurn,
  FightState,
  AvailableAction,
  EnemyData,
} from '../../shared/types';

// --- Seeded RNG (Mulberry32) --------------------------------

export class SeededRNG {
  private state: number;

  constructor(seed: number) {
    this.state = seed;
  }

  next(): number {
    let t = (this.state += 0x6d2b79f5) | 0;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  range(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  chance(probability: number): boolean {
    return this.next() < probability;
  }
}

// --- Action Definitions -------------------------------------

type ActionInfo = {
  name: string;
  description: string;
  riskLabel: string;
};

const ACTION_INFO: Record<CombatAction, ActionInfo> = {
  strike: {
    name: 'Strike',
    description: 'Standard attack',
    riskLabel: 'Reliable',
  },
  heavy_strike: {
    name: 'Heavy Strike',
    description: '1.5x damage, might miss',
    riskLabel: 'Risky',
  },
  guard: {
    name: 'Guard',
    description: 'Block next hit, chance to counter',
    riskLabel: 'Safe',
  },
  analyse: {
    name: 'Analyse',
    description: '+30% accuracy next 2 turns',
    riskLabel: 'Setup',
  },
  overclock: {
    name: 'Overclock',
    description: '+50% speed for 2 turns, crash risk',
    riskLabel: 'Volatile',
  },
  combo: {
    name: 'Combo',
    description: '2 hits at 70% damage each',
    riskLabel: 'Aggressive',
  },
  berserk: {
    name: 'Berserk',
    description: '+100% power, -50% defence',
    riskLabel: 'Desperate',
  },
};

// --- Stat to Probability ------------------------------------
// Diminishing returns: stat / (stat + K)
// K = half-point (stat value at which you reach 50%)

const statToChance = (stat: number, halfPoint: number): number => {
  if (stat <= 0) return 0;
  return stat / (stat + halfPoint);
};

// --- Available Actions for Player ---------------------------

export const getAvailableActions = (
  stats: RobotStats,
  currentHp: number,
  maxHp: number,
): AvailableAction[] => {
  const actions: AvailableAction[] = [];
  const hpPercent = currentHp / maxHp;

  // Strike is always available
  actions.push({
    action: 'strike',
    ...ACTION_INFO.strike,
    isPrimary: true,
  });

  // Stat-gated actions
  if (stats.creativity >= 15) {
    actions.push({ action: 'heavy_strike', ...ACTION_INFO.heavy_strike, isPrimary: false });
  }
  if (stats.wisdom >= 15) {
    actions.push({ action: 'guard', ...ACTION_INFO.guard, isPrimary: false });
  }
  if (stats.patternRead >= 10) {
    actions.push({ action: 'analyse', ...ACTION_INFO.analyse, isPrimary: false });
  }
  if (stats.adaptability >= 15) {
    actions.push({ action: 'overclock', ...ACTION_INFO.overclock, isPrimary: false });
  }
  if (stats.creativity + stats.speed > 25) {
    actions.push({ action: 'combo', ...ACTION_INFO.combo, isPrimary: false });
  }
  if (hpPercent < 0.3) {
    actions.push({ action: 'berserk', ...ACTION_INFO.berserk, isPrimary: false });
  }

  // Limit to 3 actions: strike + top 2 by stat affinity
  if (actions.length > 3) {
    const strike = actions[0]!;
    const rest = actions.slice(1);
    rest.sort((a, b) => scoreAction(b.action, stats) - scoreAction(a.action, stats));
    const picked = [strike, rest[0]!, rest[1]!];
    // Promote strongest to primary
    if (scoreAction(picked[1]!.action, stats) > stats.power) {
      picked[0]!.isPrimary = false;
      picked[1]!.isPrimary = true;
    }
    return picked;
  }

  // Mark strongest as primary
  if (actions.length >= 2) {
    let bestIdx = 0;
    let bestScore = 0;
    for (let i = 0; i < actions.length; i++) {
      const s = scoreAction(actions[i]!.action, stats);
      if (s > bestScore) {
        bestScore = s;
        bestIdx = i;
      }
    }
    for (let i = 0; i < actions.length; i++) {
      actions[i]!.isPrimary = i === bestIdx;
    }
  }

  return actions;
};

const scoreAction = (action: CombatAction, stats: RobotStats): number => {
  switch (action) {
    case 'strike': return stats.power;
    case 'heavy_strike': return stats.creativity + stats.power * 0.5;
    case 'guard': return stats.wisdom + stats.blockChance;
    case 'analyse': return stats.patternRead * 2;
    case 'overclock': return stats.adaptability + stats.speed;
    case 'combo': return stats.creativity + stats.speed;
    case 'berserk': return stats.power * 2;
    default: return 0;
  }
};

// --- Damage Calculation (GDD Formula) -----------------------

type DamageResult = {
  damage: number;
  crit: boolean;
  blocked: boolean;
  dodged: boolean;
  counterAttack: boolean;
  counterDamage: number;
};

const calculateDamage = (
  attacker: RobotStats,
  defender: RobotStats,
  attackerLevel: number,
  defenderLevel: number,
  action: CombatAction,
  rng: SeededRNG,
  defenderGuarding: boolean,
  defenderBerserk: boolean,
): DamageResult => {
  const noDamage: DamageResult = { damage: 0, crit: false, blocked: false, dodged: false, counterAttack: false, counterDamage: 0 };

  // Guard deals no damage
  if (action === 'guard' || action === 'analyse') {
    return noDamage;
  }

  // Dodge check
  const dodgeChance = statToChance(defender.evasion, 80);
  if (rng.chance(dodgeChance)) {
    return { ...noDamage, dodged: true };
  }

  // Heavy strike accuracy penalty (20% miss chance)
  if (action === 'heavy_strike' && rng.chance(0.2)) {
    return { ...noDamage, dodged: true };
  }

  // Base damage: GDD formula
  let baseDamage = attacker.power * (1 + attackerLevel * 0.05);

  // Action multipliers
  switch (action) {
    case 'heavy_strike': baseDamage *= 1.5; break;
    case 'combo': baseDamage *= 0.7; break;
    case 'berserk': baseDamage *= 2.0; break;
    case 'overclock': baseDamage *= 1.1; break;
  }

  // Defence reduction
  const penFactor = Math.max(0, 1 - attacker.penetration / 100);
  const effectiveDefence = defender.defence * penFactor;

  // If defender is in berserk mode, their defence is halved (berserk trade-off)
  const finalDefence = defenderBerserk ? effectiveDefence * 0.5 : effectiveDefence;
  let finalDamage = Math.max(1, baseDamage - finalDefence);

  // Crit check
  const critChance = statToChance(attacker.critChance, 50);
  const crit = rng.chance(critChance);
  if (crit) finalDamage *= 2;

  // Block check (boosted if defender is guarding)
  let blockChance = statToChance(defender.blockChance, 50);
  if (defenderGuarding) blockChance = Math.min(0.9, blockChance + 0.5);
  const blocked = rng.chance(blockChance);
  if (blocked) finalDamage *= 0.5;

  // Counter check (only on block)
  let counterAttack = false;
  let counterDamage = 0;
  if (blocked) {
    let counterChance = statToChance(defender.counter, 75);
    if (defenderGuarding) counterChance = Math.min(0.8, counterChance + 0.3);
    counterAttack = rng.chance(counterChance);
    if (counterAttack) {
      const counterBase = defender.power * (1 + defenderLevel * 0.05) * 0.6;
      const counterReduction = attacker.defence * (1 - defender.penetration / 100);
      counterDamage = Math.max(1, Math.round(counterBase - counterReduction));
    }
  }

  return {
    damage: Math.round(finalDamage),
    crit,
    blocked,
    dodged: false,
    counterAttack,
    counterDamage,
  };
};

// --- Enemy AI -----------------------------------------------

export const getEnemyAction = (
  enemyStats: RobotStats,
  enemyHpPercent: number,
  rng: SeededRNG,
): CombatAction => {
  if (enemyHpPercent < 0.3 && rng.chance(0.6)) return 'berserk';

  const pool: { action: CombatAction; weight: number }[] = [
    { action: 'strike', weight: 30 },
  ];

  if (enemyStats.creativity >= 15) pool.push({ action: 'heavy_strike', weight: 20 });
  if (enemyStats.wisdom >= 15) pool.push({ action: 'guard', weight: 15 });
  if (enemyStats.creativity + enemyStats.speed > 25) pool.push({ action: 'combo', weight: 18 });
  if (enemyStats.adaptability >= 15) pool.push({ action: 'overclock', weight: 10 });

  const totalWeight = pool.reduce((sum, p) => sum + p.weight, 0);
  let roll = rng.next() * totalWeight;
  for (const entry of pool) {
    roll -= entry.weight;
    if (roll <= 0) return entry.action;
  }
  return 'strike';
};

// --- Flavour Text -------------------------------------------

const FLAVOUR = {
  playerHit: [
    '{robot} lands a clean hit on {enemy}!',
    '{robot} strikes {enemy} with precision!',
    '{robot} connects! Solid impact!',
    '{robot} drives through {enemy}\'s guard!',
    '{robot} tags {enemy} with a sharp blow!',
  ],
  enemyHit: [
    '{enemy} strikes back at {robot}!',
    '{enemy} lands a punishing blow!',
    '{enemy} finds an opening!',
    '{enemy} retaliates with force!',
    '{enemy} connects with {robot}!',
  ],
  crit: [
    'CRITICAL HIT! {attacker} finds the weak point!',
    'DEVASTATING! {attacker} hits where it hurts!',
    'MASSIVE IMPACT! {attacker} tears through!',
  ],
  dodge: [
    '{defender} sidesteps the attack!',
    '{defender} reads the pattern and dodges!',
    'Clean miss! {defender} is untouchable!',
  ],
  block: [
    '{defender} blocks! Damage reduced!',
    '{defender}\'s armour absorbs the blow!',
    '{defender} braces and takes half damage!',
  ],
  counter: [
    '{defender} counters immediately!',
    '{defender} blocks and strikes back!',
  ],
  guard: [
    '{actor} raises their guard!',
    '{actor} tightens stance defensively!',
  ],
  berserk: [
    '{actor} enters BERSERK MODE!',
    '{actor}\'s systems overload — BERSERK!',
  ],
  analyse: [
    '{actor} scans for weaknesses...',
    '{actor} reads the pattern...',
  ],
  combo: [
    '{actor} unleashes a rapid COMBO!',
    '{actor} chains a double strike!',
  ],
  heavyStrike: [
    '{actor} winds up a HEAVY STRIKE!',
    '{actor} puts everything into one swing!',
  ],
  overclock: [
    '{actor} OVERCLOCKS — systems spike!',
    '{actor} pushes past safe limits!',
  ],
  crash: [
    '{actor} crashes mid-attack! Stunned!',
    '{actor}\'s systems glitch — lost a turn!',
  ],
};

const pick = (arr: string[], rng: SeededRNG): string => arr[rng.range(0, arr.length - 1)]!;

const template = (str: string, vars: Record<string, string>): string =>
  str.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? key);

const makeFlavour = (
  side: 'player' | 'enemy',
  action: CombatAction,
  result: DamageResult,
  robotName: string,
  enemyName: string,
  rng: SeededRNG,
): string => {
  const v = {
    robot: robotName,
    enemy: enemyName,
    attacker: side === 'player' ? robotName : enemyName,
    defender: side === 'player' ? enemyName : robotName,
    actor: side === 'player' ? robotName : enemyName,
  };

  // Special action announcements
  if (action === 'guard') return template(pick(FLAVOUR.guard, rng), v);
  if (action === 'berserk') return template(pick(FLAVOUR.berserk, rng), v);
  if (action === 'analyse') return template(pick(FLAVOUR.analyse, rng), v);

  // Result-based
  if (result.dodged) return template(pick(FLAVOUR.dodge, rng), v);
  if (result.crit) return template(pick(FLAVOUR.crit, rng), v);
  if (result.counterAttack) return template(pick(FLAVOUR.counter, rng), v);
  if (result.blocked) return template(pick(FLAVOUR.block, rng), v);

  // Action-specific hit text
  if (action === 'heavy_strike') return template(pick(FLAVOUR.heavyStrike, rng), v);
  if (action === 'combo') return template(pick(FLAVOUR.combo, rng), v);
  if (action === 'overclock') return template(pick(FLAVOUR.overclock, rng), v);

  // Default hit
  return template(pick(side === 'player' ? FLAVOUR.playerHit : FLAVOUR.enemyHit, rng), v);
};

// --- Boss Ability Effects ------------------------------------

type BossEffects = {
  /** Multiplier applied to player's effective defence (THE_COMPILER: 0.75) */
  playerDefenceMult: number;
  /** Chance that player's action is interrupted (RUNTIME_EXCEPTION: 0.3) */
  interruptChance: number;
  /** Flat bonus damage added to enemy attacks (CORE_DUMP: 10% maxHp) */
  bonusFlatDamage: number;
  /** Extra crash chance on ALL player actions (BLUE_SCREEN: 0.2) */
  extraCrashChance: number;
  /** Multiplier on all enemy stats this round (TECH_DEBT: 1 + 0.05*round) */
  enemyStatMult: number;
  /** Enemy cannot be critically hit (LEGACY_CODE) */
  critImmune: boolean;
  /** Enemy stability multiplier (LEGACY_CODE: 2x) */
  enemyStabilityMult: number;
  /** Damage reduction on all damage dealt to enemy (THE_MONOLITH: 0.15) */
  damageReduction: number;
  /** Player cannot guard (GARBAGE_COLLECTOR negates defensive buffs) */
  negatePlayerGuard: boolean;
  /** Enemy auto-dodges player attacks (THE_DEBUGGER: first 3 rounds) */
  enemyAutoDodge: boolean;
  /** Swap player power and defence (THE_REWRITE: first 3 rounds) */
  swapPlayerPowerDef: boolean;
};

const DEFAULT_BOSS_EFFECTS: BossEffects = {
  playerDefenceMult: 1,
  interruptChance: 0,
  bonusFlatDamage: 0,
  extraCrashChance: 0,
  enemyStatMult: 1,
  critImmune: false,
  enemyStabilityMult: 1,
  damageReduction: 0,
  negatePlayerGuard: false,
  enemyAutoDodge: false,
  swapPlayerPowerDef: false,
};

const getBossEffects = (enemy: EnemyData, round: number, playerMaxHp: number): BossEffects => {
  if (!enemy.isBoss || !enemy.bossAbility) return { ...DEFAULT_BOSS_EFFECTS };
  const fx = { ...DEFAULT_BOSS_EFFECTS };

  switch (enemy.name) {
    case 'THE_COMPILER':
      fx.playerDefenceMult = 0.75;
      break;
    case 'GARBAGE_COLLECTOR':
      fx.negatePlayerGuard = true;
      break;
    case 'RUNTIME_EXCEPTION':
      fx.interruptChance = 0.3;
      break;
    case 'THE_DEBUGGER':
      if (round <= 3) fx.enemyAutoDodge = true;
      break;
    case 'CORE_DUMP':
      fx.bonusFlatDamage = Math.floor(playerMaxHp * 0.1);
      break;
    case 'BLUE_SCREEN':
      fx.extraCrashChance = 0.2;
      break;
    case 'THE_REWRITE':
      if (round <= 3) fx.swapPlayerPowerDef = true;
      break;
    case 'TECH_DEBT':
      fx.enemyStatMult = 1 + 0.05 * round;
      break;
    case 'LEGACY_CODE':
      fx.critImmune = true;
      fx.enemyStabilityMult = 2;
      break;
    case 'THE_MONOLITH':
      fx.damageReduction = 0.15;
      break;
  }

  return fx;
};

/** Apply boss stat multipliers to a copy of enemy stats */
const applyBossStatMods = (stats: RobotStats, fx: BossEffects): RobotStats => {
  if (fx.enemyStatMult === 1 && fx.enemyStabilityMult === 1) return stats;
  const s = { ...stats };
  if (fx.enemyStatMult !== 1) {
    for (const key of Object.keys(s) as (keyof RobotStats)[]) {
      if (key !== 'hp' && key !== 'maxHp') {
        s[key] = Math.round(s[key] * fx.enemyStatMult);
      }
    }
  }
  if (fx.enemyStabilityMult !== 1) {
    s.stability = Math.round(s.stability * fx.enemyStabilityMult);
  }
  return s;
};

/** Apply boss mods to a copy of player stats (defence reduction, power/def swap) */
const applyPlayerStatMods = (stats: RobotStats, fx: BossEffects): RobotStats => {
  if (fx.playerDefenceMult === 1 && !fx.swapPlayerPowerDef) return stats;
  const s = { ...stats };
  if (fx.swapPlayerPowerDef) {
    const tmp = s.power;
    s.power = s.defence;
    s.defence = tmp;
  }
  if (fx.playerDefenceMult !== 1) {
    s.defence = Math.round(s.defence * fx.playerDefenceMult);
  }
  return s;
};

// --- Fight Initialization -----------------------------------

export const initFight = (
  playerStats: RobotStats,
  enemy: EnemyData,
  seed: number,
): FightState => {
  const actions = getAvailableActions(playerStats, playerStats.hp, playerStats.maxHp);

  return {
    enemy,
    seed,
    turns: [],
    result: 'pending',
    xpAwarded: 0,
    playerStatsSnapshot: { ...playerStats },
    currentRound: 0,
    availableActions: actions,
    autoPilot: false,
    currentHp: playerStats.hp,
    enemyCurrentHp: enemy.stats.hp,
  };
};

// --- Round Resolution (the core loop) -----------------------

export type RoundResult = {
  state: FightState;
  playerTurn: FightTurn;
  enemyTurn: FightTurn | null;
};

export const resolveRound = (
  state: FightState,
  playerAction: CombatAction,
  playerLevel: number,
  robotName: string,
): RoundResult => {
  const rng = new SeededRNG(state.seed + state.currentRound * 997);
  const round = state.currentRound + 1;

  // Boss ability effects for this round
  const bossFx = getBossEffects(state.enemy, round, state.playerStatsSnapshot.maxHp);
  const playerStats = applyPlayerStatMods(state.playerStatsSnapshot, bossFx);
  const enemyStats = applyBossStatMods(state.enemy.stats, bossFx);
  const enemyName = state.enemy.name;

  // Turn order: higher speed goes first, ties to player
  const playerFirst = playerStats.speed >= enemyStats.speed;

  // GARBAGE_COLLECTOR negates player guard
  const effectivePlayerAction: CombatAction =
    bossFx.negatePlayerGuard && playerAction === 'guard' ? 'strike' : playerAction;

  // RUNTIME_EXCEPTION: chance to interrupt player action
  const interrupted = bossFx.interruptChance > 0 && rng.chance(bossFx.interruptChance);
  const finalPlayerAction: CombatAction = interrupted ? 'strike' : effectivePlayerAction;

  const playerGuarding = finalPlayerAction === 'guard';

  // Crash check: overclock always has crash risk, BLUE_SCREEN adds crash chance to all actions
  let playerCrashed = false;
  if (finalPlayerAction === 'overclock') {
    const crashChance = Math.max(0.05, 0.2 + bossFx.extraCrashChance - statToChance(playerStats.stability, 60));
    playerCrashed = rng.chance(crashChance);
  } else if (bossFx.extraCrashChance > 0) {
    playerCrashed = rng.chance(bossFx.extraCrashChance);
  }

  // Enemy action
  const enemyHpPercent = state.enemyCurrentHp / enemyStats.maxHp;
  const enemyAction = getEnemyAction(enemyStats, enemyHpPercent, rng);
  const enemyGuarding = enemyAction === 'guard';

  let pHp = state.currentHp;
  let eHp = state.enemyCurrentHp;

  // --- Resolve in speed order ---

  // FIRST ATTACKER
  const firstSide = playerFirst ? 'player' : 'enemy';
  const firstAction = playerFirst ? finalPlayerAction : enemyAction;
  const firstStats = playerFirst ? playerStats : enemyStats;
  const firstDefStats = playerFirst ? enemyStats : playerStats;
  const firstLevel = playerFirst ? playerLevel : state.enemy.level;
  const firstDefLevel = playerFirst ? state.enemy.level : playerLevel;
  const firstDefGuarding = playerFirst ? enemyGuarding : playerGuarding;
  const firstDefBerserk = playerFirst ? enemyAction === 'berserk' : finalPlayerAction === 'berserk';
  const firstCrashed = playerFirst ? playerCrashed : false;

  let firstResult: DamageResult;
  if (firstCrashed) {
    firstResult = { damage: 0, crit: false, blocked: false, dodged: false, counterAttack: false, counterDamage: 0 };
  } else if (playerFirst && bossFx.enemyAutoDodge) {
    // THE_DEBUGGER: enemy auto-dodges player attacks
    firstResult = { damage: 0, crit: false, blocked: false, dodged: true, counterAttack: false, counterDamage: 0 };
  } else {
    firstResult = calculateDamage(firstStats, firstDefStats, firstLevel, firstDefLevel, firstAction, rng, firstDefGuarding, firstDefBerserk);
  }

  // Boss: crit immunity (LEGACY_CODE)
  if (bossFx.critImmune && playerFirst && firstResult.crit) {
    firstResult = { ...firstResult, crit: false, damage: Math.round(firstResult.damage / 2) };
  }

  // Boss: damage reduction (THE_MONOLITH) — reduce damage dealt to enemy
  if (bossFx.damageReduction > 0 && playerFirst && firstResult.damage > 0) {
    firstResult = { ...firstResult, damage: Math.max(1, Math.round(firstResult.damage * (1 - bossFx.damageReduction))) };
  }

  // Boss: bonus flat damage on enemy attacks (CORE_DUMP)
  if (bossFx.bonusFlatDamage > 0 && !playerFirst && firstResult.damage > 0) {
    firstResult = { ...firstResult, damage: firstResult.damage + bossFx.bonusFlatDamage };
  }

  // Apply first attacker's damage
  if (playerFirst) {
    eHp = Math.max(0, eHp - firstResult.damage);
    pHp = Math.max(0, pHp - firstResult.counterDamage);
    // Combo second hit
    if (firstAction === 'combo' && !firstResult.dodged && eHp > 0 && !firstCrashed) {
      let combo2 = calculateDamage(playerStats, enemyStats, playerLevel, state.enemy.level, 'combo', rng, enemyGuarding, enemyAction === 'berserk');
      if (bossFx.critImmune && combo2.crit) combo2 = { ...combo2, crit: false, damage: Math.round(combo2.damage / 2) };
      if (bossFx.damageReduction > 0 && combo2.damage > 0) combo2 = { ...combo2, damage: Math.max(1, Math.round(combo2.damage * (1 - bossFx.damageReduction))) };
      eHp = Math.max(0, eHp - combo2.damage);
    }
  } else {
    pHp = Math.max(0, pHp - firstResult.damage);
    eHp = Math.max(0, eHp - firstResult.counterDamage);
    if (firstAction === 'combo' && !firstResult.dodged && pHp > 0) {
      const combo2 = calculateDamage(enemyStats, playerStats, state.enemy.level, playerLevel, 'combo', rng, playerGuarding, finalPlayerAction === 'berserk');
      pHp = Math.max(0, pHp - combo2.damage + (bossFx.bonusFlatDamage > 0 ? bossFx.bonusFlatDamage : 0));
    }
  }

  const firstFlavour = firstCrashed
    ? template(pick(FLAVOUR.crash, rng), { actor: playerFirst ? robotName : enemyName, robot: robotName, enemy: enemyName, attacker: '', defender: '' })
    : makeFlavour(firstSide, firstAction, firstResult, robotName, enemyName, rng);

  const firstTurn: FightTurn = {
    turnNumber: round * 2 - 1,
    attacker: firstSide,
    action: firstAction,
    damage: firstResult.damage,
    blocked: firstResult.blocked,
    dodged: firstResult.dodged,
    critical: firstResult.crit,
    crashed: firstCrashed,
    counterAttack: firstResult.counterAttack,
    playerHpAfter: pHp,
    enemyHpAfter: eHp,
    flavourText: firstFlavour,
  };

  // Check if fight over after first attacker
  const firstKo = playerFirst ? eHp <= 0 : pHp <= 0;
  if (firstKo) {
    const result = (playerFirst && eHp <= 0) ? 'win' as const : 'loss' as const;
    const newState: FightState = {
      ...state,
      currentRound: round,
      turns: [...state.turns, firstTurn],
      result,
      currentHp: pHp,
      enemyCurrentHp: eHp,
      availableActions: [],
    };
    return {
      state: newState,
      playerTurn: playerFirst ? firstTurn : firstTurn, // will fix below
      enemyTurn: playerFirst ? null : firstTurn,
    };
  }

  // SECOND ATTACKER
  const secondSide = playerFirst ? 'enemy' : 'player';
  const secondAction = playerFirst ? enemyAction : finalPlayerAction;
  const secondStats = playerFirst ? enemyStats : playerStats;
  const secondDefStats = playerFirst ? playerStats : enemyStats;
  const secondLevel = playerFirst ? state.enemy.level : playerLevel;
  const secondDefLevel = playerFirst ? playerLevel : state.enemy.level;
  const secondDefGuarding = playerFirst ? playerGuarding : enemyGuarding;
  const secondDefBerserk = playerFirst ? finalPlayerAction === 'berserk' : enemyAction === 'berserk';
  const secondCrashed = playerFirst ? false : playerCrashed;

  let secondResult: DamageResult;
  if (secondCrashed) {
    secondResult = { damage: 0, crit: false, blocked: false, dodged: false, counterAttack: false, counterDamage: 0 };
  } else if (!playerFirst && bossFx.enemyAutoDodge) {
    // THE_DEBUGGER: enemy auto-dodges player attacks
    secondResult = { damage: 0, crit: false, blocked: false, dodged: true, counterAttack: false, counterDamage: 0 };
  } else {
    secondResult = calculateDamage(secondStats, secondDefStats, secondLevel, secondDefLevel, secondAction, rng, secondDefGuarding, secondDefBerserk);
  }

  // Boss: crit immunity (LEGACY_CODE)
  if (bossFx.critImmune && !playerFirst && secondResult.crit) {
    secondResult = { ...secondResult, crit: false, damage: Math.round(secondResult.damage / 2) };
  }

  // Boss: damage reduction (THE_MONOLITH) — reduce damage dealt to enemy
  if (bossFx.damageReduction > 0 && !playerFirst && secondResult.damage > 0) {
    secondResult = { ...secondResult, damage: Math.max(1, Math.round(secondResult.damage * (1 - bossFx.damageReduction))) };
  }

  // Boss: bonus flat damage on enemy attacks (CORE_DUMP)
  if (bossFx.bonusFlatDamage > 0 && playerFirst && secondResult.damage > 0) {
    secondResult = { ...secondResult, damage: secondResult.damage + bossFx.bonusFlatDamage };
  }

  // Apply second attacker's damage
  if (playerFirst) {
    // Enemy attacks player
    pHp = Math.max(0, pHp - secondResult.damage);
    eHp = Math.max(0, eHp - secondResult.counterDamage);
    if (secondAction === 'combo' && !secondResult.dodged && pHp > 0) {
      const combo2 = calculateDamage(enemyStats, playerStats, state.enemy.level, playerLevel, 'combo', rng, playerGuarding, finalPlayerAction === 'berserk');
      pHp = Math.max(0, pHp - combo2.damage + (bossFx.bonusFlatDamage > 0 ? bossFx.bonusFlatDamage : 0));
    }
  } else {
    // Player attacks enemy
    eHp = Math.max(0, eHp - secondResult.damage);
    pHp = Math.max(0, pHp - secondResult.counterDamage);
    if (secondAction === 'combo' && !secondResult.dodged && eHp > 0 && !secondCrashed) {
      let combo2 = calculateDamage(playerStats, enemyStats, playerLevel, state.enemy.level, 'combo', rng, enemyGuarding, enemyAction === 'berserk');
      if (bossFx.critImmune && combo2.crit) combo2 = { ...combo2, crit: false, damage: Math.round(combo2.damage / 2) };
      if (bossFx.damageReduction > 0 && combo2.damage > 0) combo2 = { ...combo2, damage: Math.max(1, Math.round(combo2.damage * (1 - bossFx.damageReduction))) };
      eHp = Math.max(0, eHp - combo2.damage);
    }
  }

  const secondFlavour = secondCrashed
    ? template(pick(FLAVOUR.crash, rng), { actor: playerFirst ? enemyName : robotName, robot: robotName, enemy: enemyName, attacker: '', defender: '' })
    : makeFlavour(secondSide, secondAction, secondResult, robotName, enemyName, rng);

  const secondTurn: FightTurn = {
    turnNumber: round * 2,
    attacker: secondSide,
    action: secondAction,
    damage: secondResult.damage,
    blocked: secondResult.blocked,
    dodged: secondResult.dodged,
    critical: secondResult.crit,
    crashed: secondCrashed,
    counterAttack: secondResult.counterAttack,
    playerHpAfter: pHp,
    enemyHpAfter: eHp,
    flavourText: secondFlavour,
  };

  // Determine fight result
  let result: 'win' | 'loss' | 'pending' = 'pending';
  if (eHp <= 0 && pHp <= 0) result = 'loss';
  else if (eHp <= 0) result = 'win';
  else if (pHp <= 0) result = 'loss';

  // Safety valve
  if (result === 'pending' && round >= MAX_ROUNDS) {
    result = pHp >= eHp ? 'win' : 'loss';
  }

  const nextActions = result === 'pending'
    ? getAvailableActions(playerStats, pHp, playerStats.maxHp)
    : [];

  const newState: FightState = {
    ...state,
    currentRound: round,
    turns: [...state.turns, firstTurn, secondTurn],
    result,
    currentHp: pHp,
    enemyCurrentHp: eHp,
    availableActions: nextActions,
  };

  // Return with proper player/enemy turn assignment
  const playerTurn = playerFirst ? firstTurn : secondTurn;
  const enemyTurn = playerFirst ? secondTurn : firstTurn;

  return { state: newState, playerTurn, enemyTurn };
};

// --- Auto-pilot: AI picks best action for player -----------

export const autoPickAction = (
  actions: AvailableAction[],
): CombatAction => {
  const primary = actions.find((a) => a.isPrimary);
  return primary?.action ?? 'strike';
};

// --- Constants ----------------------------------------------

export const MAX_ROUNDS = 50;
