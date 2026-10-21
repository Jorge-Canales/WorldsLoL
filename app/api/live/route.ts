import type { LiveResponse } from "@/lib/types";

/**
 * FASE 1: respuesta de relleno.
 * En la Fase 3 aquí se consultará la fuente de datos (LoL Esports) y se
 * devolverá la lista real de partidos con el mismo formato (LiveResponse).
 *
 * La cabecera Cache-Control hace que Vercel guarde la respuesta 15 s:
 * aunque entren mil personas a la vez, la fuente se consulta una sola vez.
 */
export async function GET() {
  const body: LiveResponse = {
    status: "pending",
    updatedAt: new Date().toISOString(),
    matches: [],
  };

  return Response.json(body, {
    headers: { "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30" },
  });
}
