import {PrismaClient,RaceStatus} from '@prisma/client';
const db=new PrismaClient();
db.race.upsert({where:{slug:'MLG'},update:{},create:{name:'MLG',slug:'MLG',region:'EUW1',startsAt:new Date(),endsAt:new Date(Date.now()+7*86400000),status:RaceStatus.LIVE}}).then(r=>console.log(`Race ready: ${r.slug}`)).catch(e=>{console.error(e);process.exit(1)}).finally(()=>db.$disconnect());
