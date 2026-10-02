import { defineArrayMember, defineField, defineType } from "sanity";

import { localeTitles, locales } from "@/i18n/locales";
import { eventCategories } from "@/lib/taxonomy";

import { noPlaceholder } from "../validation";

export const localeString = defineType({
  name: "localeString",
  title: "Text (CZ + EN)",
  type: "object",
  validation: noPlaceholder,
  fields: locales.map((lang) =>
    defineField({ name: lang, title: localeTitles[lang], type: "string" }),
  ),
});

export const localeText = defineType({
  name: "localeText",
  title: "Delší text (CZ + EN)",
  type: "object",
  validation: noPlaceholder,
  fields: locales.map((lang) =>
    defineField({ name: lang, title: localeTitles[lang], type: "text", rows: 4 }),
  ),
});

const linkAnnotation = defineArrayMember({
  name: "link",
  title: "Odkaz",
  type: "object",
  fields: [
    defineField({
      name: "href",
      title: "Adresa",
      type: "url",
      validation: (rule) =>
        rule.required().uri({ allowRelative: true, scheme: ["http", "https", "mailto", "tel"] }),
    }),
  ],
});

const richTextBlock = defineArrayMember({
  type: "block",
  styles: [
    { title: "Odstavec", value: "normal" },
    { title: "Mezititulek", value: "h3" },
  ],
  lists: [],
  marks: {
    decorators: [
      { title: "Tučně", value: "strong" },
      { title: "Kurzíva", value: "em" },
    ],
    annotations: [linkAnnotation],
  },
});

/** Rich text: paragraphs, subheadings, bold, italic and links. */
export const localeBlockContent = defineType({
  name: "localeBlockContent",
  title: "Formátovaný text (CZ + EN)",
  type: "object",
  validation: noPlaceholder,
  fields: locales.map((lang) =>
    defineField({ name: lang, title: localeTitles[lang], type: "array", of: [richTextBlock] }),
  ),
});

const categoryPillAnnotation = defineArrayMember({
  name: "categoryPill",
  title: "Kategorie (barevná pilulka)",
  type: "object",
  fields: [
    defineField({
      name: "category",
      title: "Kategorie",
      type: "string",
      options: { list: eventCategories.map((c) => ({ title: c.cs, value: c.id })) },
      validation: (rule) => rule.required(),
    }),
  ],
});

/** Hero sentence: plain paragraphs where words can be marked as category pills. */
export const localeHeroSentence = defineType({
  name: "localeHeroSentence",
  title: "Úvodní věta (CZ + EN)",
  type: "object",
  validation: noPlaceholder,
  fields: locales.map((lang) =>
    defineField({
      name: lang,
      title: localeTitles[lang],
      type: "array",
      of: [
        defineArrayMember({
          type: "block",
          styles: [{ title: "Odstavec", value: "normal" }],
          lists: [],
          marks: { decorators: [], annotations: [categoryPillAnnotation] },
        }),
      ],
    }),
  ),
});

/** URL slug per language, generated from the matching title. */
export const localeSlug = defineType({
  name: "localeSlug",
  title: "Adresa stránky (CZ + EN)",
  type: "object",
  fields: locales.map((lang) =>
    defineField({
      name: lang,
      title: localeTitles[lang],
      type: "slug",
      options: { source: `title.${lang}`, maxLength: 96 },
    }),
  ),
});
