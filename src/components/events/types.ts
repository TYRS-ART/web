import type { HOME_QUERY_RESULT } from "@/sanity/types";

type Slug = HOME_QUERY_RESULT["courses"][number]["slug"];

/**
 * Shape shared by every event list (tiles, rows, ticker). A course lesson can stand
 * in for an event: it then carries `course` and links to the course page.
 */
export type EventCard = HOME_QUERY_RESULT["upcoming"][number] & { course?: { slug: Slug } };
