/**
 * Cliente compartido de la API NO oficial de lolesports.com.
 * Lo usan /api/live (marcadores) y /api/bracket (llaves automáticas).
 * Solo se ejecuta en el servidor.
 */

const API_BASE = "https://esports-api.lolesports.com/persisted/gw";
const API_KEY = process.env.LOLESPORTS_API_KEY ?? "0TvQnueqKa5mxJntVWt0w4LpLfEkrV1Ta8rQBb9Z";
const LEAGUE_TTL = 6 * 3_600_000;

export type ApiTeam = {
  name?: string;
  code?: string;
  result?: { gameWins?: number } | null;
};

export type ApiEvent = {
  startTime?: string;
  state?: string; // "unstarted" | "inProgress" | "completed"
  type?: string; // "match" | "show"
  blockName?: string;
  match?: {
    id?: string;
    teams?: ApiTeam[];
    strategy?: { count?: number };
  };
};

type SchedulePage = {
  data?: {
    schedule?: {
      pages?: { older?: string | null; newer?: string | null };
      events?: ApiEvent[];
    };
  };
};

export async function api<T>(path: string, timeoutMs = 6000): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "x-api-key": API_KEY },
    cache: "no-store",
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`LoL Esports respondió ${res.status}`);
  return (await res.json()) as T;
}

// El id de la liga "Worlds" se busca una vez y se recuerda un rato.
let leagueCache: { id: string; at: number } | null = null;

export async function getWorldsLeagueId(): Promise<string> {
  if (process.env.WORLDS_LEAGUE_ID) return process.env.WORLDS_LEAGUE_ID;
  if (leagueCache && Date.now() - leagueCache.at < LEAGUE_TTL) return leagueCache.id;

  const json = await api<{ data?: { leagues?: { id: string; slug: string }[] } }>(
    "/getLeagues?hl=en-US",
  );
  const league = json.data?.leagues?.find((l) => l.slug === "worlds");
  if (!league) throw new Error("No se encontró la liga Worlds en la API");
  leagueCache = { id: league.id, at: Date.now() };
  return league.id;
}

async function fetchPage(leagueId: string, pageToken?: string): Promise<SchedulePage> {
  const token = pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : "";
  return api<SchedulePage>(`/getSchedule?hl=en-US&leagueId=${encodeURIComponent(leagueId)}${token}`);
}

/** Solo la página actual del calendario (lo que ya usaba /api/live). */
export async function fetchCurrentEvents(): Promise<ApiEvent[]> {
  const leagueId = await getWorldsLeagueId();
  const json = await fetchPage(leagueId);
  return json.data?.schedule?.events ?? [];
}

/**
 * El calendario viene paginado alrededor de "hoy". Para armar las llaves
 * completas seguimos algunas páginas hacia atrás y hacia adelante.
 * Si una página extra falla, seguimos con lo que ya tenemos.
 */
export async function fetchAllEvents(maxOlder = 4, maxNewer = 3): Promise<ApiEvent[]> {
  const leagueId = await getWorldsLeagueId();
  const first = await fetchPage(leagueId);
  const events: ApiEvent[] = [...(first.data?.schedule?.events ?? [])];

  const walk = async (start: string | null | undefined, max: number, dir: "older" | "newer") => {
    let token = start;
    for (let i = 0; i < max && token; i++) {
      try {
        const page = await fetchPage(leagueId, token);
        events.push(...(page.data?.schedule?.events ?? []));
        token = page.data?.schedule?.pages?.[dir];
      } catch {
        break;
      }
    }
  };

  await Promise.all([
    walk(first.data?.schedule?.pages?.older, maxOlder, "older"),
    walk(first.data?.schedule?.pages?.newer, maxNewer, "newer"),
  ]);

  // Quitar duplicados por id de partido.
  const seen = new Set<string>();
  return events.filter((e) => {
    const id = e.match?.id;
    if (!id) return true;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}


/* ------------------------------------------------------------------ */
/*  Estadísticas del juego en curso (feed "livestats")                 */
/* ------------------------------------------------------------------ */

const FEED_BASE = "https://feed.lolesports.com/livestats/v1";

export type SideStats = {
  kills: number;
  towers: number;
  dragons: string[];
  barons: number;
  inhibitors: number;
};

export type LiveGameInfo = {
  number: number;
  minute: number | null;
  paused: boolean;
  /** Estadísticas por sigla de equipo (la misma sigla que usa el calendario). */
  byCode: Record<string, SideStats>;
};

type FeedTeam = {
  totalKills?: number;
  towers?: number;
  dragons?: string[];
  barons?: number;
  inhibitors?: number;
};
type FeedFrame = {
  rfc460Timestamp?: string;
  gameState?: string; // "in_game" | "paused" | "finished"
  blueTeam?: FeedTeam;
  redTeam?: FeedTeam;
};
type FeedWindow = { frames?: FeedFrame[] };

type EventDetails = {
  data?: {
    event?: {
      match?: {
        teams?: { id?: string; code?: string }[];
        games?: {
          id?: string;
          number?: number;
          state?: string; // "unstarted" | "inProgress" | "completed" | "unneeded"
          teams?: { id?: string; side?: string }[];
        }[];
      };
    };
  };
};

async function feed<T>(path: string, timeoutMs = 3500): Promise<T> {
  const res = await fetch(`${FEED_BASE}${path}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`livestats respondió ${res.status}`);
  return (await res.json()) as T;
}

const rfc3339 = (d: Date) => d.toISOString().replace(/\.\d{3}Z$/, "Z");

// El primer frame de un juego no cambia: se guarda para calcular el minuto sin pedirlo otra vez.
const gameStarts = new Map<string, number>();

async function getGameStart(gameId: string): Promise<number | null> {
  const known = gameStarts.get(gameId);
  if (known !== undefined) return known;
  // Sin startingTime, el feed devuelve el principio del juego.
  const w = await feed<FeedWindow>(`/window/${encodeURIComponent(gameId)}`);
  const ts = w.frames?.[0]?.rfc460Timestamp;
  const t = ts ? Date.parse(ts) : NaN;
  if (!Number.isFinite(t)) return null;
  if (gameStarts.size > 40) gameStarts.clear();
  gameStarts.set(gameId, t);
  return t;
}

/** Último frame disponible. El feed pide un startingTime múltiplo de 10 s y con retraso. */
async function getLatestFrame(gameId: string): Promise<FeedFrame | null> {
  for (const lagSeconds of [60, 120]) {
    const at = new Date(Math.floor((Date.now() - lagSeconds * 1000) / 10_000) * 10_000);
    try {
      const w = await feed<FeedWindow>(
        `/window/${encodeURIComponent(gameId)}?startingTime=${encodeURIComponent(rfc3339(at))}`,
      );
      const frames = w.frames;
      if (frames && frames.length > 0) return frames[frames.length - 1];
    } catch {
      /* se intenta con más retraso */
    }
  }
  return null;
}

const toSide = (t?: FeedTeam): SideStats => ({
  kills: Number(t?.totalKills ?? 0),
  towers: Number(t?.towers ?? 0),
  dragons: Array.isArray(t?.dragons) ? t.dragons : [],
  barons: Number(t?.barons ?? 0),
  inhibitors: Number(t?.inhibitors ?? 0),
});

/**
 * Estadísticas del juego que se está jugando en este partido (kills, torres, dragones…).
 * Devuelve null si no hay un juego en curso o el feed no responde.
 */
export async function fetchLiveGame(matchId: string): Promise<LiveGameInfo | null> {
  const details = await api<EventDetails>(
    `/getEventDetails?hl=en-US&id=${encodeURIComponent(matchId)}`,
    4000,
  );
  const match = details.data?.event?.match;
  const game = match?.games?.find((g) => g.state === "inProgress");
  if (!match || !game?.id) return null;

  const [frame, start] = await Promise.all([
    getLatestFrame(game.id),
    getGameStart(game.id).catch(() => null),
  ]);
  if (!frame) return null;

  const byCode: Record<string, SideStats> = {};
  for (const team of match.teams ?? []) {
    const side = game.teams?.find((gt) => gt.id === team.id)?.side;
    if (!team.code || (side !== "blue" && side !== "red")) continue;
    byCode[team.code] = toSide(side === "blue" ? frame.blueTeam : frame.redTeam);
  }

  // Minuto = tiempo entre el primer frame del juego y el último que tenemos.
  let minute: number | null = null;
  const ts = frame.rfc460Timestamp ? Date.parse(frame.rfc460Timestamp) : NaN;
  if (start !== null && Number.isFinite(ts)) {
    const m = Math.floor((ts - start) / 60_000);
    if (m >= 0 && m <= 120) minute = m;
  }

  return {
    number: game.number ?? 0,
    minute,
    paused: frame.gameState === "paused",
    byCode,
  };
}
