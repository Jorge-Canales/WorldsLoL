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

// Mapeo de imagen por año de campeón
const WINNER_LOGOS: Record<number, string> = {
  2011: "Fnaticlogo_2011.webp",
  2012: "Taipei_Assassinslogo_2012.webp",
  2013: "SK_Telecom_T1logo_2013_2015_2016.webp",
  2014: "Samsung_Whitelogo_2014.webp",
  2015: "SK_Telecom_T1logo_2013_2015_2016.webp",
  2016: "SK_Telecom_T1logo_2013_2015_2016.webp",
  2017: "Samsung_Whitelogo_2017.webp",
  2018: "Invictus_Gaminglogo_2018.webp",
  2019: "FunPlus_Phoenixlogo_2019.webp",
  2020: "DAMWON_Gaminglogo_2020.webp",
  2021: "EDward_Gaminglogo_2021.webp",
  2022: "DRXlogo_2022.webp",
  2023: "T1logo_2023_2024_2025.webp",
  2024: "T1logo_2023_2024_2025.webp",
  2025: "T1logo_2023_2024_2025.webp",
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
  const logoFile = WINNER_LOGOS[c.year];

  return (
    <article
      className={`feature feature-${theme} champ${latest ? " champ-latest" : ""}`}
      style={{
        position: "relative",
        isolation: "isolate",
        overflow: "hidden",
        background: "linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(0, 0, 0, 0.25) 100%)",
      }}
    >
      {/* Fondo con el corte diagonal original de 120px */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: "120px",
          height: "120px",
          background: "linear-gradient(135deg, transparent 50%, rgba(255, 255, 255, 0.06) 50%)",
          pointerEvents: "none",
        }}
      />

      {/* Logo del campeón con tamaño extra grande (115px) */}
      {logoFile && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: "50%",
            height: "50%",
            zIndex: -1,
            pointerEvents: "none",
            WebkitMaskImage: "linear-gradient(to top right, transparent 0%, #000 100%)",
            maskImage: "linear-gradient(to top right, transparent 0%, #000 100%)",
          }}
        >
          <img
            src={`/media/logos/winners/${logoFile}`}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "contain", objectPosition: "top right" }}
          />
        </div>
      )}

      <p className="champ-year">{c.year}</p>
      <p className="champ-label">{t.champion}</p>
      <h3 className="h3 champ-name">
      </h3>
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
                  <h4 className="player-name">
                    {p.deceased && <MourningRibbon label={t.inMemoriam} />}
                    {p.name}
                  </h4>
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
