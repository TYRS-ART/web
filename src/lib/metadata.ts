import type { Metadata } from "next";
import { stegaClean } from "next-sanity";

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

/**
 * Strips Presentation click-to-edit markers from metadata. Wrap any
 * `generateMetadata` that uses Sanity text.
 */
export function cleanMetadata<Args extends unknown[]>(build: (...args: Args) => Promise<Metadata>) {
  return async (...args: Args): Promise<Metadata> => stegaClean(await build(...args));
}
