import type { Metadata } from "next";

import type { Locale } from "@/i18n/locales";
import { locales } from "@/i18n/locales";
import { getPathname } from "@/i18n/navigation";

import { siteUrl } from "./site";

type Href = Parameters<typeof getPathname>[0]["href"];

/** Canonical URL + hreflang alternates for a page that exists in both languages. */
export function alternates(href: Href | ((locale: Locale) => Href), locale: Locale): Metadata["alternates"] {
  const url = (l: Locale) => `${siteUrl}${getPathname({ href: typeof href === "function" ? href(l) : href, locale: l })}`;
  return {
    canonical: url(locale),
    languages: { ...Object.fromEntries(locales.map((l) => [l, url(l)])), "x-default": url("cs") },
  };
}
