import { defineArrayMember, defineField } from "sanity";

/** Card with a small title, display headline, text, optional link and butter highlight (Venue "Jak", Studio offer). */
export const infoCardMember = defineArrayMember({
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
          description: "Např. /pronajem nebo mailto:hello@tyrs.art",
          type: "url",
          validation: (rule) => rule.uri({ allowRelative: true, scheme: ["http", "https", "mailto"] }),
        }),
      ],
    }),
    defineField({ name: "highlight", title: "Žluté zvýraznění", type: "boolean", initialValue: false }),
  ],
  preview: { select: { title: "title.cs", subtitle: "headline.cs" } },
});
