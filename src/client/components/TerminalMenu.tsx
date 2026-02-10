import { useMemo, useState } from 'react';

export type TerminalMenuOption<OptionId extends string = string> = {
  id: OptionId;
  label: string;
  description: string;
  disabled?: boolean;
};

type TerminalMenuProps<OptionId extends string> = {
  options: TerminalMenuOption<OptionId>[];
  onSelect: (optionId: OptionId) => void;
};

export const TerminalMenu = <OptionId extends string,>({
  options,
  onSelect,
}: TerminalMenuProps<OptionId>) => {
  const [focusIndex, setFocusIndex] = useState(0);

  const clampedFocus = useMemo(() => {
    if (options.length === 0) return 0;
    return Math.min(focusIndex, options.length - 1);
  }, [focusIndex, options.length]);

  return (
    <div className="flex flex-col gap-2">
      {options.map((option, index) => {
        const isFocused = index === clampedFocus;
        const isDisabled = option.disabled === true;
        return (
          <button
            key={option.id}
            type="button"
            onMouseEnter={() => setFocusIndex(index)}
            onFocus={() => setFocusIndex(index)}
            onClick={() => {
              if (!isDisabled) onSelect(option.id);
            }}
            disabled={isDisabled}
            className={`w-full border px-3 py-2 text-left transition-colors ${
              isFocused
                ? 'border-[rgb(0_255_65_/_40%)] bg-[rgb(0_255_65_/_8%)]'
                : 'border-[rgb(0_255_65_/_18%)] bg-[rgb(0_0_0_/_28%)]'
            } ${isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
          >
            <span
              className={`mr-2 inline-block min-w-4 ${
                isFocused ? 'bb-cursor text-[var(--bb-secondary)]' : 'text-[rgb(0_180_216_/_80%)]'
              }`}
            >
              {isFocused ? '>' : ' '}
            </span>
            <span className="mr-2 text-[var(--bb-secondary)]">[{index + 1}]</span>
            <span
              className={`mr-2 font-semibold ${
                isFocused ? 'text-[var(--bb-text)]' : 'text-[rgb(0_255_65_/_88%)]'
              }`}
            >
              {option.label}
            </span>
            <span className="text-[rgb(0_255_65_/_55%)]">--- {option.description}</span>
          </button>
        );
      })}
    </div>
  );
};
