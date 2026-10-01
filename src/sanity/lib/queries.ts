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
