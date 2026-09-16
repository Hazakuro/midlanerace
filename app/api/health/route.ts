import {NextResponse} from 'next/server';
import {db} from '@/lib/db';
export const dynamic='force-dynamic';
export async function GET(){let databaseOk=false;try{await db.$queryRaw`SELECT 1`;databaseOk=true;}catch{}return NextResponse.json({ok:databaseOk,provider:process.env.DATA_PROVIDER||'riot',riotConfigured:Boolean(process.env.RIOT_API_KEY),databaseConfigured:Boolean(process.env.DATABASE_URL),databaseOk,timestamp:new Date().toISOString()},{status:databaseOk?200:503});}
