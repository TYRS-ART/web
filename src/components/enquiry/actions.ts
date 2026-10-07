"use server";

import { Resend } from "resend";

import { addDays, pragueDay } from "@/lib/dates";
import { sanityFetch } from "@/sanity/lib/fetch";
import { RENTAL_SPACES_QUERY } from "@/sanity/queries/rental";

import { enquiryEmail } from "./email";
import {
  ENQUIRY_FIELDS,
  EVENT_TYPES,
  SPACE_UNKNOWN,
  spaceKey,
  type EnquiryField,
  type EnquiryState,
  type EventType,
} from "./fields";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = /^\+?[\d\s()./-]+$/;
const DAY = /^\d{4}-\d{2}-\d{2}$/;

const MAX_LENGTH: Partial<Record<EnquiryField, number>> = {
  name: 200,
  organisation: 200,
  email: 254,
  phone: 40,
  message: 5000,
};

/**
 * Validates the rental enquiry and emails it to the booking address via Resend.
 * Without RESEND_API_KEY / ENQUIRY_FROM it reports a failure, and the form points
 * the visitor to the email address instead. It never pretends to have sent anything.
 */
export async function sendEnquiry(_prev: EnquiryState, formData: FormData): Promise<EnquiryState> {
  const values = Object.fromEntries(
    ENQUIRY_FIELDS.map((field) => [field, String(formData.get(field) ?? "").trim()]),
  ) as Record<EnquiryField, string>;
  const locale = formData.get("locale") === "en" ? "en" : "cs";

  // Honeypot: people don't see this field, bots fill it in. Pretend it worked.
  if (formData.get("website")) return { status: "success" };

  const errors: EnquiryState["errors"] = {};
  for (const field of ["email", "type", "date"] as const) {
    if (!values[field]) errors[field] = "required";
  }
  for (const [field, max] of Object.entries(MAX_LENGTH) as [EnquiryField, number][]) {
    if (values[field].length > max) errors[field] = "tooLong";
  }

  if (values.email && !errors.email && !EMAIL.test(values.email)) errors.email = "email";
  if (values.phone && !errors.phone && (!PHONE.test(values.phone) || values.phone.replace(/\D/g, "").length < 6)) {
    errors.phone = "phone";
  }

  const today = pragueDay(new Date());
  if (values.date) {
    const valid = DAY.test(values.date) && !Number.isNaN(Date.parse(`${values.date}T12:00:00Z`));
    if (!valid || values.date > addDays(today, 365 * 5)) errors.date = "date";
    else if (values.date < today) errors.date = "past";
  }

  const people = values.people ? Number(values.people) : undefined;
  if (people !== undefined && !(Number.isInteger(people) && people >= 1 && people <= 100_000)) errors.people = "people";

  if (values.type && !EVENT_TYPES.includes(values.type as EventType)) errors.type = "choice";
  if (values.consent !== "yes") errors.consent = "consent";

  let spaceName = "Ještě nevím";
  if (values.space && values.space !== SPACE_UNKNOWN) {
    const spaces = await sanityFetch({ query: RENTAL_SPACES_QUERY, tags: ["space"], perspective: "published" }).catch(() => []);
    const space = spaces.find((s) => spaceKey(s) === values.space);
    if (space) spaceName = space.name?.cs ?? values.space;
    else errors.space = "choice";
  }

  if (Object.keys(errors).length > 0) return { status: "invalid", errors, values };

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.ENQUIRY_FROM;
  const to = process.env.ENQUIRY_TO || "hello@tyrs.art";
  if (!apiKey || !from) {
    console.error("[enquiry] RESEND_API_KEY or ENQUIRY_FROM is not set; the enquiry was not sent.");
    return { status: "failed", values };
  }

  const { subject, text, html } = enquiryEmail({
    name: values.name,
    organisation: values.organisation,
    email: values.email,
    phone: values.phone,
    space: spaceName,
    type: values.type as EventType,
    date: values.date,
    people,
    message: values.message,
    locale,
  });

  try {
    const { error } = await new Resend(apiKey).emails.send({ from, to, replyTo: values.email, subject, text, html });
    if (error) {
      console.error("[enquiry] Resend refused the email:", error.name, error.message);
      return { status: "failed", values };
    }
  } catch (error) {
    console.error("[enquiry] Sending failed:", error instanceof Error ? error.message : error);
    return { status: "failed", values };
  }

  return { status: "success" };
}
