import {NextResponse} from 'next/server';
import {db} from '@/lib/db';
import {isAdmin} from '@/lib/admin';

export const runtime='nodejs';
const MAX_BYTES=6*1024*1024;
const placements=['top','aboveLeaderboard','belowLeaderboard','aboveRules','belowRules','footer','background','custom'];

export async function GET(){
  const images=await db.siteImage.findMany({orderBy:{createdAt:'asc'}});
  return NextResponse.json(images.map(x=>({id:x.id,name:x.name,placement:x.placement,width:x.width,opacity:x.opacity,marginTop:x.marginTop,marginBottom:x.marginBottom,enabled:x.enabled,mimeType:x.mimeType,src:`data:${x.mimeType};base64;${Buffer.from(x.data).toString('base64')}`})));
}

export async function POST(req:Request){
  if(!(await isAdmin())) return NextResponse.json({error:'Нет доступа'},{status:401});
  const body=await req.json().catch(()=>null);
  if(!body?.src || !String(body.src).startsWith('data:image/')) return NextResponse.json({error:'Нужен файл изображения'},{status:400});
  const match=String(body.src).match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if(!match) return NextResponse.json({error:'Некорректное изображение'},{status:400});
  const buffer=Buffer.from(match[2],'base64');
  if(buffer.length>MAX_BYTES) return NextResponse.json({error:'Максимальный размер изображения — 6 МБ'},{status:413});
  const placement=placements.includes(body.placement)?body.placement:'custom';
  const image=await db.siteImage.create({data:{name:String(body.name||'Изображение').slice(0,100),placement,data:buffer,mimeType:match[1],width:Math.min(100,Math.max(10,Number(body.width)||100)),opacity:Math.min(100,Math.max(0,Number(body.opacity)||100)),marginTop:Math.min(300,Math.max(0,Number(body.marginTop)||0)),marginBottom:Math.min(300,Math.max(0,Number(body.marginBottom)||12)),enabled:body.enabled!==false}});
  return NextResponse.json({ok:true,id:image.id});
}

export async function PATCH(req:Request){
  if(!(await isAdmin())) return NextResponse.json({error:'Нет доступа'},{status:401});
  const body=await req.json().catch(()=>null);
  if(!body?.id) return NextResponse.json({error:'Нет id'},{status:400});
  const image=await db.siteImage.update({where:{id:String(body.id)},data:{...(body.name!==undefined?{name:String(body.name).slice(0,100)}:{}),...(body.placement!==undefined&&placements.includes(body.placement)?{placement:body.placement}:{}),...(body.width!==undefined?{width:Math.min(100,Math.max(10,Number(body.width)||100))}:{}),...(body.opacity!==undefined?{opacity:Math.min(100,Math.max(0,Number(body.opacity)||100))}:{}),...(body.marginTop!==undefined?{marginTop:Math.min(300,Math.max(0,Number(body.marginTop)||0))}:{}),...(body.marginBottom!==undefined?{marginBottom:Math.min(300,Math.max(0,Number(body.marginBottom)||0))}:{}),...(body.enabled!==undefined?{enabled:Boolean(body.enabled)}:{})}});
  return NextResponse.json({ok:true,id:image.id});
}

export async function DELETE(req:Request){
  if(!(await isAdmin())) return NextResponse.json({error:'Нет доступа'},{status:401});
  const body=await req.json().catch(()=>null);
  if(!body?.id) return NextResponse.json({error:'Нет id'},{status:400});
  await db.siteImage.delete({where:{id:String(body.id)}});
  return NextResponse.json({ok:true});
}
