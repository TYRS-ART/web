import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { AlternatesProvider } from "@/components/layout/AlternateLinks";
import { Footer } from "@/components/layout/Footer";
import { HashScroll } from "@/components/layout/HashScroll";
import { Header } from "@/components/layout/Header";
import { PreviewBar } from "@/components/layout/PreviewBar";
import { PreviewRefresh } from "@/components/layout/PreviewRefresh";
import { getPathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { pragueDay, pragueDayRange } from "@/lib/dates";
import { sanityFetch } from "@/sanity/lib/fetch";
import { LAYOUT_QUERY } from "@/sanity/queries/layout";

import { draftMode } from "next/headers";
import Script from "next/script";
import { VisualEditing } from "next-sanity/visual-editing";

import { clash, generalSans, hedvig } from "../fonts";
import "../globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://tyrs.art"),
  title: { default: "TYRŠ", template: "%s · TYRŠ" },
  description: "Nosticova 634/2, Malá Strana, Praha 1",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const today = pragueDay(new Date());
  const [data, tr] = await Promise.all([
    sanityFetch({
      query: LAYOUT_QUERY,
      params: { month: today.slice(0, 7), ...pragueDayRange(today) },
      tags: ["settings", "playlist", "event"],
    }),
    getTranslations({ locale, namespace: "nav" }),
  ]);
  const preview = (await draftMode()).isEnabled;
  const newsletterHref = `${getPathname({ href: "/program", locale })}#newsletter`;

  return (
    <html lang={locale} className={`${clash.variable} ${generalSans.variable} ${hedvig.variable}`}>
      <body className="flex min-h-dvh flex-col">
        {process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN && (
          <Script
            defer
            data-domain={process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN}
            src="https://plausible.io/js/script.outbound-links.js"
            strategy="afterInteractive"
          />
        )}
        <NextIntlClientProvider>
          <AlternatesProvider>
            <a
              href="#obsah"
              className="sr-only z-50 rounded-full bg-black px-5 py-3 text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
            >
              {tr("skipToContent")}
            </a>
            <Header data={data} newsletterHref={newsletterHref} />
            <main id="obsah" className="flex-1">
              {children}
            </main>
            <Footer settings={data.settings} newsletterHref={newsletterHref} />
            <Suspense>
              <HashScroll />
            </Suspense>
          </AlternatesProvider>
        {preview && (
          <>
            <VisualEditing />
            <PreviewRefresh />
            <PreviewBar />
          </>
        )}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
