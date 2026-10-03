import { defineQuery } from "next-sanity";

export const MANIFESTO_QUERY = defineQuery(`
  *[_type == "manifestoPage" && _id == "manifestoPage"][0]{
    title,
    sections[]{
      _key, _type, text, size, muted, band,
      items[]{ _key, title, text }
    }
  }
`);
