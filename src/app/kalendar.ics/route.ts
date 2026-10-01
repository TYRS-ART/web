import { feedResponse } from "@/lib/event-ics";

// Subscribable iCal feed of the programme (Czech). Outside [locale]: the proxy skips paths with a dot.
export const revalidate = 300;

export function GET() {
  return feedResponse("cs");
}
