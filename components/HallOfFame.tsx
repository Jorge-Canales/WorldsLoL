import { fill, type Dict, type Locale } from "@/lib/i18n";
import type { Champion } from "@/lib/types";

const THEMES = ["purple", "green", "blue", "orange"] as const;

export default function HallOfFame({
  lang,
  t,
  regionsDict,
  champions,
}: {
  lang: Locale;
  t: Dict["hall"];
  regionsDict: Dict["regions"];
  champions: Champion[];
}) {
  const countries = new Intl.DisplayNames(lang, { type: "region" });
  const sorted = [...champions].sort((a, b) => b.year - a.year);

  return (
    <section id="hall" className="section container">
      <div className="section-head">
        <h2 className="h2">{t.title}</h2>
        <p className="muted">{t.subtitle}</p>
      </div>

      <div className="hall-grid">
        {sorted.map((c, i) => {
          const theme = THEMES[i % THEMES.length];
          const renamed = c.teamAtTime !== c.org;
          return (
            <article
              key={c.year}
              className={`feature feature-${theme} champ${i === 0 ? " champ-latest" : ""}`}
            >
              <p className="champ-year">{c.year}</p>
              <p className="champ-label">{t.champion}</p>
              <h3 className="h3 champ-name">{c.org}</h3>
              {renamed && (
                <p className="champ-sub">{fill(t.formerly, { name: c.teamAtTime })}</p>
              )}

              <dl className="champ-facts">
                <div>
                  <dt>{t.final}</dt>
                  <dd>
                    {c.score} {t.vs} {c.runnerUp}
                  </dd>
                </div>
                <div>
                  <dt>{t.host}</dt>
                  <dd>
                    {c.city}, {countries.of(c.countryCode) ?? c.countryCode}
                  </dd>
                </div>
                {c.mvp && (
                  <div>
                    <dt>{t.mvp}</dt>
                    <dd>{c.mvp}</dd>
                  </div>
                )}
              </dl>

              <span className="champ-region">
                {regionsDict[c.region as keyof Dict["regions"]] ?? c.region}
              </span>
            </article>
          );
        })}
      </div>
    </section>
  );
}
