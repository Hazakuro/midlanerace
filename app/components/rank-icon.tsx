import {getRankTier} from '@/lib/rank';

const iconBase = 'https://leagueoflegends.fandom.com/wiki/Special:FilePath/';

const iconFiles: Record<string, string> = {
  Iron: 'Season 2023 - Iron.png',
  Bronze: 'Season 2023 - Bronze.png',
  Silver: 'Season 2023 - Silver.png',
  Gold: 'Season 2023 - Gold.png',
  Platinum: 'Season 2023 - Platinum.png',
  Emerald: 'Season 2023 - Emerald.png',
  Diamond: 'Season 2023 - Diamond.png',
  Master: 'Season 2023 - Master.png',
  Grandmaster: 'Season 2023 - Grandmaster.png',
  Challenger: 'Season 2023 - Challenger.png',
};

export function RankIcon({ rank, size = 38 }: { rank: string | null | undefined; size?: number }) {
  const tier = getRankTier(rank);

  if (tier === 'Unranked') return null;

  const file = iconFiles[tier];
  if (!file) return null;

  return (
    <img
      src={`${iconBase}${encodeURIComponent(file)}`}
      width={size}
      height={size}
      alt={`${tier} rank`}
      title={tier}
      style={{
        display: 'block',
        flex: '0 0 auto',
        width: size,
        height: size,
        objectFit: 'contain',
      }}
    />
  );
}
