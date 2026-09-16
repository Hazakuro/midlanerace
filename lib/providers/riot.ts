export type RiotPlayer={riotId:string;region:string;puuid?:string;rank:string;lp:number;wins:number;losses:number;peakLp?:number;avatar?:string};
function key(){const k=process.env.RIOT_API_KEY?.trim();if(!k)throw new Error('RIOT_API_KEY is not configured');return k}
export async function riot(url:string){const r=await fetch(url,{headers:{'X-Riot-Token':key()},cache:'no-store'});if(!r.ok)throw new Error(`Riot API ${r.status}`);return r.json();}
