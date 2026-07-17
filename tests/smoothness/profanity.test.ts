// ============================================================
// Profanity/name-validation tests — KEEP verdict (donor-triage):
// active account-creation protection, ported verbatim out of the
// deleted edge-cases suite when the old combat engine was removed.
// ============================================================

import { describe, it, expect } from 'vitest';
import { checkProfanity } from '../../src/server/data/profanity';

describe('Profanity filter', () => {
  it('blocks obvious slurs', () => {
    expect(checkProfanity('fuck')).not.toBeNull();
    expect(checkProfanity('SHIT')).not.toBeNull();
    expect(checkProfanity('my robot nigger')).not.toBeNull();
  });

  it('blocks leet-speak substitutions', () => {
    expect(checkProfanity('f4gg0t')).not.toBeNull();
    expect(checkProfanity('$h1t')).not.toBeNull();
  });

  it('allows legitimate programming terms', () => {
    expect(checkProfanity('MASTER')).toBeNull();
    expect(checkProfanity('Assassin')).toBeNull();
    expect(checkProfanity('ClassBot')).toBeNull();
    expect(checkProfanity('RustCrusher')).toBeNull();
    expect(checkProfanity('ByteStrike')).toBeNull();
  });

  it('allows normal robot names', () => {
    expect(checkProfanity('Thunderbolt')).toBeNull();
    expect(checkProfanity('CyberPunch')).toBeNull();
    expect(checkProfanity('RoboFist-X')).toBeNull();
    expect(checkProfanity('Unit 42')).toBeNull();
    expect(checkProfanity('Python Power')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(checkProfanity('')).toBeNull();
  });
});
