import type { Dict } from "@/lib/i18n";
import type { Champion } from "@/lib/types";

function countBy(champions: Champion[], key: "region" | "org") {
  const map = new Map<string, number>();
  for (const c of champions) map.set(c[key], (map.get(c[key]) ?? 0) + 1);
  return [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

export default function Stats({
  t,
  regionsDict,
  champions,
}: {
  t: Dict["stats"];
  regionsDict: Dict["regions"];
  champions: Champion[];
}) {
  const regions = countBy(champions, "region");
  const orgs = countBy(champions, "org").slice(0, 6);
  const maxRegion = regions[0]?.[1] ?? 1;
  const maxOrg = orgs[0]?.[1] ?? 1;
  const unit = (n: number) => (n === 1 ? t.titleOne : t.titleMany);

  return (
    <section id="stats" className="section container">
      <div className="section-head">
        <h2 className="h2">{t.title}</h2>
        <p className="muted">{t.subtitle}</p>
      </div>

      <div className="stats-grid">
        <div className="feature feature-purple">
          <h3 className="h3">{t.byRegion}</h3>
          <ul className="bars">
            {regions.map(([region, n]) => (
              <li key={region}>
                <div className="bar-label">
                  <span>{regionsDict[region as keyof Dict["regions"]] ?? region}</span>
                  <span>
                    {n} {unit(n)}
                  </span>
                </div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${(n / maxRegion) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="feature feature-green">
          <h3 className="h3">{t.byTeam}</h3>
          <ul className="bars">
            {orgs.map(([org, n]) => (
              <li key={org}>
                <div className="bar-label">
                  <span>{org}</span>
                  <span>
                    {n} {unit(n)}
                  </span>
                </div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${(n / maxOrg) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
