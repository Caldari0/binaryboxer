import type { LanguageId } from '../data/languages';

export type EnemyPortraitType = 'bug' | 'virus' | 'system' | 'boss' | 'legacy';

const ROBOT_WIDTH = 23;
const normalize = (lines: string[]): string[] => lines.map((line) => normalizeLine(line));
const normalizeLine = (line: string): string => line.padEnd(ROBOT_WIDTH).slice(0, ROBOT_WIDTH);

const baseRobotPortrait = normalize([
  '         /\\          ',
  '        /##\\         ',
  '       |====|        ',
  '       |o  o|        ',
  '       | -- |        ',
  '   ____|____|____    ',
  '  / ___|____|___ \\   ',
  ' | |   /|  |\\   | |  ',
  ' | |  /_|__|_\\  | |  ',
  ' | |    /  \\    | |  ',
  '  \\ \\__/____\\__/ /   ',
  '   \\____/  \\____/    ',
]);

type LinePatch = {
  index: number;
  value: string;
};

const languagePatches: Record<LanguageId, LinePatch[]> = {
  rust: [
    { index: 5, value: '   _o__|::::|__o_    ' },
    { index: 6, value: '  /_o__|____|__o_\\   ' },
  ],
  javascript: [
    { index: 0, value: '       /\\/\\  /\\      ' },
    { index: 1, value: '      /_JS\\/_\\_\\     ' },
  ],
  python: [
    { index: 10, value: '  \\ \\~~/____\\~~/ /   ' },
    { index: 11, value: '   \\__/  ~~  \\__/    ' },
  ],
  cpp: [
    { index: 8, value: ' [==] /_|__|_\\ [==]  ' },
    { index: 9, value: ' | |    /  \\    | |  ' },
  ],
  css: [],
  go: [
    { index: 2, value: '        |GO|         ' },
    { index: 7, value: ' | |    /|__|\\   | | ' },
    { index: 8, value: ' | |      ||     | | ' },
  ],
  typescript: [
    { index: 2, value: '      |=[TS]=|       ' },
    { index: 6, value: '  / ___|_[]_|___ \\   ' },
  ],
  c: [
    { index: 6, value: '  / ___| || |___ \\   ' },
    { index: 7, value: ' | |   / |  | \\  | | ' },
    { index: 8, value: ' | |  /  |__|  \\ | | ' },
  ],
  haskell: [
    { index: 7, value: ' | |  /(=><=)\\  | |  ' },
    { index: 8, value: ' | |  \\_(++)_/  | |  ' },
  ],
  lua: [
    { index: 3, value: '       |(  )|        ' },
    { index: 4, value: '       | \\/ |        ' },
  ],
};

const enemyTiers: Record<EnemyPortraitType, string[]> = {
  bug: [
    `
      .-^^-.
   _ /_.._\\ _
  / _  __  _ \\
 / /| /  \\ |\\ \\
|_| |_|  |_| |_|
  /  / /\\ \\  \\
 /__/ /  \\ \\__\\
   /_/    \\_\\
    `,
    `
      .-^^^^-.
   __/_.--._\\__
  / _  /--\\  _ \\
 / /| | /\\ | |\\ \\
|_| |_|/  \\|_| |_|
 / /  / /\\ \\  \\ \\
/ /__/ /  \\ \\__\\ \\
\\_____/____\\_____/
    `,
    `
      .-^^^^^^-.
   __/_.-__-.\\__
  / _  /_--_\\  _ \\
 / /| | /\\ /| |\\ \\
|_| |_|/ /\\ \\|_| |_|
 / /  / /  \\ \\  \\ \\
/ /__/ / /\\ \\ \\__\\ \\
\\_____/ /  \\ \\_____/
     /__/    \\__\\
    `,
  ],
  virus: [
    `
      .------.
    .' .--. '.
   /  /    \\  \\
  |  |  /\\  |  |
  |  |  \\/  |  |
   \\  \\____/  /
    '.__  __.'
        \\/
    `,
    `
      .--------.
    .' .----. '.
   /  / /\\ /\\  \\
  |  | |()|()|  |
  |  |  \\/ \\/|  |
   \\  \\______/ /
    '.  __  .'
   ___\\ \\/ /___
    `,
    `
      .----------.
    .' .------. '.
   /  / /\\__/\\ \\  \\
  |  | |( oo )| |  |
  |  | | /\\/\\ | |  |
   \\  \\_\\____/_/  /
    '._  ____  _.'
   ___/ /\\__/\\ \\___
      /_/    \\_\\
    `,
  ],
  system: [
    `
    _________
   |  SYS-1 |
   | [====] |
   | | [] | |
 __|_|_||_|_|__
|___  ____  ___|
    | |  | |
    |_|  |_|
    `,
    `
    _____________
   |  SYS-CORE  |
   | [==][==]   |
   | | []  []|  |
 __|_|__====_|__|__
|___  __[][]__  ___|
   /| |  ||  | |\\
  /_|_|__||__|_|_\\
    `,
    `
    _______________
   |  SYS-OVERSEER |
   | [==][==][==]  |
   | | []  []  []| |
 __|_|__======__|_|__
|___  __[][][][]__  _|
|_| |_|  ||||  |_| |_|
  /_/|_|_||||_|_|\\_\\
    `,
  ],
  boss: [
    `
      /^^^^^^^^\\
   ___| BOSS-0 |___
  / __| [====] |__ \\
 / /  |  /\\    |  \\ \\
| |   | /__\\   |   | |
| |___|/____\\__|___| |
 \\_____/ /\\ \\_____/
      /_/  \\_\\
    `,
    `
      /^^^^^^^^^^\\
   ___| BOSS-ALPHA|___
  / __| [=][=][=] |__ \\
 / /  |  /\\ /\\    |  \\ \\
| |   | /__V__\\   |   | |
| |___|/__====_\\__|___| |
|_|___/__/ /\\ \\__\\___|_|
 \\_____/__/  \\__\\_____/
    `,
    `
      /^^^^^^^^^^^^\\
   ___| BOSS-OMEGA |___
  / __| [=][=][=][=]|__ \\
 / /  |  /\\ /\\ /\\   |  \\ \\
| |   | /__V__V__\\  |   | |
| |___|/__======__\\_|___| |
|_|___/__/ /\\__/\\ \\__\\__|_|
|_____/___/  \\/  \\___\\_____|
   /______/        \\______\\
    `,
  ],
  legacy: [
    `
      __________
     | LEGACY  |
   __| [====]  |__
  /  |  /\\ /\\  |  \\
 |   | /  V  \\ |   |
 |___|/______\\|___|
    /_/    \\_\\
    `,
    `
      ____________
     | LEGACY-II |
   __| [==][==]  |__
  /  |  /\\ /\\ /\\ |  \\
 |   | /  V  V  \\|   |
 |___|/__________\\___|
 |___/__/ /\\ \\__\\___|
    /_/__/  \\__\\_\\
    `,
    `
      ______________
     | LEGACY-X    |
   __| [==][==][==]|__
  /  |  /\\ /\\ /\\ /\\|  \\
 |   | /  V  V  V  \\   |
 |___|/_____________\\__|
 |_|_/__/ /\\__/\\ \\__\\_|
 |_____/__/  \\/  \\_____|
    `,
  ],
};

const bossPortraitByName: Record<string, string> = {
  THE_COMPILER: `
      /^^^^^^^^^^^^^^\\
   __/  THE_COMPILER  \\__
  / _  [==][==][==]    _ \\
 / /|   /\\  /\\  /\\    |\\ \\
| | |  /__\\/__\\/__\\   | | |
| | |  || OPTIMIZER || | | |
| | |  ||__====__||  | | |
| | |  /_/ /\\__/\\ \\_\\ | | |
| |_|_/__/ /  \\/  \\__\\_| |_|
 \\______/__/  /\\  \\__\\______/
    `,
  GARBAGE_COLLECTOR: `
      /^^^^^^^^^^^^^^^^\\
   __/ GARBAGE_COLLECTOR\\__
  / _  [GC][GC][GC][GC]  _ \\
 / /|  /\\  /\\  /\\  /\\   |\\ \\
| | | /__\\/__\\/__\\/__\\  | | |
| | | |  reclaim queue | | | |
| | | |  [ ][ ][ ][ ] | | | |
| | | |__======__====_| | | |
| |_|_/__/ /\\__/\\ \\__\\_| |_| |
 \\______/__/  /\\  \\__\\______/
    `,
  RUNTIME_EXCEPTION: `
      /^^^^^^^^^^^^^^^^^^\\
   __/ RUNTIME_EXCEPTION  \\__
  / _  [EX][EX][EX][EX]    _ \\
 / /|   /\\  /\\  /\\  /\\    |\\ \\
| | |  /__\\/__\\/__\\/__\\   | | |
| | |   !!! THROWN !!!    | | |
| | |  <<< stack trace >>>| | |
| | |  __====____====__   | | |
| |_|_/__/ /\\____/\\ \\__\\__| |_|
 \\______/__/  /\\  \\__\\______/
    `,
  THE_DEBUGGER: `
      /^^^^^^^^^^^^^^\\
   __/  THE_DEBUGGER  \\__
  / _  [BP][BP][BP][BP] _ \\
 / /|   /\\  /\\  /\\  /\\ |\\ \\
| | |  /__\\/__\\/__\\/__\\| | |
| | |   break> step>   | | |
| | |   watch: player  | | |
| | |  __====____====__| | |
| |_|_/__/ /\\____/\\ \\__| |_|
 \\______/__/  /\\  \\__\\______/
    `,
  CORE_DUMP: `
      /^^^^^^^^^^^\\
   __/  CORE_DUMP  \\__
  / _  [CD][CD][CD] _ \\
 / /|   /\\  /\\  /\\ |\\ \\
| | |  /__\\/__\\/__\\| | |
| | |  MEMORY FRAG  | | |
| | |  0x00 0x1F 0xA3| | |
| | |  __====____==__| | |
| |_|_/__/ /\\____/\\ \\| |_|
 \\______/__/  /\\  \\__\\____/
    `,
  BLUE_SCREEN: `
      /^^^^^^^^^^^^\\
   __/  BLUE_SCREEN  \\__
  / _  [BS][BS][BS]   _ \\
 / /|   /\\  /\\  /\\   |\\ \\
| | |  /__\\/__\\/__\\  | | |
| | |   STOP CODE    | | |
| | |  KERNEL_PANIC  | | |
| | |  __====____==__| | |
| |_|_/__/ /\\____/\\ \\| |_|
 \\______/__/  /\\  \\__\\____/
    `,
  THE_REWRITE: `
      /^^^^^^^^^^^^^\\
   __/  THE_REWRITE  \\__
  / _  [RW][RW][RW]   _ \\
 / /|   /\\  /\\  /\\   |\\ \\
| | |  /__\\/__\\/__\\  | | |
| | |  delete branch | | |
| | |  rebase entire | | |
| | |  __====____==__| | |
| |_|_/__/ /\\____/\\ \\| |_|
 \\______/__/  /\\  \\__\\____/
    `,
  TECH_DEBT: `
      /^^^^^^^^^^^\\
   __/  TECH_DEBT  \\__
  / _  [$][$][$][$] _ \\
 / /|   /\\  /\\  /\\ |\\ \\
| | |  /__\\/__\\/__\\| | |
| | |  interest +5% | | |
| | |  todo todo    | | |
| | |  __====____==_| | |
| |_|_/__/ /\\____/\\ \\| |_|
 \\______/__/  /\\  \\__\\____/
    `,
  LEGACY_CODE: `
      /^^^^^^^^^^^^\\
   __/  LEGACY_CODE  \\__
  / _  [LC][LC][LC]   _ \\
 / /|   /\\  /\\  /\\   |\\ \\
| | |  /__\\/__\\/__\\  | | |
| | |  // 1989 //    | | |
| | |  DO NOT TOUCH  | | |
| | |  __====____==__| | |
| |_|_/__/ /\\____/\\ \\| |_|
 \\______/__/  /\\  \\__\\____/
    `,
  THE_MONOLITH: `
      /^^^^^^^^^^^^\\
   __/  THE_MONOLITH \\__
  / _  [MO][NO][LI][TH]_ \\
 / /|   /\\  /\\  /\\  /\\ |\\ \\
| | |  /__\\/__\\/__\\/__\\| | |
| | |   SINGLE DEPLOY  | | |
| | |   INFINITE MASS  | | |
| | |  __==========__  | | |
| |_|_/__/ /\\____/\\ \\__| |_|
 \\______/__/  /\\  \\__\\______/
    `,
};

export const buildRobotPortrait = (languageA: LanguageId, languageB: LanguageId): string => {
  let lines = [...baseRobotPortrait];
  lines = applyPatch(lines, languageA);
  lines = applyPatch(lines, languageB);
  if (languageA === 'css' || languageB === 'css') {
    lines = framePortrait(lines);
  }
  return lines.join('\n');
};

export const buildEnemyPortrait = (type: EnemyPortraitType, level: number): string => {
  const variants = enemyTiers[type];
  const tier = level >= 18 ? 2 : level >= 10 ? 1 : 0;
  const selectedVariant = variants[tier] ?? variants[0] ?? '';
  return cleanAscii(selectedVariant);
};

export const buildBossPortraitByName = (bossName: string): string => {
  const portrait = bossPortraitByName[bossName];
  if (portrait) return cleanAscii(portrait);
  return buildEnemyPortrait('boss', 20);
};

const applyPatch = (sourceLines: string[], languageId: LanguageId): string[] => {
  const lines = [...sourceLines];
  const patches = languagePatches[languageId];
  for (const patch of patches) {
    lines[patch.index] = normalizeLine(patch.value);
  }
  return lines;
};

const framePortrait = (sourceLines: string[]): string[] => {
  const top = `+${'-'.repeat(ROBOT_WIDTH)}+`;
  const bottom = top;
  const framed = sourceLines.map((line) => `|${line}|`);
  return [top, ...framed, bottom];
};

const cleanAscii = (block: string): string => block.replace(/^\s*\n/, '').trimEnd();
