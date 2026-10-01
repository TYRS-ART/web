"use client";

import { useLocale } from "next-intl";

import { locales, type Locale } from "@/i18n/locales";

import { useLocaleHref } from "./useLocaleHref";

/** Desktop nav "EN" / "CZ": links to the same page in the other language. */
export function LocaleNavLink() {
  const locale = useLocale() as Locale;
  const other = locales.find((l) => l !== locale)!;
  const href = useLocaleHref(other);
  const label = other === "cs" ? "CZ" : "EN";
  return (
    <a href={href} hrefLang={other} lang={other} className="navlink">
      <span className="rl">
        <i data-t={label}>{label}</i>
      </span>
    </a>
  );
}

/** Mobile menu CZ | EN toggle. */
export function LocaleToggle({ label }: { label: string }) {
  const locale = useLocale() as Locale;
  const cs = useLocaleHref("cs");
  const en = useLocaleHref("en");
  const item = (l: Locale, href: string, text: string) => (
    <a
      href={href}
      hrefLang={l}
      aria-current={l === locale ? "true" : undefined}
      className="inline-flex min-h-10 min-w-[52px] items-center justify-center text-[15px] font-medium no-underline aria-[current]:bg-black aria-[current]:text-white"
    >
      {text}
    </a>
  );
  return (
    <div role="group" aria-label={label} className="inline-flex overflow-hidden rounded-full border-2 border-black">
      {item("cs", cs, "CZ")}
      {item("en", en, "EN")}
    </div>
  );
}
