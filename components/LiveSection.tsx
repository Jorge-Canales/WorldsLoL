"use client";

import { useEffect, useState } from "react";
import LiveGameStats from "./LiveGameStats";
import TeamLogo from "./TeamLogo";
import { fill, type Dict, type Locale } from "@/lib/i18n";
import { getPhase } from "@/lib/phase";
import { useNow } from "@/lib/useNow";
import type { Champion, Edition, LiveMatch, LiveResponse } from "@/lib/types";

type Props = {
  lang: Locale;
  t: Dict["live"];
  editions: Edition[];
  celebrationDays: number;
  champions: Champion[];
};

const POLL_MS = 30_000;

/** "2 d 3 h", "4 h 12 min", "7 min 30 s": las abreviaturas salen del diccionario de cada idioma. */
function formatIn(ms: number, u: Dict["live"]["units"]) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(total / 86_400);
  const h = Math.floor((total % 86_400) / 3_600);
  const m = Math.floor((total % 3_600) / 60);
  const s = total % 60;
  if (d > 0) return `${fill(u.day, { n: d })} ${fill(u.hour, { n: h })}`;
  if (h > 0) return `${fill(u.hour, { n: h })} ${fill(u.minute, { n: m })}`;
  return `${fill(u.minute, { n: m })} ${fill(u.second, { n: s })}`;
}

/** Tarjeta con cuenta regresiva al siguiente partido (cuando no hay ninguno en vivo). */
function NextMatch({ match, t }: { match: LiveMatch; t: Dict["live"] }) {
  const now = useNow(1000);
  if (now === null) return null;
  const ms = Date.parse(match.startTime) - now;
  const [a, b] = match.teams;

  return (
    <div
      className="feature feature-green"
      style={{ padding: "20px 24px", marginBottom: 16 }}
      role="timer"
      aria-live="off"
    >
      <p className="stage-title">{t.nextMatch}</p>
      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 12, margin: "10px 0 6px" }}>
        <TeamLogo code={a.code} name={a.name} size={32} />
        <span className="team">{a.name}</span>
        <span className="muted">{t.vs}</span>
        <span className="team">{b.name}</span>
        <TeamLogo code={b.code} name={b.name} size={32} />
      </div>
      <p className="stage-note" style={{ margin: 0 }}>
        {ms > 0 ? fill(t.startsIn, { time: formatIn(ms, t.units) }) : t.startingNow}
      </p>
    </div>
  );
}

export default function LiveSection({ lang, t, editions, celebrationDays, champions }: Props) {
  const now = useNow(10_000);
  const isLive =
    now !== null && getPhase(now, editions, celebrationDays, champions).kind === "live";

  const [data, setData] = useState<LiveResponse | null>(null);

  useEffect(() => {
    if (!isLive) return;
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/live", { cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
        const json = (await res.json()) as LiveResponse;
        if (!cancelled) setData(json);
      } catch {
        if (!cancelled) {
          setData((prev) => (prev ? { ...prev, status: "stale" } : prev));
        }
      }
    }

    // Con la pestaña oculta no se consulta; al volver, se actualiza de inmediato.
    const tick = () => {
      if (!document.hidden) load();
    };
    load();
    const id = setInterval(tick, POLL_MS);
    document.addEventListener("visibilitychange", tick);
    return () => {
      cancelled = true;
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [isLive]);

  if (!isLive) return null;

  const timeFmt = new Intl.DateTimeFormat(lang, { timeStyle: "short" });
  const startFmt = new Intl.DateTimeFormat(lang, {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  });
  const badge = {
    live: t.badgeLive,
    upcoming: t.badgeUpcoming,
    finished: t.badgeFinished,
  } as const;

  // La API ordena: en vivo, próximos (el más cercano primero), terminados.
  const nothingLive = !!data && !data.matches.some((m) => m.status === "live");
  const next = nothingLive ? data.matches.find((m) => m.status === "upcoming") : undefined;

  return (
    <section id="live" className="section container">
      <div className="section-head">
        <h2 className="h2">{t.title}</h2>
        <p className="muted">{t.subtitle}</p>
      </div>

      <div className="panel">
        {(!data || data.status === "pending") && <p className="muted">{t.pending}</p>}
        {data?.status === "stale" && <p className="muted">{t.stale}</p>}
        {data && data.status !== "pending" && data.matches.length === 0 && (
          <p className="muted">{t.empty}</p>
        )}

        {next && <NextMatch match={next} t={t} />}

        {data && data.matches.length > 0 && (
          <ul className="matches">
            {data.matches.map((m) => (
              <li key={m.id} className={`match match-${m.status}`}>
                <div className="match-meta">
                  <span className={`badge badge-${m.status}`}>{badge[m.status]}</span>
                  <span className="muted">
                    {m.stage} · {fill(t.bestOf, { n: m.bestOf })}
                  </span>
                  {m.status === "live" && m.gameMinute !== null && (
                    <span className="muted">{fill(t.minute, { n: m.gameMinute })}</span>
                  )}
                  {m.status === "upcoming" && (
                    <span className="muted">
                      {fill(t.startsAt, { time: startFmt.format(new Date(m.startTime)) })}
                    </span>
                  )}
                </div>
                <div className="match-teams">
                  <span className="team" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <TeamLogo code={m.teams[0].code} name={m.teams[0].name} size={28} />
                    {m.teams[0].name}
                  </span>
                  <span className="score">
                    {m.status === "upcoming"
                      ? t.vs
                      : `${m.teams[0].score} – ${m.teams[1].score}`}
                  </span>
                  <span
                    className="team team-right"
                    style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10 }}
                  >
                    {m.teams[1].name}
                    <TeamLogo code={m.teams[1].code} name={m.teams[1].name} size={28} />
                  </span>
                </div>
                {m.status === "live" && m.game && <LiveGameStats game={m.game} t={t} />}
              </li>
            ))}
          </ul>
        )}

        {data && (
          <p className="muted small">
            {fill(t.updated, { time: timeFmt.format(new Date(data.updatedAt)) })}
          </p>
        )}
      </div>
    </section>
  );
}
