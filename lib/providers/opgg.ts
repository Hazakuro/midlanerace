export type OpggPlayer = {
  riotId: string;
  region: string;
  rank: string;
  lp: number;
  wins: number;
  losses: number;
  peakLp: number;
};

type ParsedStats = {
  rank: string;
  lp: number;
  wins: number;
  losses: number;
};

const TIERS = [
  'Iron',
  'Bronze',
  'Silver',
  'Gold',
  'Platinum',
  'Emerald',
  'Diamond',
  'Master',
  'Grandmaster',
  'Challenger',
] as const;

const DIVISIONS = ['IV', 'III', 'II', 'I'] as const;

function decodeHtml(input: string): string {
  return input
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&#x2F;/gi, '/')
    .replace(/\\u002F/g, '/')
    .replace(/\\u0026/g, '&')
    .replace(/\\u003D/g, '=')
    .replace(/\\u0022/g, '"')
    .replace(/\\u0027/g, "'")
    .replace(/\\n/g, ' ')
    .replace(/\\r/g, ' ')
    .replace(/\\t/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripHtml(input: string): string {
  return decodeHtml(
    input
      .replace(/<script[^>]*>/gi, ' ')
      .replace(/<\/script>/gi, ' ')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
  );
}

function normalizeText(input: string): string {
  return input
    .replace(/\\u002F/g, '/')
    .replace(/\\u0026/g, '&')
    .replace(/\\u003D/g, '=')
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * OP.GG currently renders rank information similar to:
 *
 * Platinum 1 80 LP
 * Diamond 4 38 LP
 * Master 123 LP
 *
 * and record information:
 *
 * 81W 77L
 */
function parseStatsFromText(text: string): ParsedStats | null {
  const normalized = normalizeText(text);

  /*
   * First try the normal rendered text.
   */
  const rankRegex =
    /\b(Iron|Bronze|Silver|Gold|Platinum|Emerald|Diamond)\s+(IV|III|II|I)\s+(\d+)\s*LP\b/i;

  const highTierRegex =
    /\b(Master|Grandmaster|Challenger)\s+(\d+)\s*LP\b/i;

  const recordRegex = /\b(\d+)\s*W\s+(\d+)\s*L\b/i;

  const rankMatch =
    normalized.match(rankRegex) ??
    normalized.match(highTierRegex);

  if (rankMatch) {
    let rank: string;
    let lp: number;

    if (
      ['Master', 'Grandmaster', 'Challenger'].includes(
        rankMatch[1][0].toUpperCase() + rankMatch[1].slice(1).toLowerCase()
      )
    ) {
      rank = rankMatch[1];
      lp = Number(rankMatch[2]);
    } else {
      rank = `${rankMatch[1]} ${rankMatch[2]}`;
      lp = Number(rankMatch[3]);
    }

    const recordMatch = normalized.match(recordRegex);

    return {
      rank,
      lp,
      wins: recordMatch ? Number(recordMatch[1]) : 0,
      losses: recordMatch ? Number(recordMatch[2]) : 0,
    };
  }

  return null;
}

/**
 * OP.GG may put the actual profile payload inside JSON.
 * Search the raw response as well as the rendered text.
 */
function parseEmbeddedData(html: string): ParsedStats | null {
  const candidates: string[] = [
    html,
    decodeHtml(html),
    normalizeText(html),
  ];

  for (const candidate of candidates) {
    const parsed = parseStatsFromText(candidate);

    if (parsed) {
      return parsed;
    }
  }

  /*
   * Additional fallback:
   * OP.GG can encode rank fields separately in JSON.
   */
  const tierMatch = html.match(
    /"(?:tier|tierName|tier_name)"\s*:\s*"?(Iron|Bronze|Silver|Gold|Platinum|Emerald|Diamond|Master|Grandmaster|Challenger)"?/i
  );

  const divisionMatch = html.match(
    /"(?:rank|division|tierRank|divisionName)"\s*:\s*"?(IV|III|II|I)"?/i
  );

  const lpMatch = html.match(
    /"(?:leaguePoints|lp|league_points)"\s*:\s*(\d+)/i
  );

  const winsMatch = html.match(
    /"(?:wins|win)"\s*:\s*(\d+)/i
  );

  const lossesMatch = html.match(
    /"(?:losses|loss)"\s*:\s*(\d+)/i
  );

  if (tierMatch && lpMatch) {
    const tier = tierMatch[1];

    return {
      rank: divisionMatch
        ? `${tier} ${divisionMatch[1]}`
        : tier,
      lp: Number(lpMatch[1]),
      wins: winsMatch ? Number(winsMatch[1]) : 0,
      losses: lossesMatch ? Number(lossesMatch[1]) : 0,
    };
  }

  return null;
}

function buildSlug(riotId: string): string {
  const hashIndex = riotId.lastIndexOf('#');

  if (hashIndex <= 0 || hashIndex === riotId.length - 1) {
    throw new Error(`Invalid Riot ID: ${riotId}`);
  }

  const gameName = riotId.slice(0, hashIndex).trim();
  const tagLine = riotId.slice(hashIndex + 1).trim();

  return `${encodeURIComponent(gameName)}-${encodeURIComponent(tagLine)}`;
}

function regionCode(region: string): string {
  const value = region.toUpperCase();

  switch (value) {
    case 'EUW':
    case 'EUW1':
      return 'euw';

    case 'EUNE':
    case 'EUN1':
      return 'eune';

    case 'NA':
    case 'NA1':
      return 'na';

    case 'KR':
      return 'kr';

    case 'JP':
    case 'JP1':
      return 'jp';

    case 'BR':
    case 'BR1':
      return 'br';

    case 'TR':
    case 'TR1':
      return 'tr';

    case 'RU':
    case 'RU1':
      return 'ru';

    case 'OCE':
    case 'OC1':
      return 'oce';

    case 'LAN':
    case 'LA1':
      return 'lan';

    case 'LAS':
    case 'LA2':
      return 'las';

    default:
      return value.toLowerCase().replace(/1$/, '');
  }
}

async function fetchOpggPage(url: string): Promise<string> {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140 Safari/537.36',

      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',

      'Accept-Language': 'en-US,en;q=0.9',

      'Cache-Control': 'no-cache',

      Pragma: 'no-cache',
    },

    cache: 'no-store',

    redirect: 'follow',
  });

  if (!response.ok) {
    throw new Error(`OP.GG ${response.status}`);
  }

  return response.text();
}

export async function getOpggPlayer(
  riotId: string,
  region = 'EUW1'
): Promise<OpggPlayer> {
  const regionName = regionCode(region);
  const slug = buildSlug(riotId);

  /*
   * Current OP.GG profile format:
   *
   * https://op.gg/lol/summoners/euw/GameName-Tag
   */
  const url = `https://op.gg/lol/summoners/${regionName}/${slug}`;

  console.log(`OP.GG request: ${url}`);

  const html = await fetchOpggPage(url);

  /*
   * Don't silently convert an unknown profile to
   * "Unranked 0 LP".
   *
   * That was the reason the previous implementation
   * incorrectly returned Unranked for every player.
   */
  const stats =
    parseStatsFromText(stripHtml(html)) ??
    parseEmbeddedData(html);

  if (!stats) {
    /*
     * Check if OP.GG explicitly says the account is unranked.
     */
    const text = normalizeText(stripHtml(html));

    if (/\bUnranked\b/i.test(text)) {
      return {
        riotId,
        region,
        rank: 'Unranked',
        lp: 0,
        wins: 0,
        losses: 0,
        peakLp: 0,
      };
    }

    throw new Error('OP.GG rank data not found');
  }

  return {
    riotId,
    region,
    rank: stats.rank,
    lp: stats.lp,
    wins: stats.wins,
    losses: stats.losses,
    peakLp: stats.lp,
  };
}
