// ============================================================
// Binary Boxer — RobotCreation Component
// Language-driven robot creation with stat preview
// ============================================================

import { useState, useMemo, type ReactElement } from 'react';
import type { LanguageId } from '../../shared/types';
import {
  LANGUAGE_PROFILES,
  LANGUAGE_ORDER,
  computePreviewStats,
  previewStatLabel,
  findLanguageSynergy,
  type StatKey,
} from '../data/languages';

type RobotCreationProps = {
  onSubmit: (name: string, lang1: LanguageId, lang2: LanguageId) => void;
  loading: boolean;
};

const STAT_KEYS: StatKey[] = [
  'hp', 'power', 'defence', 'speed', 'wisdom', 'creativity',
  'stability', 'adaptability', 'evasion', 'blockChance',
  'counter', 'critChance', 'patternRead', 'penetration',
];

export const RobotCreation = ({
  onSubmit,
  loading,
}: RobotCreationProps): ReactElement => {
  const [name, setName] = useState('');
  const [selected, setSelected] = useState<LanguageId[]>([]);

  const synergy = useMemo(
    () => (selected.length === 2 && selected[0] !== undefined && selected[1] !== undefined)
      ? findLanguageSynergy(selected[0], selected[1])
      : null,
    [selected],
  );

  const statPreview = useMemo(
    () => selected.length === 2 ? computePreviewStats(selected) : null,
    [selected],
  );

  const toggleLanguage = (id: LanguageId): void => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((l): l is LanguageId => l !== id);
      if (prev.length >= 2 && prev[1] !== undefined) return [prev[1], id];
      return [...prev, id];
    });
  };

  const canSubmit = name.trim().length > 0 && selected.length === 2 && !loading;

  const handleSubmit = (): void => {
    if (!canSubmit || selected[0] === undefined || selected[1] === undefined) return;
    onSubmit(name.trim(), selected[0], selected[1]);
  };

  return (
    <div className="bb-screen-enter" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--bb-space-lg)', maxWidth: '560px', margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <div style={{ textAlign: 'center' }}>
        <div className="bb-title bb-fluid-lg">Initialize Combat Unit</div>
        <div className="bb-fluid-sm" style={{ color: 'var(--bb-text-secondary)', marginTop: 'var(--bb-space-xs)' }}>
          Choose a name and two language cores
        </div>
      </div>

      {/* Name Input */}
      <div>
        <div className="bb-stat-label" style={{ marginBottom: 'var(--bb-space-xs)' }}>
          Designation
        </div>
        <input
          type="text"
          className="bb-input"
          placeholder="Enter robot name..."
          maxLength={20}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSubmit();
          }}
        />
        <div style={{ textAlign: 'right', fontSize: '0.65rem', color: 'var(--bb-text-muted)', marginTop: '2px' }}>
          {name.length}/20
        </div>
      </div>

      {/* Language Selection */}
      <div>
        <div className="bb-stat-label" style={{ marginBottom: 'var(--bb-space-sm)' }}>
          Language Cores ({selected.length}/2)
        </div>
        <div className="bb-lang-grid">
          {LANGUAGE_ORDER.map((id) => {
            const lang = LANGUAGE_PROFILES[id];
            const isSelected = selected.includes(id);
            return (
              <button
                key={id}
                type="button"
                className={`bb-lang-card bb-lang-accent-${id} ${isSelected ? 'bb-lang-card--selected' : ''}`}
                onClick={() => toggleLanguage(id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className="bb-lang-name">
                    <span className="bb-lang-dot" style={{ background: lang.color }} />
                    {lang.name}
                  </span>
                  {isSelected && (
                    <span style={{ color: lang.color, fontSize: '0.6rem', fontWeight: 700 }}>
                      {lang.token}
                    </span>
                  )}
                </div>
                <div className="bb-lang-stat">
                  +{lang.primaryBonus} {previewStatLabel(lang.primaryStat)}/lvl
                  {lang.secondaryStat && lang.secondaryStat !== lang.primaryStat && (
                    <> | +{lang.secondaryBonus} {previewStatLabel(lang.secondaryStat)}/lvl</>
                  )}
                  {lang.allStatBonus > 0 && (
                    <> | +{lang.allStatBonus} ALL/lvl</>
                  )}
                </div>
                <div className="bb-lang-flavour">{lang.quote}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Synergy callout */}
      {synergy && (
        <div className="bb-panel bb-panel--glowing" style={{ textAlign: 'center' }}>
          <span style={{ color: 'var(--bb-xp)', fontWeight: 700, fontSize: '0.8rem' }}>
            {synergy}
          </span>
        </div>
      )}

      {/* Stat Preview */}
      {statPreview && (
        <div className="bb-panel">
          <div className="bb-stat-label" style={{ marginBottom: 'var(--bb-space-sm)' }}>
            Projected Stats (Level 1)
          </div>
          <div className="bb-stat-grid">
            {STAT_KEYS.map((key) => {
              const value = statPreview[key];
              const maxForBar = key === 'hp' ? 150 : 20;
              const fill = Math.min(100, (value / maxForBar) * 100);
              return (
                <div key={key} className="bb-stat-row">
                  <span className="bb-stat-label">{previewStatLabel(key)}</span>
                  <div style={{ flex: 1, height: '4px', background: 'var(--bb-border)', borderRadius: '2px', overflow: 'hidden', margin: '0 var(--bb-space-sm)' }}>
                    <div style={{ height: '100%', width: '100%', transformOrigin: 'left', transform: `scaleX(${fill / 100})`, background: value > 0 ? 'var(--bb-hp-high)' : 'transparent', borderRadius: '2px', transition: 'transform 300ms', willChange: 'transform' }} />
                  </div>
                  <span className="bb-stat-value">{value}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="button"
        className="bb-btn bb-btn--primary"
        style={{ width: '100%' }}
        disabled={!canSubmit}
        onClick={handleSubmit}
      >
        {loading ? 'COMPILING...' : 'COMPILE & DEPLOY'}
      </button>
    </div>
  );
};
