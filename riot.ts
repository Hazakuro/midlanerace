export type RiotPlayer = {
  riotId: string; region: string; puuid?: string; rank: string; lp: number;
  wins: number; losses: number; peakLp?: number; avatar?: string;
};

const ROUTING: Record<string,string> = {
  EUW1:'euw1', EUN1:'eun1', NA1:'na1', KR:'kr', JP1:'jp1', BR1:'br1', LA1:'la1', LA2:'la2', OC1:'oc1', TR1:'tr1', RU:'ru'
};
const PLATFORM: Record<string,string> = { EUW:'euw1', EUW1:'euw1', EUNE:'eun1', EUN1:'eun1', NA:'na1', NA1:'na1', KR:'kr', JP:'jp1', JP1:'jp1', BR:'br1', BR1:'br1', TR:'tr1', TR1:'tr1', RU:'ru', RU1:'ru', OCE:'oc1', OC1:'oc1', LAN:'la1', LAS:'la2' };
const REGIONAL: Record<string,string> = { EUW1:'europe', EUN1:'europe', NA1:'americas', KR:'asia', JP1:'asia', BR1:'americas', LA1:'americas', LA2:'americas', OC1:'sea', TR1:'europe', RU:'europe' };

function key(){ return process.env.RIOT_API_KEY?.trim(); }
function platform(region:string){ return PLATFORM[region.toUpperCase()] ?? region.toLowerCase(); }
function regional(region:string){ return REGIONAL[region.toUpperCase()] ?? 'europe'; }
async function riot(url:string){
  const k=key(); if(!k) throw new Error('RIOT_API_KEY is not configured');
  const r=await fetch(url,{headers:{'X-Riot-Token':k},cache:'no-store'});
  if(!r.ok) throw new Error(`Riot API ${r.status}`);
  return r.json();
}

export async function getRiotPlayer(riotId:string, region:string):Promise<RiotPlayer>{
  const [gameName, tagLine] = riotId.includes('#') ? riotId.split('#',2) : [riotId, ''];
  if(!gameName) throw new Error('Invalid Riot ID');
  const routing=regional(region);
  const account=await riot(`https://${routing}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine || '1')}`);
  const p=await riot(`https://${platform(region)}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${encodeURIComponent(account.puuid)}`);
  const leagues=await riot(`https://${platform(region)}.api.riotgames.com/lol/league/v4/entries/by-summoner/${encodeURIComponent(p.id)}`);
  const solo=Array.isArray(leagues) ? leagues.find((x:any)=>x.queueType==='RANKED_SOLO_5x5') : null;
  const wins=Number(solo?.wins??0), losses=Number(solo?.losses??0), lp=Number(solo?.leaguePoints??0);
  return { riotId: `${account.gameName}#${account.tagLine}`, region, puuid:account.puuid, rank: solo ? `${solo.tier} ${solo.rank}` : 'Unranked', lp, wins, losses, peakLp:lp, avatar:p.profileIconId ? `https://ddragon.leagueoflegends.com/cdn/15.18.1/img/profileicon/${p.profileIconId}.png` : undefined };
}

export async function getRecentMatches(puuid:string, region:string, count=20){
  const routing=regional(region); const ids=await riot(`https://${routing}.api.riotgames.com/lol/match/v5/matches/by-puuid/${encodeURIComponent(puuid)}/ids?start=0&count=${count}`);
  const out=[];
  for(const id of ids as string[]){
    try { const m=await riot(`https://${routing}.api.riotgames.com/lol/match/v5/matches/${encodeURIComponent(id)}`); out.push(m); } catch {}
  }
  return out;
}
