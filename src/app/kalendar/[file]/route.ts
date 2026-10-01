import { eventResponse } from "@/lib/event-ics";

// "Přidat do kalendáře": /kalendar/{czech-slug}.ics
export const revalidate = 300;

export async function GET(_request: Request, ctx: RouteContext<"/kalendar/[file]">) {
  const { file } = await ctx.params;
  return eventResponse("cs", file);
}
