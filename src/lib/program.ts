import type { Locale } from "@/i18n/locales";

import { addDays, pragueDay, pragueMidnight } from "./dates";
import { eventCategories, type EventCategory } from "./taxonomy";

/**
 * URL state of /program: `?kategorie=hudba,tanec&mesic=2026-10&zobrazeni=seznam`.
 * Defaults (all categories, current month, calendar) are left out of the URL.
 */
export type ProgramView = "kalendar" | "seznam";
export type ProgramState = { categories: EventCategory[]; month?: string; view: ProgramView };

type SearchParams = Record<string, string | string[] | undefined>;

const MONTH = /^(\d{4})-(0[1-9]|1[0-2])$/;
const categoryIds = eventCategories.map((c) => c.id) as readonly string[];

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function parseProgramState(params: SearchParams): ProgramState {
  const categories = (first(params.kategorie) ?? "")
    .split(",")
    .map((c) => c.trim().toLowerCase())
    .filter((c, i, all): c is EventCategory => categoryIds.includes(c) && all.indexOf(c) === i)
    // Keep the canonical order so equal filters share one URL.
    .sort((a, b) => categoryIds.indexOf(a) - categoryIds.indexOf(b));
  const month = first(params.mesic);
  const validMonth = month && MONTH.test(month) && Number(month.slice(0, 4)) >= 2000 && Number(month.slice(0, 4)) <= 2100;
  return {
    categories,
    month: validMonth ? month : undefined,
    view: first(params.zobrazeni) === "seznam" ? "seznam" : "kalendar",
  };
}

/** Query string for a state, commas unescaped so the URL stays readable. "" for the defaults. */
export function programQuery(state: ProgramState): string {
  const parts: string[] = [];
  if (state.categories.length > 0) parts.push(`kategorie=${state.categories.join(",")}`);
  if (state.month) parts.push(`mesic=${state.month}`);
  if (state.view === "seznam") parts.push("zobrazeni=seznam");
  return parts.length > 0 ? `?${parts.join("&")}` : "";
}

export function toggleCategory(state: ProgramState, category: EventCategory): ProgramState {
  const on = state.categories.includes(category);
  const categories = on ? state.categories.filter((c) => c !== category) : [...state.categories, category];
  return { ...state, categories: categoryIds.filter((c) => categories.includes(c as EventCategory)) as EventCategory[] };
}

/* ------------------------------------------------------------------ Months */

/** "2026-10" → "2026-11" (delta = 1) */
export function shiftMonth(monthKey: string, delta: number): string {
  const [y, m] = monthKey.split("-").map(Number);
  const index = y * 12 + (m - 1) + delta;
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, "0")}`;
}

/**
 * How far the Program and Courses calendars page back and ahead. Without a limit every
 * month links to another one, and crawlers followed them into thousands of server renders.
 */
const MONTH_SPAN = 12;

/** True when a month is within MONTH_SPAN of today's month; others are a 404. */
export function monthInRange(monthKey: string, today: string): boolean {
  const current = today.slice(0, 7);
  return monthKey >= shiftMonth(current, -MONTH_SPAN) && monthKey <= shiftMonth(current, MONTH_SPAN);
}

/** Prague-midnight bounds of a month as ISO strings, for GROQ ranges. */
export function monthRange(monthKey: string) {
  return {
    monthStart: pragueMidnight(`${monthKey}-01`).toISOString(),
    monthEnd: pragueMidnight(`${shiftMonth(monthKey, 1)}-01`).toISOString(),
  };
}

/** ISO weekday of a "YYYY-MM-DD", Monday = 1. */
export function isoWeekday(day: string): number {
  return ((new Date(`${day}T12:00:00Z`).getUTCDay() + 6) % 7) + 1;
}

export function startOfWeek(day: string): string {
  return addDays(day, 1 - isoWeekday(day));
}

/** Every day shown in a Monday-first month grid: the month plus the tails of its neighbours. */
export function calendarDays(monthKey: string): string[] {
  const firstDay = `${monthKey}-01`;
  const lastDay = addDays(`${shiftMonth(monthKey, 1)}-01`, -1);
  const days: string[] = [];
  for (let day = startOfWeek(firstDay); day <= lastDay || isoWeekday(day) !== 1; day = addDays(day, 1)) {
    days.push(day);
  }
  return days;
}

/** Day of month: "2026-10-05" → 5 */
export function dayNumber(day: string): number {
  return Number(day.slice(8, 10));
}

/** "1. 11." / "1 Nov" */
export function dayMonthLabel(day: string, locale: Locale): string {
  const date = new Date(`${day}T12:00:00Z`);
  if (locale === "cs") return `${date.getUTCDate()}. ${date.getUTCMonth() + 1}.`;
  return date.toLocaleDateString("en-GB", { timeZone: "UTC", day: "numeric", month: "short" });
}

/** "12. – 18. 10." / "28. 9. – 4. 10." · "12–18 Oct" / "28 Sep – 4 Oct" */
export function weekRangeLabel(start: string, locale: Locale): string {
  const end = addDays(start, 6);
  const sameMonth = start.slice(0, 7) === end.slice(0, 7);
  if (locale === "cs") {
    return sameMonth ? `${dayNumber(start)}. – ${dayMonthLabel(end, locale)}` : `${dayMonthLabel(start, locale)} – ${dayMonthLabel(end, locale)}`;
  }
  return sameMonth ? `${dayNumber(start)}–${dayMonthLabel(end, locale)}` : `${dayMonthLabel(start, locale)} – ${dayMonthLabel(end, locale)}`;
}

/* ------------------------------------------------------------------ Events */

type Timed = { startsAt: string; endsAt?: string | null };

/** Finished: past its end, or (without an end time) on an earlier day. */
export function isOver(event: Timed, now: Date = new Date()): boolean {
  if (event.endsAt) return Date.parse(event.endsAt) <= now.getTime();
  return pragueDay(event.startsAt) < pragueDay(now);
}

export function matchesCategories(event: { categories: string[] | null }, categories: string[]): boolean {
  return categories.length === 0 || (event.categories ?? []).some((c) => categories.includes(c));
}

/** Groups events by their Prague start day. */
export function byDay<E extends Timed>(events: E[]): Map<string, E[]> {
  const days = new Map<string, E[]>();
  for (const event of events) {
    const day = pragueDay(event.startsAt);
    days.set(day, [...(days.get(day) ?? []), event]);
  }
  return days;
}

/** Anchor id of a day in the list view. */
export function dayAnchor(day: string) {
  return `den-${day}`;
}

/** "Now" rounded down to the minute (keeps queries cacheable) and today's Prague day. */
export function roundedNow() {
  const now = new Date(Math.floor(Date.now() / 60_000) * 60_000);
  return { now, today: pragueDay(now) };
}
