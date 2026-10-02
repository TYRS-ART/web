import type { Locale } from "@/i18n/locales";

import { dayOffset, formatShortDate, formatTime } from "./dates";

export type DateWords = { today: string; tomorrow: string; until?: (date: string) => string };

/** Started already and not over yet (a festival week, an exhibition). */
export function isOngoing(startsAt: string, endsAt: string | null | undefined, now = new Date()) {
  return Boolean(endsAt) && Date.parse(startsAt) < now.getTime() && Date.parse(endsAt!) > now.getTime();
}

/** "Dnes" / "Zítra" / "Pá 16. 10."; a running event with `words.until` gives "do Ne 11. 10.". */
export function dayLabel(startsAt: string, locale: Locale, words: DateWords, endsAt?: string | null) {
  if (words.until && isOngoing(startsAt, endsAt)) return words.until(formatShortDate(endsAt!, locale));
  const offset = dayOffset(startsAt);
  if (offset === 0) return words.today;
  if (offset === 1) return words.tomorrow;
  return formatShortDate(startsAt, locale);
}

/** "Pá 16. 10. · 20:00" (a running event: just "do Ne 11. 10."). */
export function dateTimeLabel(startsAt: string, locale: Locale, words: DateWords, endsAt?: string | null) {
  if (words.until && isOngoing(startsAt, endsAt)) return dayLabel(startsAt, locale, words, endsAt);
  return `${dayLabel(startsAt, locale, words)} · ${formatTime(startsAt)}`;
}

/** First price of "390 Kč · 450 na místě · 250 stud." → "390 Kč". */
export function headlinePrice(priceText: string | undefined) {
  return priceText?.split("·")[0]?.trim() || undefined;
}
