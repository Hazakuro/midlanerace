import {getRankTier} from '@/lib/rank';

const iconFiles: Record<string, string> = {
  Iron: 'https://leagueoflegends.fandom.com/wiki/Special:FilePath/Season%202023%20-%20Iron.png',
  Gold: 'https://leagueoflegends.fandom.com/wiki/Special:FilePath/Season%202023%20-%20Gold.png',
  Bronze: '/ranks/Season_2023_-_Bronze.webp',
  Silver: '/ranks/Season_2023_-_Silver.webp',
  Platinum: '/ranks/Season_2023_-_Platinum.webp',
  Emerald: '/ranks/Season_2023_-_Emerald.webp',
  Diamond: '/ranks/Season_2023_-_Diamond.webp',
  Master: '/ranks/Season_2023_-_Master.webp',
  Grandmaster: '/ranks/Season_2023_-_Grandmaster.webp',
  Challenger: '/ranks/Season_2023_-_Challenger.webp',
};

export function RankIcon({ rank, size = 38 }: { rank: string | null | undefined; size?: number }) {
  const tier = getRankTier(rank);
  if (tier === 'Unranked') return null;

  const src = iconFiles[tier];
  if (!src) return null;

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
