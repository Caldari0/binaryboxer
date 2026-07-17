// ============================================================
// Binary Boxer — Redis key builders (installation-scoped)
// Devvit Redis is already namespaced per app installation, so keys
// deliberately contain NO postId — embedding it was the v1 bug that
// fragmented profiles across arena posts (spec §6 scoping fix).
// Challenge data is keyed by challengeId (Gate 2 consumer).
// ============================================================

/** The player's persistent gym record. Cross-user readable by design
 * (bantam-decisions #8: async raid snapshots read rival gyms). */
export const gymKey = (username: string): string => `gym:${username}`;

/** One record per Remnant on a gym's roster. */
export const fighterKey = (username: string, fighterId: string): string =>
  `fighter:${username}:${fighterId}`;

/** Transient transactional bout record (TTL'd). */
export const fightKey = (fightId: string): string => `fight:${fightId}`;

/** Pointer from a user to their single active bout, if any. */
export const activeFightKey = (username: string): string => `fight:active:${username}`;

/** Equal-start challenge scores, keyed by challenge id (spec §6). */
export const challengeScoreKey = (challengeId: string): string =>
  `challenge:${challengeId}:scores`;
