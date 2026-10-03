import { defineQuery } from "next-sanity";

export const STUDIO_QUERY = defineQuery(`{
  "page": *[_type == "studioPage" && _id == "studioPage"][0]{
    headline, intro, motto,
    collaborators[]{ _key, name, credits, url },
    offerCards[]{ _key, title, headline, body, link, highlight }
  }
}`);
