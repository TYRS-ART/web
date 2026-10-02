import type { SanityClient, SanityDocument } from "sanity";

import { addDays, pragueDay, pragueMidnight, TIME_ZONE } from "@/lib/dates";
import { findPlaceholder } from "@/lib/placeholders";

export const studioApiVersion = "2026-10-01";

type Localized = { cs?: string; en?: string } | undefined;

export function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export const publishedId = (id: string) => id.replace(/^drafts\./, "");
export const draftId = (id: string) => `drafts.${publishedId(id)}`;

/** Moves an ISO instant by whole days, keeping the Prague wall-clock time (DST-safe). */
export function shiftDays(iso: string, days: number): string {
  const day = pragueDay(iso);
  const minutesIntoDay = (Date.parse(iso) - pragueMidnight(day).getTime()) / 60_000;
  return new Date(pragueMidnight(addDays(day, days)).getTime() + minutesIntoDay * 60_000).toISOString();
}

/** Copy of an event `weeks` weeks later: dates shifted, ids, revision and slug dropped. */
export function shiftedEvent(source: SanityDocument, weeks: number): Omit<SanityDocument, "_id" | "_rev" | "_createdAt" | "_updatedAt"> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { _id, _rev, _createdAt, _updatedAt, slug, ...rest } = source;
  const copy: Record<string, unknown> = { ...rest };
  for (const field of ["startsAt", "doorsAt", "endsAt"]) {
    if (typeof copy[field] === "string") copy[field] = shiftDays(copy[field] as string, weeks * 7);
  }
  return copy as Omit<SanityDocument, "_id" | "_rev" | "_createdAt" | "_updatedAt">;
}

/** What still stops a document from going on the web (mirrors the schema's required fields). */
export function missingFields(doc: SanityDocument | null | undefined): string[] {
  if (!doc) return [];
  const problems: string[] = [];
  const title = doc.title as Localized;
  if (!title?.cs) problems.push("název");
  const image = doc.heroImage as { asset?: unknown } | undefined;
  if (!image?.asset) problems.push("fotka");
  if (doc._type === "event") {
    if (!doc.startsAt) problems.push("datum");
    if (!(doc.categories as unknown[] | undefined)?.length) problems.push("kategorie");
  }
  if (doc._type === "course") {
    if (!(doc.slots as unknown[] | undefined)?.length) problems.push("termín v týdnu");
    if (!doc.focus) problems.push("zaměření");
  }
  const placeholder = findPlaceholder(doc);
  if (placeholder) problems.push(`zástupný text „${placeholder}“`);
  return problems;
}

/** Slugs from the title (events also get their date), made unique against other documents. */
export async function buildSlugs(client: SanityClient, doc: SanityDocument) {
  const title = (doc.title as Localized) ?? {};
  const suffix = doc._type === "event" && typeof doc.startsAt === "string" ? `-${pragueDay(doc.startsAt)}` : "";
  const result: Record<string, { _type: "slug"; current: string }> = {};
  for (const lang of ["cs", "en"] as const) {
    const base = `${slugify(title[lang] || title.cs || "")}${suffix}`.replace(/^-/, "");
    if (!base) continue;
    let candidate = base;
    for (let n = 2; n < 50; n++) {
      const taken = await client.fetch<number>(
        `count(*[_type == $type && slug.${lang}.current == $slug && !(_id in [$id, $draft])])`,
        { type: doc._type, slug: candidate, id: publishedId(doc._id), draft: draftId(doc._id) },
      );
      if (!taken) break;
      candidate = `${base}-${n}`;
    }
    result[lang] = { _type: "slug", current: candidate };
  }
  return { _type: "localeSlug", ...result };
}

export function needsSlug(doc: SanityDocument | null | undefined) {
  const slug = doc?.slug as { cs?: { current?: string } } | undefined;
  return Boolean(doc && !slug?.cs?.current);
}

/** "Pá 16. 10. 20:00" in Prague time, for Studio lists. */
export function formatPragueDateTime(iso: string | undefined) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("cs-CZ", {
    timeZone: TIME_ZONE,
    weekday: "short",
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
