export type OpggPlayer = {
  riotId: string;
  region: string;
  rank: string;
  lp: number;
  wins: number;
  losses: number;
  peakLp: number;
};

function decodeHtml(input: string) {
  return input
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function parseRank(text: string) {
  const start = text.indexOf('Ranked Solo/Duo');
  const section = start >= 0 ? text.slice(start, start + 1800) : text;

  if (/\bUnranked\b/i.test(section)) return { rank: 'Unranked', lp: 0 };

  const match = section.match(/\b(Iron|Bronze|Silver|Gold|Platinum|Emerald|Diamond)\s+(IV|III|II|I)\s+(\d+)\s*LP\b/i)
    ?? section.match(/\b(Master|Grandmaster|Challenger)\s+(\d+)\s*LP\b/i);

  if (!match) throw new Error('OP.GG rank data not found');

  if (/^(Master|Grandmaster|Challenger)$/i.test(match[1])) {
    return { rank: match[1], lp: Number(match[2]) };
  }

  return { rank: `${match[1]} ${match[2]}`, lp: Number(match[3]) };
}

function parseRecord(text: string) {
  const start = text.indexOf('Ranked Solo/Duo');
  const section = start >= 0 ? text.slice(start, start + 1800) : text;
  const match = section.match(/\b(\d+)W\s+(\d+)L\b/i);
  if (!match) return { wins: 0, losses: 0 };
  return { wins: Number(match[1]), losses: Number(match[2]) };
}

function opggSlug(riotId: string) {
  const [gameName, tagLine] = riotId.split('#', 2);
  if (!gameName || !tagLine) throw new Error('Invalid Riot ID');
  return `${encodeURIComponent(gameName)}-${encodeURIComponent(tagLine)}`;
}

export async function getOpggPlayer(riotId: string, region = 'EUW1'): Promise<OpggPlayer> {
  const regionCode = region.toUpperCase().replace(/1$/, '').toLowerCase();
  const url = `https://op.gg/lol/summoners/${regionCode}/${opggSlug(riotId)}`;
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'RaceHub/1.0 (private friends site)',
      'Accept': 'text/html,application/xhtml+xml',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    cache: 'no-store',
  });

  if (!response.ok) throw new Error(`OP.GG ${response.status}`);

  const html = await response.text();
  const text = decodeHtml(html);
  const { rank, lp } = parseRank(text);
  const { wins, losses } = parseRecord(text);

  return {
    riotId,
    region,
    rank,
    lp,
    wins,
    losses,
    peakLp: lp,
  };
}
