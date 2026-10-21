export type Champion = {
  year: number;
  org: string; // nombre actual de la organización (para agrupar títulos)
  teamAtTime: string; // nombre del equipo cuando ganó
  region: string; // EMEA | GPL | LCK | LPL
  runnerUp: string;
  score: string;
  city: string;
  countryCode: string;
  mvp: string | null;
};

export type Edition = {
  year: number;
  start: string | null;
  end: string | null;
  finalCity: string | null;
  finalDate: string | null;
};

/**
 * Contrato de la API /api/live. El front solo depende de esta forma,
 * así la fuente de datos se puede cambiar sin tocar la interfaz.
 */
export type LiveMatch = {
  id: string;
  stage: string;
  bestOf: number;
  status: "upcoming" | "live" | "finished";
  startTime: string; // ISO
  gameMinute: number | null; // minuto del juego en curso, si la fuente lo da
  teams: [
    { name: string; code: string; score: number },
    { name: string; code: string; score: number },
  ];
};

export type LiveResponse = {
  status: "pending" | "ok" | "stale";
  updatedAt: string;
  matches: LiveMatch[];
};
