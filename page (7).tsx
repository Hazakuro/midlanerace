import Link from 'next/link';

export default function Home(){
  return <main className="wrap home">
    <div className="nav"><div className="brand">RACEHUB</div><span className="pill">LoL RACE TRACKER</span></div>
    <section className="hero homeHero">
      <div className="eyebrow">LIVE COMPETITIVE TRACKING</div>
      <h1>RaceHub</h1>
      <p className="muted">Отслеживайте гонки по LP, позиции, матчам и результатам участников.</p>
      <div className="homeActions"><Link className="btn primary" href="/races/MLG">Открыть MLG</Link><Link className="btn" href="/api/health">Проверить API</Link></div>
    </section>
    <div className="grid cards">
      <div className="card"><b>LIVE</b><div className="muted">Обновление лидерборда каждые 15 секунд</div></div>
      <div className="card"><b>RIOT API</b><div className="muted">Account, Summoner, League и Match V5</div></div>
      <div className="card"><b>POSTGRESQL</b><div className="muted">История LP, позиций и матчей</div></div>
    </div>
  </main>
}
