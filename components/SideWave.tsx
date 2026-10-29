import styles from "./SideWave.module.css";

/** Barra del color del lado (azul o rojo) con efecto de ola. Decorativa, pero con texto para lectores de pantalla. */
export default function SideWave({ side, label }: { side: "blue" | "red"; label: string }) {
  return (
    <div
      className={`${styles.wave} ${side === "blue" ? styles.blue : styles.red}`}
      role="img"
      aria-label={label}
    />
  );
}
