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

// League divisions from lowest to highest: IV -> III -> II -> I.
// OP.GG data can contain either Roman numerals or Arabic numerals.
const DIVISION_ORDER: Record<string, number> = {
  IV: 1,
  '4': 1,
  III: 2,
  '3': 2,
  II: 3,
  '2': 3,
  I: 4,
  '1': 4,
};

export function getRankTier(rank: string | null | undefined): RankTier {
  const value = String(rank || '').trim();
  const match = value.match(/^(Iron|Bronze|Silver|Gold|Platinum|Emerald|Diamond|Master|Grandmaster|Challenger)\b/i);
  if (!match) return 'Unranked';
  const tier = match[1].toLowerCase();
  return (Object.keys(TIER_ORDER) as RankTier[]).find(item => item.toLowerCase() === tier) || 'Unranked';
}

function getDivisionValue(rank: string | null | undefined): number {
  const match = String(rank || '').match(/\b(IV|III|II|I|4|3|2|1)\b/i);
  if (!match) return 0;
  return DIVISION_ORDER[match[1].toUpperCase()] || 0;
}

export function getRankScore(rank: string | null | undefined, lp = 0): number {
  const tier = getRankTier(rank);
  if (tier === 'Unranked') return -1;

  const base = TIER_ORDER[tier];
  const safeLp = Math.max(0, Number(lp) || 0);

  // Master / Grandmaster / Challenger have no divisions: more LP is higher.
  if (base >= TIER_ORDER.Master) {
    return base * 1_000_000 + safeLp;
  }

  // For divided tiers the division always outranks LP:
  // I > II > III > IV, then LP within the same division.
  return base * 1_000_000 + getDivisionValue(rank) * 10_000 + safeLp;
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
