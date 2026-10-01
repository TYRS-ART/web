import { defineQuery } from "next-sanity";

const imageFields = /* groq */ `asset, hotspot, crop, alt, "lqip": asset->metadata.lqip, "dimensions": asset->metadata.dimensions`;

export const LAYOUT_QUERY = defineQuery(`{
  "settings": *[_id == "settings"][0]{
    address, email, phone, socials, openingHours
  },
  "playlist": *[_type == "playlist" && month <= $month] | order(month desc)[0]{
    month, title, spotifyUrl, trackCount, tracks[]{ _key, title, artist, url },
    cover{ ${imageFields} }
  },
  "today": *[_type == "event" && startsAt >= $dayStart && startsAt < $dayEnd] | order(startsAt asc)[0]{
    title, slug, startsAt, ticketUrl, "hall": hall->name
  }
}`);

const eventCard = /* groq */ `
  _id, title, slug, startsAt, categories, featured, priceText, tickerText, ticketUrl,
  "hall": hall->name,
  heroImage{ ${imageFields} }
`;

/** Events that haven't finished yet: no end time → visible for the whole day they start. */
const notOver = /* groq */ `((defined(endsAt) && endsAt > $now) || (!defined(endsAt) && startsAt >= $dayStart))`;

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
