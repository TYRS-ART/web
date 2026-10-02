import { CogIcon } from "@sanity/icons/Cog";
import { defineField, defineType } from "sanity";

import { noPlaceholder } from "../validation";

export const settings = defineType({
  name: "settings",
  title: "Nastavení webu",
  type: "document",
  icon: CogIcon,
  groups: [
    { name: "home", title: "Homepage", default: true },
    { name: "contact", title: "Kontakt a adresa" },
    { name: "socials", title: "Sítě a newsletter" },
  ],
  fields: [
    defineField({
      name: "heroSentence",
      title: "Úvodní věta",
      description: "Označ slovo a přes ikonu kategorie z něj udělej barevnou pilulku.",
      type: "localeHeroSentence",
      group: "home",
    }),
    defineField({
      name: "rentalBand",
      title: "Pruh „Pronájem“ na homepage",
      type: "object",
      group: "home",
      fields: [
        defineField({ name: "title", title: "Nadpis", type: "localeString" }),
        defineField({ name: "text", title: "Text", type: "localeText" }),
      ],
    }),
    defineField({
      name: "address",
      title: "Adresa",
      type: "object",
      group: "contact",
      validation: noPlaceholder,
      fields: [
        defineField({ name: "street", title: "Ulice a číslo", type: "string" }),
        defineField({ name: "district", title: "Čtvrť", type: "string" }),
        defineField({ name: "postalCode", title: "PSČ", type: "string" }),
        defineField({ name: "city", title: "Město", type: "string" }),
        defineField({ name: "googleMapsUrl", title: "Odkaz do Google Maps", type: "url" }),
      ],
    }),
    defineField({ name: "email", title: "E-mail", type: "string", group: "contact", validation: (rule) => rule.email() }),
    defineField({
      name: "phone",
      title: "Telefon",
      description: "Nepovinné. Prázdné = telefon se na webu nezobrazí.",
      type: "string",
      group: "contact",
    }),
    defineField({ name: "openingHours", title: "Otevírací doba", type: "localeText", group: "contact" }),
    defineField({
      name: "socials",
      title: "Sociální sítě",
      type: "object",
      group: "socials",
      fields: [
        defineField({ name: "instagram", title: "Instagram", type: "url" }),
        defineField({ name: "spotify", title: "Spotify (profil)", type: "url" }),
        defineField({ name: "whatsapp", title: "WhatsApp kanál", type: "url" }),
      ],
    }),
  ],
  preview: { prepare: () => ({ title: "Nastavení webu" }) },
});
