// ============================================================
// Binary Boxer — HealthBar Component
// Animated health bar with label, level, and numeric HP display
// ============================================================

import type { ReactElement } from 'react';

type HealthBarProps = {
  current: number;
  max: number;
  variant: 'player' | 'enemy';
  label: string;
  level: number;
};

export const HealthBar = ({
  current,
  max,
  variant,
  label,
  level,
}: HealthBarProps): ReactElement => {
  const ratio = max > 0 ? Math.max(0, Math.min(1, current / max)) : 0;
  const percentage = ratio * 100;
  const isLow = percentage < 25;
  const isCritical = percentage < 10;

  const barClass = variant === 'player' ? 'health-bar-player' : 'health-bar-enemy';
  const textColor = variant === 'player' ? 'text-[var(--bb-primary)]' : 'text-[var(--bb-hp-enemy)]';

  return (
    <div className="flex flex-col gap-1 w-full">
      <div className="flex items-center justify-between text-xs">
        <span className={`font-bold tracking-wide ${textColor}`}>
          {label}
          <span className="ml-2 text-[var(--bb-secondary)] opacity-70">Lv.{level}</span>
        </span>
        <span
          className={`font-mono ${textColor} ${isCritical ? 'glow' : ''}`}
        >
          {current}/{max}
        </span>
      </div>
      <div className="w-full h-2 rounded-sm bg-[var(--bb-grid)] terminal-border overflow-hidden">
        <div
          className={`health-bar ${barClass} ${isLow ? 'animate-pulse' : ''}`}
          style={{ transform: `scaleX(${ratio})` }}
          role="progressbar"
          aria-valuenow={current}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-label={`${label} health: ${current} of ${max}`}
        />
      </div>
    </div>
  );
};
