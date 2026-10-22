import configData from "@/data/worlds.config.json";
import SwissStage from "./SwissStage";
import KnockoutStage from "./KnockoutStage";
import PlayInStage from "./PlayInStage";
import type { Dict, Locale } from "@/lib/i18n";

const config = configData as any;

type Props = {
  lang: Locale;
  t?: Dict["swiss"];         // Para compatibilidad general si se pasa 't'
  tSwiss?: Dict["swiss"];
  tKnockout?: Dict["knockout"];
};

export default function TournamentPhases({ lang, t, tSwiss, tKnockout }: Props) {
  const control = config.phasesControl || {
    playInActive: false,
    swissActive: false,
    knockoutActive: true,
  };

  const { playInActive, swissActive, knockoutActive } = control;
  const activeCount = [playInActive, swissActive, knockoutActive].filter(Boolean).length;

  if (activeCount > 1) {
    return (
      <section className="section container" style={{ textAlign: "center", padding: "3rem 0" }}>
        <div className="panel" style={{ padding: "2rem", background: "rgba(231, 76, 60, 0.1)", border: "1px solid #e74c3c" }}>
          <h3 className="h3" style={{ color: "#e74c3c", marginBottom: "0.5rem" }}>Sistema en Mantenimiento</h3>
          <p className="muted">Hay múltiples fases activas simultáneamente en la configuración.</p>
        </div>
      </section>
    );
  }

  if (activeCount === 0) return null;

  // Resolvemos la prop de swiss ya sea por tSwiss o por t general
  const resolvedSwissDict = tSwiss || t;

  const title = swissActive
    ? resolvedSwissDict?.title || (lang === "es" ? "Fase Suiza" : "Swiss Stage")
    : knockoutActive
    ? tKnockout?.title || (lang === "es" ? "Fase Eliminatoria" : "Knockout Stage")
    : lang === "es" ? "Fase Play-In" : "Play-In Stage";

  const subtitle = swissActive
    ? resolvedSwissDict?.subtitle || (lang === "es" ? "Seguimiento de enfrentamientos ronda por ronda." : "Round-by-round tracking of matchups.")
    : knockoutActive
    ? tKnockout?.subtitle || (lang === "es" ? "Llaves finales hacia la Gran Final de Worlds." : "Brackets leading to the Worlds Grand Final.")
    : lang === "es"
    ? "Los equipos pelean por el último lugar en la Fase Suiza."
    : "Teams fight for the last spot in the Swiss Stage.";

  return (
    <section className="section container">
      <div className="section-head" style={{ marginBottom: "1.5rem" }}>
        <h2 className="h2">{title}</h2>
        <p className="muted">{subtitle}</p>
      </div>

      {swissActive && <SwissStage lang={lang} t={resolvedSwissDict} />}
      {knockoutActive && <KnockoutStage lang={lang} t={tKnockout} />}
      {playInActive && <PlayInStage lang={lang} />}
    </section>
  );
}