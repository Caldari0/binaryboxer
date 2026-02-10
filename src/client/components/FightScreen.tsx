import { useEffect, useMemo, useRef, useState } from 'react';
import { AsciiPortrait } from './AsciiPortrait';
import { BossIntro } from './BossIntro';

export type CombatTurn = {
  id: number;
  attacker: 'player' | 'enemy';
  action: string;
  damage: number;
  crit: boolean;
  playerHp: number;
  enemyHp: number;
  line: string;
};

export type FighterView = {
  name: string;
  level: number;
  maxHp: number;
  portrait: string;
  tagline?: string | null;
};

type FightScreenProps = {
  player: FighterView;
  enemy: FighterView;
  turns: CombatTurn[];
  bossFight: boolean;
  onFightComplete: (result: 'win' | 'loss') => void;
};

type DamageFloat = {
  id: number;
  side: 'player' | 'enemy';
  text: string;
  crit: boolean;
};

const winAscii = `
__      ___ _   _
\\ \\ /\\ / / | \\ | |
 \\ V  V /  |  \\| |
  \\_/\\_/   |_|\\__|
`;

const lossAscii = `
_     ___  ____ ____ 
| |   / _ \\/ ___/ ___|
| |  | | | \\___ \\___ \\
| |__| |_| |___) |__) |
|_____\\___/|____/____/
`;

export const FightScreen = ({ player, enemy, turns, bossFight, onFightComplete }: FightScreenProps) => {
  const shouldPlayBossIntro = bossFight && turns.length > 0;
  const [introActive, setIntroActive] = useState(shouldPlayBossIntro);
  const [revealedTurns, setRevealedTurns] = useState(0);
  const [speedFast, setSpeedFast] = useState(false);
  const [damageFloats, setDamageFloats] = useState<DamageFloat[]>([]);
  const [critFlash, setCritFlash] = useState(false);
  const completionNotified = useRef(false);
  const logRef = useRef<HTMLDivElement | null>(null);

  const visibleTurns = useMemo(() => turns.slice(0, revealedTurns), [turns, revealedTurns]);
  const latestTurn = visibleTurns[visibleTurns.length - 1];
  const playerHp = latestTurn ? latestTurn.playerHp : player.maxHp;
  const enemyHp = latestTurn ? latestTurn.enemyHp : enemy.maxHp;
  const isComplete = revealedTurns >= turns.length;
  const result: 'win' | 'loss' | null = isComplete && turns.length > 0
    ? enemyHp <= 0
      ? 'win'
      : playerHp <= 0
        ? 'loss'
        : enemyHp < playerHp
          ? 'win'
          : 'loss'
    : null;

  useEffect(() => {
    if (!introActive) return;
    const timer = window.setTimeout(() => {
      setIntroActive(false);
    }, 2000);
    return () => window.clearTimeout(timer);
  }, [introActive]);

  useEffect(() => {
    if (introActive) return;
    if (turns.length === 0) return;
    if (revealedTurns >= turns.length) return;
    const turn = turns[revealedTurns];
    if (!turn) return;
    const timer = window.setTimeout(() => {
      setRevealedTurns((value) => value + 1);
      const floatId = Date.now() + turn.id;
      setDamageFloats((prev) => [
        ...prev,
        {
          id: floatId,
          side: turn.attacker === 'player' ? 'enemy' : 'player',
          text: turn.crit ? `CRIT! ${turn.damage}` : `${turn.damage}`,
          crit: turn.crit,
        },
      ]);
      window.setTimeout(() => {
        setDamageFloats((prev) => prev.filter((item) => item.id !== floatId));
      }, 1000);

      if (turn.crit) {
        setCritFlash(true);
        window.setTimeout(() => setCritFlash(false), 100);
      }
    }, speedFast ? 400 : 800);
    return () => window.clearTimeout(timer);
  }, [introActive, revealedTurns, speedFast, turns]);

  useEffect(() => {
    if (introActive) return;
    if (turns.length === 0) return;
    if (!isComplete) return;
    if (result === null) return;
    if (completionNotified.current) return;
    completionNotified.current = true;
    onFightComplete(result);
  }, [introActive, isComplete, onFightComplete, result, turns.length]);

  useEffect(() => {
    const element = logRef.current;
    if (element === null) return;
    element.scrollTop = element.scrollHeight;
  }, [visibleTurns.length]);

  const playerScale = ratio(playerHp, player.maxHp);
  const enemyScale = ratio(enemyHp, enemy.maxHp);

  return (
    <section
      className={`bb-crt relative mx-auto flex w-full max-w-[980px] flex-col gap-3 p-3 ${
        bossFight ? 'bb-boss-mode' : ''
      }`}
    >
      {introActive ? (
        <BossIntro bossName={enemy.name} tagline={enemy.tagline} portrait={enemy.portrait} />
      ) : null}
      {critFlash ? <div className="bb-crit-overlay" /> : null}
      <header className="grid grid-cols-2 gap-3">
        <div className="bb-panel">
          <div className="mb-1 flex items-center justify-between text-xs text-[rgb(0_255_65_/_74%)]">
            <span>
              {player.name} <span className="bb-level-pill">LV.{player.level}</span>
            </span>
            <span className="bb-number-glow">
              {playerHp}/{player.maxHp}
            </span>
          </div>
          <div className="bb-health-track">
            <div className="bb-health-fill bg-[var(--bb-text)]" style={{ transform: `scaleX(${playerScale})` }} />
          </div>
        </div>
        <div className="bb-panel">
          <div className="mb-1 flex items-center justify-between text-xs text-[rgb(255_0_64_/_78%)]">
            <span>
              {enemy.name} <span className="bb-level-pill">LV.{enemy.level}</span>
            </span>
            <span className="bb-number-glow">
              {enemyHp}/{enemy.maxHp}
            </span>
          </div>
          <div className="bb-health-track border-[rgb(255_0_64_/_30%)]">
            <div
              className="bb-health-fill"
              style={{
                transform: `scaleX(${enemyScale})`,
                backgroundColor: bossFight ? 'var(--bb-boss)' : 'var(--bb-enemy)',
              }}
            />
          </div>
        </div>
      </header>

      <main className="bb-panel relative flex min-h-[260px] items-center justify-between overflow-hidden">
        {damageFloats.map((float) => (
          <span
            key={float.id}
            className={`bb-float ${
              float.crit ? 'bb-crit-float' : float.side === 'player' ? 'bb-enemy-float' : 'bb-player-float'
            }`}
            style={{
              left: float.side === 'player' ? '14%' : '74%',
              top: '34%',
            }}
          >
            {float.text}
          </span>
        ))}

        <AsciiPortrait portrait={player.portrait} className="m-0 text-[0.7rem] leading-[0.95] text-[var(--bb-text)]" />
        <AsciiPortrait
          portrait={enemy.portrait}
          className="m-0 origin-center scale-x-[-1] text-[0.7rem] leading-[0.95] text-[rgb(255_0_64_/_90%)]"
        />
      </main>

      <footer className="bb-panel flex h-[180px] flex-col">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="text-[rgb(0_255_65_/_70%)]">COMBAT LOG</span>
          <button
            type="button"
            onClick={() => setSpeedFast((value) => !value)}
            className="border border-[rgb(0_180_216_/_35%)] px-2 py-1 text-[rgb(0_180_216)]"
          >
            SPEED: {speedFast ? '2X (400ms)' : '1X (800ms)'}
          </button>
        </div>
        <div ref={logRef} className="flex-1 overflow-y-auto text-xs">
          {visibleTurns.map((turn) => (
            <p key={turn.id} className="bb-log-line m-0 text-[rgb(0_255_65_/_82%)]">
              &gt; {turn.line}
            </p>
          ))}
        </div>
      </footer>

      {result !== null ? (
        <div className="bb-panel bb-ascii-title bb-stat-pulse text-center">
          <pre
            className={`m-0 whitespace-pre text-sm ${
              result === 'win' ? 'text-[rgb(0_255_65_/_95%)]' : 'text-[rgb(255_0_64_/_95%)]'
            }`}
          >
            {result === 'win' ? winAscii : lossAscii}
          </pre>
        </div>
      ) : null}
    </section>
  );
};

const ratio = (value: number, maxValue: number): number => {
  if (maxValue <= 0) return 0;
  return Math.max(0, Math.min(1, value / maxValue));
};
