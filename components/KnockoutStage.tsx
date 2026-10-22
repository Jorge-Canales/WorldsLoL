"use client";

import knockoutData from "@/data/knockout.json";
import type { Dict, Locale } from "@/lib/i18n";
import { useBracket } from "@/lib/useBracket";

type Props = {
  lang: Locale;
  t?: Dict["knockout"];
};

export default function KnockoutStage({ lang, t }: Props) {
  // Datos en vivo de /api/bracket; si no hay, se usa data/knockout.json.
  const live = useBracket();
  const bracket = live?.knockout ?? knockoutData;
  const titles = {
    qf: t?.quarterfinals || (lang === "es" ? "Cuartos de final" : "Quarterfinals"),
    sf: t?.semifinals || (lang === "es" ? "Semifinales" : "Semifinals"),
    fn: t?.final || (lang === "es" ? "Gran Final" : "Grand Final"),
  };

  const renderMatch = (match: any) => {
    const isWinnerA = match.winner && match.winner === match.teamA;
    const isWinnerB = match.winner && match.winner === match.teamB;

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
            background: isWinnerA ? "rgba(46, 204, 113, 0.15)" : "transparent",
            color: isWinnerA ? "#2ecc71" : "#fff",
            fontWeight: isWinnerA ? "bold" : "normal",
          }}
        >
          <span style={{ fontSize: "0.85rem" }}>{match.teamA || "—"}</span>
          <span style={{ fontSize: "0.85rem", opacity: 0.8 }}>{match.scoreA ?? 0}</span>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "6px 8px",
            borderRadius: "4px",
            background: isWinnerB ? "rgba(46, 204, 113, 0.15)" : "transparent",
            color: isWinnerB ? "#2ecc71" : "#fff",
            fontWeight: isWinnerB ? "bold" : "normal",
          }}
        >
          <span style={{ fontSize: "0.85rem" }}>{match.teamB || "—"}</span>
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
          <h4 style={{ textAlign: "center", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "1px", color: "var(--muted)" }}>
            {titles.qf}
          </h4>
          {bracket.quarterfinals.map(renderMatch)}
        </div>

        {/* Semifinales */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
          <h4 style={{ textAlign: "center", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "1px", color: "var(--muted)" }}>
            {titles.sf}
          </h4>
          {bracket.semifinals.map(renderMatch)}
        </div>

        {/* Gran Final */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <h4 style={{ textAlign: "center", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "1px", color: "#f1c40f" }}>
            {titles.fn}
          </h4>
          {bracket.final.map(renderMatch)}
        </div>
      </div>
    </div>
  );
}