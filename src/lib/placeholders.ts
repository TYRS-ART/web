/**
 * Design placeholders ("[Název akce]", "doplnit", "Lorem…") must never reach
 * the live site (BRIEF §10). Shared by Studio validation and the pre-launch check.
 */
const PLACEHOLDER = /\[[^\]]*\]|doplnit|lorem/i;

export function findPlaceholder(value: unknown): string | undefined {
  if (typeof value === "string") return value.match(PLACEHOLDER)?.[0];
  if (Array.isArray(value)) {
    for (const item of value) {
      const hit = findPlaceholder(item);
      if (hit) return hit;
    }
  } else if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      if (key.startsWith("_")) continue;
      const hit = findPlaceholder(item);
      if (hit) return hit;
    }
  }
  return undefined;
}
