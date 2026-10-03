import { MicrophoneIcon } from "@sanity/icons/Microphone";
import { defineArrayMember, defineField, defineType } from "sanity";

import { photoField } from "../objects/image";
import { infoCardMember } from "../objects/infoCard";

export const studioPage = defineType({
  name: "studioPage",
  title: "Stránka Studio",
  type: "document",
  icon: MicrophoneIcon,
  fields: [
    defineField({ name: "headline", title: "Hlavní věta", type: "localeText" }),
    defineField({ name: "intro", title: "Úvodní text", type: "localeBlockContent" }),
    defineField({
      name: "collaborators",
      title: "Zvukaři a producenti",
      description: "Lidé, se kterými ve studiu spolupracujeme. Pořadí = pořadí na webu.",
      type: "array",
      of: [
        defineArrayMember({
          name: "collaborator",
          type: "object",
          fields: [
            defineField({ name: "name", title: "Jméno", type: "string", validation: (rule) => rule.required() }),
            { ...photoField("photo", "Fotka"), description: "Malá fotka vedle jména. Použij jen fotku, kterou smíme zveřejnit." },
            defineField({
              name: "credits",
              title: "S kým pracoval(a)",
              description: "Jména oddělená čárkou, např. „Sting, Aretha Franklin, Billie Eilish“.",
              type: "string",
            }),
            defineField({
              name: "url",
              title: "Web / diskografie",
              type: "url",
              validation: (rule) => rule.uri({ scheme: ["https", "http"] }),
            }),
          ],
          preview: { select: { title: "name", subtitle: "credits", media: "photo" } },
        }),
      ],
    }),
    defineField({ name: "offerCards", title: "Co nabízíme – karty", type: "array", of: [infoCardMember] }),
    defineField({ name: "motto", title: "Motto (žlutý pruh)", type: "localeString" }),
  ],
  preview: { prepare: () => ({ title: "Stránka Studio" }) },
});
