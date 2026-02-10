// ============================================================
// Binary Boxer — CombatLog Component
// Scrolling terminal-style combat log with slide-in animation
// ============================================================

import { useEffect, useRef } from 'react';

type CombatLogTurn = {
  turnNumber: number;
  flavourText: string;
  critical: boolean;
  crashed: boolean;
};

type CombatLogProps = {
  turns: Array<CombatLogTurn>;
  currentTurn: number;
};

export const CombatLog = ({
  turns,
  currentTurn,
}: CombatLogProps): React.ReactElement => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new turns appear
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [currentTurn]);

  const visibleTurns = turns.filter((t) => t.turnNumber <= currentTurn);

  return (
    <div
      ref={scrollRef}
      className="flex flex-col gap-0.5 overflow-y-auto p-3 terminal-border bg-[rgba(0,0,0,0.3)] font-mono text-xs leading-relaxed"
      style={{ maxHeight: '200px' }}
    >
      {visibleTurns.length === 0 && (
        <div className="text-[var(--bb-text-dim)]">
          {'> Awaiting combat data'}
          <span className="blink">_</span>
        </div>
      )}
      {visibleTurns.map((turn) => (
        <CombatLogLine key={turn.turnNumber} turn={turn} />
      ))}
    </div>
  );
};

type CombatLogLineProps = {
  turn: CombatLogTurn;
};

const CombatLogLine = ({ turn }: CombatLogLineProps): React.ReactElement => {
  let textClass = 'text-[var(--bb-primary)]';
  if (turn.critical) {
    textClass = 'text-[var(--bb-kindred)] font-bold';
  }
  if (turn.crashed) {
    textClass = 'text-[var(--bb-accent)]';
  }

  return (
    <div className={`combat-log-entry ${textClass}`}>
      <span className="text-[var(--bb-text-dim)] mr-1 select-none">{'>'}</span>
      {turn.critical && (
        <span className="text-[var(--bb-crit)] mr-1 font-bold">[CRIT]</span>
      )}
      {turn.crashed && (
        <span className="text-[var(--bb-accent)] mr-1 font-bold">[CRASH]</span>
      )}
      <span>{turn.flavourText}</span>
    </div>
  );
};
