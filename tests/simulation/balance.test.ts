// ============================================================
// Balance gates — CI goes red when tuning leaves these corridors.
// Gate 0 corridors are structural (engine soundness + no dominant
// pick); Gate 1 tightens them per archetype × gameplan when the
// real decision model lands. Run `npm run simulate` for the table.
// ============================================================

import { describe, expect, it } from 'vitest';
import { MAX_ROUNDS } from '../../src/server/fight/resolution';
import { formatReport, runSimulation } from '../../src/server/sim/harness';

// 200 seeds/pair: binomial σ ≈ 3.5 pts, so the spread gate measures
// true imbalance, not sampling noise (40/pair alone showed ~30 pts).
const CONFIG = { seedsPerPair: 200 };

const report = runSimulation(CONFIG);

describe('balance simulation gates', () => {
  it('prints the report', () => {
    // eslint-disable-next-line no-console
    console.log(`\n${formatReport(report)}\n`);
    expect(report.totalBouts).toBe(45 * CONFIG.seedsPerPair);
  });

  it('is deterministic — the same grid reproduces the same report', () => {
    expect(runSimulation(CONFIG)).toEqual(report);
  });

  it('GATE: overall fighter win rate stays inside [35%, 65%]', () => {
    // v1 shipped at 0% for most builds. A budget-fair opponent should
    // sit near 50%; drift past this corridor means formula bias.
    expect(report.fighterWinRate).toBeGreaterThanOrEqual(0.35);
    expect(report.fighterWinRate).toBeLessThanOrEqual(0.65);
  });

  it('GATE: no language pair dominates — win-rate spread ≤ 30 pts', () => {
    expect(report.pairSpread).toBeLessThanOrEqual(0.3);
  });

  it('GATE: every pair can win and every pair can lose', () => {
    for (const pair of report.pairStats) {
      expect(pair.winRate, `${pair.pair} never wins`).toBeGreaterThan(0);
      expect(pair.winRate, `${pair.pair} never loses`).toBeLessThan(1);
    }
  });

  it('GATE: bouts end in sane time — mean rounds in [3, 12], never past the cap', () => {
    expect(report.meanRounds).toBeGreaterThanOrEqual(3);
    expect(report.meanRounds).toBeLessThanOrEqual(MAX_ROUNDS);
    expect(report.maxRounds).toBeLessThanOrEqual(MAX_ROUNDS);
    expect(report.minRounds).toBeGreaterThanOrEqual(1);
  });

  it('GATE: both finish methods occur — KO rate in [20%, 95%]', () => {
    expect(report.koRate).toBeGreaterThanOrEqual(0.2);
    expect(report.koRate).toBeLessThanOrEqual(0.95);
  });
});
