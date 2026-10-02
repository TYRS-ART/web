import type { Locale } from "@/i18n/locales";

type Localized<T> = { cs?: T | null; en?: T | null } | null | undefined;

/** Picks the requested language and falls back to Czech, which is always filled in. */
export function t<T>(value: Localized<T>, locale: Locale): T | undefined {
  if (!value) return undefined;
  return (value[locale] ?? value.cs ?? undefined) || undefined;
}

export function tSlug(value: Localized<{ current?: string | null }>, locale: Locale): string | undefined {
  return t(value, locale)?.current ?? undefined;
}

/** "https://www.instagram.com/angela_nw/" → "@angela_nw" */
export function instagramHandle(url: string | null | undefined): string | undefined {
  const handle = url?.match(/instagram\.com\/([A-Za-z0-9._]+)/)?.[1];
  return handle ? `@${handle}` : undefined;
}
