import { draftMode } from "next/headers";
import type { QueryParams } from "next-sanity";

import { client } from "./client";
import { readToken } from "./token";

/** True inside the Presentation preview (draft mode cookie). False at build time. */
export async function isPreview() {
  try {
    return (await draftMode()).isEnabled && Boolean(readToken);
  } catch {
    return false;
  }
}

/**
 * Sanity query used by every page.
 * - Visitors: published content from the CDN, cached; refreshes every minute and
 *   instantly via the webhook tags.
 * - Presentation preview: drafts, uncached, with click-to-edit markers in text
 *   (pass `stega: false` for metadata, JSON-LD and anything parsed by code).
 * Pass `perspective: "published"` for build-time work (static params, sitemap, feeds).
 */
export async function sanityFetch<const Q extends string>({
  query,
  params = {},
  tags = [],
  revalidate = 60,
  stega = true,
  perspective,
}: {
  query: Q;
  params?: QueryParams;
  tags?: string[];
  revalidate?: number | false;
  stega?: boolean;
  perspective?: "published";
}) {
  if (perspective !== "published" && (await isPreview())) {
    return client
      .withConfig({ token: readToken, useCdn: false, perspective: "drafts", stega: { ...client.config().stega, enabled: stega } })
      .fetch(query, params, { cache: "no-store" });
  }
  return client.fetch(query, params, { next: { revalidate, tags: ["sanity", ...tags] } });
}
