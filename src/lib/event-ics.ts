import { getTranslations } from "next-intl/server";

import type { Locale } from "@/i18n/locales";
import { getPathname } from "@/i18n/navigation";
import { sanityFetch } from "@/sanity/lib/fetch";
import { ICS_EVENT_QUERY, ICS_FEED_QUERY } from "@/sanity/queries/program";
import type { ICS_FEED_QUERY_RESULT } from "@/sanity/types";

import { addDays, pragueDay, pragueMidnight } from "./dates";
import { buildCalendar, icsResponse, type IcsEvent } from "./ics";
import { t, tSlug } from "./localize";
import { addressLine, siteUrl } from "./site";

/** Public paths: Czech `/kalendar.ics` + `/kalendar/{slug}.ics`, English `/calendar.ics` + `/calendar/{slug}.ics`. */
export const icsBase: Record<Locale, string> = { cs: "/kalendar", en: "/calendar" };

export function eventIcsPath(slug: string, locale: Locale) {
  return `${icsBase[locale]}/${slug}.ics`;
}

type IcsSource = ICS_FEED_QUERY_RESULT["events"][number];
type Settings = ICS_FEED_QUERY_RESULT["settings"];

function toIcsEvent(event: IcsSource, settings: Settings, locale: Locale, venue: string): IcsEvent {
  const slug = tSlug(event.slug, locale);
  const url = slug ? `${siteUrl}${getPathname({ href: { pathname: "/program/[slug]", params: { slug } }, locale })}` : undefined;
  const lead = t(event.lead, locale);
  return {
    uid: `${event._id.replace(/^drafts\./, "")}@tyrs.art`,
    start: event.startsAt,
    end: event.endsAt,
    title: t(event.title, locale) ?? venue,
    description: [lead, url].filter(Boolean).join("\n\n") || undefined,
    location: [t(event.hall, locale), venue, addressLine(settings?.address)].filter(Boolean).join(", "),
    url,
    updated: event._updatedAt,
  };
}

/** Subscribable feed: everything from the last 30 days on. */
export async function feedResponse(locale: Locale): Promise<Response> {
  const since = pragueMidnight(addDays(pragueDay(new Date()), -30)).toISOString();
  const [data, tr, tre] = await Promise.all([
    sanityFetch({ query: ICS_FEED_QUERY, params: { since }, tags: ["event", "settings"], revalidate: 300 }),
    getTranslations({ locale, namespace: "program" }),
    getTranslations({ locale, namespace: "event" }),
  ]);
  const venue = tre("venue");
  const body = buildCalendar({
    name: tr("feedName"),
    feed: true,
    events: data.events.map((event) => toIcsEvent(event, data.settings, locale, venue)),
  });
  return icsResponse(body, "tyrs.ics");
}

/** One event as a downloadable .ics ("Přidat do kalendáře"). */
export async function eventResponse(locale: Locale, file: string): Promise<Response> {
  const slug = file.replace(/\.ics$/i, "");
  if (!file.toLowerCase().endsWith(".ics") || !slug) return new Response("Not found", { status: 404 });
  const [data, tre] = await Promise.all([
    sanityFetch({ query: ICS_EVENT_QUERY, params: { slug, locale }, tags: ["event", "settings"], revalidate: 300 }),
    getTranslations({ locale, namespace: "event" }),
  ]);
  if (!data.event) return new Response("Not found", { status: 404 });
  const body = buildCalendar({
    name: t(data.event.title, locale) ?? tre("venue"),
    events: [toIcsEvent(data.event, data.settings, locale, tre("venue"))],
  });
  return icsResponse(body, `${slug}.ics`, { download: true });
}
