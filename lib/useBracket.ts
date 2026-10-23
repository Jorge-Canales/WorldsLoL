"use client";

import { useEffect, useState } from "react";
import type { BracketResponse } from "@/lib/types";

/** Pide las llaves a /api/bracket cada minuto. Devuelve null hasta tener datos. */
export function useBracket(intervalMs = 60_000): BracketResponse | null {
  const [data, setData] = useState<BracketResponse | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      if (document.hidden) return;
      try {
        const res = await fetch("/api/bracket", { cache: "no-store" });
        if (res.ok && alive) setData((await res.json()) as BracketResponse);
      } catch {
        /* se queda con el JSON estático */
      }
    };
    load();
    const id = setInterval(load, intervalMs);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [intervalMs]);

  return data;
}
