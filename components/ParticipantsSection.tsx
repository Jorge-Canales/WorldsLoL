"use client";

import { useId, useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import type { Dict } from "@/lib/i18n";
import participantsData from "@/data/participants.json";
import { useRosters } from "@/lib/useRosters";
import { getPlayerHistory } from "@/lib/roster";
import championsData from "@/data/champions.json";
import type { Champion } from "@/lib/types";
import styles from "./ParticipantsSection.module.css";

export type Participant = {
  id: string;
  name: string;
  shortName: string;
  file: string;
};

const participants = participantsData as Participant[];
const champions = championsData as Champion[];

export default function ParticipantsSection({
  t,
  cups,
}: {
  t: Dict["participants"];
  /** Textos "copa mundial" / "copas mundiales" (vienen de t.hall) para el lector de pantalla */
  cups: { one: string; many: string };
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [active, setActive] = useState<Participant | null>(null);
  const { data, loading, load } = useRosters();

  const open = (team: Participant) => {
    setActive(team);
    load();
  };

  // La ventana se abre DESPUÉS de que React ya puso el equipo nuevo y ANTES de pintar:
  // así nunca se ve un instante el roster del equipo anterior (ese era el "salto" de tamaño).
  useLayoutEffect(() => {
    const d = dialogRef.current;
    if (active && d && !d.open) d.showModal();
  }, [active]);

  // Los suplentes no se muestran: solo los titulares del equipo.
  const roster = (active ? data?.[active.id]?.players ?? [] : []).filter((p) => !p.sub);

  return (
    <section className="section container">
      <div className="section-head" style={{ marginBottom: "2rem" }}>
        <h2 className="h2">{t.title}</h2>
        <p className="muted">{t.subtitle}</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: "1rem" }}>
        {participants.map((team) => (
          <div
            key={team.id}
            className="panel"
            role="button"
            tabIndex={0}
            aria-haspopup="dialog"
            aria-label={`${team.name} · ${t.rosterTitle}`}
            onClick={() => open(team)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                open(team);
              }
            }}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "1rem", textAlign: "center", cursor: "pointer" }}
          >
            <div style={{ position: "relative", width: "56px", height: "56px", marginBottom: "0.5rem" }}>
              <Image
                src={`/media/logos/currentParticipants/${team.file}`}
                alt=""
                fill
                style={{ objectFit: "contain" }}
                unoptimized
              />
            </div>
            <span style={{ fontSize: "0.8rem", fontWeight: 600 }}>{team.name}</span>
          </div>
        ))}
      </div>

      <dialog
        ref={dialogRef}
        className="roster-dialog"
        aria-labelledby={titleId}
        onClose={() => setActive(null)}
        onClick={(e) => {
          if (e.target === dialogRef.current) dialogRef.current?.close();
        }}
      >
        <div className="roster-head">
          <div>
            <h3 id={titleId} className="h3 roster-title">
              {active?.name}
            </h3>
            <p className="muted roster-sub">{t.rosterTitle}</p>
          </div>
          <form method="dialog">
            <button className="btn btn-ghost" autoFocus>
              {t.close}
            </button>
          </form>
        </div>

        {roster.length > 0 ? (
          <ul className="roster-list">
            {roster.map((p) => {
              // Una estrella por cada Worlds ganado (se busca el apodo en data/rosters.json)
              const titles = getPlayerHistory(p.name, champions).titles;
              return (
              <li className="player" key={`${p.role}-${p.name}`}>
                <div className="player-name-row">
                  <h4 className="player-name">{p.name}</h4>
                  {titles > 0 && (
                    <span
                      className={styles.stars}
                      role="img"
                      aria-label={`${titles} ${titles === 1 ? cups.one : cups.many}`}
                      title={`${titles} ${titles === 1 ? cups.one : cups.many}`}
                    >
                      {"★".repeat(titles)}
                    </span>
                  )}
                  <span className="player-role">{t.roles[p.role]}</span>
                </div>
                {p.realName && <p className="player-current">{p.realName}</p>}
                {p.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.image}
                    alt=""
                    loading="lazy"
                    width={56}
                    height={56}
                    style={{ gridColumn: 2, gridRow: "1 / span 2", width: 56, height: 56, objectFit: "cover", borderRadius: 12 }}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                )}
              </li>
              );
            })}
          </ul>
        ) : (
          <p className="muted" style={{ padding: "0 28px 28px", minHeight: "16rem" }}>
            {loading ? t.rosterLoading : t.rosterEmpty}
          </p>
        )}
      </dialog>
    </section>
  );
}
