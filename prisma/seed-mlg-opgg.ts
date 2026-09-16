import { PrismaClient, RaceStatus } from '@prisma/client';
import { getOpggPlayer } from '../lib/providers/opgg';

const db = new PrismaClient();

const players = [
  'Leclerс#Charl',
  'Last Dance#slway',
  '300games50k#zxz',
  'uwutekk7#1314',
  'Spasibo Vadim#111',
  'babycyberia#nya',
  'seIf harm#sx7',
  'cute kuromi#333',
  'mid#11s',
  'Do not have#water',
  'Tоmioka#DEMON',
];

async function main() {
  const race = await db.race.upsert({
    where: { slug: 'MLG' },
    update: { name: 'MIDLANE ARENA PRIME RACE', region: 'EUW1', status: RaceStatus.LIVE },
    create: {
      name: 'MIDLANE ARENA PRIME RACE', slug: 'MLG', region: 'EUW1',
      startsAt: new Date(),
      endsAt: new Date(Date.now() + 7 * 86400000),
      status: RaceStatus.LIVE,
    },
  });

  for (const riotId of players) {
    const player = await db.player.upsert({
      where: { riotId },
      update: { region: 'EUW1' },
      create: { riotId, region: 'EUW1', rank: 'Unranked', lp: 0, wins: 0, losses: 0, peakLp: 0 },
    });

    await db.raceParticipant.upsert({
      where: { raceId_playerId: { raceId: race.id, playerId: player.id } },
      update: {},
      create: { raceId: race.id, playerId: player.id },
    });

    try {
      const data = await getOpggPlayer(riotId, 'EUW1');
      await db.player.update({
        where: { id: player.id },
        data: {
          rank: data.rank,
          lp: data.lp,
          wins: data.wins,
          losses: data.losses,
          peakLp: Math.max(player.peakLp, data.lp),
        },
      });
      await db.lpSnapshot.create({ data: {
        playerId: player.id, raceId: race.id, lp: data.lp, rank: data.rank,
      }});
      console.log(`OK ${riotId}: ${data.rank} ${data.lp} LP (${data.wins}/${data.losses})`);
    } catch (error) {
      console.warn(`OPGG FAIL ${riotId}: ${error instanceof Error ? error.message : 'unknown error'}`);
    }
  }

  console.log(`MIDLANE ARENA PRIME RACE ready: ${players.length} participants`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
