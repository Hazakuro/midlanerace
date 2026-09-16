'use client';
import {useCallback,useEffect,useMemo,useState} from 'react';
import Link from 'next/link';
export default function RaceLive({slug}:{slug:string}){
 const [data,setData]=useState<any>(null),[loading,setLoading]=useState(true),[error,setError]=useState('');
 const load=useCallback(async()=>{try{const r=await fetch(`/api/races/${encodeURIComponent(slug)}`,{cache:'no-store'});const j=await r.json();if(!r.ok)throw new Error(j.error||'Ошибка загрузки');setData(j);setError('')}catch(e){setError(e instanceof Error?e.message:'Ошибка загрузки')}finally{setLoading(false)}},[slug]);
 useEffect(()=>{load();const t=setInterval(load,15000);return()=>clearInterval(t)},[load]);
 const leader=data?.players?.[0]; const total=data?.players?.length||0;
 const updated=data?.players?.reduce((a:number,p:any)=>a+(p.wins+p.losses),0)||0;
 const lastUpdate=useMemo(()=>data?.players?.reduce((d:any,p:any)=>!d||new Date(p.updatedAt)>new Date(d)?p.updatedAt:d,null),[data]);
 return <div>
  {loading&&!data?<div className="card">Загрузка гонки…</div>:error?<div className="card error">{error}</div>:<>
   <div className="raceHero"><div><div className="eyebrow">{data.race.region} · {data.race.status}</div><h1>{data.race.name}</h1><p className="muted">Реальное время · автообновление каждые 15 секунд</p></div><button className="btn" onClick={load}>↻ Обновить</button></div>
   <div className="stats"><div><span>Участники</span><b>{total}</b></div><div><span>Лидер</span><b>{leader?leader.lp+' LP':'—'}</b></div><div><span>Матчи</span><b>{updated}</b></div><div><span>Последнее обновление</span><b>{lastUpdate?new Date(lastUpdate).toLocaleTimeString('ru-RU'):'—'}</b></div></div>
   <div className="card tableCard"><div className="tableTitle"><b>LEADERBOARD</b><span className="muted">по LP</span></div><div className="tableWrap"><table><thead><tr><th>#</th><th>Игрок</th><th>Ранг</th><th>LP</th><th>W/L</th><th>WR</th><th>Peak</th></tr></thead><tbody>{data.players.map((p:any)=><tr key={p.riotId}><td className="pos">{p.position}</td><td><Link className="playerLink" href={`/players/${encodeURIComponent(p.riotId)}`}>{p.riotId}</Link><small>{p.region}</small></td><td>{p.rank}</td><td><strong>{p.lp}</strong></td><td>{p.wins} / {p.losses}</td><td>{p.winrate}%</td><td>{p.peakLp}</td></tr>)}</tbody></table></div></div>
   <div className="card"><div className="tableTitle"><b>RECENT MATCHES</b><span className="muted">из Riot Match API</span></div>{data.matches.length===0?<p className="muted">Матчи появятся после первой синхронизации.</p>:<div className="matches">{data.matches.slice(0,12).map((m:any)=><div className="match" key={m.matchId}><div><strong>{m.queueId===420?'Ranked Solo':m.queueId===440?'Ranked Flex':'Queue '+m.queueId}</strong><small>{new Date(m.gameStart).toLocaleString('ru-RU')} · {m.durationSec?Math.floor(m.durationSec/60)+' мин':''}</small></div><span>{m.players.length} участн.</span></div>)}</div>}</div>
  </>}
 </div>
}
