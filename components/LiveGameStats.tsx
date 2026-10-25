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

/** Kills y objetivos del juego en curso, con los dos equipos a los lados (mismo orden que el marcador). */
export default function LiveGameStats({ game, t }: { game: LiveGame; t: Dict["live"] }) {
  const [a, b] = game.teams;

  const rows = [
    { key: "kills", label: t.kills, a: a.kills, b: b.kills },
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
          return (
            <div key={r.key} style={{ display: "contents" }} className={cls}>
              <span className={`${styles.left}${r.a < r.b ? ` ${styles.dim}` : ""}`}>
                {r.a}
                {isDragons && <DrakeIcons drakes={a.dragons} />}
              </span>
              <span className={styles.label}>{r.label}</span>
              <span className={`${styles.right}${r.b < r.a ? ` ${styles.dim}` : ""}`}>
                {isDragons && <DrakeIcons drakes={b.dragons} />}
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
