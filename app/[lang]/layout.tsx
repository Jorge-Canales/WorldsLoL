import type { Metadata } from "next";
import { notFound } from "next/navigation";
import "@fontsource-variable/nunito";
import "@fontsource-variable/inter";
import "../globals.css";
import { dictionaries, isLocale, locales } from "@/lib/i18n";

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const { meta } = dictionaries[lang];
  return {
    title: meta.title,
    description: meta.description,
    alternates: { languages: { es: "/es", en: "/en" } },
  };
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  return (
    <html lang={lang}>
      <body>{children}</body>
    </html>
  );
}
