// ============================================================
// Binary Boxer — Balance simulation harness (pure)
// Drives the real resolution core across the full language-pair
// space × a seed grid and aggregates outcome statistics. The
// simulation TEST suite asserts corridors over this report; CI goes
// red when tuning drifts out of them. v1 shipped 0%-win-rate
// unwinnable because nothing machine-checked balance — this is the
// audit's promoted Gate 0 deliverable that retires hand-tuning.
// ============================================================

import {
  LanguageIdSchema,
  emptyGrowthSources,
  type LanguagePair,
} from '../../shared/contracts';
import { MAX_INTEGRITY } from '../gym/constants';
import { deriveStats } from '../gym/derive';
import { generateOpponent } from '../fight/opponent';
import { resolveUntil, type BoutState } from '../fight/resolution';

export type PairStats = {
  pair: string;
  bouts: number;
  wins: number;
  winRate: number;
};

export type SimReport = {
  totalBouts: number;
  fighterWinRate: number;
  koRate: number;
  meanRounds: number;
  minRounds: number;
  maxRounds: number;
  pairStats: PairStats[];
  /** max pair win rate − min pair win rate: the dominance detector. */
  pairSpread: number;
};

export type SimConfig = {
  seedsPerPair: number;
  seedOffset?: number;
};

const allPairs = (): LanguagePair[] => {
  const ids = LanguageIdSchema.options;
  const pairs: LanguagePair[] = [];
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      pairs.push([ids[i]!, ids[j]!] as LanguagePair);
    }
  }
  return pairs;
};

export const runSimulation = (config: SimConfig): SimReport => {
  const pairs = allPairs();
  const offset = config.seedOffset ?? 0;

  let wins = 0;
  let kos = 0;
  let roundsSum = 0;
  let minRounds = Number.POSITIVE_INFINITY;
  let maxRounds = 0;
  const pairStats: PairStats[] = [];

  for (const pair of pairs) {
    const stats = deriveStats(pair, emptyGrowthSources());
    let pairWins = 0;

    for (let i = 0; i < config.seedsPerPair; i++) {
      const seed = offset + i * 1013 + pairStats.length * 7;
      const opponent = generateOpponent(seed);
      const initial: BoutState = {
        round: 0,
        fighter: { name: 'SIM', stats, integrity: MAX_INTEGRITY, maxIntegrity: MAX_INTEGRITY },
        opponent: {
          name: opponent.name,
          stats: opponent.stats,
          integrity: opponent.maxIntegrity,
          maxIntegrity: opponent.maxIntegrity,
        },
      };
      const result = resolveUntil(initial, seed);
      if (result.status !== 'terminal' || !result.outcome) {
        throw new Error(`simulation bout did not terminate (pair ${pair.join('+')}, seed ${seed})`);
      }
      if (result.outcome.winner === 'fighter') {
        wins += 1;
        pairWins += 1;
      }
      if (result.outcome.method === 'ko') kos += 1;
      roundsSum += result.state.round;
      minRounds = Math.min(minRounds, result.state.round);
      maxRounds = Math.max(maxRounds, result.state.round);
    }

    pairStats.push({
      pair: pair.join('+'),
      bouts: config.seedsPerPair,
      wins: pairWins,
      winRate: pairWins / config.seedsPerPair,
    });
  }

  const totalBouts = pairs.length * config.seedsPerPair;
  const rates = pairStats.map((p) => p.winRate);
  return {
    totalBouts,
    fighterWinRate: wins / totalBouts,
    koRate: kos / totalBouts,
    meanRounds: roundsSum / totalBouts,
    minRounds,
    maxRounds,
    pairStats,
    pairSpread: Math.max(...rates) - Math.min(...rates),
  };
};

export const formatReport = (report: SimReport): string => {
  const sorted = [...report.pairStats].sort((a, b) => b.winRate - a.winRate);
  const top = sorted
    .slice(0, 5)
    .map((p) => `    ${p.pair.padEnd(22)} ${(p.winRate * 100).toFixed(0)}%`)
    .join('\n');
  const bottom = sorted
    .slice(-5)
    .map((p) => `    ${p.pair.padEnd(22)} ${(p.winRate * 100).toFixed(0)}%`)
    .join('\n');
  return [
    `balance simulation — ${report.totalBouts} bouts across ${report.pairStats.length} language pairs`,
    `  fighter win rate : ${(report.fighterWinRate * 100).toFixed(1)}%`,
    `  KO rate          : ${(report.koRate * 100).toFixed(1)}%`,
    `  rounds           : min ${report.minRounds} · mean ${report.meanRounds.toFixed(1)} · max ${report.maxRounds}`,
    `  pair spread      : ${(report.pairSpread * 100).toFixed(1)} pts`,
    `  strongest pairs:\n${top}`,
    `  weakest pairs:\n${bottom}`,
  ].join('\n');
};
