import type { Locale } from "@/i18n/locales";

type Term<Id extends string> = { id: Id } & Record<Locale, string>;

export const eventCategories = [
  { id: "hudba", cs: "Hudba", en: "Music" },
  { id: "divadlo", cs: "Divadlo", en: "Theatre" },
  { id: "tanec", cs: "Tanec", en: "Dance" },
  { id: "lekce", cs: "Lekce", en: "Classes" },
  { id: "umeni", cs: "Umění", en: "Art" },
] as const satisfies readonly Term<string>[];
export type EventCategory = (typeof eventCategories)[number]["id"];

export const courseFocuses = [
  { id: "tanec", cs: "Tanec", en: "Dance" },
  { id: "hudba", cs: "Hudba", en: "Music" },
  { id: "pohyb", cs: "Pohyb", en: "Movement" },
] as const satisfies readonly Term<string>[];
export type CourseFocus = (typeof courseFocuses)[number]["id"];

export const audienceTags = [
  { id: "pro-deti", cs: "Pro děti", en: "For kids" },
  { id: "zacatecnici", cs: "Začátečníci", en: "Beginners" },
  { id: "pokrocili", cs: "Pokročilí", en: "Advanced" },
] as const satisfies readonly Term<string>[];
export type AudienceTag = (typeof audienceTags)[number]["id"];

/** ISO weekday numbers, Monday = 1. */
export const weekdays = [
  { id: 1, cs: "Pondělí", en: "Monday" },
  { id: 2, cs: "Úterý", en: "Tuesday" },
  { id: 3, cs: "Středa", en: "Wednesday" },
  { id: 4, cs: "Čtvrtek", en: "Thursday" },
  { id: 5, cs: "Pátek", en: "Friday" },
  { id: 6, cs: "Sobota", en: "Saturday" },
  { id: 7, cs: "Neděle", en: "Sunday" },
] as const;
