import type { Champion, Edition } from "./types";

export type Phase =
  | { kind: "countdown"; edition: Edition; target: string }
  | { kind: "live"; edition: Edition }
  | { kind: "celebration"; edition: Edition; champion: Champion | null }
  | { kind: "tbd"; edition: Edition | null };

const DAY = 86_400_000;

/**
 * Decide en qué estado está el sitio según la fecha:
 *  - live:        el torneo ya empezó y no ha terminado
 *  - celebration: terminó hace menos de N días (se muestra al campeón)
 *  - countdown:   falta una edición con fecha confirmada
 *  - tbd:         la siguiente edición aún no tiene fecha
 */
export function getPhase(
  now: number,
  editions: Edition[],
  celebrationDays: number,
  champions: Champion[],
): Phase {
  const sorted = [...editions].sort((a, b) => a.year - b.year);

  const started = sorted.filter((e) => e.start && Date.parse(e.start) <= now);
  const current = started[started.length - 1];

  if (current?.end) {
    const end = Date.parse(current.end);
    if (now < end) return { kind: "live", edition: current };
    if (now < end + celebrationDays * DAY) {
      return {
        kind: "celebration",
        edition: current,
        champion: champions.find((c) => c.year === current.year) ?? null,
      };
    }
  }

  const next = sorted.find((e) => !e.start || Date.parse(e.start) > now);
  if (!next) return { kind: "tbd", edition: null };
  if (next.start) return { kind: "countdown", edition: next, target: next.start };
  return { kind: "tbd", edition: next };
}

export function splitDuration(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(total / 86_400),
    hours: Math.floor((total % 86_400) / 3_600),
    minutes: Math.floor((total % 3_600) / 60),
    seconds: total % 60,
  };
}
