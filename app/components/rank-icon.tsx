import {getRankTier} from '@/lib/rank';

const tierColors: Record<string,string> = {
  Iron:'#8b95a5',
  Bronze:'#b87333',
  Silver:'#aeb8c7',
  Gold:'#e0b84b',
  Platinum:'#4cc7c0',
  Emerald:'#35c98b',
  Diamond:'#55a9e8',
  Master:'#9b68e8',
  Grandmaster:'#ef5d72',
  Challenger:'#61d8ff',
  Unranked:'#6b7280',
};

const tierLabels: Record<string,string> = {
  Iron:'I', Bronze:'B', Silver:'S', Gold:'G', Platinum:'P', Emerald:'E',
  Diamond:'D', Master:'M', Grandmaster:'GM', Challenger:'C', Unranked:'?',
};

export function RankIcon({rank,size=38}:{rank:string|null|undefined;size?:number}){
  const tier=getRankTier(rank);
  const color=tierColors[tier];
  const label=tierLabels[tier];

  return <svg width={size} height={size} viewBox="0 0 48 48" role="img" aria-label={tier} style={{display:'block',flex:'0 0 auto'}}>
    <defs>
      <linearGradient id={`rank-${tier}`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor={color}/>
        <stop offset="1" stopColor="#111827"/>
      </linearGradient>
    </defs>
    {tier==='Iron' && <path d="M24 4 39 12v16L24 44 9 28V12z" fill={`url(#rank-${tier})`} stroke={color} strokeWidth="2"/>}
    {tier==='Bronze' && <path d="m24 3 16 9-4 24-12 9-12-9-4-24z" fill={`url(#rank-${tier})`} stroke={color} strokeWidth="2"/>}
    {tier==='Silver' && <path d="M10 11h28l5 9-19 24L5 20z" fill={`url(#rank-${tier})`} stroke={color} strokeWidth="2"/>}
    {tier==='Gold' && <path d="M7 9h34l-4 25-13 9-13-9z" fill={`url(#rank-${tier})`} stroke={color} strokeWidth="2"/>}
    {tier==='Platinum' && <path d="M24 3 43 15 36 39 24 45 12 39 5 15z" fill={`url(#rank-${tier})`} stroke={color} strokeWidth="2"/>}
    {tier==='Emerald' && <path d="M24 3 42 13v22L24 45 6 35V13z" fill={`url(#rank-${tier})`} stroke={color} strokeWidth="2"/>}
    {tier==='Diamond' && <path d="m24 3 19 21-19 21L5 24z" fill={`url(#rank-${tier})`} stroke={color} strokeWidth="2"/>}
    {tier==='Master' && <path d="m24 3 8 7 10 2-2 10 5 9-9 5-4 10-8-5-8 5-4-10-9-5 5-9-2-10 10-2z" fill={`url(#rank-${tier})`} stroke={color} strokeWidth="2"/>}
    {tier==='Grandmaster' && <path d="M24 3 40 9l5 15-5 15-16 6-16-6-5-15L8 9z" fill={`url(#rank-${tier})`} stroke={color} strokeWidth="2"/>}
    {tier==='Challenger' && <path d="M24 3 29 9l8-1-1 8 7 5-7 5 1 8-8-1-5 7-5-7-8 1 1-8-7-5 7-5-1-8 8 1z" fill={`url(#rank-${tier})`} stroke={color} strokeWidth="2"/>}
    {tier==='Unranked' && <circle cx="24" cy="24" r="19" fill="#1f2937" stroke={color} strokeWidth="2"/>}
    <text x="24" y="29" textAnchor="middle" fill="white" fontSize={label.length>1?9:14} fontWeight="800" fontFamily="Arial, sans-serif">{label}</text>
  </svg>;
}
