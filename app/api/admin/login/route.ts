import {NextResponse} from 'next/server';
import {adminCookieName} from '@/lib/admin';

export async function POST(req:Request){
  const body=await req.json().catch(()=>({}));
  const password=String(body.password||'');
  const expected=process.env.ADMIN_PASSWORD;
  if(!expected || password!==expected) return NextResponse.json({error:'Неверный пароль'},{status:401});
  const res=NextResponse.json({ok:true});
  res.cookies.set(adminCookieName(),password,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:60*60*24*30});
  return res;
}

export async function DELETE(){
  const res=NextResponse.json({ok:true});
  res.cookies.set(adminCookieName(),'',{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:0});
  return res;
}
