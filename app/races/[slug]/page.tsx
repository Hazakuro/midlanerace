import Link from 'next/link';
export const dynamic='force-dynamic';
export default async function RacePage({params}:{params:Promise<{slug:string}>}){const {slug}=await params;return <main className="wrap"><div className="nav"><Link className="brand" href="/">RACEHUB</Link><span className="pill">RACE</span></div><div className="card"><div className="eyebrow">RACE</div><h1>{slug}</h1><p className="muted">Гонка загружена. Подключение PostgreSQL и Riot API настраивается через переменные окружения Railway.</p><Link className="btn primary" href="/">На главную</Link></div></main>}
