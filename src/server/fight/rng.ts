// ============================================================
// Binary Boxer — Seeded RNG (Mulberry32)
// The one donor technique carried forward verbatim (donor-triage:
// seeded randomness KEEP — determinism powers replay, idempotent
// re-resolution, and the balance harness). Reimplemented here so no
// rebuild module imports the legacy combat engine.
// ============================================================

export class SeededRng {
  #state: number;

  constructor(seed: number) {
    this.#state = seed | 0;
  }

  /** Uniform float in [0, 1). */
  next(): number {
    let t = (this.#state += 0x6d2b79f5) | 0;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Uniform integer in [min, max] inclusive. */
  range(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  chance(probability: number): boolean {
    return this.next() < probability;
  }
}

/** Diminishing-returns curve: stat / (stat + halfPoint) — the donor's
 * proven stat→probability technique, kept for the same reasons. */
export const statToChance = (stat: number, halfPoint: number): number => {
  if (stat <= 0) return 0;
  return stat / (stat + halfPoint);
};
