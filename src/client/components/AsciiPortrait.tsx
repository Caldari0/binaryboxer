import type { CSSProperties } from 'react';

type AsciiPortraitProps = {
  portrait: string;
  className?: string;
  style?: CSSProperties;
};

export const AsciiPortrait = ({ portrait, className, style }: AsciiPortraitProps) => {
  return (
    <pre
      className={
        className ??
        'm-0 text-[0.72rem] leading-[0.95] text-[rgb(0_255_65_/_86%)] whitespace-pre'
      }
      style={style}
    >
      {portrait}
    </pre>
  );
};
