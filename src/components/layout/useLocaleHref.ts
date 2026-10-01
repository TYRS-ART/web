"use client";

import { useParams } from "next/navigation";

import type { Locale } from "@/i18n/locales";
import { getPathname, usePathname } from "@/i18n/navigation";

import { useAlternates } from "./AlternateLinks";

/** URL of the current page in another language. */
export function useLocaleHref(locale: Locale): string {
  const pathname = usePathname();
  const params = useParams();
  const alternates = useAlternates();
  const alternate = alternates?.[locale];
  if (alternate) return alternate;
  if (pathname.includes("[")) return getPathname({ href: "/", locale });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return getPathname({ href: { pathname, params } as any, locale });
}
