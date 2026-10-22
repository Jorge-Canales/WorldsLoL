import rostersData from "@/data/rosters.json";
import playersData from "@/data/players.json";
import type { Champion } from "./types";

export type Role = "top" | "jungle" | "mid" | "adc" | "support";

type RosterRow = {
  year: number;
  players: { name: string; role: Role; sub?: boolean }[];
};

const rosters = rostersData as RosterRow[];
const profiles = (playersData as { players: Record<string, { current: string | null; deceased?: boolean }> }).players;

export type PlayerView = {
  name: string;
  role: Role;
  sub: boolean;
  /** Copas mundiales ganadas (se calcula contando los años en rosters.json) */
  titles: number;
  /** Equipos con los que ganó, con los años de cada copa */
  teams: { team: string; years: number[] }[];
  /** Equipo actual (data/players.json) o null si aún no está confirmado */
  current: string | null;
  deceased: boolean;
};

/** Jugadores que levantaron la copa en `year`, con sus totales históricos. */
export function getRoster(year: number, champions: Champion[]): PlayerView[] {
  const row = rosters.find((r) => r.year === year);
  if (!row) return [];

  const teamOfYear = new Map(champions.map((c) => [c.year, c.teamAtTime]));

  const views = row.players.map((p): PlayerView => {
    const wonYears = rosters
      .filter((r) => r.players.some((x) => x.name === p.name))
      .map((r) => r.year)
      .sort((a, b) => a - b);

    const teams: PlayerView["teams"] = [];
    for (const y of wonYears) {
      const team = teamOfYear.get(y) ?? "";
      const found = teams.find((t) => t.team === team);
      if (found) found.years.push(y);
      else teams.push({ team, years: [y] });
    }

    return {
      name: p.name,
      role: p.role,
      sub: p.sub === true,
      titles: wonYears.length,
      teams,
      current: profiles[p.name]?.current ?? null,
      deceased: profiles[p.name]?.deceased === true,
    };
  });

  // titulares primero, suplentes al final (el orden por rol es el del archivo)
  return views.sort((a, b) => Number(a.sub) - Number(b.sub));
}
