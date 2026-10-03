import { createClient } from "next-sanity";

import { apiVersion, dataset, projectId } from "../env";

/**
 * Text fields that may carry click-to-edit markers in Presentation. Everything else
 * (categories, slugs, dates, times, URLs, colours, addresses) stays clean because
 * the code compares or parses it.
 */
const EDITABLE_TEXT = new Set([
  "title", "lead", "body", "name", "role", "bio", "headline", "text", "intro", "statement", "motto",
  "features", "priceText", "capacityNote", "goodToKnow", "forWhom", "whatToBring", "level", "tickerText",
  "formIntro", "description", "heroSentence", "label", "artist",
]);
const NEVER = new Set(["slug", "markDefs", "categories", "focus", "audienceTags", "style", "marks", "_type", "_key", "href", "url"]);

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true,
  stega: {
    enabled: false,
    studioUrl: "/admin",
    filter: (props) => {
      const path = props.sourcePath.filter((segment): segment is string => typeof segment === "string");
      if (path.some((segment) => NEVER.has(segment))) return false;
      return path.some((segment) => EDITABLE_TEXT.has(segment)) && props.filterDefault(props);
    },
  },
});
