import { BookIcon } from "@sanity/icons/Book";
import { defineArrayMember, defineField, defineType } from "sanity";

import { audienceTags, courseFocuses, weekdays } from "@/lib/taxonomy";

import { photoField } from "../objects/image";
import { requiredLocale } from "../validation";

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

export const course = defineType({
  name: "course",
  title: "Kurz",
  type: "document",
  icon: BookIcon,
  groups: [
    { name: "main", title: "Základní", default: true },
    { name: "schedule", title: "Rozvrh" },
    { name: "booking", title: "Cena a přihlášky" },
    { name: "content", title: "Text" },
  ],
  fields: [
    defineField({ name: "title", title: "Název", type: "localeString", group: "main", validation: requiredLocale }),
    defineField({
      name: "slug",
      title: "Adresa stránky",
      description: "Vyplní se sama při zveřejnění z názvu (a u akcí z data). Změň jen když chceš jinou.",
      type: "localeSlug",
      group: "main",
    }),
    defineField({
      name: "focus",
      title: "Zaměření",
      type: "string",
      group: "main",
      options: { list: courseFocuses.map((f) => ({ title: f.cs, value: f.id })), layout: "radio", direction: "horizontal" },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "audienceTags",
      title: "Pro koho (filtry)",
      type: "array",
      group: "main",
      of: [defineArrayMember({ type: "string" })],
      options: { list: audienceTags.map((t) => ({ title: t.cs, value: t.id })), layout: "grid" },
    }),
    defineField({
      name: "level",
      title: "Úroveň",
      description: "Krátce, např. „začátečníci“, „4–7 let“, „otevřená lekce“.",
      type: "localeString",
      group: "main",
    }),
    defineField({ name: "lecturer", title: "Lektor", type: "reference", to: [{ type: "person" }], group: "main" }),
    defineField({ name: "space", title: "Sál", type: "reference", to: [{ type: "space" }], group: "main" }),
    { ...photoField("heroImage", "Hlavní fotka", { required: true }), group: "main" },
    defineField({
      name: "slots",
      title: "Pravidelné termíny",
      description: "Den a čas v týdnu. Kurz může mít víc termínů (např. Po · St · Pá).",
      type: "array",
      group: "schedule",
      validation: (rule) => rule.required().min(1),
      of: [
        defineArrayMember({
          name: "slot",
          type: "object",
          fields: [
            defineField({
              name: "weekday",
              title: "Den",
              type: "number",
              options: { list: weekdays.map((d) => ({ title: d.cs, value: d.id })) },
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "startTime",
              title: "Od (HH:MM)",
              type: "string",
              validation: (rule) => rule.required().regex(TIME, { name: "čas HH:MM" }),
            }),
            defineField({
              name: "endTime",
              title: "Do (HH:MM)",
              type: "string",
              validation: (rule) => rule.required().regex(TIME, { name: "čas HH:MM" }),
            }),
          ],
          preview: {
            select: { weekday: "weekday", startTime: "startTime", endTime: "endTime" },
            prepare: ({ weekday, startTime, endTime }) => ({
              title: `${weekdays.find((d) => d.id === weekday)?.cs ?? "?"} ${startTime ?? ""}–${endTime ?? ""}`,
            }),
          },
        }),
      ],
    }),
    defineField({ name: "runStart", title: "Začátek běhu", type: "date", group: "schedule" }),
    defineField({
      name: "runEnd",
      title: "Konec běhu",
      type: "date",
      group: "schedule",
      validation: (rule) => rule.min(rule.valueOfField("runStart")).error("Konec musí být po začátku."),
    }),
    defineField({ name: "lessonsCount", title: "Počet lekcí", type: "number", group: "schedule", validation: (rule) => rule.integer().positive() }),
    defineField({
      name: "lessonDates",
      title: "Termíny lekcí",
      type: "array",
      group: "schedule",
      of: [
        defineArrayMember({
          name: "lessonDate",
          type: "object",
          fields: [
            defineField({ name: "date", title: "Datum a čas", type: "datetime", validation: (rule) => rule.required() }),
            defineField({ name: "isTrial", title: "Zkušební lekce", type: "boolean", initialValue: false }),
            defineField({
              name: "bookingUrl",
              title: "Odkaz na přihlášku na tuto lekci",
              description: "Např. akce na Luma. Na stránce kurzu se zobrazí vpravo u termínu jako „Přihlásit se ↗“.",
              type: "url",
            }),
          ],
          preview: {
            select: { date: "date", isTrial: "isTrial", bookingUrl: "bookingUrl" },
            prepare: ({ date, isTrial, bookingUrl }) => ({
              title: date ? new Date(date).toLocaleString("cs-CZ", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Prague" }) : "",
              subtitle: [isTrial && "zkušební lekce", bookingUrl && "s odkazem na přihlášku"].filter(Boolean).join(" · ") || undefined,
            }),
          },
        }),
      ],
    }),
    defineField({ name: "coursePrice", title: "Cena celého kurzu (Kč)", type: "number", group: "booking", validation: (rule) => rule.min(0) }),
    defineField({ name: "bookingUrl", title: "Odkaz na přihlášku", type: "url", group: "booking", description: "Bez odkazu se tlačítko „Přihlásit se“ nezobrazí." }),
    defineField({
      name: "allowSingleLesson",
      title: "Lze přijít i na jednu lekci",
      type: "boolean",
      group: "booking",
      initialValue: false,
    }),
    defineField({
      name: "singleLessonPrice",
      title: "Cena jedné lekce (Kč)",
      type: "number",
      group: "booking",
      hidden: ({ document }) => !document?.allowSingleLesson,
      validation: (rule) => rule.min(0),
    }),
    defineField({
      name: "singleLessonBookingUrl",
      title: "Odkaz na přihlášku na jednu lekci",
      description: "Nepovinné. Jinak se použije hlavní odkaz na přihlášku.",
      type: "url",
      group: "booking",
      hidden: ({ document }) => !document?.allowSingleLesson,
    }),
    defineField({ name: "trialPrice", title: "Cena zkušební lekce (Kč)", type: "number", group: "booking", validation: (rule) => rule.min(0) }),
    defineField({ name: "capacity", title: "Kapacita", type: "number", group: "booking", validation: (rule) => rule.integer().positive() }),
    defineField({
      name: "placesLeft",
      title: "Zbývá míst",
      description: "Prázdné = nezobrazí se.",
      type: "number",
      group: "booking",
      validation: (rule) => rule.integer().min(0),
    }),
    defineField({ name: "description", title: "Popis", type: "localeBlockContent", group: "content" }),
    defineField({ name: "forWhom", title: "Pro koho", type: "localeText", group: "content" }),
    defineField({ name: "whatToBring", title: "Co s sebou", type: "localeText", group: "content" }),
    defineField({
      name: "goodToKnow",
      title: "Dobré vědět",
      type: "array",
      group: "content",
      of: [defineArrayMember({ type: "localeString" })],
    }),
  ],
  preview: {
    select: { title: "title.cs", level: "level.cs", media: "heroImage" },
    prepare: ({ title, level, media }) => ({ title, subtitle: level, media }),
  },
});
