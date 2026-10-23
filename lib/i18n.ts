import es from "@/dictionaries/es.json";
import en from "@/dictionaries/en.json";
import ko from "@/dictionaries/ko.json";

export const locales = ["es", "en", "ko"] as const;
export type Locale = (typeof locales)[number];
export type Dict = typeof es;

export const dictionaries: Record<Locale, Dict> = { es, en, ko };

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/** Reemplaza {llaves} dentro de un texto: fill("Worlds {year}", { year: 2026 }) */
export function fill(text: string, values: Record<string, string | number>) {
  return text.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? ""));
}
