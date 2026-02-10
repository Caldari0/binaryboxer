// ============================================================
// Binary Boxer — DynastyTree Component
// Dynasty family tree visualization with tree connectors
// ============================================================

import type { ReactElement } from 'react';

type DynastyGenerationData = {
  generationNumber: number;
  robotName: string;
  language1: string;
  language2: string;
  finalLevel: number;
  totalFights: number;
  wins: number;
  bestStreak: number;
  causeOfRetirement: string;
};

type DynastyData = {
  generations: Array<DynastyGenerationData>;
  totalFights: number;
  totalWins: number;
  deepestLevel: number;
};

type CurrentRobot = {
  robotName: string;
  level: number;
  language1: string;
  language2: string;
  generation: number;
};

type DynastyTreeProps = {
  dynasty: DynastyData | null;
  currentRobot: CurrentRobot | null;
  onBack: () => void;
};

type DynastyTitle =
  | 'Prototype'
  | 'Lineage'
  | 'Legacy'
  | 'Dynasty'
  | 'Empire'
  | 'Eternal';

const getDynastyTitle = (generationCount: number): DynastyTitle => {
  if (generationCount >= 25) return 'Eternal';
  if (generationCount >= 10) return 'Empire';
  if (generationCount >= 5) return 'Dynasty';
  if (generationCount >= 3) return 'Legacy';
  if (generationCount >= 2) return 'Lineage';
  return 'Prototype';
};

const getDynastyTitleColor = (title: DynastyTitle): string => {
  switch (title) {
    case 'Eternal':
      return 'var(--bb-kindred)';
    case 'Empire':
      return 'var(--bb-veil)';
    case 'Dynasty':
      return 'var(--bb-xp)';
    case 'Legacy':
      return 'var(--bb-echo)';
    case 'Lineage':
      return 'var(--bb-hp-high)';
    case 'Prototype':
      return 'var(--bb-text-dim)';
  }
};

export const DynastyTree = ({
  dynasty,
  currentRobot,
  onBack,
}: DynastyTreeProps): ReactElement => {
  const totalGenerations =
    (dynasty?.generations.length ?? 0) + (currentRobot ? 1 : 0);
  const title = getDynastyTitle(totalGenerations);
  const titleColor = getDynastyTitleColor(title);

  const combinedFights = dynasty?.totalFights ?? 0;
  const combinedWins = dynasty?.totalWins ?? 0;
  const bestStreak = Math.max(
    dynasty?.generations.reduce((max, g) => Math.max(max, g.bestStreak), 0) ?? 0,
    0,
  );

  return (
    <div className="bb-screen-enter" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--bb-space-md)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="bb-title bb-fluid-lg">Dynasty Tree</div>
        <button type="button" className="bb-btn" style={{ fontSize: '0.7rem', minHeight: '28px', padding: '4px 12px' }} onClick={onBack}>
          Back
        </button>
      </div>

      {/* Dynasty Title */}
      <div className="bb-panel bb-panel--glowing" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: titleColor, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          {title}
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--bb-text-muted)', marginTop: '2px' }}>
          {totalGenerations} Generation{totalGenerations !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Stats Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--bb-space-xs)' }}>
        {[
          { label: 'GENS', value: totalGenerations },
          { label: 'FIGHTS', value: combinedFights },
          { label: 'WINS', value: combinedWins },
          { label: 'STREAK', value: bestStreak },
        ].map((stat) => (
          <div key={stat.label} className="bb-panel" style={{ textAlign: 'center', padding: 'var(--bb-space-sm)' }}>
            <div className="bb-stat-label">{stat.label}</div>
            <div className="bb-stat-value" style={{ fontSize: '0.85rem' }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Tree Visualization */}
      <div className="bb-panel bb-mono" style={{ fontSize: '0.7rem', overflowY: 'auto', maxHeight: '300px', padding: 'var(--bb-space-md)' }}>
        {(!dynasty || dynasty.generations.length === 0) && !currentRobot && (
          <div style={{ color: 'var(--bb-text-dim)' }}>
            No dynasty history yet.
          </div>
        )}

        {dynasty?.generations.map((gen, index) => {
          const isLast = index === dynasty.generations.length - 1 && !currentRobot;
          const connector = isLast ? '\u2514' : '\u251C';
          const line = isLast ? ' ' : '\u2502';

          return (
            <div key={gen.generationNumber} style={{ color: 'var(--bb-text-muted)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
                <span style={{ color: 'var(--bb-text-dim)', userSelect: 'none', width: '16px', flexShrink: 0 }}>
                  {connector}{'\u2500'}
                </span>
                <div style={{ flex: 1 }}>
                  <span style={{ color: 'var(--bb-text-secondary)', fontWeight: 600 }}>
                    {gen.robotName}
                  </span>
                  <span style={{ color: 'var(--bb-text-dim)', marginLeft: '4px', fontSize: '0.6rem' }}>
                    Gen {gen.generationNumber}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '4px', marginLeft: '16px', marginBottom: '4px' }}>
                <span style={{ color: 'var(--bb-text-dim)', userSelect: 'none', width: '16px', flexShrink: 0 }}>
                  {line}
                </span>
                <div style={{ flex: 1, fontSize: '0.6rem', color: 'var(--bb-text-dim)' }}>
                  {gen.language1.toUpperCase()} + {gen.language2.toUpperCase()} | Lv.
                  {gen.finalLevel} | {gen.wins}/{gen.totalFights} W/F | Streak{' '}
                  {gen.bestStreak} |{' '}
                  {gen.causeOfRetirement === 'voluntary' ? 'Retired' : 'KO\'d'}
                </div>
              </div>
            </div>
          );
        })}

        {/* Current Robot */}
        {currentRobot && (
          <div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
              <span style={{ color: 'var(--bb-text-dim)', userSelect: 'none', width: '16px', flexShrink: 0 }}>
                {'\u2514\u2500'}
              </span>
              <div style={{ flex: 1 }}>
                <span style={{ color: 'var(--bb-hp-high)', fontWeight: 700 }}>
                  {currentRobot.robotName}
                </span>
                <span style={{ color: 'var(--bb-xp)', marginLeft: '4px', fontSize: '0.65rem' }}>
                  Gen {currentRobot.generation}
                </span>
                <span style={{ color: 'var(--bb-hp-high)', marginLeft: '4px', fontSize: '0.6rem', fontWeight: 600 }}>
                  [ACTIVE]
                </span>
              </div>
            </div>
            <div style={{ marginLeft: '24px', fontSize: '0.6rem', color: 'var(--bb-hp-high)', opacity: 0.7 }}>
              {currentRobot.language1.toUpperCase()} + {currentRobot.language2.toUpperCase()} |
              Lv.{currentRobot.level}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
