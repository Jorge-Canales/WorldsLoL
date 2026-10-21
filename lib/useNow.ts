"use client";

import { useEffect, useState } from "react";

/**
 * Devuelve la hora actual (ms) actualizada cada segundo.
 * Vale null en el servidor y en el primer render para evitar
 * diferencias de hidratación.
 */
export function useNow(intervalMs = 1000): number | null {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}
