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
    .replace(/\\\"/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractJsonLd(html: string): unknown[] {
  const result: unknown[] = [];
  const regex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(html)) !== null) {
    const raw = match[1].trim();
    if (!raw) continue;
    try {
      result.push(JSON.parse(raw));
    } catch {
      try {
        result.push(JSON.parse(decodeHtml(raw)));
      } catch {
        // Игнорируем поврежденный JSON-LD.
      }
    }
  }

  return result;
}

function findProfilePage(value: unknown): any | null {
  if (!value || typeof value !== 'object') return null;

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findProfilePage(item);
      if (found) return found;
    }
    return null;
  }

  const object = value as Record<string, unknown>;
  const type = object['@type'];
  if (
    type === 'ProfilePage' ||
    (Array.isArray(type) && type.some(item => String(item).toLowerCase() === 'profilepage'))
  ) {
    return object;
  }

  for (const child of Object.values(object)) {
    const found = findProfilePage(child);
    if (found) return found;
  }

  return null;
}

function parseRecord(text: string): {wins:number;losses:number} {
  const record =
    text.match(/\bwith\s+(\d+)\s+wins?,\s*(\d+)\s+losses?\b/i) ||
    text.match(/\b(\d+)W\s+(\d+)L\b/i) ||
    text.match(/\b(\d+)\s*W\s+(\d+)\s*L\b/i);

  return record ? {wins:Number(record[1]),losses:Number(record[2])} : {wins:0,losses:0};
}

/**
 * Парсит описание/текст OP.GG.
 * Поддерживает старый формат "with 80 wins, 47 losses"
 * и новый видимый формат OP.GG "99W 57L".
 */
function parseProfileDescription(description: string): ParsedStats | null {
  const text = decodeHtml(description);

  const normalRankRegex =
    /\b(Iron|Bronze|Silver|Gold|Platinum|Emerald|Diamond)\s+([1-4])\s+Division\s+([1-4])\s+(\d+)\s*LP\b/i;

  const highRankRegex =
    /\b(Master|Grandmaster|Challenger)\s+(\d+)\s*LP\b/i;

  const normalMatch = text.match(normalRankRegex);

  if (normalMatch) {
    const tier = capitalize(normalMatch[1]);
    const division = normalMatch[2];
    const lp = Number(normalMatch[4]);
    const record = parseRecord(text);

    return {rank:`${tier} ${division}`,lp,wins:record.wins,losses:record.losses};
  }

  const highMatch = text.match(highRankRegex);

  if (highMatch) {
    const rank = capitalize(highMatch[1]);
    const lp = Number(highMatch[2]);
    const record = parseRecord(text);

    return {rank,lp,wins:record.wins,losses:record.losses};
  }

  if (/\bcurrent\s+SOLORANKED\s+rank\s+is\s+unranked\b/i.test(text)) {
    return {rank:'Unranked',lp:0,wins:0,losses:0};
  }

  return null;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function parseCurrentSoloRankedData(html: string): ParsedStats | null {
  const text = decodeHtml(html);

  // OP.GG exposes current queues in league_stats. Select SOLORANKED first;
  // a generic tier/lp search can otherwise hit historical/top-tier data.
  const queueRegex = /"game_type"\s*:\s*"SOLORANKED"([\s\S]{0,3000}?)(?="game_type"\s*:\s*"|$)/gi;
  let queueMatch: RegExpExecArray | null;

  while ((queueMatch = queueRegex.exec(text)) !== null) {
    const block = queueMatch[1];

    const tierMatch = block.match(
      /"tier_info"\s*:\s*\{[\s\S]{0,700}?"tier"\s*:\s*"?(IRON|BRONZE|SILVER|GOLD|PLATINUM|EMERALD|DIAMOND|MASTER|GRANDMASTER|CHALLENGER)"?[\s\S]{0,300}?(?:"division"\s*:\s*"?(\\d+)"?)?[\s\S]{0,300}?"lp"\s*:\s*(\d+)/i
    );

    if (!tierMatch) continue;

    const tier = capitalize(tierMatch[1]);
    const division = tierMatch[2];
    const lp = Number(tierMatch[3]);

    const winMatch = block.match(/"win"\s*:\s*(\d+)/i);
    const loseMatch = block.match(/"lose"\s*:\s*(\d+)/i);

    return {
      rank: ['Master', 'Grandmaster', 'Challenger'].includes(tier)
        ? tier
        : division
          ? tier + ' ' + division
          : tier,
      lp,
      wins: winMatch ? Number(winMatch[1]) : 0,
      losses: loseMatch ? Number(loseMatch[1]) : 0,
    };
  }

  return null;
}

function parseStructuredRankData(html: string): ParsedStats | null {
  // OP.GG also embeds the ranked data as structured JSON.
  // This fallback is intentionally independent from the visible page text,
  // because OP.GG can change the ProfilePage description format.
  const text = decodeHtml(html);

  const tierNames = '(Iron|Bronze|Silver|Gold|Platinum|Emerald|Diamond|Master|Grandmaster|Challenger)';

  const patterns = [
    new RegExp(
      `"tier"\\s*:\\s*"${tierNames}"[\\s\\S]{0,220}?"division"\\s*:\\s*(?:\"([1-4])\"|(1|2|3|4))[\\s\\S]{0,220}?"lp"\\s*:\\s*(\\d+)`,
      'i'
    ),
    new RegExp(
      `"tier"\\s*:\\s*"${tierNames}"[\\s\\S]{0,220}?"lp"\\s*:\\s*(\\d+)`,
      'i'
    ),
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match) continue;

    const tier = capitalize(match[1]);
    const division = match[2] || match[3];
    const lp = Number(match[4] || match[2]);

    if (['Master', 'Grandmaster', 'Challenger'].includes(tier)) {
      const recordMatch = text.match(/"win"\\s*:\\s*(\\d+)[\\s\\S]{0,120}?"lose"\\s*:\\s*(\\d+)/i);
      return {
        rank: tier,
        lp,
        wins: recordMatch ? Number(recordMatch[1]) : 0,
        losses: recordMatch ? Number(recordMatch[2]) : 0,
      };
    }

    if (division) {
      const recordMatch = text.match(/"win"\\s*:\\s*(\\d+)[\\s\\S]{0,120}?"lose"\\s*:\\s*(\\d+)/i);
      return {
        rank: `${tier} ${division}`,
        lp,
        wins: recordMatch ? Number(recordMatch[1]) : 0,
        losses: recordMatch ? Number(recordMatch[2]) : 0,
      };
    }
  }

  // Some OP.GG responses use uppercase enum values and an object close to:
  // tier: PLATINUM, division: 4, lp: 61.
  const loose = text.match(
    /(?:tier["']?\\s*[:=]\\s*["']?)(IRON|BRONZE|SILVER|GOLD|PLATINUM|EMERALD|DIAMOND|MASTER|GRANDMASTER|CHALLENGER)["']?[\\s\\S]{0,260}?(?:division["']?\\s*[:=]\\s*["']?)([1-4])["']?[\\s\\S]{0,260}?(?:lp["']?\\s*[:=]\\s*["']?)(\\d+)/i
  );

  if (loose) {
    const tier = capitalize(loose[1]);
    const division = loose[2];
    const lp = Number(loose[3]);
    const recordMatch = text.match(/(?:win|wins)["']?\\s*[:=]\\s*(\\d+)[\\s\\S]{0,120}?(?:lose|losses)["']?\\s*[:=]\\s*(\\d+)/i);

    return {
      rank: ['Master', 'Grandmaster', 'Challenger'].includes(tier) ? tier : `${tier} ${division}`,
      lp,
      wins: recordMatch ? Number(recordMatch[1]) : 0,
      losses: recordMatch ? Number(recordMatch[2]) : 0,
    };
  }

  return null;
}

function parseOpggHtml(html: string): ParsedStats | null {
  const jsonLdBlocks = extractJsonLd(html);

  for (const block of jsonLdBlocks) {
    const profile = findProfilePage(block);
    if (!profile) continue;

    const description =
      typeof profile.description === 'string' ? profile.description : '';

    if (!description) continue;

    const parsed = parseProfileDescription(description);
    if (parsed) return parsed;
  }

  const currentSolo = parseCurrentSoloRankedData(html);
  if (currentSolo) return currentSolo;

  const structured = parseStructuredRankData(html);
  if (structured) return structured;

  const decoded = decodeHtml(html);

  const descriptionMatch = decoded.match(
    /"description"\s*:\s*"([^"]*current[^"]*SOLORANKED[^"]*)"/i
  );

  if (descriptionMatch) {
    const parsed = parseProfileDescription(descriptionMatch[1]);
    if (parsed) return parsed;
  }

  const text = decoded
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return parseProfileDescription(text);
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
  const requestUrl = `${url}?queue_type=SOLORANKED&refresh=${Date.now()}`;
  const response = await fetch(requestUrl, {
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

  const html = await response.text();
  if (!html.trim()) {
    throw new Error('OP.GG returned an empty page');
  }

  return html;
}

export async function getOpggPlayer(
  riotId: string,
  region = 'EUW1'
): Promise<OpggPlayer> {
  const regionName = regionCode(region);
  const slug = buildSlug(riotId);
  const url = `https://op.gg/lol/summoners/${regionName}/${slug}`;

  console.log(`OP.GG request: ${url}`);

  const html = await fetchOpggPage(url);
  const stats = parseOpggHtml(html);

  if (!stats) {
    throw new Error('OP.GG rank data not found');
  }

  console.log(
    `OP.GG parsed ${riotId}: ${stats.rank} ${stats.lp} LP (${stats.wins}/${stats.losses})`
  );

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
