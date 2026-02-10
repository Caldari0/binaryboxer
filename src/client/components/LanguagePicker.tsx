import {
  computePreviewStats,
  findLanguageSynergy,
  LANGUAGE_ORDER,
  LANGUAGE_PROFILES,
  previewStatLabel,
  type LanguageId,
  type StatKey,
} from '../data/languages';

type LanguagePickerProps = {
  selected: LanguageId[];
  onChange: (next: LanguageId[]) => void;
};

const previewStats: StatKey[] = [
  'hp',
  'power',
  'defence',
  'speed',
  'wisdom',
  'creativity',
  'stability',
  'adaptability',
];

export const LanguagePicker = ({ selected, onChange }: LanguagePickerProps) => {
  const selectedSet = new Set(selected);
  const stats = computePreviewStats(selected);
  const first = selected[0];
  const second = selected[1];
  const synergy = selected.length === 2 && first && second ? findLanguageSynergy(first, second) : null;

  const toggleLanguage = (languageId: LanguageId) => {
    if (selectedSet.has(languageId)) {
      onChange(selected.filter((value) => value !== languageId));
      return;
    }
    if (selected.length >= 2) return;
    onChange([...selected, languageId]);
  };

  return (
    <div className="bb-panel space-y-3">
      <p className="m-0 text-sm text-[rgb(0_255_65_/_74%)]">
        Select exactly two core languages to install combat modules.
      </p>
      <div className="grid grid-cols-2 gap-2">
        {LANGUAGE_ORDER.map((languageId) => {
          const language = LANGUAGE_PROFILES[languageId];
          const isSelected = selectedSet.has(languageId);
          return (
            <button
              key={language.id}
              type="button"
              onClick={() => toggleLanguage(language.id)}
              className={`border p-2 text-left transition-colors ${
                isSelected
                  ? 'border-[rgb(0_255_65_/_58%)] bg-[rgb(0_255_65_/_10%)] shadow-[0_0_12px_rgba(0,255,65,0.2)]'
                  : 'border-[rgb(0_255_65_/_22%)] bg-[rgb(0_0_0_/_25%)]'
              }`}
            >
              <div className="mb-1 flex items-center justify-between">
                <span style={{ color: language.color }} className="font-bold">
                  {language.name}
                </span>
                <span className="text-[rgb(0_255_65_/_85%)]">{isSelected ? '[x]' : '[ ]'}</span>
              </div>
              <p className="m-0 text-xs text-[rgb(0_255_65_/_85%)]">
                +{language.primaryBonus} {previewStatLabel(language.primaryStat)}
              </p>
              <p className="m-0 text-xs text-[rgb(0_255_65_/_70%)]">
                +{language.secondaryBonus} {language.secondaryStat ? previewStatLabel(language.secondaryStat) : 'ALL'}
              </p>
              <p className="m-0 mt-1 text-[0.72rem] text-[rgb(0_255_65_/_50%)]">{language.quote}</p>
            </button>
          );
        })}
      </div>
      <div className="bb-panel bg-[rgb(0_0_0_/_28%)]">
        <p className="m-0 mb-2 text-sm text-[rgb(0_255_65_/_90%)]">STAT PREVIEW</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          {previewStats.map((stat) => (
            <p key={stat} className="m-0 text-xs text-[rgb(0_255_65_/_74%)]">
              {previewStatLabel(stat)}: <span className="bb-number-glow">{stats[stat]}</span>
            </p>
          ))}
        </div>
        <p className="m-0 mt-2 text-xs text-[rgb(0_180_216_/_95%)]">
          SYNERGY:{' '}
          {synergy !== null ? (
            <span className="text-[rgb(0_255_65_/_92%)]">{synergy}</span>
          ) : (
            <span className="text-[rgb(0_255_65_/_55%)]">Awaiting second module selection.</span>
          )}
        </p>
      </div>
    </div>
  );
};
