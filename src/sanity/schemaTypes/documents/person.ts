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
  ],
  preview: {
    select: { title: "name", subtitle: "role.cs", media: "photo" },
  },
});
