import Link from "next/link";
import LangMenu from "./LangMenu";
import type { Dict, Locale } from "@/lib/i18n";

export default function Nav({ lang, t }: { lang: Locale; t: Dict["nav"] }) {
  return (
    <header className="nav">
      <div className="nav-inner container">
        <Link href={`/${lang}`} className="brand">
          Worlds <span>LoL</span>
        </Link>

        <nav className="nav-links" aria-label="Principal">
          <a href="#stats">{t.stats}</a>
          <a href="#hall">{t.hall}</a>
        </nav>

        <LangMenu lang={lang} label={t.languageLabel} />
      </div>
    </header>
  );
}
