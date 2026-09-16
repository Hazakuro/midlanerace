import {NextResponse} from 'next/server';
import {db} from '@/lib/db';
import {getRiotPlayer} from '@/lib/providers/riot';
export const dynamic='force-dynamic';
export async function POST(req:Request,{params}:{params:Promise<{slug:string}>}){
 const secret=req.headers.get('x-admin-secret'); if(process.env.SYNC_SECRET&&secret!==process.env.SYNC_SECRET)return NextResponse.json({error:'Unauthorized'},{status:401});
 const {slug}=await params; const body=await req.json().catch(()=>({})); const riotId=String(body.riotId||'').trim(); const region=String(body.region||'EUW1').trim().toUpperCase();
 if(!riotId)return NextResponse.json({error:'riotId is required'},{status:400});
 try{const race=await db.race.findUnique({where:{slug}});if(!race)return NextResponse.json({error:'Race not found'},{status:404});
  const data=await getRiotPlayer(riotId,region); const player=await db.player.upsert({where:{riotId:data.riotId},update:{region:data.region,puuid:data.puuid,rank:data.rank,lp:data.lp,wins:data.wins,losses:data.losses,peakLp:data.lp},create:{riotId:data.riotId,region:data.region,puuid:data.puuid,rank:data.rank,lp:data.lp,wins:data.wins,losses:data.losses,peakLp:data.lp}});
  await db.raceParticipant.upsert({where:{raceId_playerId:{raceId:race.id,playerId:player.id}},update:{},create:{raceId:race.id,playerId:player.id}});
  return NextResponse.json({ok:true,player});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Failed to add player'},{status:500});}
}
