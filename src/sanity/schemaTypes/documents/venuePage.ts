import { InfoOutlineIcon } from "@sanity/icons/InfoOutline";
import { defineArrayMember, defineField, defineType } from "sanity";

export const venuePage = defineType({
  name: "venuePage",
  title: "Stránka Venue",
  type: "document",
  icon: InfoOutlineIcon,
  fields: [
    defineField({ name: "statement", title: "Kdo – hlavní věta", type: "localeText" }),
    defineField({ name: "intro", title: "Kdo – úvodní text", type: "localeBlockContent" }),
    defineField({
      name: "founders",
      title: "Zakladatelé",
      type: "array",
      of: [defineArrayMember({ type: "reference", to: [{ type: "person" }] })],
      validation: (rule) => rule.unique(),
    }),
    defineField({ name: "motto", title: "Motto (žlutý pruh)", type: "localeString" }),
    defineField({
      name: "infoCards",
      title: "Jak – karty",
      type: "array",
      of: [
        defineArrayMember({
          name: "infoCard",
          type: "object",
          fields: [
            defineField({ name: "title", title: "Nadpis", type: "localeString" }),
            defineField({ name: "headline", title: "Hlavní text", type: "localeString" }),
            defineField({ name: "body", title: "Doplňující text", type: "localeText" }),
            defineField({
              name: "link",
              title: "Odkaz",
              type: "object",
              fields: [
                defineField({ name: "label", title: "Text odkazu", type: "localeString" }),
                defineField({
                  name: "href",
                  title: "Adresa",
                  description: "Např. /pronajem nebo mailto:booking@tyrs.art",
                  type: "url",
                  validation: (rule) => rule.uri({ allowRelative: true, scheme: ["http", "https", "mailto"] }),
                }),
              ],
            }),
            defineField({ name: "highlight", title: "Žluté zvýraznění", type: "boolean", initialValue: false }),
          ],
          preview: { select: { title: "title.cs", subtitle: "headline.cs" } },
        }),
      ],
    }),
  ],
  preview: { prepare: () => ({ title: "Stránka Venue" }) },
});
