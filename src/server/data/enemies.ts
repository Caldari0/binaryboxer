// ============================================================
// Binary Boxer — Enemy Data
// Static data: enemy name pools, boss names, taglines, abilities
// ============================================================

export const ENEMY_NAMES: string[] = [
  // Error types
  'NULLPTR',
  'SEGFAULT',
  'STACK_OVERFLOW',
  'DEADLOCK',
  'RACE_CONDITION',
  'BUFFER_OVERFLOW',
  'MEMORY_LEAK',
  'SYNTAX_ERROR',
  'INFINITE_LOOP',
  'KERNEL_PANIC',
  'HEAP_CORRUPTION',
  'TYPE_ERROR',
  'OFF_BY_ONE',
  'DANGLING_PTR',
  'DOUBLE_FREE',
  'USE_AFTER_FREE',
  'UNDERFLOW',

  // Threat types
  'MALWARE_X',
  'ROOTKIT',
  'TROJAN_HORSE',
  'WORM_PROTOCOL',
  'RANSOMWARE',
  'ZERO_DAY',
  'SQL_INJECT',
  'XSS_PHANTOM',
  'CSRF_GHOST',
  'DDOS_STORM',

  // System types
  'DAEMON_9',
  'CRON_REAPER',
  'FORK_BOMB',
  'ZOMBIE_PROC',
  'ORPHAN_THREAD',
  'MUTEX_LOCK',
  'SEMAPHORE',
  'CALLBACK_HELL',
  'PROMISE_REJECT',
];

export const BOSS_NAMES: string[] = [
  'THE_COMPILER',
  'GARBAGE_COLLECTOR',
  'RUNTIME_EXCEPTION',
  'THE_DEBUGGER',
  'CORE_DUMP',
  'BLUE_SCREEN',
  'THE_REWRITE',
  'TECH_DEBT',
  'LEGACY_CODE',
  'THE_MONOLITH',
];

export const BOSS_TAGLINES: Record<string, string> = {
  THE_COMPILER: 'Your code will not survive optimization',
  GARBAGE_COLLECTOR: 'Everything you built will be reclaimed',
  RUNTIME_EXCEPTION: 'I only appear when you least expect it',
  THE_DEBUGGER: 'I already know every move you will make',
  CORE_DUMP: 'Your memory is laid bare before me',
  BLUE_SCREEN: 'There is no recovery from this',
  THE_REWRITE: 'Everything you are will be replaced',
  TECH_DEBT: 'You cannot outrun what you chose to ignore',
  LEGACY_CODE: 'I have been here longer than you can comprehend',
  THE_MONOLITH: 'I am indivisible. I am eternal. I am everything.',
};

export const BOSS_ABILITIES: Record<string, string> = {
  THE_COMPILER: 'Optimizes away 25% of player defence',
  GARBAGE_COLLECTOR: 'Removes player buffs at the start of each turn',
  RUNTIME_EXCEPTION: 'Has a 30% chance to interrupt player actions',
  THE_DEBUGGER: 'Reads player pattern with 100% accuracy for 3 turns',
  CORE_DUMP: 'Deals bonus damage equal to 10% of player max HP',
  BLUE_SCREEN: 'Forces a crash check every turn with +20% crash chance',
  THE_REWRITE: 'Swaps player power and defence stats for 3 turns',
  TECH_DEBT: 'Gains +5% to all stats for each turn the fight lasts',
  LEGACY_CODE: 'Cannot be critically hit and has double stability',
  THE_MONOLITH: 'Has 2x HP and reduces all incoming damage by 15%',
};
