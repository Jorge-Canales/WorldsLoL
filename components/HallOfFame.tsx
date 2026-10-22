import ChampionCard from "./ChampionCard";
import type { Dict, Locale } from "@/lib/i18n";
import { getRoster } from "@/lib/roster";
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
        {sorted.map((c, i) => (
          <ChampionCard
            key={c.year}
            champion={c}
            theme={THEMES[i % THEMES.length]}
            latest={i === 0}
            t={t}
            region={regionsDict[c.region as keyof Dict["regions"]] ?? c.region}
            host={`${c.city}, ${countries.of(c.countryCode) ?? c.countryCode}`}
            roster={getRoster(c.year, champions)}
          />
        ))}
      </div>
    </section>
  );
}
