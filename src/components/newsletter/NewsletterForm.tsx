"use client";

import { useLocale, useTranslations } from "next-intl";
import { useActionState } from "react";

import { subscribe, type SubscribeState } from "./actions";

/** Email signup (Mailchimp, double opt-in). Replaced by a thank-you note on success. */
export function NewsletterForm({ className = "", dark = false }: { className?: string; dark?: boolean }) {
  const tr = useTranslations("newsletter");
  const locale = useLocale();
  const [state, action, pending] = useActionState<SubscribeState, FormData>(subscribe, { status: "idle" });

  if (state.status === "success" || state.status === "already") {
    return (
      <p role="status" className={`m-0 text-[17px] leading-[26px] font-medium lg:text-lg ${className}`}>
        {tr(state.status)}
      </p>
    );
  }

  return (
    <form action={action} className={`flex flex-col gap-2 ${className}`} noValidate>
      <input type="hidden" name="locale" value={locale} />
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
      <div className="flex gap-2">
        <label className="sr-only" htmlFor="newsletter-email">
          {tr("label")}
        </label>
        <input
          id="newsletter-email"
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder={tr("placeholder")}
          aria-invalid={state.status === "invalid" || undefined}
          className={`min-h-12 min-w-0 flex-1 rounded-full border-2 px-5 text-base outline-none lg:min-h-14 lg:text-lg ${
            dark ? "border-white bg-transparent text-white placeholder:text-white/60" : "border-black bg-white text-black placeholder:text-muted"
          }`}
        />
        <button
          type="submit"
          disabled={pending}
          className={`inline-flex min-h-12 shrink-0 cursor-pointer items-center rounded-full px-5 text-base font-medium disabled:opacity-60 lg:min-h-14 lg:px-7 lg:text-lg ${
            dark ? "bg-white text-black hover:bg-butter" : "bg-black text-white hover:bg-green"
          }`}
        >
          {pending ? tr("sending") : tr("submit")}
        </button>
      </div>
      {(state.status === "invalid" || state.status === "error") && (
        <p role="alert" className="m-0 text-sm leading-5 lg:text-base">
          {tr(state.status)}
        </p>
      )}
    </form>
  );
}
