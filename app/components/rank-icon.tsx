import {getRankTier} from '@/lib/rank';

const iconBase = 'https://static.wikia.nocookie.net/leagueoflegends/images/';

const iconFiles: Record<string, string> = {
  Iron: 'https://leagueoflegends.fandom.com/wiki/Special:FilePath/Season%202023%20-%20Iron.png',
  Gold: 'https://leagueoflegends.fandom.com/wiki/Special:FilePath/Season%202023%20-%20Gold.png',
  Bronze: `${iconBase}c/cb/Season_2023_-_Bronze.png/revision/latest/scale-to-width-down/130?cb=20231007195824`,
  Silver: `${iconBase}c/c4/Season_2023_-_Silver.png/revision/latest/scale-to-width-down/130?cb=20231007195834`,
  Platinum: `${iconBase}b/bd/Season_2023_-_Platinum.png/revision/latest/scale-to-width-down/130?cb=20231007195833`,
  Emerald: `${iconBase}4/4b/Season_2023_-_Emerald.png/revision/latest/scale-to-width-down/130?cb=20231007195827`,
  Diamond: `${iconBase}3/37/Season_2023_-_Diamond.png/revision/latest/scale-to-width-down/130?cb=20231007195826`,
  Master: `${iconBase}d/d5/Season_2023_-_Master.png/revision/latest/scale-to-width-down/130?cb=20231007195832`,
  Grandmaster: `${iconBase}6/64/Season_2023_-_Grandmaster.png/revision/latest/scale-to-width-down/130?cb=20231007195830`,
  Challenger: `${iconBase}1/14/Season_2023_-_Challenger.png/revision/latest/scale-to-width-down/130?cb=20231007195825`,
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
