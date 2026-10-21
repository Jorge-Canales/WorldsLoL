"use client";

import { useEffect, useState } from "react";
import { fill, type Dict, type Locale } from "@/lib/i18n";
import { getPhase } from "@/lib/phase";
import { useNow } from "@/lib/useNow";
import type { Champion, Edition, LiveResponse } from "@/lib/types";

type Props = {
  lang: Locale;
  t: Dict["live"];
  editions: Edition[];
  celebrationDays: number;
  champions: Champion[];
};

const POLL_MS = 30_000;

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

    load();
    const id = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [isLive]);

  if (!isLive) return null;

  const timeFmt = new Intl.DateTimeFormat(lang, { timeStyle: "short" });
  const badge = {
    live: t.badgeLive,
    upcoming: t.badgeUpcoming,
    finished: t.badgeFinished,
  } as const;

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
                </div>
                <div className="match-teams">
                  <span className="team">{m.teams[0].name}</span>
                  <span className="score">
                    {m.teams[0].score} – {m.teams[1].score}
                  </span>
                  <span className="team team-right">{m.teams[1].name}</span>
                </div>
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
