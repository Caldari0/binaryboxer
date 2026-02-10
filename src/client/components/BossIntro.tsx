import { AsciiPortrait } from './AsciiPortrait';

type BossIntroProps = {
  bossName: string;
  tagline: string | null | undefined;
  portrait: string;
};

export const BossIntro = ({ bossName, tagline, portrait }: BossIntroProps) => {
  return (
    <div className="bb-boss-intro-overlay">
      <div className="bb-boss-intro-flicker" />
      <div className="bb-boss-intro-content">
        <pre className="bb-boss-title m-0">{buildBossTitleAscii(bossName)}</pre>
        <p className="bb-boss-tagline m-0">
          {tagline ?? `${bossName.replaceAll('_', ' ')}: "You do not have enough uptime to survive this."`}
        </p>
        <AsciiPortrait portrait={portrait} className="bb-boss-portrait m-0" />
      </div>
    </div>
  );
};

const buildBossTitleAscii = (name: string): string => {
  const label = name.replaceAll('_', ' ');
  const expanded = label.split('').join(' ');
  const width = Math.max(42, expanded.length + 8);
  const top = `/${'^'.repeat(width - 2)}\\`;
  const lineA = `| ${expanded.padEnd(width - 4)} |`;
  const lineB = `| ${'B O S S   E N C O U N T E R'.padEnd(width - 4)} |`;
  const bottom = `\\${'_'.repeat(width - 2)}/`;
  return [top, lineA, lineB, bottom].join('\n');
};
