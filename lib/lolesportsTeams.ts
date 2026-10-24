import { api } from "@/lib/lolesports";

/** Forma (parcial) de /getTeams en la API no oficial de lolesports. */
export type ApiPlayer = {
  id?: string;
  summonerName?: string;
  firstName?: string;
  lastName?: string;
  image?: string;
  role?: string; // "top" | "jungle" | "mid" | "bottom" | "support" | ...
};

export type ApiTeamInfo = {
  id?: string;
  slug?: string;
  name?: string;
  code?: string;
  status?: string;
  players?: ApiPlayer[];
};

export async function fetchTeams(): Promise<ApiTeamInfo[]> {
  // La lista completa de equipos es grande: damos más tiempo que a las demás consultas.
  const json = await api<{ data?: { teams?: ApiTeamInfo[] } }>("/getTeams?hl=en-US", 15000);
  return json.data?.teams ?? [];
}

/* ------------------------------------------------------------------ */
/*  Titulares reales: quién jugó el último juego del equipo            */
/* ------------------------------------------------------------------ */

const FEED_BASE = "https://feed.lolesports.com/livestats/v1";

export type LineupPlayer = {
  playerId: string;
  /** Nombre como sale en el juego, normalmente "SIGLA Nombre" */
  summonerName: string;
  role: string;
};

type EventDetails = {
  data?: {
    event?: {
      match?: {
        teams?: { id?: string; code?: string }[];
        games?: { id?: string; number?: number; state?: string }[];
      };
    };
  };
};

type TeamMeta = {
  esportsTeamId?: string;
  participantMetadata?: { esportsPlayerId?: string; summonerName?: string; role?: string }[];
};
type FeedWindow = { gameMetadata?: { blueTeamMetadata?: TeamMeta; redTeamMetadata?: TeamMeta } };

/**
 * Los 5 jugadores que salieron en el último juego terminado de `matchId`
 * para el equipo con alguna de las siglas `codes`. null si algo falla o no hay juego.
 */
export async function fetchLineup(matchId: string, codes: string[]): Promise<LineupPlayer[] | null> {
  const details = await api<EventDetails>(`/getEventDetails?hl=en-US&id=${encodeURIComponent(matchId)}`, 6000);
  const match = details.data?.event?.match;
  const team = match?.teams?.find((t) => t.code && codes.includes(t.code.toUpperCase()));
  const game = (match?.games ?? [])
    .filter((g) => g.state === "completed" && g.id)
    .sort((a, b) => (b.number ?? 0) - (a.number ?? 0))[0];
  if (!team?.id || !game?.id) return null;

  const res = await fetch(`${FEED_BASE}/window/${encodeURIComponent(game.id)}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(6000),
  });
  if (!res.ok) return null;
  const meta = ((await res.json()) as FeedWindow).gameMetadata;
  const side = [meta?.blueTeamMetadata, meta?.redTeamMetadata].find((m) => m?.esportsTeamId === team.id);
  const list = (side?.participantMetadata ?? [])
    .filter((p) => p.esportsPlayerId && p.summonerName)
    .map((p) => ({ playerId: p.esportsPlayerId!, summonerName: p.summonerName!, role: p.role ?? "" }));
  return list.length >= 5 ? list : null;
}
