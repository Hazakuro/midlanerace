import {getRankTier} from '@/lib/rank';

const iconBase = 'https://leagueoflegends.fandom.com/wiki/Special:FilePath/';

const iconFiles: Record<string, string> = {
  Iron: 'Season 2023 - Iron.png',
  Gold: 'Season 2023 - Gold.png',
  Bronze: '/ranks/bronze.png',
  Silver: '/ranks/silver.png',
  Platinum: '/ranks/platinum.png',
  Emerald: '/ranks/emerald.png',
  Diamond: '/ranks/diamond.png',
  Master: '/ranks/master.png',
  Grandmaster: '/ranks/grandmaster.png',
  Challenger: '/ranks/challenger.png',
};

export function RankIcon({ rank, size = 38 }: { rank: string | null | undefined; size?: number }) {
  const tier = getRankTier(rank);

  if (tier === 'Unranked') return null;

  const file = iconFiles[tier];
  if (!file) return null;

  const src = file.startsWith('/') ? file : `${iconBase}${encodeURIComponent(file)}`;

  return (
    <img
      src={src}
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
