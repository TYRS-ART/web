/** GROQ fragments shared by every page's queries. */

export const imageFields = /* groq */ `asset, hotspot, crop, alt, "lqip": asset->metadata.lqip, "dimensions": asset->metadata.dimensions`;

/** Fields every event list needs (tiles, rows, ticker, calendar). */
export const eventCard = /* groq */ `
  _id, title, slug, startsAt, categories, featured, priceText, tickerText, ticketUrl,
  "hall": hall->name,
  heroImage{ ${imageFields} }
`;

/** Events that haven't finished yet: no end time → visible for the whole day they start. */
export const notOver = /* groq */ `((defined(endsAt) && endsAt > $now) || (!defined(endsAt) && startsAt >= $dayStart))`;
