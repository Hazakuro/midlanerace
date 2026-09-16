import {NextResponse} from 'next/server';
import {db} from '@/lib/db';
export async function GET(_:Request,{params}:{params:Promise<{slug:string}>}){
 const {slug}=await params;
 const race=await db.race.findUnique({where:{slug},include:{participants:{include:{player:true}},matches:{include:{players:{include:{player:true}}},orderBy:{gameStart:'desc'}},positionSnapshots:{orderBy:{recordedAt:'asc'}}}});
 if(!race)return NextResponse.json({error:'Race not found'},{status:404});
 return NextResponse.json(race);
}
