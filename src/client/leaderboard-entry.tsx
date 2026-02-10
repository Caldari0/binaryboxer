// ============================================================
// Binary Boxer — Inline Leaderboard Entry Point
// Lightweight leaderboard shown in Reddit feed. Must load <1s.
// ============================================================

import './index.css';

import { requestExpandedMode } from '@devvit/web/client';
import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { LeaderboardResponse } from '../shared/api';
import type { LeaderboardEntry } from '../shared/types';

type LeaderboardInlineState = {
  entries: LeaderboardEntry[];
  loaded: boolean;
};

export const LeaderboardInline = () => {
  const [state, setState] = useState<LeaderboardInlineState>({
    entries: [],
    loaded: false,
  });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/leaderboard/level');
        if (!res.ok) throw new Error('fetch failed');
        const data: LeaderboardResponse = await res.json();
        setState({ entries: data.entries.slice(0, 5), loaded: true });
      } catch {
        setState((p) => ({ ...p, loaded: true }));
      }
    };
    void load();
  }, []);

  return (
    <div className="bb-app">
      <div className="bb-splash">
        <section className="bb-crt relative w-full max-w-[440px] p-3">
          <div className="bb-binary-rain" />
          <div className="m-0 text-xs font-bold text-[rgb(0_255_65_/_95%)]">
            BINARY BOXER — TOP FIGHTERS
          </div>

          {!state.loaded ? (
            <div className="mt-2 flex items-center gap-2">
              <div className="bb-spinner" />
              <span className="bb-fluid-sm text-[var(--bb-text-secondary)]">LOADING RANKINGS</span>
            </div>
          ) : state.entries.length === 0 ? (
            <p className="m-0 mt-2 text-xs text-[rgb(0_255_65_/_70%)]">
              No fighters ranked yet. Be the first!
            </p>
          ) : (
            <div className="mt-2 rounded border border-[rgb(0_255_65_/_18%)] bg-[rgb(0_0_0_/_35%)] p-2 text-[0.68rem]">
              {state.entries.map((entry) => (
                <p key={entry.rank} className="m-0 text-[rgb(0_255_65_/_78%)]">
                  [{entry.rank}] {entry.robotName}
                  <span className="ml-2 text-[rgb(0_255_65_/_55%)]">LV.{entry.score}</span>
                </p>
              ))}
            </div>
          )}

          <button
            type="button"
            className="bb-btn bb-btn--primary mt-3 w-full"
            onClick={(e) => requestExpandedMode(e.nativeEvent, 'game')}
          >
            [ENTER] TAP TO FIGHT
          </button>
        </section>
      </div>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LeaderboardInline />
  </StrictMode>,
);
