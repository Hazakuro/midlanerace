import {NextResponse} from 'next/server';
export const dynamic='force-dynamic';
export async function GET(){return NextResponse.json({ok:true,provider:process.env.DATA_PROVIDER||'riot',riotConfigured:Boolean(process.env.RIOT_API_KEY),timestamp:new Date().toISOString()});}
