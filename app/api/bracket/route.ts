import { fetchAllEvents } from "@/lib/lolesports";
import { buildKnockout, buildPlayIn, buildSwiss, filterEdition, listBlocks } from "@/lib/bracket";
import config from "@/data/worlds.config.json";
import type { BracketResponse } from "@/lib/types";

/**
 * Llaves automáticas (play-in + fase suiza + eliminatorias) armadas desde la misma API
 * de lolesports que usa /api/live. Reemplaza editar swiss.json / knockout.json
 * a mano. Si la API falla o aún no publica una fase, responde null para esa
 * fase y el front sigue mostrando el JSON estático como respaldo.
 *
 * Abre /api/bracket?debug para ver los nombres de bloque que llegan de la API.
 */

let lastGood: BracketResponse | null = null;

/** Edición en curso: la más reciente que arranca en los próximos 14 días. */
function currentEdition() {
  const soon = Date.now() + 14 * 86_400_000;
  const list = (config.editions as { start: string | null; end: string | null }[])
    .filter((e) => e.start && Date.parse(e.start) <= soon)
    .sort((a, b) => Date.parse(b.start!) - Date.parse(a.start!));
  return list[0] ?? null;
}

export async function GET(request: Request) {
  const debug = new URL(request.url).searchParams.has("debug");
  let body: BracketResponse;
  let ok = true;
  let error: string | null = null;
  let blocks: string[] = [];
  let counts: unknown = null;

  try {
    const raw = await fetchAllEvents();
    const edition = currentEdition();
    const events = filterEdition(raw, edition);
    blocks = listBlocks(events);
    counts = { fetched: raw.length, inEdition: events.length, edition };
    body = {
      status: "ok",
      updatedAt: new Date().toISOString(),
      knockout: buildKnockout(events),
      swiss: buildSwiss(events),
      playIn: buildPlayIn(events),
    };
    lastGood = body;
  } catch (err) {
    ok = false;
    error = err instanceof Error ? err.message : String(err);
    console.error("[api/bracket]", error);
    body = lastGood
      ? { ...lastGood, status: "stale" }
      : { status: "stale", updatedAt: new Date().toISOString(), knockout: null, swiss: null, playIn: null };
  }

  return Response.json(debug ? { ...body, debug: { error, blocks, counts } } : body, {
    headers: {
      "Cache-Control": ok
        ? "public, s-maxage=30, stale-while-revalidate=60"
        : "public, s-maxage=5, stale-while-revalidate=10",
    },
  });
}
