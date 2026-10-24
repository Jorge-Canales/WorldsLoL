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
