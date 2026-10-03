import { BulbOutlineIcon } from "@sanity/icons/BulbOutline";
import { defineArrayMember, defineField, defineType } from "sanity";

const plain = (value?: { cs?: string } | null) => value?.cs?.replace(/\s+/g, " ").slice(0, 80) ?? "";

/**
 * Manifesto: a headline, then a list of blocks the editor can add and reorder:
 * section heading, text, big statement, the pillars, the one quote, and a line of words.
 */
export const manifestoPage = defineType({
  name: "manifestoPage",
  title: "Stránka Manifest",
  type: "document",
  icon: BulbOutlineIcon,
  fields: [
    defineField({ name: "title", title: "Hlavní věta (nadpis stránky)", type: "localeText" }),
    defineField({
      name: "sections",
      title: "Bloky",
      description: "Text manifestu po blocích. Pořadí můžeš měnit přetažením.",
      type: "array",
      of: [
        defineArrayMember({
          name: "mHeading",
          title: "Nadpis části",
          type: "object",
          fields: [defineField({ name: "text", title: "Nadpis", type: "localeString" })],
          preview: { select: { text: "text" }, prepare: ({ text }) => ({ title: plain(text), subtitle: "Nadpis části" }) },
        }),
        defineArrayMember({
          name: "mText",
          title: "Text",
          type: "object",
          fields: [
            defineField({
              name: "text",
              title: "Text",
              description: "Odstavce odděl prázdným řádkem.",
              type: "localeText",
            }),
            defineField({
              name: "size",
              title: "Velikost",
              type: "string",
              options: { list: [{ title: "Úvodní (větší)", value: "lead" }, { title: "Běžný", value: "body" }], layout: "radio" },
              initialValue: "body",
            }),
          ],
          preview: { select: { text: "text" }, prepare: ({ text }) => ({ title: plain(text), subtitle: "Text" }) },
        }),
        defineArrayMember({
          name: "mStatement",
          title: "Velká věta",
          type: "object",
          fields: [
            defineField({ name: "text", title: "Věta", description: "Každý řádek zůstane na svém řádku.", type: "localeText" }),
            defineField({
              name: "size",
              title: "Velikost",
              type: "string",
              options: {
                list: [
                  { title: "Obří", value: "xl" },
                  { title: "Velká", value: "l" },
                  { title: "Střední", value: "m" },
                ],
                layout: "radio",
              },
              initialValue: "l",
            }),
            defineField({ name: "muted", title: "Šedě (tlumeně)", type: "boolean", initialValue: false }),
          ],
          preview: { select: { text: "text" }, prepare: ({ text }) => ({ title: plain(text), subtitle: "Velká věta" }) },
        }),
        defineArrayMember({
          name: "mPillars",
          title: "Pilíře",
          type: "object",
          fields: [
            defineField({
              name: "items",
              title: "Pilíře",
              type: "array",
              of: [
                defineArrayMember({
                  name: "pillar",
                  type: "object",
                  fields: [
                    defineField({ name: "title", title: "Název", type: "localeString" }),
                    defineField({ name: "text", title: "Text", type: "localeText" }),
                  ],
                  preview: { select: { title: "title.cs", subtitle: "text.cs" } },
                }),
              ],
            }),
          ],
          preview: { select: { items: "items" }, prepare: ({ items }) => ({ title: `Pilíře (${items?.length ?? 0})` }) },
        }),
        defineArrayMember({
          name: "mQuote",
          title: "Citát (žlutý pruh)",
          type: "object",
          description: "Nejvýš jeden na stránce.",
          fields: [defineField({ name: "text", title: "Text", type: "localeString" })],
          preview: { select: { text: "text" }, prepare: ({ text }) => ({ title: plain(text), subtitle: "Citát" }) },
        }),
        defineArrayMember({
          name: "mWords",
          title: "Řada slov",
          type: "object",
          fields: [
            defineField({ name: "text", title: "Slova", description: "Např. „Koncerty. Divadlo. Přednášky.“", type: "localeText" }),
            defineField({ name: "band", title: "Na černém pruhu", type: "boolean", initialValue: false }),
          ],
          preview: { select: { text: "text" }, prepare: ({ text }) => ({ title: plain(text), subtitle: "Řada slov" }) },
        }),
      ],
    }),
  ],
  preview: { prepare: () => ({ title: "Stránka Manifest" }) },
});
