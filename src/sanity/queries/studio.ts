import { defineQuery } from "next-sanity";

import { imageFields } from "./shared";

export const STUDIO_QUERY = defineQuery(`{
  "page": *[_type == "studioPage" && _id == "studioPage"][0]{
    headline, intro, motto,
    collaborators[]{ _key, name, form, credits, url, photo{ ${imageFields} } },
    offerCards[]{ _key, title, headline, body, link, highlight }
  }
}`);
