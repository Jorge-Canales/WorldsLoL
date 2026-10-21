"use client";

import { splitDuration } from "@/lib/phase";

type Props = {
  target: string; // fecha ISO a la que se cuenta
  now: number | null;
  labels: { days: string; hours: string; minutes: string; seconds: string };
};

const pad = (n: number) => String(n).padStart(2, "0");

export default function Countdown({ target, now, labels }: Props) {
  const parts = now === null ? null : splitDuration(Date.parse(target) - now);

  const units = [
    { key: "days", label: labels.days, value: parts ? String(parts.days) : "--" },
    { key: "hours", label: labels.hours, value: parts ? pad(parts.hours) : "--" },
    { key: "minutes", label: labels.minutes, value: parts ? pad(parts.minutes) : "--" },
    { key: "seconds", label: labels.seconds, value: parts ? pad(parts.seconds) : "--" },
  ];

  return (
    <div className="countdown" role="timer" aria-live="off">
      {units.map((u) => (
        <div className="unit" key={u.key}>
          <span className="unit-value">{u.value}</span>
          <span className="unit-label">{u.label}</span>
        </div>
      ))}
    </div>
  );
}
