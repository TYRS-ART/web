import { feedResponse } from "@/lib/event-ics";

// Subscribable iCal feed of the programme (English).
export const revalidate = 300;

export function GET() {
  return feedResponse("en");
}
