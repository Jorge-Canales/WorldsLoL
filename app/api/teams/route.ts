import { api } from "@/lib/lolesports";
import { getPlayerHistory } from "@/lib/roster";
import type { Role } from "@/lib/roster";
import {
  apiRole,
  findApiTeam,
  sortPlayers,
  type ApiTeamLite,
  type ParticipantLite,
  type TeamPlayer,
  type TeamRoster,
  type TeamsPayload,
} from "@/lib/teams";
import type { Champion } from "@/lib/types";
import championsData from "@/data/champions.json";
import participantsData from "@/data/participants.json";
import manualData from "@/data/teamRosters.json";

/**
 * Roster de cada equipo del torneo (data/participants.json).
 *
 * 1. Si en data/teamRosters.json escribiste jugadores de un equipo, se usan esos.
 * 2. Si no, se toman de la API de LoL Esports (getTeams) y se descartan entrenadores.
 *
 * A cada jugador se le agrega su historial de copas mundiales (data/rosters.json) para
 * poder resaltar a los campeones. Los rosters casi no cambian: se guardan 1 hora.
 *
 * Abre /api/teams?debug=1 para ver con qué equipo de la API se emparejó cada participante.
 */

const champions = championsData as Champion[];
const participants = participantsData as ParticipantLite[];
const manual = (manualData as unknown as {
  rosters?: Record<string, { name?: string; role?: string; sub?: boolean }[]>;
}).rosters ?? {};

const TTL = 60 * 60 * 1000;
let cache: { at: number; payload: TeamsPayload } | null = null;

const withHistory = (name: string, role: Role, sub: boolean): TeamPlayer => ({
  name,
  role,
  sub,
  ...getPlayerHistory(name, champions),
});

function manualRoster(id: string): TeamRoster | null {
  const players = (manual[id] ?? [])
    .filter((p) => p.name && p.name.trim() !== "" && apiRole(p.role === "adc" ? "bottom" : p.role))
    .map((p) => withHistory(p.name!.trim(), (p.role as Role), p.sub === true));
  return players.length > 0 ? { source: "manual", players: sortPlayers(players) } : null;
}

async function build(notes: string[]): Promise<TeamsPayload> {
  const teams: TeamsPayload["teams"] = {};
  const pending = participants.filter((p) => {
    const m = manualRoster(p.id);
    if (m) teams[p.id] = m;
    return !m;
  });

  let ok = true;
  if (pending.length > 0) {
    try {
      const json = await api<{ data?: { teams?: ApiTeamLite[] } }>("/getTeams?hl=en-US");
      const apiTeams = json.data?.teams ?? [];
      notes.push(`API: ${apiTeams.length} equipos recibidos`);
      for (const p of pending) {
        const found = findApiTeam(p, apiTeams);
        notes.push(`${p.id}: ${found ? `${found.name} (${found.code})` : "sin pareja en la API"}`);
        if (!found) continue;
        const players = (found.players ?? []).flatMap((pl) => {
          const role = apiRole(pl.role);
          return role && pl.summonerName ? [withHistory(pl.summonerName, role, false)] : [];
        });
        if (players.length > 0) teams[p.id] = { source: "api", players: sortPlayers(players) };
      }
    } catch (err) {
      ok = false;
      notes.push(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return { status: ok ? "ok" : "stale", updatedAt: new Date().toISOString(), teams };
}

export async function GET(request: Request) {
  const debug = new URL(request.url).searchParams.has("debug");
  const notes: string[] = [];

  let payload: TeamsPayload;
  if (cache && Date.now() - cache.at < TTL && !debug) {
    payload = cache.payload;
  } else {
    payload = await build(notes);
    if (payload.status === "ok") cache = { at: Date.now(), payload };
    else if (cache) payload = { ...cache.payload, status: "stale" }; // la API falló: el último bueno
  }

  return Response.json(debug ? { ...payload, debug: notes } : payload, {
    headers: {
      "Cache-Control":
        payload.status === "ok"
          ? "public, s-maxage=3600, stale-while-revalidate=86400"
          : "public, s-maxage=30, stale-while-revalidate=60",
    },
  });
}
