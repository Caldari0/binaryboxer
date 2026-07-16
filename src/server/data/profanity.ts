// ============================================================
// Binary Boxer — Profanity Filter
// Lightweight blocklist for robot name validation
// Covers Reddit content policy essentials without false positives
// ============================================================

// Lowercase patterns checked against normalized robot names.
// Uses word-boundary matching to avoid false positives on
// substrings (e.g. "assassin" should not trigger on "ass").
const BLOCKED_WORDS: string[] = [
  'fuck', 'shit', 'cunt', 'nigger', 'nigga', 'faggot', 'fag',
  'retard', 'kike', 'chink', 'spic', 'wetback', 'tranny',
  'dyke', 'slut', 'whore', 'bitch', 'cock', 'dick', 'pussy',
  'penis', 'vagina', 'anus', 'rape', 'molest', 'pedo',
  'nazi', 'hitler', 'holocaust', 'genocide',
  'kill yourself', 'kys',
];

// Pre-compile regex patterns with word boundaries
const BLOCKED_PATTERNS: RegExp[] = BLOCKED_WORDS.map(
  (word) => new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i'),
);

/**
 * Check if a robot name contains blocked words.
 * Returns the matched word if found, or null if the name is clean.
 */
export const checkProfanity = (name: string): string | null => {
  // Normalize: lowercase, collapse leet-speak substitutions
  const normalized = name
    .toLowerCase()
    .replace(/0/g, 'o')
    .replace(/1/g, 'i')
    .replace(/3/g, 'e')
    .replace(/4/g, 'a')
    .replace(/5/g, 's')
    .replace(/7/g, 't')
    .replace(/@/g, 'a')
    .replace(/\$/g, 's');

  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(normalized)) {
      return pattern.source.replace(/\\b/g, '');
    }
  }
  return null;
};
