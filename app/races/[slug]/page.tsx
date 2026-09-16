import Link from 'next/link';
import RaceLive from './race-live';
export const dynamic='force-dynamic';
export default async function RacePage({params}:{params:Promise<{slug:string}>}){const {slug}=await params;return <main className="wrap"><div className="nav"><Link className="brand" href="/">RACEHUB</Link><span className="pill">LIVE RACE</span></div><RaceLive slug={slug}/></main>}
