import { CalendarIcon } from "@sanity/icons/Calendar";
import { defineArrayMember, defineField, defineType } from "sanity";

import { eventCategories } from "@/lib/taxonomy";

import { photoField } from "../objects/image";
import { requiredLocale } from "../validation";

export const event = defineType({
  name: "event",
  title: "Akce",
  type: "document",
  icon: CalendarIcon,
  groups: [
    { name: "main", title: "Základní", default: true },
    { name: "content", title: "Text" },
    { name: "tickets", title: "Vstupenky" },
    { name: "extra", title: "Doplňky" },
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
    defineField({ name: "startsAt", title: "Začátek", type: "datetime", group: "main", validation: (rule) => rule.required() }),
    defineField({ name: "doorsAt", title: "Otevření dveří", type: "datetime", group: "main" }),
    defineField({
      name: "endsAt",
      title: "Konec",
      type: "datetime",
      group: "main",
      validation: (rule) => rule.min(rule.valueOfField("startsAt")).error("Konec musí být po začátku."),
    }),
    defineField({ name: "hall", title: "Sál", type: "reference", to: [{ type: "space" }], group: "main" }),
    defineField({
      name: "categories",
      title: "Kategorie",
      type: "array",
      group: "main",
      of: [defineArrayMember({ type: "string" })],
      options: { list: eventCategories.map((c) => ({ title: c.cs, value: c.id })), layout: "grid" },
      validation: (rule) => rule.required().min(1).unique(),
    }),
    { ...photoField("heroImage", "Hlavní fotka", { required: true }), group: "main" },
    defineField({ name: "lead", title: "Perex (úvodní odstavec)", type: "localeText", group: "content" }),
    defineField({ name: "body", title: "Text", type: "localeBlockContent", group: "content" }),
    defineField({
      name: "goodToKnow",
      title: "Dobré vědět",
      type: "array",
      group: "content",
      of: [defineArrayMember({ type: "localeString" })],
    }),
    defineField({
      name: "priceText",
      title: "Vstupné",
      description: "Např. „390 Kč · 450 na místě · 250 stud.“ První částka se ukáže i na tlačítku.",
      type: "localeString",
      group: "tickets",
    }),
    defineField({ name: "ticketUrl", title: "Odkaz na vstupenky", type: "url", group: "tickets" }),
    defineField({
      name: "capacityNote",
      title: "Poznámka o kapacitě",
      description: "Např. „Zbývá posledních 24 vstupenek“. Prázdné = nezobrazí se.",
      type: "localeString",
      group: "tickets",
    }),
    defineField({
      name: "links",
      title: "Poslechni si",
      type: "object",
      group: "extra",
      fields: [
        defineField({ name: "spotify", title: "Spotify", type: "url" }),
        defineField({ name: "website", title: "Web umělce", type: "url" }),
      ],
    }),
    defineField({
      name: "featured",
      title: "Zvýraznit na homepage",
      description: "Zvýrazněné akce mají v mozaice „Nejbližší události“ přednost.",
      type: "boolean",
      group: "extra",
      initialValue: false,
    }),
    defineField({
      name: "tickerText",
      title: "Text do běžícího pásu „Dnes“",
      description: "Nepovinné. Jinak se použije název akce.",
      type: "localeString",
      group: "extra",
    }),
  ],
  orderings: [
    { title: "Podle data", name: "startsAtAsc", by: [{ field: "startsAt", direction: "asc" }] },
    { title: "Nejnovější", name: "startsAtDesc", by: [{ field: "startsAt", direction: "desc" }] },
  ],
  preview: {
    select: { title: "title.cs", startsAt: "startsAt", media: "heroImage" },
    prepare: ({ title, startsAt, media }) => ({
      title,
      subtitle: startsAt
        ? new Date(startsAt).toLocaleString("cs-CZ", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Prague" })
        : undefined,
      media,
    }),
  },
});
