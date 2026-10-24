import { fetchTeams, type ApiTeamInfo } from "@/lib/lolesportsTeams";
import participantsData from "@/data/participants.json";
import overridesData from "@/data/currentRosters.json";

/**
 * Rosters actuales de los equipos en competencia, sacados de la API de lolesports
 * (getTeams). Cada equipo de data/participants.json se busca por nombre o sigla.
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

/** Titulares = el primero de cada rol; los demás de ese rol quedan como suplentes. */
function toPlayers(team: ApiTeamInfo): RosterPlayer[] {
  const seen = new Set<string>();
  const list: RosterPlayer[] = [];
  for (const pl of team.players ?? []) {
    const role = ROLE_MAP[(pl.role ?? "").toLowerCase()];
    if (!role || !pl.summonerName) continue; // sin rol de juego (entrenadores, etc.)
    list.push({
      name: pl.summonerName,
      realName: [pl.firstName, pl.lastName].filter(Boolean).join(" "),
      role,
      sub: seen.has(role),
      image: pl.image || null,
    });
    seen.add(role);
  }
  return list.sort(
    (a, b) => Number(a.sub) - Number(b.sub) || ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role),
  );
}

let lastGood: RostersResponse | null = null;

export async function GET(request: Request) {
  const debug = new URL(request.url).searchParams.has("debug");
  let body: RostersResponse;
  let ok = true;
  let error: string | null = null;
  const found: Record<string, string> = {};
  const missing: string[] = [];

  try {
    const apiTeams = await fetchTeams();
    const teams: RostersResponse["teams"] = {};

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
      teams[p.id] = { name: p.name, players: toPlayers(team) };
      found[p.id] = `${team.name} (${team.code})`;
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
