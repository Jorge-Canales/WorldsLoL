import { fill, type Dict } from "@/lib/i18n";
import type { LiveGame } from "@/lib/types";
import styles from "./LiveGameStats.module.css";

/** Kills y objetivos del juego en curso, con los dos equipos a los lados (mismo orden que el marcador). */
export default function LiveGameStats({ game, t }: { game: LiveGame; t: Dict["live"] }) {
  const [a, b] = game.teams;

  const rows = [
    { key: "kills", label: t.kills, a: a.kills, b: b.kills, hint: undefined },
    { key: "towers", label: t.towers, a: a.towers, b: b.towers, hint: undefined },
    { key: "dragons", label: t.dragons, a: a.dragons.length, b: b.dragons.length, hint: [a.dragons.join(", "), b.dragons.join(", ")] },
    { key: "barons", label: t.barons, a: a.barons, b: b.barons, hint: undefined },
    { key: "inhibitors", label: t.inhibitors, a: a.inhibitors, b: b.inhibitors, hint: undefined },
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
          return (
            <div key={r.key} style={{ display: "contents" }} className={cls}>
              <span
                className={`${styles.left}${r.a < r.b ? ` ${styles.dim}` : ""}`}
                title={r.hint?.[0] || undefined}
              >
                {r.a}
              </span>
              <span className={styles.label}>{r.label}</span>
              <span
                className={`${styles.right}${r.b < r.a ? ` ${styles.dim}` : ""}`}
                title={r.hint?.[1] || undefined}
              >
                {r.b}
              </span>
            </div>
          );
        })}
      </div>

      <p className={styles.note}>{t.delayNote}</p>
    </div>
  );
}
