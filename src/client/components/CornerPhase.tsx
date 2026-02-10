import { LANGUAGE_ORDER, LANGUAGE_PROFILES, type LanguageId } from '../data/languages';
import { TerminalMenu, type TerminalMenuOption } from './TerminalMenu';

export type CornerAction = 'repair' | 'fullRepair' | 'train' | 'swapLanguage' | 'fightNext';

export type CornerRobot = {
  name: string;
  level: number;
  languages: [LanguageId, LanguageId];
  hp: number;
  maxHp: number;
  xp: number;
  fightCount: number;
  winStreak: number;
  fullRepairCooldown: number;
  stats: {
    maxHp: number;
    power: number;
    defence: number;
    speed: number;
    wisdom: number;
    creativity: number;
    stability: number;
    adaptability: number;
    evasion: number;
    blockChance: number;
    counter: number;
    critChance: number;
    patternRead: number;
    penetration: number;
  };
};

type CornerPhaseProps = {
  robot: CornerRobot;
  onAction: (action: CornerAction, payload?: string) => void;
};

const trainableStats: Array<keyof CornerRobot['stats']> = [
  'maxHp',
  'power',
  'defence',
  'speed',
  'wisdom',
  'creativity',
  'stability',
  'adaptability',
  'evasion',
  'blockChance',
  'counter',
  'critChance',
  'patternRead',
  'penetration',
];

const statLabel: Record<keyof CornerRobot['stats'], string> = {
  maxHp: 'MHP',
  power: 'PWR',
  defence: 'DEF',
  speed: 'SPD',
  wisdom: 'WIS',
  creativity: 'CRT',
  stability: 'STB',
  adaptability: 'ADP',
  evasion: 'EVA',
  blockChance: 'BLK',
  counter: 'CTR',
  critChance: 'CRI',
  patternRead: 'PAT',
  penetration: 'PEN',
};

const statVisualMax: Record<keyof CornerRobot['stats'], number> = {
  maxHp: 200,
  power: 30,
  defence: 30,
  speed: 30,
  wisdom: 30,
  creativity: 30,
  stability: 30,
  adaptability: 30,
  evasion: 30,
  blockChance: 30,
  counter: 30,
  critChance: 30,
  patternRead: 30,
  penetration: 30,
};

export const CornerPhase = ({ robot, onAction }: CornerPhaseProps) => {
  const options: TerminalMenuOption<CornerAction>[] = [
    {
      id: 'repair',
      label: 'REPAIR SYSTEMS',
      description: 'Restore 50% HP',
    },
    {
      id: 'fullRepair',
      label: 'FULL REPAIR',
      description:
        robot.fullRepairCooldown === 0
          ? 'Restore 100% HP'
          : `Cooldown ${robot.fullRepairCooldown} fight(s)`,
      disabled: robot.fullRepairCooldown > 0,
    },
    {
      id: 'train',
      label: 'TRAIN',
      description: 'Allocate XP to core stats',
    },
    {
      id: 'swapLanguage',
      label: 'SWAP LANGUAGE',
      description: 'Install a replacement language module',
    },
    {
      id: 'fightNext',
      label: 'FIGHT NEXT',
      description: 'Queue the next arena battle',
    },
  ];

  return (
    <section className="bb-shell-grid">
      <div className="space-y-3">
        <div className="bb-panel text-xs text-[rgb(0_255_65_/_76%)]">
          STATUS | UNIT: <span className="bb-number-glow">{robot.name}</span> | LV:{' '}
          <span className="bb-number-glow">{robot.level}</span> | XP:{' '}
          <span className="bb-number-glow">{robot.xp}</span> | HP:{' '}
          <span className="bb-number-glow">
            {robot.hp}/{robot.maxHp}
          </span>{' '}
          | FIGHTS: <span className="bb-number-glow">{robot.fightCount}</span> | STREAK:{' '}
          <span className="bb-number-glow">{robot.winStreak}</span>
        </div>
        <TerminalMenu options={options} onSelect={(action) => onAction(action)} />
        <div className="bb-panel">
          <p className="m-0 mb-2 text-xs text-[rgb(0_255_65_/_72%)]">TRAINING QUEUE</p>
          <div className="grid grid-cols-2 gap-2">
            {trainableStats.map((stat) => {
              const cost = Math.max(10, robot.stats[stat] * 10);
              return (
                <button
                  key={stat}
                  type="button"
                  onClick={() => onAction('train', stat)}
                  disabled={robot.xp < cost}
                  className="border border-[rgb(0_255_65_/_20%)] bg-[rgb(0_0_0_/_20%)] px-2 py-1 text-left text-xs disabled:cursor-not-allowed disabled:opacity-55"
                >
                  {statLabel[stat]} +1
                  <span className="ml-2 text-[rgb(0_255_65_/_55%)]">({cost} XP)</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <aside className="space-y-3">
        <div className="bb-panel">
          <p className="m-0 mb-2 text-xs text-[rgb(0_255_65_/_72%)]">ACTIVE MODULES</p>
          <div className="flex flex-wrap gap-2">
            {robot.languages.map((languageId) => (
              <span key={languageId} className="bb-level-pill">
                {LANGUAGE_PROFILES[languageId].name.toUpperCase()}
              </span>
            ))}
          </div>
          <p className="m-0 mt-3 text-xs text-[rgb(0_255_65_/_60%)]">Swap target (replaces slot B):</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {LANGUAGE_ORDER.filter((languageId) => !robot.languages.includes(languageId)).map((languageId) => (
              <button
                key={languageId}
                type="button"
                onClick={() => onAction('swapLanguage', languageId)}
                className="border border-[rgb(0_255_65_/_20%)] bg-[rgb(0_0_0_/_24%)] px-2 py-1 text-left text-xs"
                style={{ color: LANGUAGE_PROFILES[languageId].color }}
              >
                {LANGUAGE_PROFILES[languageId].name}
              </button>
            ))}
          </div>
        </div>
        <div className="bb-panel">
          <p className="m-0 mb-2 text-xs text-[rgb(0_255_65_/_72%)]">CORE STATS</p>
          <div className="space-y-1">
            {trainableStats.map((stat) => (
              <div key={stat} className="bb-stat-bar-text">
                {statLabel[stat]}: {barLine(robot.stats[stat], statVisualMax[stat])}{' '}
                <span className="bb-number-glow">{robot.stats[stat]}</span>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </section>
  );
};

const barLine = (value: number, maxValue: number): string => {
  const total = 10;
  const filled = Math.max(0, Math.min(total, Math.round((value / maxValue) * total)));
  return `${'#'.repeat(filled)}${'.'.repeat(total - filled)}`;
};
