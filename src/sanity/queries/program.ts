import { defineQuery } from "next-sanity";

import { eventCard, imageFields, notOver } from "./shared";

/** /program: every event of the shown month, this week's events and the channel links. */
export const PROGRAM_QUERY = defineQuery(`{
  "settings": *[_id == "settings"][0]{ socials },
  "month": *[_type == "event" && startsAt >= $monthStart && startsAt < $monthEnd] | order(startsAt asc){
    ${eventCard}
  },
  "week": *[_type == "event" && startsAt >= $weekStart && startsAt < $weekEnd] | order(startsAt asc){
    ${eventCard}
  }
}`);

/** /program/[slug]: one event by its slug in the current language (English falls back to the Czech slug). */
export const EVENT_QUERY = defineQuery(`{
  "event": *[_type == "event" && (
    ($locale == "cs" && slug.cs.current == $slug)
    || ($locale == "en" && coalesce(slug.en.current, slug.cs.current) == $slug)
  )][0]{
    _id, title, slug, startsAt, doorsAt, endsAt, categories, lead, body, goodToKnow,
    priceText, ticketUrl, capacityNote, links,
    "hall": hall->name,
    heroImage{ ${imageFields} }
  },
  "settings": *[_id == "settings"][0]{ address }
}`);

/** "Další akce": upcoming events except the one shown; ranked in code (same category first). */
export const RELATED_EVENTS_QUERY = defineQuery(`
  *[_type == "event" && _id != $id && ${notOver}] | order(startsAt asc)[0...24]{ ${eventCard} }
`);

/** Slugs of upcoming events, prerendered at build time. */
export const EVENT_SLUGS_QUERY = defineQuery(`
  *[_type == "event" && ${notOver}]{ "cs": slug.cs.current, "en": coalesce(slug.en.current, slug.cs.current) }
`);

const icsFields = /* groq */ `
  _id, _updatedAt, title, slug, startsAt, endsAt, lead, ticketUrl, "hall": hall->name
`;

/** iCal feed: recent and upcoming events. */
export const ICS_FEED_QUERY = defineQuery(`{
  "settings": *[_id == "settings"][0]{ address },
  "events": *[_type == "event" && startsAt >= $since] | order(startsAt asc){ ${icsFields} }
}`);

/** Single-event .ics ("Přidat do kalendáře"). */
export const ICS_EVENT_QUERY = defineQuery(`{
  "settings": *[_id == "settings"][0]{ address },
  "event": *[_type == "event" && (
    ($locale == "cs" && slug.cs.current == $slug)
    || ($locale == "en" && coalesce(slug.en.current, slug.cs.current) == $slug)
  )][0]{ ${icsFields} }
}`);
