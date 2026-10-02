import { UserIcon } from "@sanity/icons/User";
import { defineField, defineType } from "sanity";

import { photoField } from "../objects/image";

export const person = defineType({
  name: "person",
  title: "Člověk",
  type: "document",
  icon: UserIcon,
  fields: [
    defineField({ name: "name", title: "Jméno", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "role", title: "Role", type: "localeString" }),
    photoField("photo", "Fotka"),
    defineField({ name: "bio", title: "Medailonek", type: "localeText" }),
    defineField({
      name: "instagram",
      title: "Instagram",
      description: "Odkaz na profil, např. https://www.instagram.com/angela_nw/",
      type: "url",
      validation: (rule) =>
        rule.uri({ scheme: ["https"] }).custom((value?: string) =>
          !value || /^https:\/\/(www\.)?instagram\.com\/[A-Za-z0-9._]+\/?$/.test(value) ? true : "Vlož odkaz na profil ve tvaru https://www.instagram.com/jmeno/",
        ),
    }),
  ],
  preview: {
    select: { title: "name", subtitle: "role.cs", media: "photo" },
  },
});
