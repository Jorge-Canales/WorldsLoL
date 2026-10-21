"use client";

import Countdown from "./Countdown";
import Trophy from "./Trophy";
import { fill, type Dict, type Locale } from "@/lib/i18n";
import { getPhase } from "@/lib/phase";
import { useNow } from "@/lib/useNow";
import type { Champion, Edition } from "@/lib/types";

type Props = {
  lang: Locale;
  hero: Dict["hero"];
  countdown: Dict["countdown"];
  editions: Edition[];
  celebrationDays: number;
  champions: Champion[];
};

export default function PhaseHero({
  lang,
  hero,
  countdown,
  editions,
  celebrationDays,
  champions,
}: Props) {
  const now = useNow();
  const phase = now === null ? null : getPhase(now, editions, celebrationDays, champions);

  const dateTime = new Intl.DateTimeFormat(lang, { dateStyle: "long", timeStyle: "short" });
  const dateOnly = new Intl.DateTimeFormat(lang, { dateStyle: "long", timeZone: "UTC" });
  const maxYear = Math.max(...editions.map((e) => e.year));

  // Textos y tarjeta según el estado del sitio
  let eyebrow = "";
  let headline = hero.loading;
  let body = "";
  let card: React.ReactNode = <div className="card-skeleton" aria-hidden="true" />;
  let cardClass = "stage stage-purple";
  let primaryHref = "#hall";
  let primaryLabel = hero.ctaHall;

  if (phase?.kind === "countdown") {
    const year = phase.edition.year;
    eyebrow = hero.countdown.eyebrow;
    headline = fill(hero.countdown.headline, { year });
    body = hero.countdown.body;
    card = (
      <>
        <p className="stage-title">{fill(hero.countdown.cardTitle, { year })}</p>
        <Countdown target={phase.target} now={now} labels={countdown} />
        <p className="stage-note">
          {fill(hero.countdown.startsOn, { date: dateTime.format(new Date(phase.target)) })}
        </p>
      </>
    );
  } else if (phase?.kind === "live") {
    const { edition } = phase;
    eyebrow = hero.live.eyebrow;
    headline = fill(hero.live.headline, { year: edition.year });
    body = hero.live.body;
    cardClass = "stage stage-green";
    primaryHref = "#live";
    primaryLabel = hero.ctaLive;
    card = (
      <>
        <p className="live-pill">
          <span className="live-dot" aria-hidden="true" />
          {hero.live.eyebrow}
        </p>
        <p className="stage-title">{fill(hero.live.cardTitle, { year: edition.year })}</p>
        {edition.finalDate && (
          <p className="stage-big">
            {fill(hero.live.finalOn, {
              date: dateOnly.format(new Date(`${edition.finalDate}T12:00:00Z`)),
              city: edition.finalCity ?? "",
            })}
          </p>
        )}
        {phase.edition.end && (
          <Countdown target={phase.edition.end} now={now} labels={countdown} />
        )}
      </>
    );
  } else if (phase?.kind === "celebration") {
    const { edition, champion } = phase;
    eyebrow = fill(hero.celebration.eyebrow, { year: edition.year });
    headline = hero.celebration.headline;
    body = hero.celebration.body;
    cardClass = "stage stage-orange";
    card = (
      <>
        <p className="stage-title">{fill(hero.celebration.cardTitle, { year: edition.year })}</p>
        {champion ? (
          <>
            <p className="stage-champion">{champion.teamAtTime}</p>
            <p className="stage-note">
              {fill(hero.celebration.beat, { team: champion.runnerUp, score: champion.score })}
            </p>
          </>
        ) : (
          <p className="stage-note">{hero.celebration.pending}</p>
        )}
      </>
    );
  } else if (phase?.kind === "tbd") {
    const year = phase.edition?.year ?? maxYear + 1;
    eyebrow = hero.tbd.eyebrow;
    headline = fill(hero.tbd.headline, { year });
    body = hero.tbd.body;
    cardClass = "stage stage-blue";
    card = (
      <>
        <p className="stage-title">{fill(hero.tbd.cardTitle, { year })}</p>
        <p className="stage-big">{hero.tbd.cardBody}</p>
      </>
    );
  }

  return (
    <section className="hero container">
      <div className="hero-copy">
        <p className="eyebrow">{eyebrow || " "}</p>
        <h1 className="display">{headline}</h1>
        <p className="lead">{body || " "}</p>
        <div className="cta-row">
          <a className="btn btn-secondary" href="#stats">
            {hero.ctaStats}
          </a>
          <a className="btn btn-primary" href={primaryHref}>
            {primaryLabel}
          </a>
        </div>
      </div>

      <div className="hero-stage">
        <div className={cardClass}>{card}</div>
        <Trophy className="hero-trophy" />
      </div>
    </section>
  );
}
