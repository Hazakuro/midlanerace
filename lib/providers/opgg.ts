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

/**
 * Декодируем HTML entities.
 */
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
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Извлекает содержимое JSON-LD.
 */
function extractJsonLd(html: string): unknown[] {
  const result: unknown[] = [];

  const regex =
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

  let match: RegExpExecArray | null;

  while ((match = regex.exec(html)) !== null) {
    const raw = match[1].trim();

    if (!raw) continue;

    try {
      result.push(JSON.parse(raw));
    } catch {
      // Иногда JSON содержит HTML entities.
      try {
        result.push(JSON.parse(decodeHtml(raw)));
      } catch {
        // Игнорируем поврежденный JSON-LD.
      }
    }
  }

  return result;
}

/**
 * Рекурсивно ищет ProfilePage внутри JSON-LD.
 */
function findProfilePage(value: unknown): any | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findProfilePage(item);

      if (found) {
        return found;
      }
    }

    return null;
  }

  const object = value as Record<string, unknown>;

  if (object['@type'] === 'ProfilePage') {
    return object;
  }

  for (const child of Object.values(object)) {
    const found = findProfilePage(child);

    if (found) {
      return found;
    }
  }

  return null;
}

/**
 * Парсит описание OP.GG.
 *
 * Пример:
 *
 * Last Dance#slway is a League of Legends summoner on the EUW server.
 * Last Dance#slway's current SOLORANKED rank is gold 3 Division 3 27 LP
 * with 5 wins, 1 losses, and a 83% win rate.
 */
function parseProfileDescription(description: string): ParsedStats | null {
  const text = decodeHtml(description);

  /**
   * Обычные ранги:
   *
   * gold 3 Division 3 27 LP
   * platinum 4 Division 4 61 LP
   * diamond 1 Division 1 1 LP
   * emerald 4 Division 4 7 LP
   */
  const normalRankRegex =
    /\b(Iron|Bronze|Silver|Gold|Platinum|Emerald|Diamond)\s+([1-4])\s+Division\s+([1-4])\s+(\d+)\s*LP\b/i;

  /**
   * Master / Grandmaster / Challenger:
   *
   * Master 600 LP
   */
  const highRankRegex =
    /\b(Master|Grandmaster|Challenger)\s+(\d+)\s*LP\b/i;

  const normalMatch = text.match(normalRankRegex);

  if (normalMatch) {
    const tier = capitalize(normalMatch[1]);
    const division = normalMatch[2];
    const lp = Number(normalMatch[4]);

    const record = text.match(
      /\bwith\s+(\d+)\s+wins?,\s*(\d+)\s+losses?\b/i
    );

    return {
      rank: `${tier} ${division}`,
      lp,
      wins: record ? Number(record[1]) : 0,
      losses: record ? Number(record[2]) : 0,
    };
  }

  const highMatch = text.match(highRankRegex);

  if (highMatch) {
    const rank = capitalize(highMatch[1]);
    const lp = Number(highMatch[2]);

    const record = text.match(
      /\bwith\s+(\d+)\s+wins?,\s*(\d+)\s+losses?\b/i
    );

    return {
      rank,
      lp,
      wins: record ? Number(record[1]) : 0,
      losses: record ? Number(record[2]) : 0,
    };
  }

  /**
   * Если профиль реально Unranked.
   */
  if (
    /\bcurrent\s+SOLORANKED\s+rank\s+is\s+unranked\b/i.test(text)
  ) {
    return {
      rank: 'Unranked',
      lp: 0,
      wins: 0,
      losses: 0,
    };
  }

  return null;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

/**
 * Основной парсер OP.GG.
 */
function parseOpggHtml(html: string): ParsedStats | null {
  /**
   * 1. Сначала пробуем JSON-LD.
   * Это основной и наиболее стабильный источник.
   */
  const jsonLdBlocks = extractJsonLd(html);

  for (const block of jsonLdBlocks) {
    const profile = findProfilePage(block);

    if (!profile) {
      continue;
    }

    const description =
      typeof profile.description === 'string'
        ? profile.description
        : '';

    if (!description) {
      continue;
    }

    const parsed = parseProfileDescription(description);

    if (parsed) {
      return parsed;
    }
  }

  /**
   * 2. Запасной вариант:
   * ищем описание напрямую в HTML.
   */
  const decoded = decodeHtml(html);

  const descriptionMatch = decoded.match(
    /"description"\s*:\s*"([^"]*current[^"]*SOLORANKED[^"]*)"/i
  );

  if (descriptionMatch) {
    const parsed = parseProfileDescription(descriptionMatch[1]);

    if (parsed) {
      return parsed;
    }
  }

  /**
   * 3. Последний fallback — поиск по обычному тексту.
   */
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
