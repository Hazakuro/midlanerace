'use client';
import {useCallback,useEffect,useMemo,useState} from 'react';
import {RankIcon} from '@/app/components/rank-icon';

export default function RaceLive({slug}:{slug:string}){
 const [data,setData]=useState<any>(null),[loading,setLoading]=useState(true),[error,setError]=useState('');
 const load=useCallback(async()=>{try{const r=await fetch(`/api/races/${encodeURIComponent(slug)}`,{cache:'no-store'});const j=await r.json();if(!r.ok)throw new Error(j.error||'Ошибка загрузки');setData(j);setError('')}catch(e){setError(e instanceof Error?e.message:'Ошибка загрузки')}finally{setLoading(false)}},[slug]);
 useEffect(()=>{load();const t=setInterval(load,60*60*1000);return()=>clearInterval(t)},[load]);
 const lastUpdate=useMemo(()=>data?.players?.reduce((d:any,p:any)=>!d||new Date(p.updatedAt)>new Date(d)?p.updatedAt:d,null),[data]);
 const opggUrl=(riotId:string)=>{const [gameName,...tagParts]=String(riotId||'').split('#');const tagLine=tagParts.join('#');return `https://op.gg/lol/summoners/euw/${encodeURIComponent(gameName)}-${encodeURIComponent(tagLine)}`};
 return <main className="wrap leaderboardPage">
  {loading&&!data?<div className="card">Загрузка leaderboard…</div>:error?<div className="card error">{error}</div>:<>
   <header className="leaderboardHeader">
    <div><div className="eyebrow">LEAGUE OF LEGENDS · EUW</div><h1>{data.race.name}</h1><p className="muted">Leaderboard · автообновление раз в час</p></div>
   </header>
   <div className="stats"><div><span>Участники</span><b>{data.players.length}</b></div><div><span>Лидер</span><b>{data.players[0]?`${data.players[0].rank} · ${data.players[0].lp} LP`:'—'}</b></div><div><span>Всего матчей</span><b>{data.players.reduce((a:number,p:any)=>a+p.totalMatches,0)}</b></div><div><span>Обновлено</span><b>{lastUpdate?new Date(lastUpdate).toLocaleTimeString('ru-RU'):'—'}</b></div></div>
   <section className="card tableCard">
    <div className="tableTitle"><div><b>LEADERBOARD</b><span className="muted leaderboardSub">RANKED SOLO/DUO</span></div><span className="muted">по рангу и LP</span></div>
    <div className="tableWrap"><table><thead><tr><th>#</th><th>Игрок</th><th>Ранг</th><th>LP</th><th>W/L</th><th>Матчи</th><th>WR</th><th>Peak</th></tr></thead><tbody>{data.players.map((p:any)=><tr key={p.riotId} className={p.position<=3?'topRow':''}><td className="pos">{p.position}</td><td><a className="playerLink" href={opggUrl(p.riotId)} target="_blank" rel="noreferrer">{p.riotId}</a><small>{p.region}</small></td><td><div className="rankCell"><RankIcon rank={p.rank} size={38}/><span>{p.rank}</span></div></td><td><strong>{p.lp}</strong></td><td>{p.wins} / {p.losses}</td><td><strong>{p.totalMatches}</strong></td><td>{p.winrate}%</td><td>{p.peakLp}</td></tr>)}</tbody></table></div>
   </section>
   <footer className="siteFooter">Сделано благодаря упорному труду <strong>Hazakuro</strong></footer>
  </>}
 </main>
}
