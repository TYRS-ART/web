import { defineArrayMember, defineField } from "sanity";

const altField = defineField({
  name: "alt",
  title: "Popis obrázku (pro nevidomé a vyhledávače)",
  type: "localeString",
});

/** Photo with hotspot and a bilingual alt text. */
export function photoField(name: string, title: string, options: { required?: boolean } = {}) {
  return defineField({
    name,
    title,
    type: "image",
    options: { hotspot: true },
    fields: [altField],
    validation: options.required ? (rule) => rule.required() : undefined,
  });
}

/** The same photo as an item of a photo list (gallery). */
export const photoMember = defineArrayMember({
  type: "image",
  options: { hotspot: true },
  fields: [altField],
});
