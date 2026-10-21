import Link from "next/link";
import type { Dict, Locale } from "@/lib/i18n";

export default function Nav({ lang, t }: { lang: Locale; t: Dict["nav"] }) {
  const other: Locale = lang === "es" ? "en" : "es";

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

        <Link href={`/${other}`} className="btn btn-ghost" aria-label={t.switchAria} hrefLang={other}>
          {t.switchLabel}
        </Link>
      </div>
    </header>
  );
}
