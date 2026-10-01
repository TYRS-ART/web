import type { Locale } from "@/i18n/locales";

import { weekdays } from "./taxonomy";

export type Slot = { _key: string; weekday: number; startTime: string; endTime: string };

const shortWeekday: Record<Locale, string[]> = {
  cs: ["Po", "Út", "St", "Čt", "Pá", "So", "Ne"],
  en: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
};

export function weekdayShort(weekday: number, locale: Locale) {
  return shortWeekday[locale][weekday - 1];
}

export function weekdayLong(weekday: number, locale: Locale) {
  return weekdays.find((d) => d.id === weekday)?.[locale] ?? "";
}

/** "08:00" → "8:00" */
export function shortTime(time: string) {
  return time.replace(/^0(\d)/, "$1");
}

/** Minutes after midnight. */
export function minutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/** Every slot of every course, sorted Monday → Sunday, morning → night. */
export function flattenSlots<C extends { slots: Slot[] | null }>(courses: C[]) {
  return courses
    .flatMap((course) => (course.slots ?? []).map((slot) => ({ course, slot })))
    .sort((a, b) => a.slot.weekday - b.slot.weekday || minutes(a.slot.startTime) - minutes(b.slot.startTime));
}
