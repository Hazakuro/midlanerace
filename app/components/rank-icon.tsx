import {getRankTier} from '@/lib/rank';

const emblemBase = 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/ranked-emblem';

const tierColors: Record<string, string> = {
  Iron: '#8b95a5',
  Bronze: '#b87333',
  Silver: '#aeb8c7',
  Gold: '#e0b84b',
  Platinum: '#4cc7c0',
  Emerald: '#35c98b',
  Diamond: '#55a9e8',
  Master: '#9b68e8',
  Grandmaster: '#ef5d72',
  Challenger: '#61d8ff',
  Unranked: '#6b7280',
};

export function RankIcon({ rank, size = 38 }: { rank: string | null | undefined; size?: number }) {
  const tier = getRankTier(rank);

  if (tier === 'Unranked') {
    return (
      <span
        role="img"
        aria-label="Unranked"
        style={{
          display: 'block',
          flex: '0 0 auto',
          width: size,
          height: size,
          borderRadius: '50%',
          border: `2px solid ${tierColors.Unranked}`,
          background: '#1f2937',
          color: '#9ca3af',
          fontSize: Math.max(11, Math.round(size * 0.34)),
          fontWeight: 800,
          lineHeight: `${size}px`,
          textAlign: 'center',
        }}
      >
        ?
      </span>
    );
  }

  const src = `${emblemBase}/emblem-${tier.toLowerCase()}.png`;

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
