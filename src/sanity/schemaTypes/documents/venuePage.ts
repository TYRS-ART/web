import { InfoOutlineIcon } from "@sanity/icons/InfoOutline";
import { defineArrayMember, defineField, defineType } from "sanity";

import { infoCardMember } from "../objects/infoCard";

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
      of: [infoCardMember],
    }),
  ],
  preview: { prepare: () => ({ title: "Stránka Venue" }) },
});
