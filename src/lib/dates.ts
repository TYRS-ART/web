import type { Locale } from "@/i18n/locales";

export const TIME_ZONE = "Europe/Prague";

const intlLocale: Record<Locale, string> = { cs: "cs-CZ", en: "en-GB" };

/** YYYY-MM-DD of a moment, in Prague. */
export function pragueDay(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-CA", { timeZone: TIME_ZONE });
}

export function dayOffset(date: Date | string, from: Date = new Date()): number {
  const a = Date.parse(pragueDay(date));
  const b = Date.parse(pragueDay(from));
  return Math.round((a - b) / 86_400_000);
}

/** "20:00" */
export function formatTime(date: Date | string): string {
  return new Date(date).toLocaleTimeString("cs-CZ", { timeZone: TIME_ZONE, hour: "2-digit", minute: "2-digit" });
}

/** Short weekday: "Pá" / "Fri". */
export function formatWeekday(date: Date | string, locale: Locale): string {
  const day = new Date(date).toLocaleDateString(intlLocale[locale], { timeZone: TIME_ZONE, weekday: "short" });
  return day.charAt(0).toUpperCase() + day.slice(1).replace(".", "");
}

/** "Pá 16. 10." / "Fri 16 Oct" */
export function formatShortDate(date: Date | string, locale: Locale): string {
  const d = new Date(date);
  if (locale === "cs") {
    const [, m, day] = pragueDay(d).split("-").map(Number);
    return `${formatWeekday(d, locale)} ${day}. ${m}.`;
  }
  return `${formatWeekday(d, locale)} ${d.toLocaleDateString("en-GB", { timeZone: TIME_ZONE, day: "numeric", month: "short" })}`;
}

/** "Říjen" / "October" */
export function formatMonth(date: Date | string, locale: Locale): string {
  const month = new Date(date).toLocaleDateString(intlLocale[locale], { timeZone: TIME_ZONE, month: "long" });
  return month.charAt(0).toUpperCase() + month.slice(1);
}

/** Month name in the nominative from a "YYYY-MM" string. */
export function formatMonthKey(monthKey: string, locale: Locale): string {
  return formatMonth(new Date(`${monthKey}-15T12:00:00Z`), locale);
}

/** UTC instant of Prague midnight at the start of the given "YYYY-MM-DD". */
export function pragueMidnight(day: string): Date {
  const naive = new Date(`${day}T00:00:00Z`);
  const offset = new Intl.DateTimeFormat("en-US", { timeZone: TIME_ZONE, timeZoneName: "longOffset" })
    .formatToParts(naive)
    .find((part) => part.type === "timeZoneName")
    ?.value.match(/GMT([+-])(\d{2}):(\d{2})/);
  const minutes = offset ? (offset[1] === "-" ? -1 : 1) * (Number(offset[2]) * 60 + Number(offset[3])) : 0;
  return new Date(naive.getTime() - minutes * 60_000);
}

export function addDays(day: string, days: number): string {
  return new Date(Date.parse(`${day}T12:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);
}

/** Start and end (exclusive) of a Prague day as ISO strings, for GROQ date ranges. */
export function pragueDayRange(day: string = pragueDay(new Date())) {
  return { dayStart: pragueMidnight(day).toISOString(), dayEnd: pragueMidnight(addDays(day, 1)).toISOString() };
}
