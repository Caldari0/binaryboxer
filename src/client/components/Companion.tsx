// ============================================================
// Binary Boxer — Companion Component
// Small companion indicator with colored dot, name, and bob animation
// ============================================================

type CompanionProps = {
  id: 'veil' | 'echo' | 'kindred';
  active: boolean;
};

type CompanionMeta = {
  name: string;
  color: string;
  symbol: string;
};

const COMPANION_META: Record<string, CompanionMeta> = {
  veil: {
    name: 'Veil',
    color: '#9b5de5',
    symbol: '\u25C6', // diamond
  },
  echo: {
    name: 'Echo',
    color: '#00f5d4',
    symbol: '\u25C8', // outlined diamond
  },
  kindred: {
    name: 'Kindred',
    color: '#ffd60a',
    symbol: '\u2726', // four-pointed star
  },
};

export const Companion = ({
  id,
  active,
}: CompanionProps): React.ReactElement | null => {
  const meta = COMPANION_META[id];

  if (!meta) return null;

  if (!active) {
    return (
      <span
        className="inline-flex items-center gap-0.5 text-[10px] opacity-30"
        style={{ color: meta.color }}
      >
        <span>{meta.symbol}</span>
        <span>{meta.name}</span>
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-0.5 text-[10px] companion-bob"
      style={{
        color: meta.color,
        textShadow: `0 0 6px ${meta.color}80`,
      }}
    >
      <span className="text-xs">{meta.symbol}</span>
      <span className="font-bold">{meta.name}</span>
    </span>
  );
};
