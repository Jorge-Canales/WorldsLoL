"use client";

import swissData from "@/data/swiss.json";
import { fill, type Dict, type Locale } from "@/lib/i18n";
import TeamLogo from "./TeamLogo";
import type { BracketResponse } from "@/lib/types";

type Props = {
  lang: Locale;
  t?: Dict["swiss"];
  /** Datos de /api/bracket que le pasa TournamentPhases. null = aún cargando. */
  data?: BracketResponse | null;
};

export default function SwissStage({ lang, t, data }: Props) {
  // Datos en vivo de /api/bracket; si no hay, se usa data/swiss.json.
  const rounds: any[] = data?.swiss ?? swissData;
  const roundTemplate = t?.round || "Ronda {n}";

  return (
    <div style={{ margin: "2rem 0", overflowX: "auto" }}>
      <div style={{ display: "flex", gap: "1rem", minWidth: "900px", justifyContent: "space-between" }}>
        {rounds.map((round) => (
          <div key={round.round} style={{ flex: 1, background: "rgba(255,255,255,0.02)", borderRadius: "8px", padding: "1rem", border: "1px solid rgba(255,255,255,0.05)" }}>
            <h4 style={{ textAlign: "center", marginBottom: "1rem", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "1px" }}>
              {/* Traduce 'Ronda 1' o 'Round 1' dinámicamente según la página actual */}
              {fill(roundTemplate, { n: round.round })}
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {round.matches.map((match: any, idx: number) => {
                const getTeamStyle = (team: string, status?: string) => {
                  const isWinner = match.winner && match.winner === team;
                  
                  if (status === "qualified") {
                    return { bg: "rgba(241, 196, 15, 0.2)", color: "#f1c40f" };
                  }
                  if (status === "eliminated") {
                    return { bg: "rgba(231, 76, 60, 0.2)", color: "#e74c3c" };
                  }
                  if (isWinner) {
                    return { bg: "rgba(46, 204, 113, 0.2)", color: "#2ecc71" };
                  }
                  return { bg: "transparent", color: "#888" };
                };

                const styleA = getTeamStyle(match.teamA, match.statusA);
                const styleB = getTeamStyle(match.teamB, match.statusB);

                // Más espacio cuando cambia el grupo de récord (2-0 / 1-1 / 0-2…).
                const prev = idx > 0 ? round.matches[idx - 1] : null;
                const newGroup = !!prev && !!match.record && prev.record !== match.record;

                return (
                  <div key={idx} style={{ marginTop: newGroup ? "1.1rem" : 0, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px", background: "rgba(0,0,0,0.2)", padding: "4px", borderRadius: "4px" }}>
                    <div style={{ padding: "6px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontWeight: "bold", fontSize: "0.85rem", borderRadius: "4px", background: styleA.bg, color: styleA.color }}>
                      <TeamLogo code={match.teamA} size={18} />
                      {match.teamA || "—"}
                    </div>
                    <div style={{ padding: "6px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontWeight: "bold", fontSize: "0.85rem", borderRadius: "4px", background: styleB.bg, color: styleB.color }}>
                      <TeamLogo code={match.teamB} size={18} />
                      {match.teamB || "—"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}