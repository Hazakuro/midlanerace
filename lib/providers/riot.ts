export type RiotPlayer = {
  riotId: string; region: string; puuid: string; rank: string; lp: number;
  wins: number; losses: number; peakLp: number; avatar?: string;
};

const PLATFORM: Record<string,string> = {EUW:'euw1',EUW1:'euw1',EUNE:'eun1',EUN1:'eun1',NA:'na1',NA1:'na1',KR:'kr',JP:'jp1',JP1:'jp1',BR:'br1',BR1:'br1',TR:'tr1',TR1:'tr1',RU:'ru',RU1:'ru',OCE:'oc1',OC1:'oc1',LAN:'la1',LA1:'la1',LAS:'la2',LA2:'la2'};
const REGIONAL: Record<string,string> = {EUW:'europe',EUW1:'europe',EUNE:'europe',EUN1:'europe',NA:'americas',NA1:'americas',KR:'asia',JP:'asia',JP1:'asia',BR:'americas',BR1:'americas',TR:'europe',TR1:'europe',RU:'europe',RU1:'europe',OCE:'sea',OC1:'sea',LAN:'americas',LA1:'americas',LAS:'americas',LA2:'americas'};
function apiKey(){const k=process.env.RIOT_API_KEY?.trim();if(!k)throw new Error('RIOT_API_KEY is not configured');return k;}
function platform(region:string){return PLATFORM[region.toUpperCase()]??region.toLowerCase();}
function regional(region:string){return REGIONAL[region.toUpperCase()]??'europe';}
export async function riot(url:string){const r=await fetch(url,{headers:{'X-Riot-Token':apiKey()},cache:'no-store'});if(!r.ok)throw new Error(`Riot API ${r.status}`);return r.json();}
export async function getRiotPlayer(riotId:string,region:string):Promise<RiotPlayer>{
  const [gameName,tagLine] = riotId.split('#',2); if(!gameName)throw new Error('Invalid Riot ID');
  const routing=regional(region); const pfx=platform(region);
  const account=await riot(`https://${routing}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine||'1')}`);
  const summoner=await riot(`https://${pfx}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${encodeURIComponent(account.puuid)}`);
  const leagues=await riot(`https://${pfx}.api.riotgames.com/lol/league/v4/entries/by-summoner/${encodeURIComponent(summoner.id)}`);
  const solo=Array.isArray(leagues)?leagues.find((x:any)=>x.queueType==='RANKED_SOLO_5x5'):null;
  const lp=Number(solo?.leaguePoints??0),wins=Number(solo?.wins??0),losses=Number(solo?.losses??0);
  return {riotId:`${account.gameName}#${account.tagLine}`,region,puuid:account.puuid,rank:solo?`${solo.tier} ${solo.rank}`:'Unranked',lp,wins,losses,peakLp:lp,avatar:summoner.profileIconId?`https://ddragon.leagueoflegends.com/cdn/15.18.1/img/profileicon/${summoner.profileIconId}.png`:undefined};
}
export async function getRecentMatches(puuid:string,region:string,count=20){
  const routing=regional(region); const ids=await riot(`https://${routing}.api.riotgames.com/lol/match/v5/matches/by-puuid/${encodeURIComponent(puuid)}/ids?start=0&count=${count}`);
  const out:any[]=[]; for(const id of ids as string[]){try{out.push(await riot(`https://${routing}.api.riotgames.com/lol/match/v5/matches/${encodeURIComponent(id)}`));}catch{}}
  return out;
}
