"use client";

import Image from "next/image";
import type { Dict } from "@/lib/i18n";
import participantsData from "@/data/participants.json";

export type Participant = {
  id: string;
  name: string;
  shortName: string;
  file: string;
};

const participants = participantsData as Participant[];

export default function ParticipantsSection({ t }: { t: Dict["participants"] }) {
  return (
    <section className="section container">
      <div className="section-head" style={{ marginBottom: "2rem" }}>
        <h2 className="h2">{t.title}</h2>
        <p className="muted">{t.subtitle}</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: "1rem" }}>
        {participants.map((team) => (
          <div key={team.id} className="panel" style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "1rem", textAlign: "center" }}>
            <div style={{ position: "relative", width: "56px", height: "56px", marginBottom: "0.5rem" }}>
              <Image 
                src={`/media/logos/currentParticipants/${team.file}`} 
                alt={team.name} 
                fill
                style={{ objectFit: "contain" }}
                unoptimized
              />
            </div>
            <span style={{ fontSize: "0.8rem", fontWeight: 600 }}>{team.name}</span>
          </div>
        ))}
      </div>
    </section>
  );
}