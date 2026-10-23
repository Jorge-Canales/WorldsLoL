"use client";

import knockoutData from "@/data/knockout.json";
import type { Dict, Locale } from "@/lib/i18n";
import TeamLogo from "./TeamLogo";
import type { BracketResponse } from "@/lib/types";

type Props = {
  lang: Locale;
  t?: Dict["knockout"];
  /** Datos de /api/bracket que le pasa TournamentPhases. null = aún cargando. */
  data?: BracketResponse | null;
};

export default function KnockoutStage({ lang, t, data }: Props) {
  // Datos en vivo de /api/bracket; si no hay, se usa data/knockout.json.
  const bracket = data?.knockout ?? knockoutData;
  const titles = {
    qf: t?.quarterfinals || (lang === "es" ? "Cuartos de final" : "Quarterfinals"),
    sf: t?.semifinals || (lang === "es" ? "Semifinales" : "Semifinals"),
    fn: t?.final || (lang === "es" ? "Gran Final" : "Grand Final"),
  };

  const renderMatch = (match: any, isFinal = false) => {
    const isWinnerA = match.winner && match.winner === match.teamA;
    const isWinnerB = match.winner && match.winner === match.teamB;
    // Verde para ganadores normales; dorado solo para el campeón en la Gran Final.
    const winBg = isFinal ? "rgba(241, 196, 15, 0.2)" : "rgba(46, 204, 113, 0.15)";
    const winColor = isFinal ? "#f1c40f" : "#2ecc71";

    return (
      <div
        key={match.id}
        className="panel"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "4px",
          padding: "0.5rem",
          background: "rgba(0, 0, 0, 0.25)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "6px",
          minWidth: "160px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "6px 8px",
            borderRadius: "4px",
            background: isWinnerA ? winBg : "transparent",
            color: isWinnerA ? winColor : "#fff",
            fontWeight: isWinnerA ? "bold" : "normal",
          }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "0.85rem" }}>
            <TeamLogo code={match.teamA} size={20} />
            {match.teamA || "—"}
          </span>
          <span style={{ fontSize: "0.85rem", opacity: 0.8 }}>{match.scoreA ?? 0}</span>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "6px 8px",
            borderRadius: "4px",
            background: isWinnerB ? winBg : "transparent",
            color: isWinnerB ? winColor : "#fff",
            fontWeight: isWinnerB ? "bold" : "normal",
          }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "0.85rem" }}>
            <TeamLogo code={match.teamB} size={20} />
            {match.teamB || "—"}
          </span>
          <span style={{ fontSize: "0.85rem", opacity: 0.8 }}>{match.scoreB ?? 0}</span>
        </div>
      </div>
    );
  };

  return (
    <div style={{ margin: "2rem 0", overflowX: "auto" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(200px, 1fr))",
          gap: "1.5rem",
          alignItems: "center",
          minWidth: "700px",
        }}
      >
        {/* Cuartos de final */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <h4 style={{ textAlign: "center", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "1px", color: "var(--color-fog)" }}>
            {titles.qf}
          </h4>
          {bracket.quarterfinals.map((m) => renderMatch(m))}
        </div>

        {/* Semifinales */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
          <h4 style={{ textAlign: "center", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "1px", color: "var(--color-fog)" }}>
            {titles.sf}
          </h4>
          {bracket.semifinals.map((m) => renderMatch(m))}
        </div>

        {/* Gran Final */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <h4 style={{ textAlign: "center", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "1px", color: "#f1c40f" }}>
            {titles.fn}
          </h4>
          {bracket.final.map((m) => renderMatch(m, true))}
        </div>
      </div>
    </div>
  );
}