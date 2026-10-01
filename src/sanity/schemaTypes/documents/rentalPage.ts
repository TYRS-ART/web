import { EnvelopeIcon } from "@sanity/icons/Envelope";
import { defineArrayMember, defineField, defineType } from "sanity";

export const rentalPage = defineType({
  name: "rentalPage",
  title: "Stránka Pronájem",
  type: "document",
  icon: EnvelopeIcon,
  fields: [
    defineField({ name: "headline", title: "Nadpis", type: "localeString" }),
    defineField({ name: "intro", title: "Úvodní text", type: "localeText" }),
    defineField({
      name: "included",
      title: "Co je v ceně",
      type: "array",
      of: [
        defineArrayMember({
          name: "includedItem",
          type: "object",
          fields: [
            defineField({ name: "title", title: "Nadpis", type: "localeString" }),
            defineField({ name: "body", title: "Text", type: "localeText" }),
          ],
          preview: { select: { title: "title.cs", subtitle: "body.cs" } },
        }),
      ],
    }),
    defineField({ name: "formIntro", title: "Text u formuláře", type: "localeText" }),
    defineField({
      name: "quote",
      title: "Reference",
      type: "object",
      fields: [
        defineField({ name: "text", title: "Citace", type: "localeText" }),
        defineField({ name: "author", title: "Jméno", type: "string" }),
        defineField({ name: "organisation", title: "Organizace", type: "string" }),
      ],
    }),
  ],
  preview: { prepare: () => ({ title: "Stránka Pronájem" }) },
});
