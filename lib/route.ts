import type { LiveMatch, LiveResponse } from "@/lib/types";

/**
 * FASE 3: marcadores reales del Worlds.
 *
 * Fuente: la API NO oficial que usa lolesports.com (getLeagues + getSchedule).
 * Se consulta solo desde el servidor. La clave de abajo es la clave pública
 * que usa la propia página de LoL Esports (está publicada en las librerías de
 * la comunidad); si algún día cambia, se puede poner la nueva en Vercel como
 * variable de entorno LOLESPORTS_API_KEY sin tocar el código.
 *
 * Capas de protección:
 *  1. Cache-Control: Vercel guarda la respuesta 15 s (mil visitantes = 1 consulta).
 *  2. Si la fuente falla, se devuelve el último dato bueno con status "stale".
 *  3. Cada consulta a la fuente tiene un límite de 6 s.
 */

const API_BASE = "https://esports-api.lolesports.com/persisted/gw";
const API_KEY = process.env.LOLESPORTS_API_KEY ?? "0TvQnueqKa5mxJntVWt0w4LpLfEkrV1Ta8rQBb9Z";

const HOUR = 3_600_000;
const LEAGUE_TTL = 6 * HOUR;
const FINISHED_WINDOW = 24 * HOUR; // partidos terminados que se siguen mostrando
const UPCOMING_WINDOW = 36 * HOUR; // partidos futuros que se muestran
const MAX_FINISHED = 8;
const MAX_UPCOMING = 8;

// ---- Forma (parcial) de lo que responde la API no oficial ----
type ApiTeam = {
  name?: string;
  code?: string;
  result?: { gameWins?: number } | null;
};
type ApiEvent = {
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

async function api<T>(path: string): Promise<T> {
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

async function getWorldsLeagueId(): Promise<string> {
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

function toMatch(e: ApiEvent): LiveMatch | null {
  const teams = e.match?.teams;
  if (e.type && e.type !== "match") return null;
  if (!e.match?.id || !e.startTime || !teams || teams.length !== 2) return null;

  const status: LiveMatch["status"] =
    e.state === "inProgress" ? "live" : e.state === "completed" ? "finished" : "upcoming";

  const side = (t: ApiTeam) => ({
    name: t.name ?? "TBD",
    code: t.code ?? "TBD",
    score: t.result?.gameWins ?? 0,
  });

  return {
    id: e.match.id,
    stage: e.blockName ?? "",
    bestOf: e.match.strategy?.count ?? 1,
    status,
    startTime: e.startTime,
    gameMinute: null, // el minuto de juego queda para la Fase 3B
    teams: [side(teams[0]), side(teams[1])],
  };
}

/** Elige y ordena lo que vale la pena mostrar ahora. */
export function pickMatches(events: ApiEvent[], now: number): LiveMatch[] {
  const all = events.map(toMatch).filter((m): m is LiveMatch => m !== null);
  const at = (m: LiveMatch) => Date.parse(m.startTime);

  const live = all.filter((m) => m.status === "live").sort((a, b) => at(a) - at(b));
  const upcoming = all
    .filter((m) => m.status === "upcoming" && at(m) <= now + UPCOMING_WINDOW)
    .sort((a, b) => at(a) - at(b))
    .slice(0, MAX_UPCOMING);
  const finished = all
    .filter((m) => m.status === "finished" && at(m) >= now - FINISHED_WINDOW)
    .sort((a, b) => at(b) - at(a))
    .slice(0, MAX_FINISHED);

  return [...live, ...upcoming, ...finished];
}

async function loadMatches(): Promise<LiveMatch[]> {
  const leagueId = await getWorldsLeagueId();
  const json = await api<{ data?: { schedule?: { events?: ApiEvent[] } } }>(
    `/getSchedule?hl=en-US&leagueId=${encodeURIComponent(leagueId)}`,
  );
  return pickMatches(json.data?.schedule?.events ?? [], Date.now());
}

// Último dato bueno, por si la fuente tarda o falla.
let lastGood: LiveResponse | null = null;

export async function GET(request: Request) {
  const debug = new URL(request.url).searchParams.has("debug");
  let body: LiveResponse;
  let error: string | null = null;
  let ok = true;

  try {
    const matches = await loadMatches();
    body = { status: "ok", updatedAt: new Date().toISOString(), matches };
    lastGood = body;
  } catch (err) {
    ok = false;
    error = err instanceof Error ? err.message : String(err);
    console.error("[api/live]", error);
    body = lastGood
      ? { ...lastGood, status: "stale" }
      : { status: "stale", updatedAt: new Date().toISOString(), matches: [] };
  }

  return Response.json(debug ? { ...body, debug: error } : body, {
    headers: {
      "Cache-Control": ok
        ? "public, s-maxage=15, stale-while-revalidate=30"
        : "public, s-maxage=5, stale-while-revalidate=10",
    },
  });
}
