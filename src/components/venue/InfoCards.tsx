import type { ReactNode } from "react";

import type { Locale } from "@/i18n/locales";
import { Link } from "@/i18n/navigation";
import { routing, type AppPathname } from "@/i18n/routing";
import { t } from "@/lib/localize";
import { nbsp } from "@/lib/typography";
import type { VENUE_QUERY_RESULT } from "@/sanity/types";

type Card = NonNullable<NonNullable<VENUE_QUERY_RESULT["page"]>["infoCards"]>[number];

type StaticPathname = Exclude<AppPathname, `${string}[${string}`>;

/** "/pronajem" → the localized route (so English visitors land on /en/rental). */
function internalRoute(href: string): StaticPathname | undefined {
  const path = href.replace(/[?#].*$/, "").replace(/\/$/, "") || "/";
  return (Object.keys(routing.pathnames) as AppPathname[]).find(
    (key): key is StaticPathname => !key.includes("[") && key === path,
  );
}

function CardLink({ href, className, children }: { href: string; className: string; children: ReactNode }) {
  const route = internalRoute(href);
  if (route) {
    const hash = href.split("#")[1];
    return (
      <Link href={hash ? { pathname: route, hash } : route} className={className}>
        {children}
      </Link>
    );
  }
  const external = /^https?:/.test(href);
  return (
    <a href={href} className={className} {...(external ? { target: "_blank", rel: "noopener" } : {})}>
      {children}
    </a>
  );
}

/** "Jak" info cards: small title, display headline, text and an optional link. Highlighted ones are butter. */
export function InfoCards({ cards, locale }: { cards: Card[]; locale: Locale }) {
  const items = cards
    .map((card) => ({
      key: card._key,
      title: t(card.title, locale),
      headline: t(card.headline, locale),
      body: t(card.body, locale),
      linkLabel: t(card.link?.label, locale),
      href: card.link?.href,
      highlight: Boolean(card.highlight),
    }))
    .filter((card) => card.headline || card.body);
  if (items.length === 0) return null;

  return (
    <div className={`flex flex-col gap-3 lg:grid lg:gap-4 ${items.length === 2 ? "lg:grid-cols-2" : "lg:grid-cols-3"}`}>
      {items.map((card) => {
        const headlineClass = "font-display text-[26px] leading-7 lg:text-[32px] lg:leading-[34px]";
        // A link whose text is the headline itself (e.g. the contact email) turns the headline into the link.
        const headlineIsLink = Boolean(card.href && card.headline && card.linkLabel?.replace(/\s*→$/, "") === card.headline);
        return (
          <div
            key={card.key}
            className={`box-border flex flex-col gap-1.5 rounded-[14px] p-5 lg:min-h-[220px] lg:gap-2.5 lg:rounded-[20px] lg:p-8 ${
              card.highlight ? "bg-butter text-black" : "bg-white"
            }`}
          >
            {card.title && <h3 className="m-0 text-sm leading-5 font-normal text-muted lg:text-lg lg:leading-6">{card.title}</h3>}
            {card.headline &&
              (headlineIsLink ? (
                <CardLink href={card.href!} className={`${headlineClass} break-words text-black no-underline hover:text-green`}>
                  {card.headline}
                </CardLink>
              ) : (
                <p className={`m-0 ${headlineClass}`}>{nbsp(card.headline)}</p>
              ))}
            {card.body && <p className="m-0 text-[15px] leading-[22px] text-muted lg:text-base lg:leading-6">{nbsp(card.body)}</p>}
            {card.href && card.linkLabel && !headlineIsLink && (
              <CardLink
                href={card.href}
                className="self-start text-[15px] leading-[22px] font-medium underline underline-offset-2 hover:text-green lg:text-base lg:leading-6"
              >
                {card.linkLabel}
              </CardLink>
            )}
          </div>
        );
      })}
    </div>
  );
}
