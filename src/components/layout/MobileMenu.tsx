"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import type { Locale } from "@/i18n/locales";
import { Link } from "@/i18n/navigation";
import { formatTime } from "@/lib/dates";
import { t, tSlug } from "@/lib/localize";
import type { LAYOUT_QUERY_RESULT } from "@/sanity/types";

import { LocaleToggle } from "./LocaleSwitch";

type Props = {
  today: LAYOUT_QUERY_RESULT["today"];
  settings: LAYOUT_QUERY_RESULT["settings"];
  newsletterHref: string;
};

/** Full-screen mobile menu, opened by the black "Menu" pill. */
export function MobileMenu({ today, settings, newsletterHref }: Props) {
  const locale = useLocale() as Locale;
  const tr = useTranslations();
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
    document.documentElement.style.overflow = open ? "hidden" : "";
  }, [open]);

  const item = "flex items-baseline justify-between border-t-2 border-black py-3.5 text-black no-underline group";
  const arrow = "text-[28px] leading-7 transition-transform duration-300 ease-roll group-hover:translate-x-1.5";
  const sub = "inline-flex min-h-10 items-center rounded-full border-2 border-black px-4 text-[15px] font-medium no-underline";
  const todaySlug = today ? tSlug(today.slug, locale) : undefined;
  const socials = settings?.socials;
  const address = settings?.address;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label={tr("nav.openMenu")}
        className="inline-flex h-11 cursor-pointer items-center rounded-full bg-black px-5 text-base leading-6 font-medium text-white"
      >
        {tr("nav.menu")}
      </button>

      <dialog
        ref={dialog}
        onClose={() => setOpen(false)}
        onClick={(event) => {
          // Close after following any link inside the menu.
          if ((event.target as HTMLElement).closest("a")) setOpen(false);
        }}
        aria-label={tr("nav.mainMenu")}
        className="m-0 h-dvh max-h-none w-screen max-w-none bg-paper p-0 text-black backdrop:bg-transparent"
      >
        <div className="flex min-h-full flex-col">
          <div className="flex items-center justify-between px-5 py-4">
            <Link href="/" aria-label={tr("nav.homeLabel")} className="inline-flex">
              <Image src="/logos/logo-primary.svg" alt="TYRŠ" width={103} height={34} className="block h-[34px] w-auto" priority />
            </Link>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={tr("nav.closeMenu")}
              className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full bg-black px-[18px] text-base leading-6 font-medium text-white"
            >
              {tr("nav.close")} <span aria-hidden="true" className="text-lg">✕</span>
            </button>
          </div>

          <nav aria-label={tr("nav.mainMenu")} className="flex flex-col px-5 pt-5">
            <Link href="/program" className={item}>
              <span className="font-display text-[52px] leading-[52px]">{tr("nav.program")}</span>
              <span className={arrow} aria-hidden="true">→</span>
            </Link>
            <div className="flex gap-2 pb-4">
              <Link href="/program" className={sub}>{tr("nav.events")}</Link>
              <Link href="/kurzy" className={sub}>{tr("nav.courses")}</Link>
            </div>
            <Link href="/venue" className={item}>
              <span className="font-display text-[52px] leading-[52px]">{tr("nav.venue")}</span>
              <span className={arrow} aria-hidden="true">→</span>
            </Link>
            <Link href="/pronajem" className={`${item} border-b-2`}>
              <span className="font-display text-[52px] leading-[52px]">{tr("nav.rental")}</span>
              <span className={arrow} aria-hidden="true">→</span>
            </Link>
          </nav>

          {today && todaySlug && (
            <section
              aria-label={tr("menu.today")}
              className="mx-5 mt-6 flex items-center justify-between gap-3 rounded-[14px] bg-white px-[18px] py-4"
            >
              <Link href={{ pathname: "/program/[slug]", params: { slug: todaySlug } }} className="flex min-w-0 flex-col gap-0.5 no-underline">
                <span className="text-[13px] leading-4 text-muted">
                  {[tr("menu.today"), formatTime(today.startsAt), t(today.hall, locale)].filter(Boolean).join(" · ")}
                </span>
                <span className="font-display text-2xl leading-[26px]">{t(today.title, locale)}</span>
              </Link>
              {today.ticketUrl && (
                <a
                  href={today.ticketUrl}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex min-h-10 items-center rounded-full bg-lime px-4 text-sm font-medium whitespace-nowrap text-black no-underline"
                >
                  {tr("menu.tickets")}
                </a>
              )}
            </section>
          )}

          <div className="mt-auto flex flex-col gap-5 px-5 pt-8 pb-7">
            <div className="flex gap-5 text-[17px] leading-[26px] font-medium">
              {socials?.instagram && (
                <a href={socials.instagram} target="_blank" rel="noopener" className="no-underline">Instagram</a>
              )}
              {socials?.spotify && (
                <a href={socials.spotify} target="_blank" rel="noopener" className="no-underline">Spotify</a>
              )}
              <a href={newsletterHref} className="no-underline">
                {tr("footer.newsletter")}
              </a>
            </div>
            <div className="flex items-end justify-between gap-3 text-[15px] leading-[22px]">
              {address?.street ? (
                <span>
                  {[address.street, address.city].filter(Boolean).join(", ")}
                  {address.googleMapsUrl && (
                    <>
                      <br />
                      <a href={address.googleMapsUrl} target="_blank" rel="noopener" className="font-medium no-underline">
                        {tr("menu.map")} ↗
                      </a>
                    </>
                  )}
                </span>
              ) : (
                <span />
              )}
              <LocaleToggle label={tr("nav.language")} />
            </div>
          </div>
        </div>
      </dialog>
    </>
  );
}
