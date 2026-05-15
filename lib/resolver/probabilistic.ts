/**
 * Lightweight string similarity helpers used for probabilistic patient matching.
 * Pure functions - keep the resolver layer dependency-light.
 */

/** Jaro-Winkler similarity. Returns 0–1. */
export function jaroWinkler(s1: string, s2: string, p = 0.1): number {
  if (!s1 && !s2) return 1;
  if (!s1 || !s2) return 0;
  if (s1 === s2) return 1;

  const m = matchCount(s1, s2);
  if (m === 0) return 0;

  // Count transpositions
  let t = 0;
  let k = 0;
  const matches1 = matches(s1, s2);
  const matches2 = matches(s2, s1);
  for (let i = 0; i < s1.length; i++) {
    if (matches1[i]) {
      while (!matches2[k]) k++;
      if (s1[i] !== s2[k]) t++;
      k++;
    }
  }
  t /= 2;

  const jaro = (m / s1.length + m / s2.length + (m - t) / m) / 3;

  // Winkler boost
  let prefix = 0;
  for (let i = 0; i < Math.min(4, s1.length, s2.length); i++) {
    if (s1[i] === s2[i]) prefix++;
    else break;
  }
  return jaro + prefix * p * (1 - jaro);
}

function matchCount(s1: string, s2: string): number {
  const range = Math.max(0, Math.floor(Math.max(s1.length, s2.length) / 2) - 1);
  const s2Matched = new Array(s2.length).fill(false);
  let count = 0;
  for (let i = 0; i < s1.length; i++) {
    const lo = Math.max(0, i - range);
    const hi = Math.min(s2.length - 1, i + range);
    for (let j = lo; j <= hi; j++) {
      if (!s2Matched[j] && s1[i] === s2[j]) {
        s2Matched[j] = true;
        count++;
        break;
      }
    }
  }
  return count;
}

function matches(s1: string, s2: string): boolean[] {
  const range = Math.max(0, Math.floor(Math.max(s1.length, s2.length) / 2) - 1);
  const result = new Array(s1.length).fill(false);
  const s2Matched = new Array(s2.length).fill(false);
  for (let i = 0; i < s1.length; i++) {
    const lo = Math.max(0, i - range);
    const hi = Math.min(s2.length - 1, i + range);
    for (let j = lo; j <= hi; j++) {
      if (!s2Matched[j] && s1[i] === s2[j]) {
        s2Matched[j] = true;
        result[i] = true;
        break;
      }
    }
  }
  return result;
}

/** Normalized Levenshtein similarity, 0–1. */
export function levenshteinSim(a: string, b: string): number {
  if (a === b) return 1;
  if (!a || !b) return 0;
  const dp: number[][] = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  const dist = dp[a.length][b.length];
  return 1 - dist / Math.max(a.length, b.length);
}
