/** Rental enquiry form: field names, choices and the state the server action returns. */

export const EVENT_TYPES = ["koncert", "divadlo-tanec", "workshop", "firemni", "nataceni", "oslava", "jine"] as const;
export type EventType = (typeof EVENT_TYPES)[number];

/** Value of the "Ještě nevím" space option. */
export const SPACE_UNKNOWN = "nevim";

export const ENQUIRY_FIELDS = [
  "name",
  "organisation",
  "email",
  "phone",
  "space",
  "type",
  "date",
  "people",
  "message",
  "consent",
] as const;
export type EnquiryField = (typeof ENQUIRY_FIELDS)[number];

export type EnquiryError = "required" | "tooLong" | "email" | "phone" | "date" | "past" | "people" | "choice" | "consent";

export type EnquiryState = {
  status: "idle" | "invalid" | "failed" | "success";
  errors?: Partial<Record<EnquiryField, EnquiryError>>;
  /** What the visitor typed, so the form keeps it after a failed submission. */
  values?: Partial<Record<EnquiryField, string>>;
};

/** URL-friendly key of a space ("Velký sál" → "velky-sal"), used in ?prostor= and the select. */
export function spaceKey(space: { _id: string; name?: { cs?: string | null } | null }): string {
  const fromName = (space.name?.cs ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return fromName || space._id;
}
