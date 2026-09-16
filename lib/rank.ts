export type RankTier = 'Iron' | 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Emerald' | 'Diamond' | 'Master' | 'Grandmaster' | 'Challenger' | 'Unranked';

const TIER_ORDER: Record<RankTier, number> = {
  Unranked: -1,
  Iron: 0,
  Bronze: 1,
  Silver: 2,
  Gold: 3,
  Platinum: 4,
  Emerald: 5,
  Diamond: 6,
  Master: 7,
  Grandmaster: 8,
  Challenger: 9,
};

// Requested leaderboard order inside each divided tier:
// IV -> III -> II -> I.
// Sorting is descending, so I gets the largest division value.
const DIVISION_ORDER: Record<string, number> = {
  IV: 1,
  III: 2,
  II: 3,
  I: 4,
};

export function getRankTier(rank: string | null | undefined): RankTier {
  const value = String(rank || '').trim();
  const match = value.match(/^(Iron|Bronze|Silver|Gold|Platinum|Emerald|Diamond|Master|Grandmaster|Challenger)\b/i);
  if (!match) return 'Unranked';
  const tier = match[1].toLowerCase();
  return (Object.keys(TIER_ORDER) as RankTier[]).find(item => item.toLowerCase() === tier) || 'Unranked';
}

export function getRankScore(rank: string | null | undefined, lp = 0): number {
  const tier = getRankTier(rank);
  if (tier === 'Unranked') return -1;

  const base = TIER_ORDER[tier];

  // Master / Grandmaster / Challenger have no divisions:
  // more LP always means a higher place inside the tier.
  if (base >= TIER_ORDER.Master) {
    return base * 1_000_000 + Math.max(0, Number(lp) || 0);
  }

  const divisionMatch = String(rank || '').match(/\b(IV|III|II|I)\b/i);
  const division = divisionMatch
    ? DIVISION_ORDER[divisionMatch[1].toUpperCase()] || 0
    : 0;

  // Division weight is larger than any possible LP value, so the order is
  // always IV -> III -> II -> I regardless of LP.
  return base * 1_000_000 + division * 10_000 + Math.max(0, Number(lp) || 0);
}

export function sortPlayersByRank<T extends { rank?: string | null; lp?: number }>(players: T[]): T[] {
  return [...players].sort((a, b) => {
    const scoreDiff = getRankScore(b.rank, b.lp) - getRankScore(a.rank, a.lp);
    if (scoreDiff !== 0) return scoreDiff;
    return String(a.rank || '').localeCompare(String(b.rank || ''));
  });
}

export function getTotalMatches(player: { wins?: number; losses?: number }): number {
  return Math.max(0, Number(player.wins) || 0) + Math.max(0, Number(player.losses) || 0);
}
