import type { LiveMatch, LiveResponse } from "@/lib/types";
import { fetchCurrentEvents, fetchLiveGame, type ApiEvent, type ApiTeam } from "@/lib/lolesports";

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

const HOUR = 3_600_000;
const FINISHED_WINDOW = 12 * HOUR; // partidos terminados que se siguen mostrando
const UPCOMING_WINDOW = 36 * HOUR; // partidos futuros que se muestran
const MAX_FINISHED = 8;
const MAX_UPCOMING = 8;

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
function pickMatches(events: ApiEvent[], now: number): LiveMatch[] {
  const all = events.map(toMatch).filter((m): m is LiveMatch => m !== null);
  const at = (m: LiveMatch) => Date.parse(m.startTime);

  const live = all.filter((m) => m.status === "live").sort((a, b) => at(a) - at(b));
  const allUpcoming = all.filter((m) => m.status === "upcoming").sort((a, b) => at(a) - at(b));
  let upcoming = allUpcoming.filter((m) => at(m) <= now + UPCOMING_WINDOW).slice(0, MAX_UPCOMING);
  if (upcoming.length === 0) {
    // Nada próximo en las siguientes 36 h: se manda igual el siguiente partido con equipos
    // ya definidos, para poder mostrar la cuenta regresiva.
    const known = (m: LiveMatch) => m.teams.every((t) => t.code !== "TBD");
    const nearest = allUpcoming.find(known);
    if (nearest) upcoming = [nearest];
  }
  const finished = all
    .filter((m) => m.status === "finished" && at(m) >= now - FINISHED_WINDOW)
    .sort((a, b) => at(b) - at(a))
    .slice(0, MAX_FINISHED);

  return [...live, ...upcoming, ...finished];
}

/** Espera como máximo `ms`; si se pasa, sigue sin esperar (los marcadores salen igual). */
function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | undefined> {
  return Promise.race([p, new Promise<undefined>((resolve) => setTimeout(() => resolve(undefined), ms))]);
}

/**
 * Agrega minuto, kills y objetivos a los partidos en vivo (máximo 3).
 * Es un extra: si algo falla, el partido se muestra igual, solo con el marcador.
 */
async function addGameStats(matches: LiveMatch[], notes: string[]) {
  const live = matches.filter((m) => m.status === "live").slice(0, 3);
  await Promise.allSettled(
    live.map(async (m) => {
      try {
        const info = await fetchLiveGame(m.id);
        if (!info) {
          notes.push(`${m.id}: sin juego en curso o sin datos`);
          return;
        }
        m.gameMinute = info.minute;
        const [a, b] = m.teams;
        const sa = info.byCode[a.code];
        const sb = info.byCode[b.code];
        if (!sa || !sb) {
          notes.push(`${m.id}: las siglas ${a.code}/${b.code} no coinciden con ${Object.keys(info.byCode).join("/")}`);
          return;
        }
        m.game = { number: info.number, minute: info.minute, paused: info.paused, teams: [sa, sb] };
      } catch (err) {
        notes.push(`${m.id}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }),
  );
}

async function loadMatches(notes: string[]): Promise<LiveMatch[]> {
  const matches = pickMatches(await fetchCurrentEvents(), Date.now());
  await withTimeout(addGameStats(matches, notes), 7000);
  return matches;
}

// Último dato bueno, por si la fuente tarda o falla.
let lastGood: LiveResponse | null = null;

export async function GET(request: Request) {
  const debug = new URL(request.url).searchParams.has("debug");
  let body: LiveResponse;
  let error: string | null = null;
  let ok = true;
  const notes: string[] = [];

  try {
    const matches = await loadMatches(notes);
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

  return Response.json(debug ? { ...body, debug: error, statsDebug: notes } : body, {
    headers: {
      "Cache-Control": ok
        ? "public, s-maxage=15, stale-while-revalidate=30"
        : "public, s-maxage=5, stale-while-revalidate=10",
    },
  });
}
