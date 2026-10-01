import { eventResponse } from "@/lib/event-ics";

// "Add to calendar": /calendar/{english-slug}.ics
export const revalidate = 300;

export async function GET(_request: Request, ctx: RouteContext<"/calendar/[file]">) {
  const { file } = await ctx.params;
  return eventResponse("en", file);
}
