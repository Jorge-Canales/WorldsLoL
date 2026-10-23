import { isTeamCode, logoFor } from "@/lib/logos";

/**
 * Logo pequeño de un equipo. Es decorativo (el nombre ya está al lado).
 * Si es un equipo real pero no tenemos su logo, deja un hueco del mismo
 * tamaño para que las filas no se desalineen; si es "—" o TBD no pone nada.
 */
export default function TeamLogo({
  code,
  name,
  size = 24,
}: {
  code?: string;
  name?: string;
  size?: number;
}) {
  const src = logoFor(code, name);
  if (!src) {
    if (!isTeamCode(code) && !name) return null;
    return <span aria-hidden="true" style={{ width: size, height: size, flex: "none" }} />;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      loading="lazy"
      style={{ width: size, height: size, objectFit: "contain", flex: "none" }}
    />
  );
}
