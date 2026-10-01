import { defineQuery } from "next-sanity";

import { eventCard, imageFields, notOver } from "./shared";

export const HOME_QUERY = defineQuery(`{
  "settings": *[_id == "settings"][0]{
    heroSentence, rentalBand, address,
    mapImage{ ${imageFields} }
  },
  "upcoming": *[_type == "event" && ${notOver}] | order(startsAt asc)[0...30]{ ${eventCard} },
  "courses": *[_type == "course"
    && (!defined(runStart) || runStart <= $weekEnd)
    && (!defined(runEnd) || runEnd >= $weekStart)
  ]{ _id, title, slug, focus, slots[]{ _key, weekday, startTime, endTime } }
}`);
