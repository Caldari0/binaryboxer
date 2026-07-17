// ============================================================
// Binary Boxer — Gym-domain tunables (single source)
// ============================================================

/** Gym integrity lights per generation (spec #19: 2–3 lives; gym-pivot #8). */
export const LAMPS_PER_GENERATION = 3;

/** Baseline for every derived stat before leans and growth sources. */
export const BASE_STAT = 10;

/** Chassis integrity ceiling (fighter condition and in-bout health). */
export const MAX_INTEGRITY = 100;

/** Transient bout records live this long between commands. */
export const FIGHT_TTL_SECONDS = 60 * 60 * 24;
