"use client";

import playInData from "@/data/playin.json";
import type { Locale } from "@/lib/i18n";
import type { BracketPlayIn, BracketPlayInMatch } from "@/lib/types";
import { useBracket } from "@/lib/useBracket";

type Props = { lang: Locale };

const headStyle = {
  textAlign: "center" as const,
  fontSize: "0.85rem",
  textTransform: "uppercase" as const,
  letterSpacing: "1px",
  color: "var(--muted)",
};

export default function PlayInStage({ lang }: Props) {
  // Datos en vivo de /api/bracket; si no hay, se usa data/playin.json (vacío).
  const live = useBracket();
  const data = (live?.playIn ?? playInData) as BracketPlayIn;
  const es = lang === "es";

  const empty = !data.bracket && (!data.rounds || data.rounds.length === 0);
  if (empty) {
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

  const card = (m: BracketPlayInMatch, isFinal: boolean) => {
    // Dorado solo en el partido de clasificación (la final del Play-In).
    const isQ = isFinal && !!data.qualified && m.status === "finished";
    return (
      <div key={m.id}>
        {m.lower && (
          <div className="muted" style={{ fontSize: "0.7rem", textAlign: "center", marginBottom: "4px" }}>
            {es ? "Bracket de perdedores" : "Losers' bracket"}
          </div>
        )}
        <div
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
          {row(m.teamA, m.scoreA, !!m.winner && m.winner === m.teamA, isQ && data.qualified === m.teamA)}
          {row(m.teamB, m.scoreB, !!m.winner && m.winner === m.teamB, isQ && data.qualified === m.teamB)}
        </div>
      </div>
    );
  };

  const titles: Record<string, string> = {
    r1: es ? "Ronda 1" : "Round 1",
    r2: es ? "Ronda 2" : "Round 2",
    qual: es ? "Partido de clasificación" : "Qualification match",
  };

  const columns = data.bracket
    ? data.bracket.map((c) => ({ id: c.key, title: titles[c.key], matches: c.matches, gap: c.key === "r1" ? "1rem" : "2.5rem" }))
    : data.rounds.map((r) => ({
        id: String(r.day),
        title: r.title ?? (es ? `Día ${r.day}` : `Day ${r.day}`),
        matches: r.matches,
        gap: "1rem",
      }));

  return (
    <div style={{ margin: "2rem 0", overflowX: "auto" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${columns.length}, minmax(200px, 1fr))`,
          gap: "1.5rem",
          alignItems: "center",
          minWidth: `${columns.length * 220}px`,
        }}
      >
        {columns.map((col) => (
          <div key={col.id} style={{ display: "flex", flexDirection: "column", gap: col.gap }}>
            <h4 style={col.id === "qual" ? { ...headStyle, color: "#f1c40f" } : headStyle}>{col.title}</h4>
            {col.matches.map((m) => card(m, col.id === "qual"))}
          </div>
        ))}
      </div>
      {data.qualified && (
        <p className="muted" style={{ textAlign: "center", marginTop: "1rem" }}>
          {es ? "Clasificado al Swiss:" : "Qualified to Swiss:"}{" "}
          <strong style={{ color: "#f1c40f" }}>{data.qualifiedName || data.qualified}</strong>
        </p>
      )}
    </div>
  );
}
