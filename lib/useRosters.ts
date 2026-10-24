"use client";

import { useCallback, useState } from "react";

export type RosterPlayerView = {
  name: string;
  realName: string;
  role: "top" | "jungle" | "mid" | "adc" | "support";
  sub: boolean;
  image: string | null;
};
type Rosters = Record<string, { name: string; players: RosterPlayerView[] }>;

// Una sola descarga por visita, compartida por todas las tarjetas.
let cache: Rosters | null = null;
let inflight: Promise<Rosters | null> | null = null;

async function download(): Promise<Rosters | null> {
  try {
    const res = await fetch("/api/rosters");
    if (!res.ok) return null;
    const json = (await res.json()) as { teams?: Rosters };
    return json.teams ?? null;
  } catch {
    return null;
  }
}

/** Los rosters se piden la primera vez que alguien abre un equipo, no al cargar la página. */
export function useRosters() {
  const [data, setData] = useState<Rosters | null>(cache);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (cache) {
      setData(cache);
      return;
    }
    setLoading(true);
    inflight ??= download();
    const result = await inflight;
    inflight = null; // si falló, el siguiente clic vuelve a intentar
    if (result && Object.keys(result).length > 0) cache = result;
    setData(result ?? null);
    setLoading(false);
  }, []);

  return { data, loading, load };
}
