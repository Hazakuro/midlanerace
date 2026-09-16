import Link from 'next/link';
import { db } from '@/lib/db';
import RaceLive from './race-live';
export const dynamic='force-dynamic';
export default async function RacePage({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params; let race:any=null; let error='';
  try{race=await db.race.findUnique({where:{slug},include:{participants:{include:{player:true}},matches:{include:{players:{include:{player:true}}},orderBy:{gameStart:'desc'},take:12}}});}catch(e){error=e instanceof Error?e.message:'Database unavailable';}
  if(!race) return <main className="wrap"><div className="nav"><Link className="brand" href="/">RACEHUB</Link></div><div className="card"><div className="eyebrow">RACE</div><h1>{slug}</h1><p className="muted">{error?'База данных пока не подключена.':'Гонка не найдена.'}</p><Link className="btn primary" href="/">На главную</Link></div></main>;
  const players=race.participants.map((x:any)=>x.player).sort((a:any,b:any)=>b.lp-a.lp);
  return <main className="wrap"><div className="nav"><Link className="brand" href="/">RACEHUB</Link><span className="pill">{race.status}</span></div><section className="hero"><div className="eyebrow">LIVE RACE · {race.region}</div><h1>{race.name}</h1><p className="muted">{new Date(race.startsAt).toLocaleString('ru-RU')} — {new Date(race.endsAt).toLocaleString('ru-RU')}</p></section><RaceLive slug={race.slug} initialPlayers={players.map((p:any,i:number)=>({position:i+1,riotId:p.riotId,region:p.region,rank:p.rank,lp:p.lp,wins:p.wins,losses:p.losses,peakLp:p.peakLp,winrate:p.wins+p.losses?Math.round(p.wins/(p.wins+p.losses)*100):0}))} initialMatches={race.matches}/></main>;
}
