'use client';
import {useCallback,useEffect,useMemo,useState} from 'react';
import {RankIcon} from '@/app/components/rank-icon';

export default function RaceLive({slug}:{slug:string}){
 const [data,setData]=useState<any>(null),[loading,setLoading]=useState(true),[refreshing,setRefreshing]=useState(false),[error,setError]=useState(''),[refreshMessage,setRefreshMessage]=useState('');
 const load=useCallback(async()=>{try{const r=await fetch(`/api/races/${encodeURIComponent(slug)}`,{cache:'no-store'});const j=await r.json();if(!r.ok)throw new Error(j.error||'Ошибка загрузки');setData(j);setError('')}catch(e){setError(e instanceof Error?e.message:'Ошибка загрузки')}finally{setLoading(false)}},[slug]);
 useEffect(()=>{load();const t=setInterval(load,60*60*1000);return()=>clearInterval(t)},[load]);
 const refresh=useCallback(async()=>{if(refreshing)return;setRefreshing(true);setRefreshMessage('Обновляем данные из OP.GG…');setError('');try{const r=await fetch(`/api/races/${encodeURIComponent(slug)}/refresh`,{method:'POST',cache:'no-store'});const j=await r.json();if(!r.ok)throw new Error(j.error||'Ошибка обновления');await load();setRefreshMessage(j.failed?`Обновлено: ${j.updated}, ошибок: ${j.failed}`:`Обновлено игроков: ${j.updated}`);setTimeout(()=>setRefreshMessage(''),5000)}catch(e){setRefreshMessage('');setError(e instanceof Error?e.message:'Ошибка обновления')}finally{setRefreshing(false)}},[load,refreshing,slug]);
 const lastUpdate=useMemo(()=>data?.players?.reduce((d:any,p:any)=>!d||new Date(p.updatedAt)>new Date(d)?p.updatedAt:d,null),[data]);
 const opggUrl=(riotId:string)=>{const [gameName,...tagParts]=String(riotId||'').split('#');const tagLine=tagParts.join('#');return `https://op.gg/lol/summoners/euw/${encodeURIComponent(gameName)}-${encodeURIComponent(tagLine)}`};
 const placeBadge=(position:number)=>position===1?'🏆':position===2?'🥈':position===3?'🥉':position;
 return <main className="wrap leaderboardPage">
  {loading&&!data?<div className="card">Загрузка leaderboard…</div>:error?<div className="card error">{error}</div>:<>
   <header className="leaderboardHeader heroHeader">
    <div className="inkBlade inkBladeLeft" aria-hidden="true"/><div className="inkBlade inkBladeRight" aria-hidden="true"/>
    <div className="spiritOrb spiritOrbBlue" aria-hidden="true"/><div className="spiritOrb spiritOrbRed" aria-hidden="true"/>
    <div className="heroTitle"><div className="eyebrow">LEAGUE OF LEGENDS · EUW</div><h1>Midlane Arena</h1><div className="heroDivider"><i/><span>✦</span><i/></div><p className="muted">PRIME RACE · RANKED SOLO/DUO</p></div>
   </header>
   <div className="stats"><div><span>Участники</span><b>{data.players.length}</b></div><div><span>Лидер</span><b>{data.players[0]?`${data.players[0].rank} · ${data.players[0].lp} LP`:'—'}</b></div><div><span>Всего матчей</span><b>{data.players.reduce((a:number,p:any)=>a+p.totalMatches,0)}</b></div><div><span>Обновлено</span><b>{lastUpdate?new Date(lastUpdate).toLocaleTimeString('ru-RU'):'—'}</b></div></div>
   <div className="raceContent">
    <section className="card tableCard">
     <div className="tableTitle"><div><b>LEADERBOARD</b><span className="muted leaderboardSub">RANKED SOLO/DUO</span></div><div className="tableActions"><span className="muted">по рангу и LP</span><button className="refreshButton" onClick={refresh} disabled={refreshing}>{refreshing?'⟳ ОБНОВЛЕНИЕ…':'⟳ ОБНОВИТЬ ДАННЫЕ'}</button></div></div>
     {refreshMessage&&<div className="refreshMessage">{refreshMessage}</div>}
     <div className="tableWrap"><table><thead><tr><th>#</th><th>Игрок</th><th>Ранг</th><th>LP</th><th>W/L</th><th>Матчи</th><th>WR</th><th>Peak</th></tr></thead><tbody>{data.players.map((p:any)=><tr key={p.riotId} className={p.position<=3?`topRow prize-${p.position}`:''}><td className="pos">{placeBadge(p.position)}</td><td><a className="playerLink" href={opggUrl(p.riotId)} target="_blank" rel="noreferrer">{p.riotId}</a><small>{p.region}</small></td><td><div className="rankCell"><RankIcon rank={p.rank} size={96}/><span>{p.rank}</span></div></td><td><strong>{p.lp}</strong></td><td>{p.wins} / {p.losses}</td><td><strong>{p.totalMatches}</strong></td><td>{p.winrate}%</td><td>{p.peakLp}</td></tr>)}</tbody></table></div>
    </section>
    <aside className="card raceRules">
     <div className="rulesEyebrow">MIDLANE ARENA</div>
     <h2>ПРАВИЛА УЧАСТИЯ</h2>
     <div className="rulesDivider"><i/><span>✦</span><i/></div>
     <div className="rulePrize"><span>ПРИЗОВОЙ ФОНД</span><strong>50.000 ₽</strong></div>
     <ul>
      <li><b>Лимит игр</b><span>300</span></li>
      <li><b>Формат</b><span>Никакого дуо</span></li>
      <li><b>Победитель</b><span>Участник, находящийся на самом верху таблицы в конце сезона</span></li>
     </ul>
     <div className="rulesNote"><b>P.S.</b> Делайте клипы своих удачных / крутых моментов, если хотите попасть в видеомонтаж от <strong>Hazakuro</strong></div>
    </aside>
   </div>
   <footer className="siteFooter">Сделано благодаря упорному труду <strong>Hazakuro</strong></footer>
  </>}
 </main>
}
