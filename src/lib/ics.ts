/**
 * Minimal iCalendar (RFC 5545) writer for "Přidat do kalendáře" and the programme feed.
 * Times are written in UTC, so no VTIMEZONE block is needed; calendar apps show them in local time.
 */

export type IcsEvent = {
  uid: string;
  start: Date | string;
  /** Without an end, the event lasts DEFAULT_DURATION. */
  end?: Date | string | null;
  title: string;
  description?: string;
  location?: string;
  url?: string;
  updated?: Date | string;
};

const DEFAULT_DURATION_MS = 2 * 60 * 60 * 1000;

/** 2026-10-16T18:00:00.000Z → 20261016T180000Z */
export function icsDate(value: Date | string): string {
  return new Date(value).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/** TEXT value escaping: backslash, semicolon, comma and newlines. */
export function icsEscape(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r\n|\r|\n/g, "\\n");
}

const encoder = new TextEncoder();

/** Folds a content line to at most 75 octets, never splitting a UTF-8 character. */
export function icsFold(line: string): string {
  if (encoder.encode(line).length <= 75) return line;
  const parts: string[] = [];
  let current = "";
  let size = 0;
  for (const char of line) {
    const charSize = encoder.encode(char).length;
    // Continuation lines start with a space, which counts towards their 75 octets.
    const limit = parts.length === 0 ? 75 : 74;
    if (size + charSize > limit) {
      parts.push(current);
      current = "";
      size = 0;
    }
    current += char;
    size += charSize;
  }
  parts.push(current);
  return parts.join("\r\n ");
}

function eventLines(event: IcsEvent, stamp: string): string[] {
  const start = new Date(event.start);
  const end = event.end ? new Date(event.end) : new Date(start.getTime() + DEFAULT_DURATION_MS);
  const lines = [
    "BEGIN:VEVENT",
    `UID:${event.uid}`,
    `DTSTAMP:${event.updated ? icsDate(event.updated) : stamp}`,
    `DTSTART:${icsDate(start)}`,
    `DTEND:${icsDate(end > start ? end : new Date(start.getTime() + DEFAULT_DURATION_MS))}`,
    `SUMMARY:${icsEscape(event.title)}`,
  ];
  if (event.description) lines.push(`DESCRIPTION:${icsEscape(event.description)}`);
  if (event.location) lines.push(`LOCATION:${icsEscape(event.location)}`);
  if (event.url) lines.push(`URL:${event.url}`);
  lines.push("STATUS:CONFIRMED", "END:VEVENT");
  return lines;
}

/** A whole VCALENDAR with CRLF line endings and folded lines. */
export function buildCalendar({ name, events, feed = false }: { name: string; events: IcsEvent[]; feed?: boolean }): string {
  const stamp = icsDate(new Date());
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//TYRŠ//tyrs.art//CS",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${icsEscape(name)}`,
    "X-WR-TIMEZONE:Europe/Prague",
    // Subscribed feeds: ask calendar apps to check for changes every hour.
    ...(feed ? ["REFRESH-INTERVAL;VALUE=DURATION:PT1H", "X-PUBLISHED-TTL:PT1H"] : []),
    ...events.flatMap((event) => eventLines(event, stamp)),
    "END:VCALENDAR",
  ];
  return lines.map(icsFold).join("\r\n") + "\r\n";
}

/** HTTP response for an .ics body. */
export function icsResponse(body: string, filename: string, { download = false } = {}): Response {
  return new Response(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${filename}"`,
    },
  });
}
