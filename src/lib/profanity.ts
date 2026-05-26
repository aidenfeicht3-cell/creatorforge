/**
 * Lightweight profanity / harassment filter.
 *
 * Goal: catch obvious slurs and harassment in Workshop content. Triggering
 * the filter suspends the user from the Workshop for a week (not from the
 * rest of the app). Everyone keeps their AI tools, just loses community
 * posting privileges.
 *
 * This is intentionally conservative — false positives are bad. The list
 * targets things no good-faith user would type. Tune in production.
 */

// Word fragments / slurs to block. Lowercased, matched as whole-word.
const BLOCKLIST = [
  // racial slurs
  "nigger", "nigga", "n1gger", "n!gger",
  "chink", "spic", "kike", "wetback",
  // homophobic / transphobic slurs
  "faggot", "fag", "tranny", "dyke",
  // misogynistic slurs
  "cunt", "whore", "slut",
  // ableist slurs (kept conservative)
  "retard", "retarded",
  // common harassment phrases
  "kill yourself", "kys",
];

const WORD_BOUNDARY_RE = new RegExp(
  // Build a regex that matches any blocklist entry as a whole word/phrase.
  // Word boundaries protect against false positives like "scunthorpe" or "classic".
  "(?:^|\\W)(" +
    BLOCKLIST.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|") +
    ")(?:$|\\W)",
  "i",
);

export interface ProfanityResult {
  clean: boolean;
  matched?: string;
}

export function checkProfanity(input: string): ProfanityResult {
  if (!input) return { clean: true };
  const text = input.toLowerCase();
  const m = text.match(WORD_BOUNDARY_RE);
  if (m) return { clean: false, matched: m[1] };
  return { clean: true };
}

/** Default suspension on a first offense — 7 days. */
export const SUSPENSION_DAYS = 7;

export function suspensionDate(days = SUSPENSION_DAYS): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}
