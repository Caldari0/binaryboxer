// ============================================================
// Binary Boxer — Inline Preview (Feed Card)
// Lightweight splash shown in Reddit feed. Must load <1s.
// ============================================================

import './index.css';

import { context, requestExpandedMode } from '@devvit/web/client';
import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { InitResponse } from '../shared/api';

type SplashState = {
  username: string;
  hasPlayer: boolean;
  robotName: string | null;
  level: number | null;
  streak: number | null;
  generation: number | null;
  loaded: boolean;
};

export const Splash = () => {
  const [state, setState] = useState<SplashState>({
    username: context.username ?? 'user',
    hasPlayer: false,
    robotName: null,
    level: null,
    streak: null,
    generation: null,
    loaded: false,
  });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/init');
        if (!res.ok) throw new Error('fetch failed');
        const data: InitResponse = await res.json();
        setState({
          username: data.username,
          hasPlayer: data.hasPlayer,
          robotName: data.player?.robotName ?? null,
          level: data.player?.level ?? null,
          streak: data.player?.currentStreak ?? null,
          generation: data.player?.generation ?? null,
          loaded: true,
        });
      } catch {
        setState((p) => ({ ...p, loaded: true }));
      }
    };
    void load();
  }, []);

  const topThree = state.hasPlayer
    ? [
        `${padRank(1)} ${state.robotName ?? 'BYTE_CRUSHER'}  ${Math.max(10, state.level ?? 1)}`,
        `${padRank(2)} NULL_PTR      ${Math.max(8, (state.level ?? 1) - 1)}`,
        `${padRank(3)} RUSTY_LOOP    ${Math.max(7, (state.level ?? 1) - 2)}`,
      ]
    : [
        `${padRank(1)} BYTE_CRUSHER  17`,
        `${padRank(2)} HEAP_HOUND    14`,
        `${padRank(3)} ZERO_DAY      12`,
      ];

  const statusLine = state.hasPlayer
    ? `${state.robotName ?? 'UNIT'} | LV.${state.level ?? 1} | ${state.streak ?? 0}W STREAK | GEN.${state.generation ?? 1}`
    : null;

  return (
    <div className="bb-app">
      <div className="bb-splash">
        <section className="bb-crt relative w-full max-w-[440px] p-3">
          <div className="bb-binary-rain" />
          <pre className="bb-ascii-title m-0 text-[0.56rem] leading-tight text-[rgb(0_255_65_/_95%)]">
            {` ____  ____  \n| __ )| __ ) \n|  _ \\|  _ \\ `}
          </pre>

          {!state.loaded ? (
            <div className="mt-2 flex items-center gap-2">
              <div className="bb-spinner" />
              <span className="bb-fluid-sm text-[var(--bb-text-secondary)]">SYNCING TERMINAL</span>
            </div>
          ) : statusLine ? (
            <div className="mt-2">
              <p className="bb-number-glow m-0 text-xs">{statusLine}</p>
              <div className="mt-2 rounded border border-[rgb(0_255_65_/_18%)] bg-[rgb(0_0_0_/_35%)] p-2 text-[0.68rem]">
                {topThree.map((line) => (
                  <p key={line} className="m-0 text-[rgb(0_255_65_/_78%)]">
                    {line}
                  </p>
                ))}
              </div>
            </div>
          ) : (
            <p className="m-0 mt-2 text-xs text-[rgb(0_255_65_/_82%)]">
              &gt; INITIALIZE NEW COMBAT UNIT <span className="bb-cursor">_</span>
            </p>
          )}

          <button
            type="button"
            className="bb-btn bb-btn--primary mt-3 w-full"
            onClick={(e) => requestExpandedMode(e.nativeEvent, 'game')}
          >
            {state.hasPlayer ? '[ENTER] TAP TO CONTINUE' : '[ENTER] TAP TO FIGHT'}
          </button>
          {!state.hasPlayer && state.loaded ? (
            <p className="m-0 mt-2 text-center text-[0.68rem] text-[rgb(0_255_65_/_60%)]">
              USER: {state.username.toUpperCase()}
            </p>
          ) : null}
        </section>
      </div>
    </div>
  );
};

const padRank = (rank: number): string => `[${rank}]`;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Splash />
  </StrictMode>
);
