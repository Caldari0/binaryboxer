// ============================================================
// Binary Boxer — Leaderboard Component
// Rankings display with metric tabs and player highlighting
// ============================================================

type LeaderboardEntry = {
  rank: number;
  username: string;
  robotName: string;
  score: number;
  language1: string;
  language2: string;
  generation: number;
};

type LeaderboardProps = {
  entries: Array<LeaderboardEntry>;
  metric: string;
  playerRank: number | null;
  onChangeMetric: (metric: string) => void;
  onBack: () => void;
};

const METRICS = [
  { id: 'level', label: 'LEVEL' },
  { id: 'streak', label: 'STREAK' },
  { id: 'dynasty', label: 'DYNASTY' },
  { id: 'fights', label: 'FIGHTS' },
];

const getRankColor = (rank: number): string => {
  switch (rank) {
    case 1:
      return 'var(--bb-kindred)';
    case 2:
      return '#c0c0c0';
    case 3:
      return '#cd7f32';
    default:
      return 'var(--bb-text-secondary)';
  }
};

const getRankPrefix = (rank: number): string => {
  switch (rank) {
    case 1:
      return '#1';
    case 2:
      return '#2';
    case 3:
      return '#3';
    default:
      return `#${rank}`;
  }
};

export const Leaderboard = ({
  entries,
  metric,
  playerRank,
  onChangeMetric,
  onBack,
}: LeaderboardProps): React.ReactElement => {
  return (
    <div className="bb-screen-enter" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--bb-space-md)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="bb-title bb-fluid-lg">Leaderboard</div>
        <button type="button" className="bb-btn" style={{ fontSize: '0.7rem', minHeight: '28px', padding: '4px 12px' }} onClick={onBack}>
          Back
        </button>
      </div>

      {/* Metric Tabs */}
      <div style={{ display: 'flex', gap: '4px' }}>
        {METRICS.map((m) => (
          <button
            key={m.id}
            type="button"
            className={metric === m.id ? 'bb-btn bb-btn--primary' : 'bb-btn'}
            style={{ flex: 1, fontSize: '0.7rem', minHeight: '32px', padding: '4px 0' }}
            onClick={() => onChangeMetric(m.id)}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Rankings Table */}
      <div className="bb-panel" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Table Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '36px 1fr 1fr 50px 64px',
          gap: '4px',
          padding: 'var(--bb-space-sm) var(--bb-space-md)',
          borderBottom: '1px solid var(--bb-border)',
          fontSize: '0.6rem',
          color: 'var(--bb-text-dim)',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>
          <span>Rank</span>
          <span>User</span>
          <span>Robot</span>
          <span style={{ textAlign: 'right' }}>Score</span>
          <span style={{ textAlign: 'right' }}>Langs</span>
        </div>

        {/* Table Body */}
        <div>
          {entries.length === 0 && (
            <div style={{ padding: 'var(--bb-space-lg)', textAlign: 'center', fontSize: '0.75rem', color: 'var(--bb-text-dim)' }}>
              No rankings yet. Be the first to fight!
            </div>
          )}
          {entries.map((entry, index) => {
            const isPlayer = playerRank !== null && entry.rank === playerRank;
            const rankColor = getRankColor(entry.rank);

            return (
              <div
                key={entry.rank}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '36px 1fr 1fr 50px 64px',
                  gap: '4px',
                  padding: 'var(--bb-space-xs) var(--bb-space-md)',
                  fontSize: '0.72rem',
                  borderBottom: index < entries.length - 1 ? '1px solid var(--bb-border)' : 'none',
                  background: isPlayer
                    ? 'rgba(74, 158, 255, 0.06)'
                    : entry.rank <= 3
                      ? 'rgba(212, 168, 67, 0.03)'
                      : 'transparent',
                  alignItems: 'center',
                }}
              >
                <span className="bb-mono" style={{ fontWeight: 700, color: rankColor }}>
                  {getRankPrefix(entry.rank)}
                </span>
                <span style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  color: isPlayer ? 'var(--bb-hp-high)' : 'var(--bb-text)',
                  fontWeight: isPlayer ? 700 : 400,
                }}>
                  {entry.username}
                </span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--bb-text-muted)' }}>
                  {entry.robotName}
                  {entry.generation > 1 && (
                    <span style={{ marginLeft: '4px', color: 'var(--bb-kindred)', fontSize: '0.6rem' }}>
                      G{entry.generation}
                    </span>
                  )}
                </span>
                <span className="bb-mono" style={{ textAlign: 'right', fontWeight: 700, color: rankColor }}>
                  {entry.score}
                </span>
                <span style={{ textAlign: 'right', fontSize: '0.6rem', color: 'var(--bb-text-dim)' }}>
                  {entry.language1.toUpperCase().slice(0, 3)}/
                  {entry.language2.toUpperCase().slice(0, 3)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Player Rank Footer */}
      {playerRank !== null && (
        <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--bb-hp-high)', fontWeight: 600 }}>
          Your rank: #{playerRank}
        </div>
      )}
    </div>
  );
};
