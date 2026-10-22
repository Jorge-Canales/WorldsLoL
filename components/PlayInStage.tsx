"use client";

import playInData from "@/data/playin.json";
import type { Locale } from "@/lib/i18n";
import type { BracketPlayIn } from "@/lib/types";
import { useBracket } from "@/lib/useBracket";

type Props = { lang: Locale };

export default function PlayInStage({ lang }: Props) {
  // Datos en vivo de /api/bracket; si no hay, se usa data/playin.json (vacío).
  const live = useBracket();
  const data = (live?.playIn ?? playInData) as BracketPlayIn;
  const es = lang === "es";

  if (!data.rounds || data.rounds.length === 0) {
    return (
      <div className="panel" style={{ padding: "1.5rem", textAlign: "center" }}>
        <p className="muted">
          {live
            ? es ? "El Play-In aún no tiene partidos publicados." : "No Play-In matches published yet."
            : es ? "Cargando Play-In…" : "Loading Play-In…"}
        </p>
      </div>
    );
  }

  const row = (team: string, score: number, won: boolean, qualified: boolean) => (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "6px 8px",
        borderRadius: "4px",
        background: qualified ? "rgba(241, 196, 15, 0.2)" : won ? "rgba(46, 204, 113, 0.15)" : "transparent",
        color: qualified ? "#f1c40f" : won ? "#2ecc71" : "#fff",
        fontWeight: won ? "bold" : "normal",
      }}
    >
      <span style={{ fontSize: "0.85rem" }}>{team || "—"}</span>
      <span style={{ fontSize: "0.85rem", opacity: 0.8 }}>{score}</span>
    </div>
  );

  return (
    <div style={{ margin: "2rem 0", overflowX: "auto" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${data.rounds.length}, minmax(200px, 1fr))`,
          gap: "1.5rem",
          minWidth: `${data.rounds.length * 220}px`,
        }}
      >
        {data.rounds.map((round) => (
          <div key={round.day} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <h4 style={{ textAlign: "center", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "1px", color: "var(--muted)" }}>
              {round.title ?? (es ? `Día ${round.day}` : `Day ${round.day}`)}
            </h4>
            {round.matches.map((m) => (
              <div
                key={m.id}
                className="panel"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                  padding: "0.5rem",
                  background: "rgba(0, 0, 0, 0.25)",
                  border: m.status === "live" ? "1px solid #e74c3c" : "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "6px",
                }}
              >
                {m.status === "live" && (
                  <span style={{ fontSize: "0.65rem", color: "#e74c3c", fontWeight: "bold", textAlign: "center" }}>
                    {es ? "EN VIVO" : "LIVE"}
                  </span>
                )}
                {row(m.teamA, m.scoreA, !!m.winner && m.winner === m.teamA, !!data.qualified && data.qualified === m.teamA && m.status === "finished")}
                {row(m.teamB, m.scoreB, !!m.winner && m.winner === m.teamB, !!data.qualified && data.qualified === m.teamB && m.status === "finished")}
              </div>
            ))}
          </div>
        ))}
      </div>
      {data.qualified && (
        <p className="muted" style={{ textAlign: "center", marginTop: "1rem" }}>
          {es ? "Clasificado al Swiss:" : "Qualified to Swiss:"} <strong style={{ color: "#f1c40f" }}>{data.qualified}</strong>
        </p>
      )}
    </div>
  );
}
