"use client";

import { useState } from "react";
import { fill, type Dict } from "@/lib/i18n";
import type { LiveGame } from "@/lib/types";
import styles from "./LiveGameStats.module.css";

/** Ícono por tipo de dragón (nombres que manda el feed → archivo en public/media/drakes/). */
const DRAKE_ICONS: Record<string, string> = {
  chemtech: "Chemtech_Dragon_buff.webp",
  cloud: "Cloud_Dragon_buff.webp",
  hextech: "Hextech_Dragon_buff.webp",
  infernal: "Infernal_Dragon_buff.webp",
  mountain: "Mountain_Dragon_buff.webp",
  ocean: "Ocean_Dragon_buff.webp",
};

/** Íconos de los dragones que lleva un equipo, en el orden en que los fue tomando. */
function DrakeIcons({ drakes }: { drakes: string[] }) {
  const kinds = drakes.map((d) => d.toLowerCase());
  const icons = kinds.filter((k) => DRAKE_ICONS[k]);
  if (icons.length === 0) return null;
  const elder = kinds.includes("elder"); // el Ancestral no tiene ícono: hace brillar al resto
  return (
    <span className={`${styles.drakes}${elder ? ` ${styles.elder}` : ""}`}>
      {icons.map((k, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={`${k}-${i}`}
          src={`/media/drakes/${DRAKE_ICONS[k]}`}
          alt={k}
          title={k}
          width={24}
          height={24}
          className={styles.drake}
        />
      ))}
    </span>
  );
}

type Side = "blue" | "red";

/** 52 340 → "52.3k" */
const fmtGold = (n: number) => `${(n / 1000).toFixed(1)}k`;

/**
 * Número que, cuando sube, muestra un "+N" flotante del color del equipo (azul/rojo):
 * sube y se desvanece. No aparece al cargar la página, solo cuando cambia.
 */
function Num({ value, side }: { value: number; side: Side }) {
  const [prev, setPrev] = useState(value);
  const [pops, setPops] = useState<{ id: number; delta: number }[]>([]);

  if (value !== prev) {
    setPrev(value);
    if (value > prev) setPops((list) => [...list.slice(-3), { id: value, delta: value - prev }]);
  }

  return (
    <span className={styles.num}>
      {value}
      {pops.map((p) => (
        <span
          key={p.id}
          aria-hidden="true"
          className={`${styles.pop} ${side === "blue" ? styles.popBlue : styles.popRed}`}
          onAnimationEnd={() => setPops((list) => list.filter((x) => x.id !== p.id))}
        >
          +{p.delta}
        </span>
      ))}
    </span>
  );
}

/** Kills y objetivos del juego en curso, con los dos equipos a los lados (mismo orden que el marcador). */
export default function LiveGameStats({ game, t }: { game: LiveGame; t: Dict["live"] }) {
  const [a, b] = game.teams;
  // Sin dato del feed: izquierda = azul, derecha = rojo
  const sideA: Side = a.side ?? "blue";
  const sideB: Side = b.side ?? "red";

  // Oro: solo si el feed lo trae para los dos equipos. La ventaja se muestra junto al que va arriba.
  const hasGold = typeof a.gold === "number" && typeof b.gold === "number";
  const goldA = a.gold ?? 0;
  const goldB = b.gold ?? 0;
  const leadA = goldA > goldB ? goldA - goldB : 0;
  const leadB = goldB > goldA ? goldB - goldA : 0;

  const rows = [
    { key: "kills", label: t.kills, a: a.kills, b: b.kills },
    ...(hasGold ? [{ key: "gold", label: t.gold, a: goldA, b: goldB }] : []),
    { key: "towers", label: t.towers, a: a.towers, b: b.towers },
    { key: "dragons", label: t.dragons, a: a.dragons.length, b: b.dragons.length },
    { key: "barons", label: t.barons, a: a.barons, b: b.barons },
    { key: "inhibitors", label: t.inhibitors, a: a.inhibitors, b: b.inhibitors },
  ];

  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        {game.number > 0 && <span>{fill(t.game, { n: game.number })}</span>}
        {game.paused && <span className={styles.paused}>{t.paused}</span>}
      </div>

      <div className={styles.grid}>
        {rows.map((r) => {
          const cls = r.key === "kills" ? styles.kills : undefined;
          const isDragons = r.key === "dragons";
          const isGold = r.key === "gold";
          return (
            <div key={r.key} style={{ display: "contents" }} className={cls}>
              <span className={`${styles.left}${r.a < r.b ? ` ${styles.dim}` : ""}`}>
                {isGold ? (
                  <span className={styles.goldCell}>
                    {fmtGold(r.a)}
                    {leadA > 0 && (
                      <span className={`${styles.lead} ${sideA === "blue" ? styles.leadBlue : styles.leadRed}`}>
                        +{fmtGold(leadA)}
                      </span>
                    )}
                  </span>
                ) : (
                  <Num value={r.a} side={sideA} />
                )}
                {isDragons && <DrakeIcons drakes={a.dragons} />}
              </span>
              <span className={styles.label}>{r.label}</span>
              <span className={`${styles.right}${r.b < r.a ? ` ${styles.dim}` : ""}`}>
                {isDragons && <DrakeIcons drakes={b.dragons} />}
                {isGold ? (
                  <span className={styles.goldCell}>
                    {leadB > 0 && (
                      <span className={`${styles.lead} ${sideB === "blue" ? styles.leadBlue : styles.leadRed}`}>
                        +{fmtGold(leadB)}
                      </span>
                    )}
                    {fmtGold(r.b)}
                  </span>
                ) : (
                  <Num value={r.b} side={sideB} />
                )}
              </span>
            </div>
          );
        })}
      </div>

      <p className={styles.note}>{t.delayNote}</p>
    </div>
  );
}
