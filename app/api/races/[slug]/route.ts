import {NextResponse} from 'next/server';
import {db} from '@/lib/db';
import {sortPlayersByRank,getTotalMatches} from '@/lib/rank';
export const dynamic='force-dynamic';

export async function GET(_:Request,{params}:{params:Promise<{slug:string}>}){
 const {slug}=await params;
 try{
  const race=await db.race.findUnique({where:{slug},include:{participants:{include:{player:true}},matches:{include:{players:{include:{player:true}}},orderBy:{gameStart:'desc'},take:30}}});
  if(!race)return NextResponse.json({error:'Race not found'},{status:404});

  const sortedPlayers=sortPlayersByRank(race.participants.map(p=>p.player));
  const players=sortedPlayers.map((p,i)=>({
   position:i+1,
   riotId:p.riotId,
   region:p.region,
   rank:p.rank||'Unranked',
   lp:p.lp,
   wins:p.wins,
   losses:p.losses,
   totalMatches:getTotalMatches(p),
   peakLp:p.peakLp,
   winrate:p.wins+p.losses?Math.round(p.wins/(p.wins+p.losses)*100):0,
   updatedAt:p.updatedAt
  }));

  const matches=race.matches.map(m=>({matchId:m.matchId,gameStart:m.gameStart,durationSec:m.durationSec,queueId:m.queueId,players:m.players.map(x=>({riotId:x.player.riotId,win:x.win,champion:x.champion,kills:x.kills,deaths:x.deaths,assists:x.assists}))}));
  return NextResponse.json({race:{name:race.name,slug:race.slug,region:race.region,status:race.status,startsAt:race.startsAt,endsAt:race.endsAt},players,matches});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Database unavailable'},{status:503});}
}
