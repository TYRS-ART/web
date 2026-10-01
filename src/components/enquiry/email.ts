// Only imported by the enquiry server action.
import cs from "@/messages/cs/rental.json";

import type { EventType } from "./fields";

export type Enquiry = {
  name: string;
  organisation: string;
  email: string;
  phone: string;
  /** Czech name of the space, or "Ještě nevím". */
  space: string;
  type: EventType;
  /** YYYY-MM-DD */
  date: string;
  people: number;
  message: string;
  locale: string;
};

const labels = cs.enquiry;

function escapeHtml(text: string) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/** 2026-10-24 → "so 24. 10. 2026" */
function czechDate(day: string) {
  const date = new Date(`${day}T12:00:00Z`);
  const weekday = new Intl.DateTimeFormat("cs-CZ", { weekday: "short", timeZone: "UTC" }).format(date);
  const [y, m, d] = day.split("-").map(Number);
  return `${weekday} ${d}. ${m}. ${y}`;
}

/** The email the booking team receives. Always in Czech; the visitor's language is noted. */
export function enquiryEmail(enquiry: Enquiry) {
  const rows: [string, string][] = [
    [labels.name, enquiry.name],
    ["Organizace", enquiry.organisation || "—"],
    [labels.email, enquiry.email],
    [labels.phone, enquiry.phone],
    [labels.space, enquiry.space],
    [labels.type, labels.types[enquiry.type]],
    [labels.date, czechDate(enquiry.date)],
    [labels.people, String(enquiry.people)],
    ["Jazyk webu", enquiry.locale === "en" ? "angličtina" : "čeština"],
  ];

  const subject = `Poptávka pronájmu: ${enquiry.name}${enquiry.organisation ? ` (${enquiry.organisation})` : ""}, ${czechDate(enquiry.date)}`
    .replace(/[\r\n]+/g, " ")
    .slice(0, 200);

  const text = [
    "Nová poptávka z formuláře na tyrs.art/pronajem",
    "",
    ...rows.map(([label, value]) => `${label}: ${value}`),
    "",
    `${labels.message}`,
    enquiry.message,
    "",
    "Odpovědí na tento e-mail odpovíte přímo tazateli.",
  ].join("\n");

  const html = `<!doctype html>
<html lang="cs"><body style="margin:0;padding:24px;background:#f3f1ea;font-family:Helvetica,Arial,sans-serif;color:#000">
<div style="max-width:600px;margin:0 auto;padding:32px;border-radius:16px;background:#fff">
<p style="margin:0 0 20px;font-size:14px;color:#5c5c5c">Nová poptávka z formuláře na tyrs.art/pronajem</p>
<table style="width:100%;border-collapse:collapse;font-size:16px;line-height:24px">
${rows
  .map(
    ([label, value]) =>
      `<tr><th style="text-align:left;vertical-align:top;padding:6px 16px 6px 0;color:#5c5c5c;font-weight:normal;white-space:nowrap">${escapeHtml(label)}</th><td style="padding:6px 0">${escapeHtml(value)}</td></tr>`,
  )
  .join("\n")}
</table>
<p style="margin:24px 0 8px;font-size:14px;color:#5c5c5c">${escapeHtml(labels.message)}</p>
<p style="margin:0;font-size:16px;line-height:24px;white-space:pre-wrap">${escapeHtml(enquiry.message)}</p>
<p style="margin:24px 0 0;font-size:13px;color:#5c5c5c">Odpovědí na tento e-mail odpovíte přímo tazateli.</p>
</div>
</body></html>`;

  return { subject, text, html };
}
