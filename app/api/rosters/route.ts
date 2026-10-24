import { fetchAllEvents, type ApiEvent } from "@/lib/lolesports";
import { fetchLineup, fetchTeams, type ApiTeamInfo, type LineupPlayer } from "@/lib/lolesportsTeams";
import participantsData from "@/data/participants.json";
import overridesData from "@/data/currentRosters.json";

/**
 * Rosters actuales de los equipos en competencia, sacados de la API de lolesports
 * (getTeams). Cada equipo de data/participants.json se busca por nombre o sigla.
 * Titulares = los 5 que jugaron el último juego terminado del equipo (feed de lolesports);
 * el resto de la plantilla sale como suplente. Si no hay juegos aún, se muestra la plantilla
 * sin etiquetar suplentes.
 * Los rosters casi no cambian: la respuesta se guarda 1 hora.
 * Para corregir uno a mano: data/currentRosters.json (gana sobre la API).
 *
 * Abre /api/rosters?debug para ver qué equipos se encontraron y cuáles no.
 */

type Participant = { id: string; name: string; shortName: string; codes?: string[] };
export type RosterPlayer = {
  name: string;
  realName: string;
  role: "top" | "jungle" | "mid" | "adc" | "support";
  sub: boolean;
  image: string | null;
};
export type RostersResponse = {
  status: "ok" | "stale";
  updatedAt: string;
  teams: Record<string, { name: string; players: RosterPlayer[] }>;
};

const participants = participantsData as Participant[];
const overrides = overridesData as unknown as Record<
  string,
  { name: string; role: RosterPlayer["role"]; sub?: boolean }[] | string
>;

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ø/g, "o")
    .replace(/[^a-z0-9]/g, "");

const ROLE_ORDER: RosterPlayer["role"][] = ["top", "jungle", "mid", "adc", "support"];
const ROLE_MAP: Record<string, RosterPlayer["role"]> = {
  top: "top",
  jungle: "jungle",
  mid: "mid",
  bottom: "adc",
  adc: "adc",
  support: "support",
};

/** Encuentra el equipo de la API para un participante: primero por nombre, luego por sigla. */
function findTeam(p: Participant, teams: ApiTeamInfo[]): ApiTeamInfo | undefined {
  const withPlayers = teams.filter((t) => (t.players?.length ?? 0) > 0);
  const byName = withPlayers.find((t) => t.name && norm(t.name) === norm(p.name));
  if (byName) return byName;
  const codes = [p.shortName, ...(p.codes ?? [])].map(norm);
  return withPlayers
    .filter((t) => t.code && codes.includes(norm(t.code)))
    .sort((a, b) => (b.players?.length ?? 0) - (a.players?.length ?? 0))[0];
}

const sortPlayers = (list: RosterPlayer[]) =>
  list.sort((a, b) => Number(a.sub) - Number(b.sub) || ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role));

/** Quita la sigla del equipo del nombre del feed: "GEN Chovy" → "Chovy". */
const stripTag = (name: string) => name.replace(/^\S+\s+/, "");

/**
 * Con `lineup` (quién jugó de verdad) los titulares son esos 5 y el resto son suplentes.
 * Sin `lineup` se muestra la plantilla completa, sin marcar suplentes (no hay forma de saberlo).
 */
function toPlayers(team: ApiTeamInfo, lineup: LineupPlayer[] | null): RosterPlayer[] {
  const starters = new Map(lineup?.map((l) => [l.playerId, l]) ?? []);
  const list: RosterPlayer[] = [];

  for (const pl of team.players ?? []) {
    const started = pl.id ? starters.get(pl.id) : undefined;
    const role = ROLE_MAP[(started?.role || pl.role || "").toLowerCase()];
    if (!role || !pl.summonerName) continue; // sin rol de juego (entrenadores, etc.)
    list.push({
      name: pl.summonerName,
      realName: [pl.firstName, pl.lastName].filter(Boolean).join(" "),
      role,
      sub: lineup ? !started : false,
      image: pl.image || null,
    });
    if (pl.id) starters.delete(pl.id);
  }

  // Titulares que getTeams no trae (cambio reciente): se agregan desde el feed.
  for (const l of starters.values()) {
    const role = ROLE_MAP[l.role.toLowerCase()];
    if (role) list.push({ name: stripTag(l.summonerName), realName: "", role, sub: false, image: null });
  }
  return sortPlayers(list);
}

/** Último partido terminado de cada equipo, buscando por sus siglas. */
function lastMatchId(events: ApiEvent[], codes: string[]): string | undefined {
  return events
    .filter(
      (e) =>
        e.state === "completed" &&
        e.match?.id &&
        e.startTime &&
        e.match.teams?.some((t) => t.code && codes.includes(t.code.toUpperCase())),
    )
    .sort((a, b) => Date.parse(b.startTime!) - Date.parse(a.startTime!))[0]?.match?.id;
}

let lastGood: RostersResponse | null = null;

export const maxDuration = 30; // consulta varias APIs: más margen que el límite por defecto

export async function GET(request: Request) {
  const debug = new URL(request.url).searchParams.has("debug");
  let body: RostersResponse;
  let ok = true;
  let error: string | null = null;
  const found: Record<string, string> = {};
  const missing: string[] = [];

  try {
    const [apiTeams, events] = await Promise.all([
      fetchTeams(),
      fetchAllEvents(1, 0).catch(() => [] as ApiEvent[]), // sin calendario: plantilla sin titulares
    ]);
    const teams: RostersResponse["teams"] = {};

    // Titulares reales de cada equipo (en paralelo; si uno falla, ese equipo queda sin marcar).
    const lineups = new Map<string, LineupPlayer[] | null>();
    await Promise.all(
      participants.map(async (p) => {
        const codes = [p.shortName, ...(p.codes ?? [])].map((c) => c.toUpperCase());
        const matchId = lastMatchId(events, codes);
        try {
          lineups.set(p.id, matchId ? await fetchLineup(matchId, codes) : null);
        } catch {
          lineups.set(p.id, null);
        }
      }),
    );

    for (const p of participants) {
      const manual = overrides[p.id];
      if (Array.isArray(manual) && manual.length > 0) {
        teams[p.id] = {
          name: p.name,
          players: manual.map((m) => ({ name: m.name, realName: "", role: m.role, sub: m.sub === true, image: null })),
        };
        found[p.id] = "manual (data/currentRosters.json)";
        continue;
      }
      const team = findTeam(p, apiTeams);
      if (!team) {
        missing.push(p.id);
        continue;
      }
      const lineup = lineups.get(p.id) ?? null;
      teams[p.id] = { name: p.name, players: toPlayers(team, lineup) };
      found[p.id] = `${team.name} (${team.code}) · titulares: ${lineup ? "del último juego" : "SIN DATOS (plantilla completa)"}`;
    }

    body = { status: "ok", updatedAt: new Date().toISOString(), teams };
    lastGood = body;
  } catch (err) {
    ok = false;
    error = err instanceof Error ? err.message : String(err);
    console.error("[api/rosters]", error);
    body = lastGood
      ? { ...lastGood, status: "stale" }
      : { status: "stale", updatedAt: new Date().toISOString(), teams: {} };
  }

  return Response.json(debug ? { ...body, debug: { error, found, missing } } : body, {
    headers: {
      "Cache-Control": ok
        ? "public, s-maxage=3600, stale-while-revalidate=86400"
        : "public, s-maxage=10, stale-while-revalidate=30",
    },
  });
}
