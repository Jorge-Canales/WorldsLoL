"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n";
import styles from "./LangMenu.module.css";

// Los nombres de los idiomas se escriben en su propio idioma y no se traducen.
const OPTIONS: { code: Locale; label: string }[] = [
  { code: "es", label: "Español" },
  { code: "en", label: "English" },
  { code: "ko", label: "한국어" },
];

function GlobeIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}

/** Globo terráqueo que abre la lista de idiomas y te deja en la misma página al cambiar. */
export default function LangMenu({ lang, label }: { lang: Locale; label: string }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  const pathname = usePathname() ?? `/${lang}`;
  // Si agregas otro idioma, súmalo aquí y en OPTIONS.
  const rest = pathname.replace(/^\/(es|en|ko)(?=\/|$)/, "");

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: Event) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("touchstart", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("touchstart", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        className={styles.button}
        aria-label={label}
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((o) => !o)}
      >
        <GlobeIcon />
      </button>

      {open && (
        <ul id={menuId} className={styles.menu}>
          {OPTIONS.map((o) => {
            const current = o.code === lang;
            return (
              <li key={o.code}>
                <Link
                  href={`/${o.code}${rest}`}
                  lang={o.code}
                  hrefLang={o.code}
                  className={`${styles.option}${current ? ` ${styles.current}` : ""}`}
                  aria-current={current ? "true" : undefined}
                  onClick={() => setOpen(false)}
                >
                  <span>{o.label}</span>
                  {current && <CheckIcon />}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
