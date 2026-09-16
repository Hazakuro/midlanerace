import {NextResponse} from 'next/server';
import {db} from '@/lib/db';
import {getRiotPlayer,getRecentMatches} from '@/lib/providers/riot';
export const dynamic='force-dynamic'; export const maxDuration=60;
export async function POST(req:Request){
 const provided=req.headers.get('x-sync-secret')||new URL(req.url).searchParams.get('secret'); const expected=process.env.SYNC_SECRET||process.env.CRON_SECRET;
 if(expected&&provided!==expected)return NextResponse.json({error:'Unauthorized'},{status:401});
 const url=new URL(req.url); let body:any={}; try{body=await req.json();}catch{} const slug=url.searchParams.get('race')||body.race||'MLG';
 try{const race=await db.race.findUnique({where:{slug},include:{participants:{include:{player:true}}}}); if(!race)return NextResponse.json({error:'Race not found'},{status:404});
  const updated:any[]=[],errors:any[]=[];
  for(const part of race.participants){try{const old=part.player.lp; const data=await getRiotPlayer(part.player.riotId,part.player.region);
   await db.player.update({where:{id:part.player.id},data:{puuid:data.puuid,rank:data.rank,lp:data.lp,wins:data.wins,losses:data.losses,peakLp:Math.max(part.player.peakLp,data.lp)}});
   await db.lpSnapshot.create({data:{playerId:part.player.id,raceId:race.id,lp:data.lp,rank:data.rank}}); updated.push({riotId:data.riotId,lp:data.lp,delta:data.lp-old});
   for(const m of await getRecentMatches(data.puuid,part.player.region,10)){const start=new Date(m.info.gameStartTimestamp); if(start<race.startsAt||start>race.endsAt)continue; if(await db.raceMatch.findUnique({where:{matchId:m.metadata.matchId}}))continue;
    const rm=await db.raceMatch.create({data:{raceId:race.id,matchId:m.metadata.matchId,gameStart:start,gameEnd:new Date(start.getTime()+Number(m.info.gameDuration||0)*1000),queueId:Number(m.info.queueId||0),mapId:Number(m.info.mapId||0),durationSec:Number(m.info.gameDuration||0)}});
    for(const pl of m.info.participants){const rp=await db.player.findFirst({where:{puuid:pl.puuid}}); if(rp)await db.raceMatchPlayer.create({data:{matchId:rm.id,playerId:rp.id,win:Boolean(pl.win),champion:String(pl.championName||''),kills:Number(pl.kills||0),deaths:Number(pl.deaths||0),assists:Number(pl.assists||0)}}).catch(()=>{});}
   }
  }catch(e){errors.push({riotId:part.player.riotId,error:e instanceof Error?e.message:'Sync failed'});}}
  const sorted=await db.raceParticipant.findMany({where:{raceId:race.id},include:{player:true},orderBy:{player:{lp:'desc'}}});
  for(let i=0;i<sorted.length;i++)await db.positionSnapshot.create({data:{raceId:race.id,playerId:sorted[i].playerId,position:i+1,lp:sorted[i].player.lp}});
  return NextResponse.json({ok:true,race:slug,updated,errors,positionCount:sorted.length,at:new Date().toISOString()});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Sync failed'},{status:500});}}
export const GET=POST;
