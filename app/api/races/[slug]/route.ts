import {NextResponse} from 'next/server';export async function GET(_:Request,{params}:{params:Promise<{slug:string}>}){const {slug}=await params;return NextResponse.json({slug});}
