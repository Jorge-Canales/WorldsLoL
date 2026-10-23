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

/** Contrato de /api/bracket: mismas formas que data/knockout.json y data/swiss.json. */
export type BracketKnockoutMatch = {
  id: string;
  teamA: string;
  scoreA: number;
  teamB: string;
  scoreB: number;
  winner: string;
};

export type BracketSwissRound = {
  round: number;
  title: string;
  matches: {
    teamA: string;
    teamB: string;
    winner: string;
    /** Récord G-P de los equipos antes del partido ("1-0", "1-1"…). Separa los grupos de la ronda. */
    record?: string;
    statusA?: "qualified" | "eliminated";
    statusB?: "qualified" | "eliminated";
  }[];
};

export type BracketPlayInMatch = BracketKnockoutMatch & {
  status: "upcoming" | "live" | "finished";
  /** true = partido de la llave de perdedores */
  lower?: boolean;
};

export type BracketPlayIn = {
  /** Cuadro de doble eliminación (3 columnas). null si los partidos no encajan. */
  bracket:
    | { key: "r1" | "r2" | "qual"; matches: BracketPlayInMatch[] }[]
    | null;
  /** Respaldo en lista, agrupado por bloque/día, por si el cuadro no encaja. */
  rounds: {
    title: string | null; // null = se muestra "Día N"
    day: number;
    matches: BracketPlayInMatch[];
  }[];
  /** Equipo que pasa al Swiss, cuando ya terminó el Play-In (código y nombre completo). */
  qualified: string;
  qualifiedName?: string;
};

export type BracketResponse = {
  status: "ok" | "stale";
  updatedAt: string;
  /** null = la API aún no publica esa fase; el front usa el JSON estático. */
  knockout: {
    quarterfinals: BracketKnockoutMatch[];
    semifinals: BracketKnockoutMatch[];
    final: BracketKnockoutMatch[];
  } | null;
  swiss: BracketSwissRound[] | null;
  playIn: BracketPlayIn | null;
};
