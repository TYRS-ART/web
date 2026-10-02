import { draftMode } from "next/headers";
import { NextResponse } from "next/server";

import { client } from "@/sanity/lib/client";
import { readToken } from "@/sanity/lib/token";

/** Latest edit time across the dataset, drafts included. Only answers inside draft preview. */
export async function GET() {
  if (!(await draftMode()).isEnabled || !readToken) return new NextResponse(null, { status: 401 });
  const revision = await client
    .withConfig({ token: readToken, useCdn: false, perspective: "raw" })
    .fetch<string | null>(`*[!(_id in path("_.**"))] | order(_updatedAt desc)[0]._updatedAt`, {}, { cache: "no-store" });
  return NextResponse.json({ revision }, { headers: { "Cache-Control": "no-store" } });
}
