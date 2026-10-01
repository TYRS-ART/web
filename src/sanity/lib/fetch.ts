import type { QueryParams } from "next-sanity";

import { client } from "./client";

/** Cached Sanity query. Pages refresh every minute; the webhook revalidates tags instantly. */
export async function sanityFetch<const Q extends string>({
  query,
  params = {},
  tags = [],
  revalidate = 60,
}: {
  query: Q;
  params?: QueryParams;
  tags?: string[];
  revalidate?: number | false;
}) {
  return client.fetch(query, params, { next: { revalidate, tags: ["sanity", ...tags] } });
}
