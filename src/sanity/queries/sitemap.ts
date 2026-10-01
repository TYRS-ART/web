import { defineQuery } from "next-sanity";

export const SITEMAP_QUERY = defineQuery(`{
  "events": *[_type == "event" && defined(slug.cs.current)]{ slug, _updatedAt },
  "courses": *[_type == "course" && defined(slug.cs.current)]{ slug, _updatedAt }
}`);
