import { defineQuery } from "next-sanity";

import { imageFields } from "./shared";

export const VENUE_QUERY = defineQuery(`{
  "page": *[_type == "venuePage" && _id == "venuePage"][0]{
    statement, intro, motto,
    "founders": founders[]->{ _id, name, role, photo{ ${imageFields} } },
    infoCards[]{ _key, title, headline, body, link, highlight }
  },
  "settings": *[_type == "settings" && _id == "settings"][0]{
    address, email,
    mapImage{ ${imageFields} }
  }
}`);
