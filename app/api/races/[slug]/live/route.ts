import {NextResponse} from 'next/server';
import {db} from '@/lib/db';

export const dynamic='force-dynamic';

function regionCode(region:string){
 const value=region.toUpperCase();
 if(value==='EUW'||value==='EUW1')return'euw';
 if(value==='EUNE'||value==='EUN1')return'eune';
 if(value==='NA'||value==='NA1')return'na';
 if(value==='KR')return'kr';
 if(value==='JP'||value==='JP1')return'jp';
 if(value==='BR'||value==='BR1')return'br';
 if(value==='TR'||value==='TR1')return'tr';
 if(value==='RU'||value==='RU1')return'ru';
 if(value==='OCE'||value==='OC1')return'oce';
 if(value==='LAN'||value==='LA1')return'lan';
 if(value==='LAS'||value==='LA2')return'las';
 return value.toLowerCase().replace(/1$/,'');
}

function opggSlug(riotId:string){
 const hash=riotId.lastIndexOf('#');
 if(hash<=0)return encodeURIComponent(riotId);
 return `${encodeURIComponent(riotId.slice(0,hash).trim())}-${encodeURIComponent(riotId.slice(hash+1).trim())}`;
}

async function checkLive(riotId:string,region:string){
 const url=`https://op.gg/lol/summoners/${regionCode(region)}/${opggSlug(riotId)}/ingame`;
 try{
  const response=await fetch(url,{headers:{'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140 Safari/537.36','Accept-Language':'en-US,en;q=0.9'},cache:'no-store',redirect:'follow'});
  if(!response.ok)return{riotId,isLive:false,url};
  const html=(await response.text()).replace(/<[^>]+>/g,' ').replace(/\\s+/g,' ');
  const notLive=/is not in an active game|is not currently in a game|not in an active game|not currently in a game/i.test(html);
  return{riotId,isLive:!notLive,url};
 }catch{return{riotId,isLive:false,url};}
}

export async function GET(_:Request,{params}:{params:Promise<{slug:string}>}){
 const {slug}=await params;
 try{
  const race=await db.race.findUnique({where:{slug},include:{participants:{include:{player:true}}}});
  if(!race)return NextResponse.json({error:'Race not found'},{status:404});
  const live=await Promise.all(race.participants.map(p=>checkLive(p.player.riotId,p.player.region)));
  return NextResponse.json({live,checkedAt:new Date().toISOString()});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Live status unavailable'},{status:503});}
}
