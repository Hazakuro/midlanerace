import {NextResponse} from 'next/server';
import {db} from '@/lib/db';
import {getOpggPlayer} from '@/lib/providers/opgg';
import {sortPlayersByRank} from '@/lib/rank';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(_: Request, {params}:{params:Promise<{slug:string}>}) {
  const {slug} = await params;

  try {
    const race = await db.race.findUnique({where:{slug},include:{participants:{include:{player:true}}}});
    if (!race) return NextResponse.json({error:'Race not found'}, {status:404});

    const results: Array<{riotId:string; rank:string; lp:number; wins:number; losses:number}> = [];
    const errors: Array<{riotId:string; error:string}> = [];

    for (const participant of race.participants) {
      const player = participant.player;
      try {
        const fresh = await getOpggPlayer(player.riotId, player.region);
        const peakLp = Math.max(player.peakLp, fresh.lp);
        await db.player.update({where:{id:player.id},data:{rank:fresh.rank,lp:fresh.lp,wins:fresh.wins,losses:fresh.losses,peakLp}});
        await db.lpSnapshot.create({data:{playerId:player.id,raceId:race.id,lp:fresh.lp,rank:fresh.rank}});
        results.push({riotId:player.riotId,rank:fresh.rank,lp:fresh.lp,wins:fresh.wins,losses:fresh.losses});
      } catch (error) {
        errors.push({riotId:player.riotId,error:error instanceof Error?error.message:'OP.GG update failed'});
      }
    }

    const currentPlayers = sortPlayersByRank(race.participants.map(p=>{
      const fresh = results.find(r=>r.riotId===p.player.riotId);
      return {...p.player,rank:fresh?.rank??p.player.rank,lp:fresh?.lp??p.player.lp};
    }));
    await db.positionSnapshot.createMany({data:currentPlayers.map((player,index)=>({raceId:race.id,playerId:player.id,position:index+1,lp:player.lp}))});

    return NextResponse.json({ok:errors.length===0,updated:results.length,failed:errors.length,results,errors,updatedAt:new Date().toISOString()});
  } catch (error) {
    return NextResponse.json({error:error instanceof Error?error.message:'Database unavailable'},{status:503});
  }
}
