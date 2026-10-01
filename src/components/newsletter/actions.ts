"use server";

import { createHash } from "node:crypto";

export type SubscribeState = { status: "idle" | "success" | "already" | "invalid" | "error" };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Whether Mailchimp is configured. Without it the signup form is not shown. */
export async function newsletterEnabled() {
  return Boolean(process.env.MAILCHIMP_API_KEY && process.env.MAILCHIMP_AUDIENCE_ID);
}

/** Adds the address to the Mailchimp audience with double opt-in ("pending"). */
export async function subscribe(_prev: SubscribeState, formData: FormData): Promise<SubscribeState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const language = formData.get("locale") === "en" ? "en" : "cs";
  // Honeypot: bots fill every field.
  if (formData.get("website")) return { status: "success" };
  if (!EMAIL.test(email)) return { status: "invalid" };

  const apiKey = process.env.MAILCHIMP_API_KEY;
  const audience = process.env.MAILCHIMP_AUDIENCE_ID;
  if (!apiKey || !audience) return { status: "error" };
  const dc = apiKey.split("-").pop();
  const hash = createHash("md5").update(email).digest("hex");

  try {
    const response = await fetch(`https://${dc}.api.mailchimp.com/3.0/lists/${audience}/members/${hash}`, {
      method: "PUT",
      headers: {
        Authorization: `Basic ${Buffer.from(`tyrs:${apiKey}`).toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email_address: email, status_if_new: "pending", language }),
      cache: "no-store",
    });
    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as { title?: string };
      if (body.title === "Invalid Resource") return { status: "invalid" };
      return { status: "error" };
    }
    const member = (await response.json()) as { status?: string };
    return { status: member.status === "subscribed" ? "already" : "success" };
  } catch {
    return { status: "error" };
  }
}
