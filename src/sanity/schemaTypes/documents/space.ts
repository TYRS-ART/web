import { HomeIcon } from "@sanity/icons/Home";
import { defineField, defineType } from "sanity";

import { photoField } from "../objects/image";
import { requiredLocale } from "../validation";

export const space = defineType({
  name: "space",
  title: "Prostor",
  type: "document",
  icon: HomeIcon,
  fields: [
    defineField({ name: "name", title: "Název", type: "localeString", validation: requiredLocale }),
    defineField({ name: "capacity", title: "Kapacita (lidí)", type: "number", validation: (rule) => rule.integer().positive() }),
    defineField({ name: "area", title: "Plocha (m²)", type: "number", validation: (rule) => rule.positive() }),
    defineField({ name: "features", title: "Vybavení a využití", type: "localeString" }),
    photoField("photo", "Fotka"),
    defineField({
      name: "rentable",
      title: "Lze pronajmout",
      description: "Zobrazí se na stránce Pronájem.",
      type: "boolean",
      initialValue: true,
    }),
    defineField({ name: "order", title: "Pořadí", type: "number", initialValue: 0 }),
  ],
  orderings: [{ title: "Pořadí", name: "orderAsc", by: [{ field: "order", direction: "asc" }] }],
  preview: {
    select: { title: "name.cs", capacity: "capacity", media: "photo" },
    prepare: ({ title, capacity, media }) => ({ title, subtitle: capacity ? `${capacity} míst` : undefined, media }),
  },
});
