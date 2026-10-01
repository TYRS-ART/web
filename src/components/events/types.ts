import type { HOME_QUERY_RESULT } from "@/sanity/types";

/** Shape shared by every event list (tiles, rows, ticker). */
export type EventCard = HOME_QUERY_RESULT["upcoming"][number];
