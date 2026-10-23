"use client";

import { useState } from "react";
import configData from "@/data/worlds.config.json";
import SwissStage from "./SwissStage";
import KnockoutStage from "./KnockoutStage";
import PlayInStage from "./PlayInStage";
import { dictionaries, type Dict, type Locale } from "@/lib/i18n";
import { useBracket } from "@/lib/useBracket";

const config = configData as any;

type Props = {
  lang: Locale;
  t?: Dict["swiss"]; // compatibilidad: si se pasa 't', se usa como diccionario de la fase suiza
  tSwiss?: Dict["swiss"];
  tKnockout?: Dict["knockout"];
};

type Phase = "playIn" | "swiss" | "knockout";

export default function TournamentPhases({ lang, t, tSwiss, tKnockout }: Props) {
  const d = dictionaries[lang];
  const swissDict = tSwiss ?? t ?? d.swiss;
  const knockoutDict = tKnockout ?? d.knockout;

  // Se piden las llaves UNA sola vez y se reparten a las tres fases:
  // al cambiar de pestaña ya no hay parpadeo ni consultas repetidas.
  const bracket = useBracket();

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
          <h3 className="h3" style={{ color: "#e74c3c", marginBottom: "0.5rem" }}>
            {d.phases.maintenanceTitle}
          </h3>
          <p className="muted">{d.phases.maintenanceBody}</p>
        </div>
      </section>
    );
  }

  if (activeCount === 0) return null;

  const title =
    view === "swiss" ? swissDict.title : view === "knockout" ? knockoutDict.title : d.playIn.title;
  const subtitle =
    view === "swiss" ? swissDict.subtitle : view === "knockout" ? knockoutDict.subtitle : d.playIn.subtitle;

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
        <div style={{ display: "flex", gap: "0.5rem" }} role="group" aria-label={d.phases.switchAria}>
          {others.map((p) => (
            <button
              key={p}
              type="button"
              className="btn btn-ghost"
              style={{ textTransform: "uppercase", letterSpacing: "1px", fontSize: "0.8rem", cursor: "pointer" }}
              onClick={() => setViewed(p === current ? null : p)}
            >
              {d.phases.tabs[p]}
            </button>
          ))}
        </div>
      </div>

      {view === "swiss" && <SwissStage lang={lang} t={swissDict} data={bracket} />}
      {view === "knockout" && <KnockoutStage lang={lang} t={knockoutDict} data={bracket} />}
      {view === "playIn" && <PlayInStage lang={lang} data={bracket} />}
    </section>
  );
}
