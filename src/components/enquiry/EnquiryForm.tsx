"use client";

import { useLocale, useTranslations } from "next-intl";
import { useActionState, useEffect, useRef, type ComponentProps, type ReactNode } from "react";

import { Link } from "@/i18n/navigation";

import { sendEnquiry } from "./actions";
import { EVENT_TYPES, SPACE_UNKNOWN, type EnquiryField, type EnquiryState } from "./fields";

const control =
  "box-border block w-full min-h-14 rounded-md border-2 border-black bg-white px-[18px] py-3.5 font-sans text-[17px] leading-6 text-black outline-none aria-invalid:shadow-[0_0_0_2px_#000] lg:min-h-16 lg:rounded-[14px] lg:px-6 lg:py-4 lg:text-xl lg:leading-7";

/** Rental enquiry (server action → email). Replaced by a thank-you note once sent. */
export function EnquiryForm({
  spaces,
  defaultSpace,
  email,
  today,
  className = "",
}: {
  spaces: { key: string; name: string }[];
  defaultSpace?: string;
  email: string;
  /** YYYY-MM-DD in Prague, the earliest date the picker offers. */
  today: string;
  className?: string;
}) {
  const tr = useTranslations("enquiry");
  const locale = useLocale();
  const [state, action, pending] = useActionState<EnquiryState, FormData>(sendEnquiry, { status: "idle" });
  const formRef = useRef<HTMLFormElement>(null);
  const statusRef = useRef<HTMLParagraphElement>(null);

  // Move focus to the result: the thank-you note, or the first field that needs fixing.
  useEffect(() => {
    if (state.status === "success") statusRef.current?.focus();
    if (state.status === "invalid") formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
    if (state.status === "failed") formRef.current?.querySelector<HTMLElement>('[role="alert"]')?.focus();
  }, [state]);

  const mail = (chunks: ReactNode) => (
    <a href={`mailto:${email}`} className="font-medium underline underline-offset-4 hover:text-green">
      {chunks}
    </a>
  );

  if (state.status === "success") {
    return (
      <div className={`box-border rounded-tile bg-white p-6 lg:rounded-card lg:p-12 ${className}`}>
        <p
          ref={statusRef}
          role="status"
          tabIndex={-1}
          className="m-0 font-display text-[30px] leading-8 outline-none lg:text-[48px] lg:leading-[48px]"
        >
          {tr("success")}
        </p>
      </div>
    );
  }

  // React resets the form after each action; the returned values become the new defaults,
  // so the visitor never loses what they typed. Selects only pick up a new default on
  // mount, hence their keys (the space select also follows ?prostor= from the tiles).
  const values = state.values ?? {};
  const errors = state.errors ?? {};

  const field = (name: EnquiryField) => {
    const error = errors[name];
    return {
      id: `enquiry-${name}`,
      name,
      "aria-invalid": error ? true : undefined,
      "aria-describedby": error ? `enquiry-${name}-error` : undefined,
    };
  };

  const errorText = (name: EnquiryField) =>
    errors[name] ? (
      <p id={`enquiry-${name}-error`} className="m-0 flex items-start gap-2 text-sm leading-5 font-medium lg:text-[15px] lg:leading-[22px]">
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" className="mt-px shrink-0 lg:mt-0.5">
          <circle cx="9" cy="9" r="9" fill="currentColor" />
          <path d="M9 4.5v5.5M9 12.5v1" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
        </svg>
        {tr(`errors.${errors[name]}`)}
      </p>
    ) : null;

  const wrap = "flex flex-col gap-2 text-[15px] leading-5 font-medium lg:gap-2.5 lg:text-base lg:leading-5";

  return (
    <form
      ref={formRef}
      action={action}
      noValidate
      aria-label={tr("form")}
      className={`m-0 box-border flex flex-col gap-4 rounded-tile bg-white p-6 lg:grid lg:grid-cols-2 lg:gap-6 lg:rounded-card lg:p-12 ${className}`}
    >
      <input type="hidden" name="locale" value={locale} />
      <div className="hidden" aria-hidden="true">
        <label htmlFor="enquiry-website">{tr("honeypot")}</label>
        <input id="enquiry-website" type="text" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      {state.status === "failed" && (
        <p role="alert" tabIndex={-1} className="m-0 rounded-md bg-butter p-4 text-base leading-6 font-medium outline-none lg:col-span-2 lg:p-5 lg:text-lg lg:leading-7">
          {tr.rich("failed", { email: () => mail(email) })}
        </p>
      )}
      {state.status === "invalid" && (
        <p role="alert" className="m-0 text-base leading-6 font-medium lg:col-span-2 lg:text-lg lg:leading-7">
          {tr("invalid")}
        </p>
      )}

      <div className={wrap}>
        <label htmlFor="enquiry-name">{tr("name")}</label>
        <input {...field("name")} type="text" required maxLength={200} autoComplete="name" defaultValue={values.name} className={control} />
        {errorText("name")}
      </div>
      <div className={wrap}>
        <label htmlFor="enquiry-organisation">{tr("organisation")}</label>
        <input
          {...field("organisation")}
          type="text"
          maxLength={200}
          autoComplete="organization"
          defaultValue={values.organisation}
          className={control}
        />
        {errorText("organisation")}
      </div>
      <div className={wrap}>
        <label htmlFor="enquiry-email">{tr("email")}</label>
        <input {...field("email")} type="email" required maxLength={254} autoComplete="email" defaultValue={values.email} className={control} />
        {errorText("email")}
      </div>
      <div className={wrap}>
        <label htmlFor="enquiry-phone">{tr("phone")}</label>
        <input {...field("phone")} type="tel" required maxLength={40} autoComplete="tel" defaultValue={values.phone} className={control} />
        {errorText("phone")}
      </div>
      <div className={wrap}>
        <label htmlFor="enquiry-space">{tr("space")}</label>
        <Select key={`${defaultSpace}-${values.space}`} {...field("space")} required defaultValue={values.space ?? defaultSpace ?? spaces[0]?.key ?? SPACE_UNKNOWN}>
          {spaces.map((space) => (
            <option key={space.key} value={space.key}>
              {space.name}
            </option>
          ))}
          <option value={SPACE_UNKNOWN}>{tr("spaceUnknown")}</option>
        </Select>
        {errorText("space")}
      </div>
      <div className={wrap}>
        <label htmlFor="enquiry-type">{tr("type")}</label>
        <Select key={values.type} {...field("type")} required defaultValue={values.type ?? EVENT_TYPES[0]}>
          {EVENT_TYPES.map((type) => (
            <option key={type} value={type}>
              {tr(`types.${type}`)}
            </option>
          ))}
        </Select>
        {errorText("type")}
      </div>
      <div className={wrap}>
        <label htmlFor="enquiry-date">{tr("date")}</label>
        <input {...field("date")} type="date" required min={today} defaultValue={values.date} className={control} />
        {errorText("date")}
      </div>
      <div className={wrap}>
        <label htmlFor="enquiry-people">{tr("people")}</label>
        <input
          {...field("people")}
          type="number"
          required
          min={1}
          step={1}
          inputMode="numeric"
          defaultValue={values.people}
          className={control}
        />
        {errorText("people")}
      </div>
      <div className={`${wrap} lg:col-span-2`}>
        <label htmlFor="enquiry-message">{tr("message")}</label>
        <textarea
          {...field("message")}
          required
          rows={4}
          maxLength={5000}
          defaultValue={values.message}
          className={`${control} resize-y lg:min-h-[176px]`}
        />
        {errorText("message")}
      </div>

      <div className="flex flex-col gap-2 lg:col-span-2">
        <label className="flex items-start gap-3 text-sm leading-5 text-muted lg:text-base lg:leading-6">
          <input
              {...field("consent")}
            type="checkbox"
            value="yes"
            required
            defaultChecked={values.consent === "yes"}
            className="m-0 size-[22px] shrink-0 accent-black lg:size-6"
          />
          <span>
            {tr.rich("consent", {
              link: (chunks) => (
                <Link href="/ochrana-soukromi" target="_blank" className="underline underline-offset-4 hover:text-green">
                  {chunks}
                </Link>
              ),
            })}
          </span>
        </label>
        {errorText("consent")}
      </div>

      <div className="flex flex-col gap-4 lg:col-span-2 lg:flex-row lg:items-center lg:gap-6">
        <button
          type="submit"
          disabled={pending}
          className="min-h-[60px] cursor-pointer rounded-full border-0 bg-black px-10 font-sans text-lg leading-6 font-medium text-white hover:bg-green disabled:cursor-wait disabled:opacity-60 lg:min-h-[72px] lg:text-2xl lg:leading-7"
        >
          {pending ? tr("sending") : tr("submit")}
        </button>
        <span className="text-center text-sm leading-5 text-muted lg:text-left lg:text-base lg:leading-6">{tr("replyPromise")}</span>
      </div>
    </form>
  );
}

/** Native select with a custom chevron (Safari ignores padding and height on the native look). */
function Select({ children, ...props }: ComponentProps<"select">) {
  return (
    <span className="relative block">
      <select {...props} className={`${control} cursor-pointer appearance-none pr-12 lg:pr-14`}>
        {children}
      </select>
      <svg
        width="14"
        height="9"
        viewBox="0 0 14 9"
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-5 -translate-y-1/2 lg:right-6"
      >
        <path d="M1 1.5l6 6 6-6" stroke="currentColor" strokeWidth="2" fill="none" />
      </svg>
    </span>
  );
}
