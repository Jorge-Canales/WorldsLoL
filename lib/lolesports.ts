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

export async function api<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "x-api-key": API_KEY },
    cache: "no-store",
    signal: AbortSignal.timeout(6000),
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
