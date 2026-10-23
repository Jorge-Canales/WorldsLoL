"use client";

import { useState } from "react";
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

type Phase = "playIn" | "swiss" | "knockout";

const LABELS: Record<Phase, { es: string; en: string }> = {
  playIn: { es: "Play-In", en: "Play-In" },
  swiss: { es: "Suiza", en: "Swiss" },
  knockout: { es: "Eliminatoria", en: "Knockout" },
};

export default function TournamentPhases({ lang, t, tSwiss, tKnockout }: Props) {
  const control = config.phasesControl || {
    playInActive: false,
    swissActive: false,
    knockoutActive: true,
  };

  const { playInActive, swissActive, knockoutActive } = control;
  const activeCount = [playInActive, swissActive, knockoutActive].filter(Boolean).length;

  // Fase "oficial" según la config; los botones permiten ver las otras.
  const current: Phase = swissActive ? "swiss" : knockoutActive ? "knockout" : "playIn";
  const [viewed, setViewed] = useState<Phase | null>(null);
  const view: Phase = viewed ?? current;

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
  const es = lang === "es";

  const title =
    view === "swiss"
      ? resolvedSwissDict?.title || (es ? "Fase Suiza" : "Swiss Stage")
      : view === "knockout"
      ? tKnockout?.title || (es ? "Fase Eliminatoria" : "Knockout Stage")
      : es ? "Fase Play-In" : "Play-In Stage";

  const subtitle =
    view === "swiss"
      ? resolvedSwissDict?.subtitle || (es ? "Seguimiento de enfrentamientos ronda por ronda." : "Round-by-round tracking of matchups.")
      : view === "knockout"
      ? tKnockout?.subtitle || (es ? "Llaves finales hacia la Gran Final de Worlds." : "Brackets leading to the Worlds Grand Final.")
      : es
      ? "Los equipos pelean por el último lugar en la Fase Suiza."
      : "Teams fight for the last spot in the Swiss Stage.";

  // Los dos botones son las fases distintas a la que se está viendo.
  const others = (["playIn", "swiss", "knockout"] as Phase[]).filter((p) => p !== view);

  return (
    <section className="section container">
      <div
        className="section-head"
        style={{
          marginBottom: "1.5rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <h2 className="h2">{title}</h2>
          <p className="muted">{subtitle}</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }} role="group" aria-label={es ? "Cambiar de fase" : "Switch stage"}>
          {others.map((p) => (
            <button
              key={p}
              type="button"
              className="btn btn-ghost"
              style={{ textTransform: "uppercase", letterSpacing: "1px", fontSize: "0.8rem", cursor: "pointer" }}
              onClick={() => setViewed(p === current ? null : p)}
            >
              {LABELS[p][lang]}
            </button>
          ))}
        </div>
      </div>

      {view === "swiss" && <SwissStage lang={lang} t={resolvedSwissDict} />}
      {view === "knockout" && <KnockoutStage lang={lang} t={tKnockout} />}
      {view === "playIn" && <PlayInStage lang={lang} />}
    </section>
  );
}
