import type { Locale } from "@/i18n/locales";

import { dayOffset, formatShortDate, formatTime } from "./dates";

/** "Dnes" / "Zítra" / "Pá 16. 10." */
export function dayLabel(startsAt: string, locale: Locale, words: { today: string; tomorrow: string }) {
  const offset = dayOffset(startsAt);
  if (offset === 0) return words.today;
  if (offset === 1) return words.tomorrow;
  return formatShortDate(startsAt, locale);
}

/** "Pá 16. 10. · 20:00" */
export function dateTimeLabel(startsAt: string, locale: Locale, words: { today: string; tomorrow: string }) {
  return `${dayLabel(startsAt, locale, words)} · ${formatTime(startsAt)}`;
}

/** First price of "390 Kč · 450 na místě · 250 stud." → "390 Kč". */
export function headlinePrice(priceText: string | undefined) {
  return priceText?.split("·")[0]?.trim() || undefined;
}
