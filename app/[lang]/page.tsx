import { notFound } from "next/navigation";
import Nav from "@/components/Nav";
import PhaseHero from "@/components/PhaseHero";
import LiveSection from "@/components/LiveSection";
import ParticipantsSection from "@/components/ParticipantsSection";
import TournamentPhases from "@/components/TournamentPhases";
import Stats from "@/components/Stats";
import HallOfFame from "@/components/HallOfFame";
import { dictionaries, isLocale } from "@/lib/i18n";
import type { Champion, Edition } from "@/lib/types";
import championsData from "@/data/champions.json";
import config from "@/data/worlds.config.json";

const champions = championsData as Champion[];
const editions = config.editions as Edition[];

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = dictionaries[lang];

  return (
    <>
      <Nav lang={lang} t={t.nav} />

      <main>
        <PhaseHero
          lang={lang}
          hero={t.hero}
          countdown={t.countdown}
          editions={editions}
          celebrationDays={config.celebrationDays}
          champions={champions}
        />

        <LiveSection
          lang={lang}
          t={t.live}
          editions={editions}
          celebrationDays={config.celebrationDays}
          champions={champions}
        />

        {/* Equipos en competencia */}
        <ParticipantsSection t={t.participants} cups={{ one: t.hall.cupOne, many: t.hall.cupMany }} />

        {/* Fases del torneo (Play-In, Swiss, Knockout) */}
        <TournamentPhases lang={lang} t={t.swiss} tKnockout={t.knockout} />

        {/* Los números del trono y Salón de la Fama */}
        <Stats t={t.stats} regionsDict={t.regions} champions={champions} />
        <HallOfFame lang={lang} t={t.hall} regionsDict={t.regions} champions={champions} />
      </main>

      <footer className="footer">
        <div className="container footer-inner">
          <p className="brand">
            Worlds <span>LoL</span>
          </p>
          <p>{t.footer.disclaimer}</p>
          <p>{t.footer.data}</p>
        </div>
      </footer>
    </>
  );
}