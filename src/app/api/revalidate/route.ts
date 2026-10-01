import { revalidateTag } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { parseBody } from "next-sanity/webhook";

type WebhookPayload = { _type?: string };

/**
 * Sanity webhook (on create/update/delete): drops cached data so changes show on the
 * next visit. Configure in sanity.io/manage → API → Webhooks with the secret from
 * SANITY_REVALIDATE_SECRET and projection `{_type}`.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.SANITY_REVALIDATE_SECRET;
  if (!secret) return NextResponse.json({ message: "Missing SANITY_REVALIDATE_SECRET" }, { status: 500 });

  const { isValidSignature, body } = await parseBody<WebhookPayload>(request, secret, true);
  if (!isValidSignature) return NextResponse.json({ message: "Invalid signature" }, { status: 401 });

  // Every query is tagged "sanity" plus its document types; drop both so nothing stays stale.
  const tags = ["sanity", ...(body?._type ? [body._type] : [])];
  for (const tag of tags) revalidateTag(tag, { expire: 0 });

  return NextResponse.json({ revalidated: tags, now: Date.now() });
}
