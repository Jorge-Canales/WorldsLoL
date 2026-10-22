"use client";

import { useId, useRef } from "react";
import Trophy from "./Trophy";
import { fill, type Dict } from "@/lib/i18n";
import type { Champion } from "@/lib/types";
import type { PlayerView } from "@/lib/roster";

type Props = {
  champion: Champion;
  theme: string;
  latest: boolean;
  t: Dict["hall"];
  region: string;
  host: string;
  roster: PlayerView[];
};

function MourningRibbon({ label }: { label: string }) {
  return (
    <svg
      className="player-ribbon"
      viewBox="0 0 24 24"
      role="img"
      aria-label={label}
    >
      <title>{label}</title>
      <path
        fillRule="evenodd"
        d="M12 2.5c-3.2 0-5.5 2.3-5.5 5 0 2 1.2 3.5 2.8 5.2L6 21.5l3.6-1.2 2.4-3.3 2.4 3.3 3.6 1.2-3.3-8.8c1.6-1.7 2.8-3.2 2.8-5.2 0-2.7-2.3-5-5.5-5ZM12 5.5c-1.4 0-2.5 1-2.5 2.200 0 .9.6 1.600 1.500 2.600l1 1.100 1-1.100c.9-1 1.500-1.700 1.500-2.600 0-1.200-1.100-2.200-2.500-2.200Z"
        fill="#000"
        stroke="#fff"
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ChampionCard({ champion: c, theme, latest, t, region, host, roster }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const renamed = c.teamAtTime !== c.org;

  return (
    <article className={`feature feature-${theme} champ${latest ? " champ-latest" : ""}`}>
      <p className="champ-year">{c.year}</p>
      <p className="champ-label">{t.champion}</p>
      <h3 className="h3 champ-name">{c.teamAtTime}</h3>
      {renamed && <p className="champ-sub">{fill(t.nowAs, { name: c.org })}</p>}

      <dl className="champ-facts">
        <div>
          <dt>{t.final}</dt>
          <dd>
            {c.score} {t.vs} {c.runnerUp}
          </dd>
        </div>
        <div>
          <dt>{t.host}</dt>
          <dd>{host}</dd>
        </div>
        {c.mvp && (
          <div>
            <dt>{t.mvp}</dt>
            <dd>{c.mvp}</dd>
          </div>
        )}
      </dl>

      <div className="champ-foot">
        <span className="champ-region">{region}</span>
        {roster.length > 0 && (
          <button
            type="button"
            className="champ-open"
            aria-haspopup="dialog"
            onClick={() => dialogRef.current?.showModal()}
          >
            {t.viewPlayers}
            <span className="sr-only"> · {c.year} {c.teamAtTime}</span>
          </button>
        )}
      </div>

      {roster.length > 0 && (
        <dialog
          ref={dialogRef}
          className="roster-dialog"
          aria-labelledby={titleId}
          onClick={(e) => {
            // clic en el fondo oscuro = cerrar
            if (e.target === dialogRef.current) dialogRef.current?.close();
          }}
        >
          <div className="roster-head">
            <div>
              <h3 id={titleId} className="h3 roster-title">
                {c.year} · {c.teamAtTime}
              </h3>
              <p className="muted roster-sub">{t.playersTitle}</p>
            </div>
            <form method="dialog">
              <button className="btn btn-ghost" autoFocus>
                {t.close}
              </button>
            </form>
          </div>

          <ul className="roster-list">
            {roster.map((p) => (
              <li className="player" key={p.name}>
                <div className="player-name-row">
                  <h4 className="player-name">{p.deceased && <MourningRibbon label={t.inMemoriam} />}{p.name}</h4>
                  <span className={`player-role${p.sub ? " player-role-sub" : ""}`}>
                    {t.roles[p.role]}
                    {p.sub ? ` · ${t.substitute}` : ""}
                  </span>
                </div>

                <p className="player-current">
                  {p.current && p.current in t.status
                    ? t.status[p.current as keyof typeof t.status]
                    : p.current
                      ? fill(t.currentTeam, { team: p.current })
                      : t.currentUnknown}
                </p>

                <div className="player-cups">
                  <span className="player-cups-main">
                    <Trophy className="player-cup-icon" />
                    <span className="player-cups-n">{p.titles}</span>
                  </span>
                  <span className="player-cups-l">{p.titles === 1 ? t.cupOne : t.cupMany}</span>
                </div>

                <p className="player-teams">
                  {t.cupsWith}:{" "}
                  {p.teams.map((tm, i) => (
                    <span key={tm.team}>
                      {i > 0 && " · "}
                      <strong>{tm.team}</strong> ({tm.years.join(", ")})
                    </span>
                  ))}
                </p>
              </li>
            ))}
          </ul>
        </dialog>
      )}
    </article>
  );
}
