import { draftMode } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

/** Leaves the draft preview and returns to the published page. */
export async function GET(request: NextRequest) {
  (await draftMode()).disable();
  const back = request.nextUrl.searchParams.get("redirect") ?? "/";
  return NextResponse.redirect(new URL(back.startsWith("/") ? back : "/", request.url));
}
