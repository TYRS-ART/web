import type { Locale } from "@/i18n/locales";

import { minutes, shortTime, weekdayShort, type Slot } from "./courses";
import { addDays, formatTime, pragueDay } from "./dates";
import { audienceTags, courseFocuses } from "./taxonomy";

/* ------------------------------------------------------------------ Weeks */

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

/** ISO weekday (Monday = 1) of a "YYYY-MM-DD". */
export function isoWeekday(day: string): number {
  return ((new Date(`${day}T12:00:00Z`).getUTCDay() + 6) % 7) + 1;
}

/** Monday of the week that contains the given day. */
export function mondayOf(day: string): string {
  return addDays(day, 1 - isoWeekday(day));
}

/** Monday of the week requested in the URL (`?tyden=2026-10-12`), or of this week. */
export function parseWeek(value: string | string[] | undefined, today: string): string {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw && ISO_DAY.test(raw) && !Number.isNaN(Date.parse(`${raw}T12:00:00Z`))) {
    return mondayOf(new Date(`${raw}T12:00:00Z`).toISOString().slice(0, 10));
  }
  return mondayOf(today);
}

function dayMonth(day: string) {
  const [, m, d] = day.split("-").map(Number);
  return { d, m };
}

const monthShort = (day: string) =>
  new Date(`${day}T12:00:00Z`).toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" });

/** "12.–18. 10." / "28. 9.–4. 10." · "12–18 Oct" / "28 Sep – 4 Oct" */
export function formatWeekRange(monday: string, locale: Locale): string {
  const sunday = addDays(monday, 6);
  const a = dayMonth(monday);
  const b = dayMonth(sunday);
  if (locale === "cs") return a.m === b.m ? `${a.d}.–${b.d}. ${b.m}.` : `${a.d}. ${a.m}.–${b.d}. ${b.m}.`;
  return a.m === b.m ? `${a.d}–${b.d} ${monthShort(sunday)}` : `${a.d} ${monthShort(monday)} – ${b.d} ${monthShort(sunday)}`;
}

/** "6. 10." / "6 Oct", with the year when it isn't this year's. */
export function formatDay(day: string, locale: Locale, withYear = false): string {
  const { d, m } = dayMonth(day);
  const year = day.slice(0, 4);
  if (locale === "cs") return withYear ? `${d}. ${m}. ${year}` : `${d}. ${m}.`;
  return withYear ? `${d} ${monthShort(day)} ${year}` : `${d} ${monthShort(day)}`;
}

/** "6. 10. – 8. 12." (years shown only when the run crosses New Year). */
export function formatRun(start: string, end: string, locale: Locale): string {
  const withYear = start.slice(0, 4) !== end.slice(0, 4);
  return `${formatDay(start, locale, withYear)} – ${formatDay(end, locale, withYear)}`;
}

const monthKeys = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"] as const;

/** "oct" — key for the month select in messages. */
export function monthKey(day: string): string {
  return monthKeys[Number(day.slice(5, 7)) - 1];
}

/** "3 200 Kč" / "CZK 3,200" */
export function formatPrice(amount: number, locale: Locale): string {
  if (locale === "cs") return `${new Intl.NumberFormat("cs-CZ").format(amount)} Kč`;
  return `CZK ${new Intl.NumberFormat("en-GB").format(amount)}`;
}

/* ---------------------------------------------------------------- Filters */

export const filterIds = [...courseFocuses.map((f) => f.id), "pro-deti", "zacatecnici"] as const;
export type FilterId = (typeof filterIds)[number];

/** `?filtr=tanec,pro-deti` → ["tanec", "pro-deti"] (unknown values dropped, in canonical order). */
export function parseFilters(value: string | string[] | undefined): FilterId[] {
  const raw = (Array.isArray(value) ? value.join(",") : (value ?? "")).split(",");
  return filterIds.filter((id) => raw.includes(id));
}

const isFocus = (id: string) => courseFocuses.some((f) => f.id === id);
const isAudience = (id: string) => audienceTags.some((a) => a.id === id);

/** Focus filters are alternatives, audience filters too; the two groups narrow each other. */
export function matchesFilters(course: { focus: string | null; audienceTags: string[] | null }, filters: FilterId[]) {
  const focuses = filters.filter(isFocus);
  const audiences = filters.filter(isAudience);
  if (focuses.length > 0 && !focuses.includes(course.focus as FilterId)) return false;
  if (audiences.length > 0 && !audiences.some((a) => course.audienceTags?.includes(a))) return false;
  return true;
}

/* ---------------------------------------------------------------- Lessons */

type CourseForWeek = {
  _id: string;
  slots: Slot[] | null;
  runStart: string | null;
  runEnd: string | null;
  lessonDates: string[] | null;
};

export type Lesson<C> = { key: string; course: C; day: string; weekday: number; start: string; end: string };

function addMinutes(time: string, delta: number) {
  const total = minutes(time) + delta;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

/** Prague day, weekday and times of one dated lesson; the length comes from the matching weekly slot. */
export function lessonTimes(slots: Slot[], date: string) {
  const day = pragueDay(date);
  const weekday = isoWeekday(day);
  const start = formatTime(date);
  const slot = slots.find((s) => s.weekday === weekday && s.startTime === start) ?? slots.find((s) => s.weekday === weekday) ?? slots[0];
  const length = slot ? minutes(slot.endTime) - minutes(slot.startTime) : 0;
  return { day, weekday, start, end: addMinutes(start, Math.max(30, length)) };
}

/**
 * The lessons of the given week. Courses with lesson dates meet exactly on those dates
 * (holidays and moved lessons included); the others on every slot within their run.
 */
export function lessonsInWeek<C extends CourseForWeek>(courses: C[], monday: string): Lesson<C>[] {
  const sunday = addDays(monday, 6);
  const lessons: Lesson<C>[] = [];
  for (const course of courses) {
    const slots = course.slots ?? [];
    if (slots.length === 0) continue;
    if (course.lessonDates && course.lessonDates.length > 0) {
      for (const date of course.lessonDates) {
        const times = lessonTimes(slots, date);
        if (times.day < monday || times.day > sunday) continue;
        lessons.push({ key: `${course._id}-${date}`, course, ...times });
      }
    } else {
      for (const slot of slots) {
        const day = addDays(monday, slot.weekday - 1);
        if (course.runStart && day < course.runStart) continue;
        if (course.runEnd && day > course.runEnd) continue;
        lessons.push({ key: `${course._id}-${slot._key}`, course, day, weekday: slot.weekday, start: slot.startTime, end: slot.endTime });
      }
    }
  }
  return lessons.sort((a, b) => a.day.localeCompare(b.day) || minutes(a.start) - minutes(b.start));
}

/** Side-by-side columns for lessons that overlap on the same day. */
export function layoutDay<L extends { start: string; end: string }>(lessons: L[]) {
  const placed: { lesson: L; column: number; columns: number }[] = [];
  let cluster: typeof placed = [];
  let clusterEnd = -1;
  const close = () => {
    const columns = Math.max(1, ...cluster.map((p) => p.column + 1));
    for (const p of cluster) p.columns = columns;
    cluster = [];
  };
  for (const lesson of lessons) {
    const start = minutes(lesson.start);
    if (start >= clusterEnd) {
      close();
      clusterEnd = -1;
    }
    const taken = cluster.filter((p) => minutes(p.lesson.end) > start).map((p) => p.column);
    let column = 0;
    while (taken.includes(column)) column++;
    const item = { lesson, column, columns: 1 };
    cluster.push(item);
    placed.push(item);
    clusterEnd = Math.max(clusterEnd, minutes(lesson.end));
  }
  close();
  return placed;
}

/* ------------------------------------------------------------------ Slots */

/** "St 17:00" · "Po · St · Pá 8:00" · "Po 8:00 · St 9:00" */
export function slotsBadge(slots: Slot[] | null, locale: Locale): string {
  const list = [...(slots ?? [])].sort((a, b) => a.weekday - b.weekday);
  if (list.length === 0) return "";
  if (list.every((s) => s.startTime === list[0].startTime)) {
    return `${list.map((s) => weekdayShort(s.weekday, locale)).join(" · ")} ${shortTime(list[0].startTime)}`;
  }
  return list.map((s) => `${weekdayShort(s.weekday, locale)} ${shortTime(s.startTime)}`).join(" · ");
}

/** Course titles like "Současný tanec — začátečníci" break before the dash, never after it. */
export function keepDashWithNext(title: string): string {
  return title.replace(/ — /g, " — ");
}

/** Number of lessons in the run: the explicit count, else the listed dates. */
export function lessonTotal(course: { lessonsCount: number | null; lessonDates: unknown[] | null }) {
  return course.lessonsCount ?? (course.lessonDates?.length || undefined);
}
