import { fetchAllEvents } from "@/lib/lolesports";
import { buildKnockout, buildPlayIn, buildSwiss, listBlocks } from "@/lib/bracket";
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

export async function GET(request: Request) {
  const debug = new URL(request.url).searchParams.has("debug");
  let body: BracketResponse;
  let ok = true;
  let error: string | null = null;
  let blocks: string[] = [];

  try {
    const events = await fetchAllEvents();
    blocks = listBlocks(events);
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

  return Response.json(debug ? { ...body, debug: { error, blocks } } : body, {
    headers: {
      "Cache-Control": ok
        ? "public, s-maxage=30, stale-while-revalidate=60"
        : "public, s-maxage=5, stale-while-revalidate=10",
    },
  });
}
