import { PlayIcon } from "@sanity/icons/Play";
import { defineArrayMember, defineField, defineType } from "sanity";

import { photoField } from "../objects/image";

export const playlist = defineType({
  name: "playlist",
  title: "Playlist měsíce",
  type: "document",
  icon: PlayIcon,
  fields: [
    defineField({
      name: "month",
      title: "Měsíc (RRRR-MM)",
      type: "string",
      validation: (rule) => rule.required().regex(/^\d{4}-(0[1-9]|1[0-2])$/, { name: "RRRR-MM" }),
    }),
    defineField({ name: "title", title: "Název", type: "localeString" }),
    defineField({ name: "spotifyUrl", title: "Odkaz na Spotify", type: "url", validation: (rule) => rule.required() }),
    photoField("cover", "Obal"),
    defineField({
      name: "tracks",
      title: "Ukázka skladeb",
      type: "array",
      of: [
        defineArrayMember({
          name: "track",
          type: "object",
          fields: [
            defineField({ name: "title", title: "Skladba", type: "string", validation: (rule) => rule.required() }),
            defineField({ name: "artist", title: "Interpret", type: "string", validation: (rule) => rule.required() }),
            defineField({ name: "url", title: "Odkaz", type: "url" }),
          ],
          preview: { select: { title: "title", subtitle: "artist" } },
        }),
      ],
    }),
  ],
  orderings: [{ title: "Podle měsíce", name: "monthDesc", by: [{ field: "month", direction: "desc" }] }],
  preview: {
    select: { month: "month", title: "title.cs", media: "cover" },
    prepare: ({ month, title, media }) => ({ title: month, subtitle: title, media }),
  },
});
