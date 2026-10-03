import {NextResponse} from 'next/server';
import {db} from '@/lib/db';
import {getOpggPlayer} from '@/lib/providers/opgg';
import {sortPlayersByRank} from '@/lib/rank';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

type RefreshResult = {
  riotId: string;
  rank: string;
  lp: number;
  wins: number;
  losses: number;
};

type RefreshError = {
  riotId: string;
  error: string;
};

async function refreshOne(
  raceId: string,
  player: {id:string; riotId:string; region:string; rank:string|null; lp:number; peakLp:number},
): Promise<RefreshResult> {
  let lastError: unknown = null;

  // Two attempts protect against short OP.GG/network hiccups without
  // replacing valid existing data with zeros or an error state.
  for (let attempt = 1; attempt <= 2; attempt++) {
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
        data: {
          playerId: player.id,
          raceId,
          lp: fresh.lp,
          rank: fresh.rank,
        },
      });

      return {
        riotId: player.riotId,
        rank: fresh.rank,
        lp: fresh.lp,
        wins: fresh.wins,
        losses: fresh.losses,
      };
    } catch (error) {
      lastError = error;
      if (attempt < 2) {
        await new Promise(resolve => setTimeout(resolve, 700));
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error('OP.GG update failed');
}

export async function POST(_: Request, {params}:{params:Promise<{slug:string}>}) {
  const {slug} = await params;

  try {
    const race = await db.race.findUnique({
      where: {slug},
      include: {participants: {include: {player: true}}},
    });

    if (!race) {
      return NextResponse.json({error:'Race not found'}, {status:404});
    }

    const results: RefreshResult[] = [];
    const errors: RefreshError[] = [];

    // Refresh in small parallel batches. This is much faster than waiting
    // for all 11 OP.GG requests one after another, while avoiding a burst
    // of requests that could trigger OP.GG rate limiting.
    const batchSize = 4;

    for (let i = 0; i < race.participants.length; i += batchSize) {
      const batch = race.participants.slice(i, i + batchSize);

      const batchResults = await Promise.allSettled(
        batch.map(({player}) => refreshOne(race.id, player))
      );

      batchResults.forEach((result, index) => {
        const player = batch[index].player;

        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          errors.push({
            riotId: player.riotId,
            error: result.reason instanceof Error
              ? result.reason.message
              : 'OP.GG update failed',
          });
        }
      });
    }

    // Failed players keep their last known data and still participate in
    // ranking/snapshot calculation.
    const currentPlayers = sortPlayersByRank(
      race.participants.map(p => {
        const fresh = results.find(r => r.riotId === p.player.riotId);

        return {
          ...p.player,
          rank: fresh?.rank ?? p.player.rank,
          lp: fresh?.lp ?? p.player.lp,
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

    return NextResponse.json({
      ok: errors.length === 0,
      updated: results.length,
      failed: errors.length,
      results,
      errors,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {error:error instanceof Error ? error.message : 'Database unavailable'},
      {status:503}
    );
  }
}
