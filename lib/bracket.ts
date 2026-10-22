import type { ApiEvent } from "@/lib/lolesports";
import type { BracketKnockoutMatch, BracketPlayIn, BracketSwissRound } from "@/lib/types";

/**
 * Convierte los eventos crudos de lolesports en las MISMAS formas que ya
 * usan data/knockout.json y data/swiss.json. Así los componentes no cambian
 * de diseño: solo reciben los datos de la API en vez del JSON.
 */

type Norm = {
  id: string;
  start: number;
  state: string;
  block: string;
  a: { code: string; wins: number };
  b: { code: string; wins: number };
};

const DASH = "—";
const PLAYIN_RE = /play.?-?\s?in/i;
const isTbd = (c: string) => !c || c.toUpperCase() === "TBD";
const label = (c: string) => (isTbd(c) ? DASH : c);

function normalize(events: ApiEvent[]): Norm[] {
  const out: Norm[] = [];
  for (const e of events) {
    if (e.type && e.type !== "match") continue;
    const t = e.match?.teams;
    if (!e.match?.id || !e.startTime || !t || t.length !== 2) continue;
    out.push({
      id: e.match.id,
      start: Date.parse(e.startTime),
      state: e.state ?? "unstarted",
      block: e.blockName ?? "",
      a: { code: t[0].code ?? "TBD", wins: t[0].result?.gameWins ?? 0 },
      b: { code: t[1].code ?? "TBD", wins: t[1].result?.gameWins ?? 0 },
    });
  }
  return out.sort((x, y) => x.start - y.start);
}

function winnerOf(m: Norm): string {
  if (m.state !== "completed" || m.a.wins === m.b.wins) return "";
  return m.a.wins > m.b.wins ? m.a.code : m.b.code;
}

function toKo(m: Norm, id: string): BracketKnockoutMatch {
  return {
    id,
    teamA: label(m.a.code),
    scoreA: m.a.wins,
    teamB: label(m.b.code),
    scoreB: m.b.wins,
    winner: winnerOf(m),
  };
}

const blank = (id: string): BracketKnockoutMatch => ({
  id,
  teamA: DASH,
  scoreA: 0,
  teamB: DASH,
  scoreB: 0,
  winner: "",
});

function pad(list: BracketKnockoutMatch[], size: number, prefix: string) {
  const out = list.slice(0, size);
  while (out.length < size) out.push(blank(`${prefix}${out.length + 1}`));
  return out;
}

export function buildKnockout(events: ApiEvent[]) {
  const all = normalize(events);
  const ko = all.filter((m) => !PLAYIN_RE.test(m.block) && !/swiss|suizo/i.test(m.block));
  const qf = ko.filter((m) => /quarter|cuartos/i.test(m.block));
  const sf = ko.filter((m) => /semi/i.test(m.block));
  const fn = ko.filter((m) => /final/i.test(m.block) && !/quarter|semi|cuartos/i.test(m.block));

  if (qf.length + sf.length + fn.length === 0) return null;

  // Ordenar cuartos para que los dos que alimentan la misma semi queden juntos
  // (el horario no siempre sigue el orden del cuadro).
  const semiIndex = (m: Norm) => {
    const w = winnerOf(m);
    const i = w ? sf.findIndex((s) => s.a.code === w || s.b.code === w) : -1;
    return i === -1 ? 99 : i;
  };
  const qfOrdered = [...qf].sort((x, y) => semiIndex(x) - semiIndex(y) || x.start - y.start);

  return {
    quarterfinals: pad(qfOrdered.map((m, i) => toKo(m, `qf${i + 1}`)), 4, "qf"),
    semifinals: pad(sf.map((m, i) => toKo(m, `sf${i + 1}`)), 2, "sf"),
    final: pad(fn.map((m, i) => toKo(m, `f${i + 1}`)), 1, "f"),
  };
}

/** Tamaño de cada ronda suiza (16 equipos): 8, 8, 8, 6, 3. */
const SWISS_SIZES = [8, 8, 8, 6, 3];
const SWISS_WINS = 3; // 3 victorias clasifica, 3 derrotas elimina

export function buildSwiss(events: ApiEvent[]): BracketSwissRound[] | null {
  const matches = normalize(events).filter((m) => /swiss|suizo/i.test(m.block) && !PLAYIN_RE.test(m.block));
  if (matches.length === 0) return null;

  const played = new Map<string, number>(); // partidos programados/jugados por equipo
  const wins = new Map<string, number>();
  const losses = new Map<string, number>();
  const rounds: BracketSwissRound[] = SWISS_SIZES.map((_, i) => ({
    round: i + 1,
    title: `Ronda ${i + 1}`,
    matches: [],
  }));

  for (const m of matches) {
    if (isTbd(m.a.code) || isTbd(m.b.code)) continue;
    // La ronda sale de cuántos partidos lleva el equipo: no depende del nombre del bloque.
    const n = Math.max(played.get(m.a.code) ?? 0, played.get(m.b.code) ?? 0);
    const round = rounds[n];
    if (!round) continue;
    played.set(m.a.code, (played.get(m.a.code) ?? 0) + 1);
    played.set(m.b.code, (played.get(m.b.code) ?? 0) + 1);

    const winner = winnerOf(m);
    const entry: BracketSwissRound["matches"][number] = {
      teamA: m.a.code,
      teamB: m.b.code,
      winner,
    };

    if (winner) {
      const loser = winner === m.a.code ? m.b.code : m.a.code;
      wins.set(winner, (wins.get(winner) ?? 0) + 1);
      losses.set(loser, (losses.get(loser) ?? 0) + 1);
      const status = (c: string) =>
        (wins.get(c) ?? 0) >= SWISS_WINS
          ? "qualified"
          : (losses.get(c) ?? 0) >= SWISS_WINS
          ? "eliminated"
          : undefined;
      entry.statusA = status(m.a.code);
      entry.statusB = status(m.b.code);
    }
    round.matches.push(entry);
  }

  // Rellenar con "—" lo que aún no se define, igual que el JSON estático.
  return rounds.map((r, i) => {
    const matchesPadded = [...r.matches];
    while (matchesPadded.length < SWISS_SIZES[i]) matchesPadded.push({ teamA: DASH, teamB: DASH, winner: "" });
    return { ...r, matches: matchesPadded };
  });
}

/**
 * Play-In: no asumimos la forma del cuadro (doble eliminación, grupos...).
 * Agrupamos por bloque de la API; si todo viene en un solo bloque, por día.
 * El ganador del último partido terminado se marca como clasificado al Swiss.
 */
export function buildPlayIn(events: ApiEvent[]): BracketPlayIn | null {
  const matches = normalize(events).filter((m) => PLAYIN_RE.test(m.block));
  if (matches.length === 0) return null;

  const blocks = [...new Set(matches.map((m) => m.block))];
  const byDay = blocks.length === 1;
  const keyOf = (m: Norm) => (byDay ? new Date(m.start).toISOString().slice(0, 10) : m.block);

  const groups = new Map<string, Norm[]>();
  for (const m of matches) {
    const k = keyOf(m);
    groups.set(k, [...(groups.get(k) ?? []), m]);
  }

  const rounds = [...groups.entries()].map(([key, list], i) => ({
    title: byDay ? null : key,
    day: i + 1,
    matches: list.map((m, j) => ({
      ...toKo(m, `pi${i + 1}-${j + 1}`),
      status: (m.state === "inProgress" ? "live" : m.state === "completed" ? "finished" : "upcoming") as
        | "live"
        | "finished"
        | "upcoming",
    })),
  }));

  const last = matches[matches.length - 1];
  const allDone = matches.every((m) => m.state === "completed");
  return { rounds, qualified: allDone ? winnerOf(last) : "" };
}

/** Nombres de bloque que devuelve la API (útil para depurar con ?debug). */
export function listBlocks(events: ApiEvent[]): string[] {
  return [...new Set(normalize(events).map((m) => m.block))];
}
