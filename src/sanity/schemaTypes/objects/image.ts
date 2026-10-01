import { defineField } from "sanity";

/** Photo with hotspot and a bilingual alt text. */
export function photoField(name: string, title: string, options: { required?: boolean } = {}) {
  return defineField({
    name,
    title,
    type: "image",
    options: { hotspot: true },
    fields: [
      defineField({
        name: "alt",
        title: "Popis obrázku (pro nevidomé a vyhledávače)",
        type: "localeString",
      }),
    ],
    validation: options.required ? (rule) => rule.required() : undefined,
  });
}
