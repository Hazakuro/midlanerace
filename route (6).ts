import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
export const dynamic='force-dynamic';
export async function GET(){
  let database=false, databaseError: string|undefined;
  try { await db.$queryRaw`SELECT 1`; database=true; } catch(e){ databaseError=e instanceof Error?e.message:'Database unavailable'; }
  return NextResponse.json({ok:true,database,databaseError,riotConfigured:Boolean(process.env.RIOT_API_KEY),provider:process.env.DATA_PROVIDER||'riot',timestamp:new Date().toISOString()});
}
