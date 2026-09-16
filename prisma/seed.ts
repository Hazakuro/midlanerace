import { PrismaClient, RaceStatus } from '@prisma/client';

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
    update: { status: RaceStatus.LIVE },
    create: {
      name: 'MLG',
      slug: 'MLG',
      region: 'EUW1',
      startsAt: new Date(),
      endsAt: new Date(Date.now() + 7 * 86400000),
      status: RaceStatus.LIVE,
    },
  });

  for (const riotId of players) {
    const player = await db.player.upsert({
      where: { riotId },
      update: { region: 'EUW1' },
      create: { riotId, region: 'EUW1' },
    });

    await db.raceParticipant.upsert({
      where: { raceId_playerId: { raceId: race.id, playerId: player.id } },
      update: {},
      create: { raceId: race.id, playerId: player.id },
    });
  }

  console.log(`Race ready: ${race.slug}`);
  console.log(`Participants added: ${players.length}`);
  console.log(players.join('\n'));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
