// ============================================================
// Binary Boxer — Main Game Entry Point (Expanded Mode)
// ============================================================

import './index.css';

import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { useGameState } from './hooks/useGameState';
import { RobotCreation } from './components/RobotCreation';
import { FightScreen } from './components/FightScreen';
import type { CombatTurn } from './components/FightScreen';
import { CornerPhase } from './components/CornerPhase';
import { DynastyTree } from './components/DynastyTree';
import { Leaderboard } from './components/Leaderboard';
import { buildRobotPortrait, buildEnemyPortrait, buildBossPortraitByName } from './components/asciiPortraits';
import type { LanguageId, GrowthStatKey, LeaderboardMetric } from '../shared/types';

export const App = () => {
  const game = useGameState();
  const autoPilotFight = game.autoPilotFight;
  const playerLanguage1 = game.player?.language1;
  const playerLanguage2 = game.player?.language2;
  const shouldAutoResolveFight =
    game.screen === 'fighting' &&
    game.fight !== null &&
    !game.loading &&
    game.error === null &&
    game.fight.result === 'pending' &&
    game.fight.turns.length === 0;

  // Set language CSS variables when player is loaded
  useEffect(() => {
    if (!playerLanguage1 || !playerLanguage2) return;
    const root = document.documentElement;
    root.style.setProperty('--bb-lang1', `var(--bb-lang-${playerLanguage1})`);
    root.style.setProperty('--bb-lang2', `var(--bb-lang-${playerLanguage2})`);
  }, [playerLanguage1, playerLanguage2]);

  // Build a full server fight log up front, then let the UI replay it at fixed cadence.
  useEffect(() => {
    if (!shouldAutoResolveFight) return;
    void autoPilotFight();
  }, [autoPilotFight, shouldAutoResolveFight]);

  // --- Loading Screen ---
  if (game.screen === 'loading') {
    return (
      <div className="bb-app">
        <div className="bb-splash">
          <div className="bb-splash-title">Binary Boxer</div>
          <div style={{ marginTop: 'var(--bb-space-md)' }}>
            {game.error ? (
              <span className="bb-fluid-sm" style={{ color: 'var(--bb-damage)' }}>
                ERROR: {game.error}
              </span>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--bb-space-sm)', justifyContent: 'center' }}>
                <div className="bb-spinner" />
                <span className="bb-fluid-sm" style={{ color: 'var(--bb-text-secondary)' }}>
                  INITIALIZING SYSTEMS
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- Robot Creation ---
  if (game.screen === 'creating') {
    return (
      <div className="bb-app">
        <div className="bb-screen">
          <RobotCreation
            onSubmit={(name: string, lang1: LanguageId, lang2: LanguageId) => {
              void game.createRobot(name, lang1, lang2);
            }}
            loading={game.loading}
          />
        </div>
      </div>
    );
  }

  // --- Fight Screen ---
  if (game.screen === 'fighting' && game.fight) {
    const lang1 = game.player?.language1 ?? 'rust';
    const lang2 = game.player?.language2 ?? 'go';
    const combatTurns: CombatTurn[] = game.fight.turns.map((t, i) => ({
      id: i,
      attacker: t.attacker,
      action: t.action,
      damage: t.damage,
      crit: t.critical,
      playerHp: t.playerHpAfter,
      enemyHp: t.enemyHpAfter,
      line: t.flavourText,
    }));
    return (
      <div className="bb-app">
        <FightScreen
          key={`${game.fight.seed}-${game.fight.turns.length}`}
          player={{
            name: game.player?.robotName ?? 'UNKNOWN',
            level: game.player?.level ?? 1,
            maxHp: game.fight.playerStatsSnapshot.maxHp,
            portrait: buildRobotPortrait(lang1, lang2),
          }}
          enemy={{
            name: game.fight.enemy.name,
            level: game.fight.enemy.level,
            maxHp: game.fight.enemy.stats.maxHp,
            tagline: game.fight.enemy.bossTagline,
            portrait: game.fight.enemy.isBoss
              ? buildBossPortraitByName(game.fight.enemy.name)
              : buildEnemyPortrait(
                  resolveEnemyPortraitType(game.fight.enemy.name, game.fight.enemy.isBoss),
                  game.fight.enemy.level
                ),
          }}
          turns={combatTurns}
          bossFight={game.fight.enemy.isBoss}
          onFightComplete={() => {
            void game.completeFight();
          }}
        />
      </div>
    );
  }

  // --- Corner Phase ---
  if (game.screen === 'corner' && game.player) {
    return (
      <div className="bb-app">
        <div className="bb-screen">
          <CornerPhase
            robot={{
              name: game.player.robotName,
              level: game.player.level,
              languages: [game.player.language1, game.player.language2],
              hp: game.player.stats.hp,
              maxHp: game.player.stats.maxHp,
              xp: game.player.xp,
              fightCount: game.player.totalFights,
              winStreak: game.player.currentStreak,
              fullRepairCooldown: game.player.fullRepairCooldown,
              stats: {
                maxHp: game.player.stats.maxHp,
                power: game.player.stats.power,
                defence: game.player.stats.defence,
                speed: game.player.stats.speed,
                wisdom: game.player.stats.wisdom,
                creativity: game.player.stats.creativity,
                stability: game.player.stats.stability,
                adaptability: game.player.stats.adaptability,
                evasion: game.player.stats.evasion,
                blockChance: game.player.stats.blockChance,
                counter: game.player.stats.counter,
                critChance: game.player.stats.critChance,
                patternRead: game.player.stats.patternRead,
                penetration: game.player.stats.penetration,
              },
            }}
            onAction={(action, payload) => {
              switch (action) {
                case 'repair':
                  void game.repair(false);
                  break;
                case 'fullRepair':
                  void game.repair(true);
                  break;
                case 'train':
                  if (payload && isGrowthStatKey(payload)) {
                    void game.trainStat(payload);
                  }
                  break;
                case 'swapLanguage':
                  if (payload && isLanguageId(payload)) {
                    void game.swapLanguage(2, payload);
                  }
                  break;
                case 'fightNext':
                  void game.startFight();
                  break;
              }
            }}
          />
          {game.error && (
            <div
              className="bb-panel"
              style={{
                position: 'fixed',
                bottom: 'var(--bb-space-md)',
                left: 'var(--bb-space-md)',
                right: 'var(--bb-space-md)',
                borderColor: 'var(--bb-damage)',
                zIndex: 50,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ color: 'var(--bb-damage)', fontSize: '0.75rem' }}>
                {game.error}
              </span>
              <button
                className="bb-btn"
                style={{ fontSize: '0.65rem', minHeight: '28px', padding: '2px 8px' }}
                onClick={game.clearError}
              >
                DISMISS
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- Dynasty View ---
  if (game.screen === 'dynasty') {
    return (
      <div className="bb-app">
        <div className="bb-screen">
          <DynastyTree
            dynasty={game.dynasty}
            currentRobot={
              game.player
                ? {
                    robotName: game.player.robotName,
                    level: game.player.level,
                    language1: game.player.language1,
                    language2: game.player.language2,
                    generation: game.player.generation,
                  }
                : null
            }
            onBack={game.goToCorner}
          />
        </div>
      </div>
    );
  }

  // --- Leaderboard ---
  if (game.screen === 'leaderboard') {
    return (
      <div className="bb-app">
        <div className="bb-screen">
          <Leaderboard
            entries={game.leaderboard}
            metric={game.leaderboardMetric}
            playerRank={game.playerRank}
            onChangeMetric={(metric: string) => {
              if (isLeaderboardMetric(metric)) {
                void game.loadLeaderboard(metric);
              }
            }}
            onBack={game.goToCorner}
          />
        </div>
      </div>
    );
  }

  // --- Fallback ---
  return (
    <div className="bb-app">
      <div className="bb-splash">
        <div className="bb-splash-title" style={{ fontSize: '1rem' }}>SYSTEM ERROR</div>
        <button
          className="bb-btn bb-btn--primary"
          onClick={game.goToCorner}
        >
          REBOOT
        </button>
      </div>
    </div>
  );
};

const resolveEnemyPortraitType = (enemyName: string, isBoss: boolean) => {
  if (isBoss) return 'boss';
  const normalized = enemyName.toLowerCase();
  if (normalized.includes('legacy')) return 'legacy';
  if (
    normalized.includes('virus') ||
    normalized.includes('worm') ||
    normalized.includes('trojan')
  ) {
    return 'virus';
  }
  if (
    normalized.includes('kernel') ||
    normalized.includes('compiler') ||
    normalized.includes('system')
  ) {
    return 'system';
  }
  return 'bug';
};

const isLanguageId = (value: string): value is LanguageId =>
  value === 'rust' ||
  value === 'javascript' ||
  value === 'python' ||
  value === 'cpp' ||
  value === 'css' ||
  value === 'go' ||
  value === 'typescript' ||
  value === 'c' ||
  value === 'haskell' ||
  value === 'lua';

const isGrowthStatKey = (value: string): value is GrowthStatKey =>
  value === 'maxHp' ||
  value === 'power' ||
  value === 'defence' ||
  value === 'speed' ||
  value === 'wisdom' ||
  value === 'creativity' ||
  value === 'stability' ||
  value === 'adaptability' ||
  value === 'evasion' ||
  value === 'blockChance' ||
  value === 'counter' ||
  value === 'critChance' ||
  value === 'patternRead' ||
  value === 'penetration';

const isLeaderboardMetric = (value: string): value is LeaderboardMetric =>
  value === 'level' || value === 'streak' || value === 'dynasty' || value === 'fights';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
