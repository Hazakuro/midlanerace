import {db} from '@/lib/db';
import {getOpggPlayer} from '@/lib/providers/opgg';
import {sortPlayersByRank} from '@/lib/rank';

export async function refreshRaceData(slug = process.env.RACE_SLUG || 'MLG') {
  const race = await db.race.findUnique({
    where: {slug},
    include: {participants: {include: {player: true}}},
  });

  if (!race) throw new Error(`Race not found: ${slug}`);

  const results: Array<{riotId:string; rank:string; lp:number; wins:number; losses:number}> = [];
  const errors: Array<{riotId:string; error:string}> = [];

  for (const participant of race.participants) {
    const player = participant.player;
    try {
      const fresh = await getOpggPlayer(player.riotId, player.region);
      const peakLp = Math.max(player.peakLp, fresh.lp);

      await db.player.update({
        where: {id: player.id},
        data: {
          rank: fresh.rank,
          lp: fresh.lp,
          wins: fresh.wins,
          losses: fresh.losses,
          peakLp,
        },
      });

      await db.lpSnapshot.create({
        data: {playerId: player.id, raceId: race.id, lp: fresh.lp, rank: fresh.rank},
      });

      results.push({
        riotId: player.riotId,
        rank: fresh.rank,
        lp: fresh.lp,
        wins: fresh.wins,
        losses: fresh.losses,
      });
    } catch (error) {
      errors.push({
        riotId: player.riotId,
        error: error instanceof Error ? error.message : 'OP.GG update failed',
      });
    }
  }

  const currentPlayers = sortPlayersByRank(
    race.participants.map((participant) => {
      const fresh = results.find((item) => item.riotId === participant.player.riotId);
      return {
        ...participant.player,
        rank: fresh?.rank ?? participant.player.rank,
        lp: fresh?.lp ?? participant.player.lp,
      };
    })
  );

  await db.positionSnapshot.createMany({
    data: currentPlayers.map((player, index) => ({
      raceId: race.id,
      playerId: player.id,
      position: index + 1,
      lp: player.lp,
    })),
  });

  return {
    slug,
    updated: results.length,
    failed: errors.length,
    results,
    errors,
    updatedAt: new Date().toISOString(),
  };
}
