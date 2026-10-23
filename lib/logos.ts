import participantsData from "@/data/participants.json";

type P = { id: string; name: string; shortName: string; file: string; codes?: string[] };

const list = participantsData as P[];
const BASE = "/media/logos/currentParticipants/";

/** Minúsculas, sin acentos ni símbolos: "LØS" → "los", "Gen.G" → "geng". */
const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ø/g, "o")
    .replace(/[^a-z0-9]/g, "");

// Cada equipo se encuentra por su sigla (shortName) y por las siglas extra de "codes".
const byCode = new Map<string, P>();
for (const p of list) for (const c of [p.shortName, ...(p.codes ?? [])]) byCode.set(norm(c), p);

/** ¿Es una sigla de equipo real? (no vacía, no "—", no "TBD") */
export function isTeamCode(code?: string) {
  const n = code ? norm(code) : "";
  return n !== "" && n !== "tbd";
}

/** Ruta del logo del equipo, o null si no lo tenemos. Busca por sigla y, si falla, por nombre. */
export function logoFor(code?: string, name?: string): string | null {
  const byC = code && isTeamCode(code) ? byCode.get(norm(code)) : undefined;
  if (byC) return BASE + byC.file;

  const n = name ? norm(name) : "";
  if (n.length >= 4 && n !== "tbd") {
    const hit = list.find((p) => {
      const pn = norm(p.name);
      return n.includes(pn) || pn.includes(n);
    });
    if (hit) return BASE + hit.file;
  }
  return null;
}
