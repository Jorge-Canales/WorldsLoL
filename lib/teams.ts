import type { Role } from "./roster";

/** Un jugador del roster de un equipo del torneo, con su historial de copas. */
export type TeamPlayer = {
  name: string;
  role: Role;
  sub: boolean;
  titles: number;
  teams: { team: string; years: number[] }[];
};

export type TeamRoster = {
  /** "manual" = data/teamRosters.json; "api" = LoL Esports */
  source: "manual" | "api";
  players: TeamPlayer[];
};

/** Respuesta de /api/teams: el roster de cada equipo de participants.json, por su id. */
export type TeamsPayload = {
  status: "ok" | "stale";
  updatedAt: string;
  teams: Record<string, TeamRoster>;
};

export type ParticipantLite = { id: string; name: string; shortName: string; codes?: string[] };
export type ApiTeamLite = {
  code?: string;
  name?: string;
  players?: { summonerName?: string; role?: string }[];
};

/** Minúsculas, sin acentos ni símbolos: "LØS" → "los", "Gen.G" → "geng". */
export const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ø/g, "o")
    .replace(/[^a-z0-9]/g, "");

const ROLE_ORDER: Role[] = ["top", "jungle", "mid", "adc", "support"];

/** Posición de la API → nuestra posición. Otros valores (entrenadores, "none") se descartan. */
export function apiRole(role?: string): Role | null {
  switch (role) {
    case "top":
    case "jungle":
    case "mid":
    case "support":
      return role;
    case "bottom":
      return "adc";
    default:
      return null;
  }
}

/** Titulares/jugadores por posición; los suplentes marcados, al final. */
export function sortPlayers<T extends { role: Role; sub: boolean }>(list: T[]): T[] {
  return [...list].sort(
    (a, b) => Number(a.sub) - Number(b.sub) || ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role),
  );
}

/**
 * Busca en la lista de equipos de la API el que corresponde a un participante.
 * Prioridad: mismo nombre → misma sigla → nombre parecido. Solo equipos con jugadores.
 */
export function findApiTeam(p: ParticipantLite, teams: ApiTeamLite[]): ApiTeamLite | undefined {
  const withPlayers = teams.filter((t) => (t.players?.length ?? 0) > 0);
  const pn = norm(p.name);
  const codes = new Set([p.shortName, ...(p.codes ?? [])].map(norm));

  const byName = withPlayers.find((t) => t.name && norm(t.name) === pn);
  if (byName) return byName;

  const byCode = withPlayers.filter((t) => t.code && codes.has(norm(t.code)));
  if (byCode.length > 0) {
    const close = byCode.find((t) => t.name && (norm(t.name).includes(pn) || pn.includes(norm(t.name))));
    return close ?? byCode[0];
  }

  return withPlayers.find((t) => {
    const tn = t.name ? norm(t.name) : "";
    return tn.length >= 4 && pn.length >= 4 && (tn.includes(pn) || pn.includes(tn));
  });
}
