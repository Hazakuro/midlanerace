'use client';
import {useCallback,useEffect,useMemo,useState} from 'react';
import {RankIcon} from '@/app/components/rank-icon';

type HistoryPoint={lp:number;rank:string|null;position:number;recordedAt:string};

export default function RaceLive({slug}:{slug:string}){
 const [data,setData]=useState<any>(null),[loading,setLoading]=useState(true),[refreshing,setRefreshing]=useState(false),[error,setError]=useState(''),[refreshMessage,setRefreshMessage]=useState(''),[expanded,setExpanded]=useState<string|null>(null),[now,setNow]=useState(Date.now());
 const load=useCallback(async()=>{try{const r=await fetch(`/api/races/${encodeURIComponent(slug)}`,{cache:'no-store'});const j=await r.json();if(!r.ok)throw new Error(j.error||'Ошибка загрузки');setData(j);setError('')}catch(e){setError(e instanceof Error?e.message:'Ошибка загрузки')}finally{setLoading(false)}},[slug]);
 useEffect(()=>{load();const t=setInterval(load,60*60*1000);return()=>clearInterval(t)},[load]);
 useEffect(()=>{const t=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(t)},[]);
 const refresh=useCallback(async()=>{if(refreshing)return;setRefreshing(true);setRefreshMessage('Обновляем данные из OP.GG…');setError('');try{const r=await fetch(`/api/races/${encodeURIComponent(slug)}/refresh`,{method:'POST',cache:'no-store'});const j=await r.json();if(!r.ok)throw new Error(j.error||'Ошибка обновления');await load();setRefreshMessage(j.failed?`Обновлено: ${j.updated}, ошибок: ${j.failed}`:`Обновлено игроков: ${j.updated}`);setTimeout(()=>setRefreshMessage(''),5000)}catch(e){setRefreshMessage('');setError(e instanceof Error?e.message:'Ошибка обновления')}finally{setRefreshing(false)}},[load,refreshing,slug]);
 const lastUpdate=useMemo(()=>data?.players?.reduce((d:any,p:any)=>!d||new Date(p.updatedAt)>new Date(d)?p.updatedAt:d,null),[data]);
 const totalMatches=useMemo(()=>data?.players?.reduce((a:number,p:any)=>a+p.totalMatches,0)||0,[data]);
 const totalGameLimit=300;
 const countdown=useMemo(()=>{if(!data?.race?.endsAt)return '—';let s=Math.max(0,Math.floor((new Date(data.race.endsAt).getTime()-now)/1000));const d=Math.floor(s/86400);s%=86400;const h=Math.floor(s/3600);s%=3600;const m=Math.floor(s/60);return `${d}д ${String(h).padStart(2,'0')}ч ${String(m).padStart(2,'0')}м`},[data,now]);
 const opggUrl=(riotId:string)=>{const [gameName,...tagParts]=String(riotId||'').split('#');const tagLine=tagParts.join('#');return `https://op.gg/lol/summoners/euw/${encodeURIComponent(gameName)}-${encodeURIComponent(tagLine)}`};
 const placeBadge=(position:number)=>position===1?'🏆':position===2?'🥈':position===3?'🥉':position;
 const historyFor=(riotId:string):HistoryPoint[]=>data?.history?.[riotId]||[];
 const positionDelta=(riotId:string,current:number)=>{const h=historyFor(riotId);if(h.length<2)return 0;const previous=h[h.length-2]?.position;return typeof previous==='number'?previous-current:0};
 const sparkline=(points:HistoryPoint[])=>{const values=points.length?points.map(x=>x.lp):[0];const min=Math.min(...values),max=Math.max(...values),range=Math.max(1,max-min);return values.map((v,i)=>`${(i/Math.max(1,values.length-1))*100},${28-((v-min)/range)*24}`).join(' ')};
 return <main className="wrap leaderboardPage">
  <div className="mist mistA"/><div className="mist mistB"/><div className="particles" aria-hidden="true"/>
  {loading&&!data?<div className="card">Загрузка leaderboard…</div>:error?<div className="card error">{error}</div>:<>
   <header className="leaderboardHeader heroHeader">
    <div className="inkBlade inkBladeLeft" aria-hidden="true"/><div className="inkBlade inkBladeRight" aria-hidden="true"/>
    <div className="spiritOrb spiritOrbBlue" aria-hidden="true"/><div className="spiritOrb spiritOrbRed" aria-hidden="true"/>
    <div className="heroTitle"><div className="eyebrow">LEAGUE OF LEGENDS · EUW</div><h1>Midlane Arena</h1><div className="heroDivider"><i/><span>✦</span><i/></div><p className="muted">PRIME RACE · RANKED SOLO/DUO</p></div>
   </header>
   <section className="raceOverview">
    <div className="stats"><div><span>Участники</span><b>{data.players.length}</b></div><div><span>Лидер</span><b>{data.players[0]?`${data.players[0].rank} · ${data.players[0].lp} LP`:'—'}</b></div><div><span>Всего матчей</span><b>{totalMatches} / {totalGameLimit*data.players.length}</b></div><div><span>До конца</span><b>{countdown}</b></div></div>
    <div className="raceProgress"><div className="progressMeta"><span>ОБЩИЙ ПРОГРЕСС ИГР</span><strong>{Math.min(100,Math.round(totalMatches/(Math.max(1,totalGameLimit*data.players.length))*100))}%</strong></div><div className="progressTrack"><i style={{width:`${Math.min(100,totalMatches/(Math.max(1,totalGameLimit*data.players.length))*100)}%`}}/></div></div>
   </section>
   <section className="podium" aria-label="Топ игроков">
    {data.players.slice(0,3).map((p:any,i:number)=><div key={p.riotId} className={`podiumCard podium-${i+1}`}><div className="podiumPlace">{placeBadge(i+1)}</div><RankIcon rank={p.rank} size={70}/><div className="podiumPlayer"><a href={opggUrl(p.riotId)} target="_blank" rel="noreferrer">{p.riotId}</a><span>{p.rank}</span></div><strong>{p.lp} LP</strong><small>{p.totalMatches}/300 игр · {p.winrate}% WR</small></div>)}
   </section>
   <div className="raceContent">
    <section className="card tableCard">
     <div className="tableTitle"><div><b>LEADERBOARD</b><span className="muted leaderboardSub">RANKED SOLO/DUO</span></div><div className="tableActions"><span className="muted">по рангу и LP</span><button className="refreshButton" onClick={refresh} disabled={refreshing}>{refreshing?'⟳ ОБНОВЛЕНИЕ…':'⟳ ОБНОВИТЬ ДАННЫЕ'}</button></div></div>
     {refreshMessage&&<div className={`refreshMessage ${refreshing?'isRefreshing':''}`}><span>✦</span>{refreshMessage}</div>}
     <div className="tableWrap"><table><thead><tr><th>#</th><th>Игрок</th><th>Ранг</th><th>LP</th><th>W/L</th><th>Матчи</th><th>WR</th><th>LP/игра</th><th>Peak</th><th/></tr></thead><tbody>{data.players.map((p:any)=><>
      <tr key={p.riotId} className={p.position<=3?`topRow prize-${p.position}`:''} onClick={()=>setExpanded(expanded===p.riotId?null:p.riotId)}>
       <td className="pos">{placeBadge(p.position)}{positionDelta(p.riotId,p.position)!==0&&<span className={`positionDelta ${positionDelta(p.riotId,p.position)>0?'up':'down'}`}>{positionDelta(p.riotId,p.position)>0?'▲':'▼'} {Math.abs(positionDelta(p.riotId,p.position))}</span>}</td>
       <td><a className="playerLink" href={opggUrl(p.riotId)} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()}>{p.riotId}</a><small>{p.region}</small></td>
       <td><div className="rankCell"><RankIcon rank={p.rank} size={96}/><span>{p.rank}</span></div></td><td><strong>{p.lp}</strong></td><td>{p.wins} / {p.losses}</td><td><strong>{p.totalMatches}</strong><div className="gameProgress"><i style={{width:`${Math.min(100,p.totalMatches/3)}%`}}/></div></td><td>{p.winrate}%</td><td>{p.lpPerGame}</td><td>{p.peakLp}</td><td className="expandCell">{expanded===p.riotId?'−':'+'}</td>
      </tr>
      {expanded===p.riotId&&<tr key={`${p.riotId}-details`} className="detailsRow"><td colSpan={10}><div className="playerDetails"><div className="detailHead"><div><b>{p.riotId}</b><span>Детали прогресса</span></div><div className="freshness">● данные обновлены {new Date(p.updatedAt).toLocaleTimeString('ru-RU')}</div></div><div className="detailGrid"><div className="detailStat"><span>ТЕКУЩИЙ LP</span><strong>{p.lp}</strong></div><div className="detailStat"><span>PEAK LP</span><strong>{p.peakLp}</strong></div><div className="detailStat"><span>ПОБЕДЫ</span><strong>{p.wins}</strong></div><div className="detailStat"><span>ПОРАЖЕНИЯ</span><strong>{p.losses}</strong></div><div className="detailStat"><span>LP / ИГРА</span><strong>{p.lpPerGame}</strong></div><div className="detailStat"><span>ПОЗИЦИЯ</span><strong>#{p.position}</strong></div><div className="lpChart"><div><span>ИСТОРИЯ LP</span><b>{historyFor(p.riotId).length?`${historyFor(p.riotId).length} обновлений`:'История появится после обновлений'}</b></div><svg viewBox="0 0 100 32" preserveAspectRatio="none"><polyline points={sparkline(historyFor(p.riotId))} fill="none" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke"/></svg></div></div></div></td></tr>}
     </>)}</tbody></table></div>
    </section>
    <aside className="card raceRules"><div className="rulesEyebrow">MIDLANE ARENA</div><h2>ПРАВИЛА УЧАСТИЯ</h2><div className="rulesDivider"><i/><span>✦</span><i/></div><div className="rulePrize"><span>ПРИЗОВОЙ ФОНД</span><strong>50.000 ₽</strong></div><ul><li><b>Лимит игр</b><span>300</span></li><li><b>Формат</b><span>Никакого дуо</span></li><li><b>Победитель</b><span>Участник, находящийся на самом верху таблицы в конце сезона</span></li></ul><div className="rulesNote"><b>P.S.</b> Делайте клипы своих удачных / крутых моментов, если хотите попасть в видеомонтаж от <strong>Hazakuro</strong></div></aside>
   </div>
   <div className="updateLine">{lastUpdate?`Последнее обновление данных: ${new Date(lastUpdate).toLocaleString('ru-RU')}`:'Данные ещё не обновлялись'}</div>
   <footer className="siteFooter">Сделано благодаря упорному труду <strong>Hazakuro</strong></footer>
  </>}
 </main>
}
