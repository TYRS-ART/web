import type { PortableTextBlock } from "@portabletext/react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { cache } from "react";

import { BackLink } from "@/components/detail/BackLink";
import { Badge, DetailHero } from "@/components/detail/DetailHero";
import { BandNote, bandCommitClass, bandOutlineClass, InfoBand, type InfoItem } from "@/components/detail/InfoBand";
import { Lead, RichText } from "@/components/detail/RichText";
import { ShareButtons } from "@/components/detail/ShareButtons";
import { ButterCard, cardButtonClass, GoodToKnowCard, LinksCard, SpotifyIcon } from "@/components/detail/SideCards";
import { StickyBar, stickyActionClass } from "@/components/detail/StickyBar";
import { EventTile } from "@/components/events/EventTile";
import { SetAlternates } from "@/components/layout/AlternateLinks";
import { buttonClass } from "@/components/ui/button";
import { CategoryChip } from "@/components/ui/CategoryChip";
import type { Locale } from "@/i18n/locales";
import { getPathname, Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { formatShortDate, formatTime, pragueDayRange } from "@/lib/dates";
import { eventIcsPath } from "@/lib/event-ics";
import { headlinePrice } from "@/lib/events";
import { t, tSlug } from "@/lib/localize";
import { roundedNow } from "@/lib/program";
import { siteUrl } from "@/lib/site";
import { nbsp } from "@/lib/typography";
import { sanityFetch } from "@/sanity/lib/fetch";
import { urlFor } from "@/sanity/lib/image";
import { EVENT_QUERY, EVENT_SLUGS_QUERY, RELATED_EVENTS_QUERY } from "@/sanity/queries/program";
import type { EVENT_QUERY_RESULT } from "@/sanity/types";

type EventDoc = NonNullable<EVENT_QUERY_RESULT["event"]>;

function nowParams() {
  const { now, today } = roundedNow();
  return { now: now.toISOString(), ...pragueDayRange(today) };
}

const getEvent = cache(async (slug: string, locale: Locale) =>
  sanityFetch({ query: EVENT_QUERY, params: { slug: decodeURIComponent(slug), locale }, tags: ["event", "settings", "space"] }),
);

/** Upcoming events are prerendered in both languages; the rest render on first visit. */
export async function generateStaticParams({ params }: { params: { locale: string } }) {
  const locale = params.locale as Locale;
  if (!routing.locales.includes(locale)) return [];
  const slugs = await sanityFetch({ query: EVENT_SLUGS_QUERY, params: nowParams(), tags: ["event"] });
  return slugs.flatMap((s) => (s[locale] ? [{ slug: s[locale] }] : []));
}

/** Path of the event page in each language, for hreflang and the language switch. */
function eventPaths(event: EventDoc) {
  return Object.fromEntries(
    routing.locales.map((l) => {
      const slug = tSlug(event.slug, l);
      return [l, slug ? getPathname({ href: { pathname: "/program/[slug]", params: { slug } }, locale: l }) : undefined];
    }),
  ) as Record<Locale, string | undefined>;
}

function ogImage(event: EventDoc) {
  if (!event.heroImage?.asset) return undefined;
  return urlFor(event.heroImage as Parameters<typeof urlFor>[0]).width(1200).height(630).fit("crop").url();
}

export async function generateMetadata({ params }: PageProps<"/[locale]/program/[slug]">): Promise<Metadata> {
  const { locale: l, slug } = await params;
  const locale = l as Locale;
  const { event } = await getEvent(slug, locale);
  if (!event) return {};
  const title = t(event.title, locale);
  const description = t(event.lead, locale);
  const paths = eventPaths(event);
  const image = ogImage(event);
  return {
    title,
    description,
    alternates: {
      canonical: paths[locale],
      languages: Object.fromEntries(Object.entries(paths).filter(([, path]) => path)),
    },
    openGraph: {
      type: "website",
      title,
      description,
      url: paths[locale],
      locale: locale === "cs" ? "cs_CZ" : "en_GB",
      images: image ? [{ url: image, width: 1200, height: 630, alt: title }] : undefined,
    },
  };
}

/** "390 Kč" / "CZK 390" → 390 */
function priceNumber(price: string | undefined) {
  const match = price?.replace(/\s/g, "").match(/\d+(?:[.,]\d+)?/);
  return match ? Number(match[0].replace(",", ".")) : undefined;
}

export default async function EventPage({ params }: PageProps<"/[locale]/program/[slug]">) {
  const { locale: l, slug } = await params;
  const locale = l as Locale;
  setRequestLocale(locale);

  const { event, settings } = await getEvent(slug, locale);
  if (!event) notFound();

  const [related, tr] = await Promise.all([
    sanityFetch({ query: RELATED_EVENTS_QUERY, params: { id: event._id, ...nowParams() }, tags: ["event"] }),
    getTranslations(),
  ]);

  const title = t(event.title, locale) ?? "";
  const category = event.categories?.[0];
  const hall = t(event.hall, locale);
  const address = settings?.address;
  const priceText = t(event.priceText, locale);
  const [firstPrice, ...otherPrices] = (priceText ?? "").split("·").map((p) => p.trim()).filter(Boolean);
  const ticketPrice = headlinePrice(priceText);
  const lead = t(event.lead, locale);
  const body = t(event.body, locale) as PortableTextBlock[] | undefined;
  const goodToKnow = (event.goodToKnow ?? []).map((item) => t(item, locale)).filter((item): item is string => Boolean(item));
  const capacity = t(event.capacityNote, locale);
  const paths = eventPaths(event);
  const localSlug = tSlug(event.slug, locale) ?? slug;
  const date = formatShortDate(event.startsAt, locale);
  const time = formatTime(event.startsAt);
  const words = { today: tr("common.today"), tomorrow: tr("common.tomorrow") };

  // "Další akce": same category first, then the nearest.
  const shared = (e: (typeof related)[number]) => e.categories?.some((c) => event.categories?.includes(c));
  const more = [...related.filter(shared), ...related.filter((e) => !shared(e))].slice(0, 3);

  const items: InfoItem[] = [
    {
      label: tr("event.when"),
      value: (
        <>
          {date}
          <br />
          {time}
        </>
      ),
    },
  ];
  if (event.doorsAt) items.push({ label: tr("event.doors"), value: formatTime(event.doorsAt) });
  items.push({
    label: tr("event.where"),
    value: hall ?? tr("event.venue"),
    sub: address?.street ? (
      <Link href="/venue" className="text-white underline underline-offset-4 hover:text-lime">
        {address.street}
      </Link>
    ) : undefined,
  });
  if (firstPrice) items.push({ label: tr("event.price"), value: firstPrice, sub: otherPrices.join(" · ") || undefined });

  const ticketLabel = ticketPrice ? tr("event.ticketsWithPrice", { price: ticketPrice }) : tr("event.tickets");
  const listen = [
    event.links?.spotify && (
      <a key="spotify" href={event.links.spotify} target="_blank" rel="noopener" className={`${cardButtonClass.base} ${cardButtonClass.green}`}>
        <SpotifyIcon />
        Spotify
      </a>
    ),
    event.links?.website && (
      <a key="web" href={event.links.website} target="_blank" rel="noopener" className={`${cardButtonClass.base} ${cardButtonClass.outline}`}>
        {tr("detail.website")} <span aria-hidden="true">↗</span>
      </a>
    ),
  ].filter(Boolean);

  const image = ogImage(event);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: title,
    startDate: event.startsAt,
    ...(event.endsAt ? { endDate: event.endsAt } : {}),
    ...(event.doorsAt ? { doorTime: event.doorsAt } : {}),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    inLanguage: locale,
    url: paths[locale] ? `${siteUrl}${paths[locale]}` : undefined,
    ...(lead ? { description: lead } : {}),
    ...(image ? { image: [image] } : {}),
    location: {
      "@type": "Place",
      name: hall ? `${hall}, TYRŠ` : "TYRŠ",
      ...(address?.street
        ? {
            address: {
              "@type": "PostalAddress",
              streetAddress: address.street,
              addressLocality: address.city,
              postalCode: address.postalCode,
              addressCountry: "CZ",
            },
          }
        : {}),
    },
    organizer: { "@type": "Organization", name: "TYRŠ", url: siteUrl },
    ...(event.ticketUrl
      ? {
          offers: {
            "@type": "Offer",
            url: event.ticketUrl,
            ...(priceNumber(ticketPrice) !== undefined ? { price: priceNumber(ticketPrice), priceCurrency: "CZK" } : {}),
          },
        }
      : {}),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <SetAlternates cs={paths.cs} en={paths.en} />

      <BackLink href="/program" label={tr("event.back")} ariaLabel={tr("detail.breadcrumb")} />

      <DetailHero
        image={event.heroImage}
        title={title}
        label={tr("event.photo")}
        fallbackClass={`cl cl-${category}`}
        badges={
          <>
            {hall && <Badge>{hall}</Badge>}
            {event.categories?.map((c) => <CategoryChip key={c} category={c} locale={locale} />)}
          </>
        }
      />

      <InfoBand
        label={tr("event.info")}
        items={items}
        actions={
          <>
            {event.ticketUrl && (
              <a href={event.ticketUrl} target="_blank" rel="noopener" className={bandCommitClass}>
                {ticketLabel}
              </a>
            )}
            <a href={eventIcsPath(localSlug, locale)} download className={bandOutlineClass}>
              {tr("detail.addToCalendar")}
            </a>
            {capacity && <BandNote>{nbsp(capacity)}</BandNote>}
          </>
        }
      />

      <section className="flex flex-col gap-5 px-5 pt-12 lg:grid lg:grid-cols-12 lg:items-start lg:gap-8 lg:px-16 lg:pt-24">
        {(lead || (body && body.length > 0)) && (
          <article className="flex flex-col gap-5 lg:col-span-8 lg:gap-7">
            {lead && <Lead>{nbsp(lead)}</Lead>}
            {body && body.length > 0 && <RichText value={body} />}
          </article>
        )}
        <aside className="flex flex-col gap-5 lg:col-span-4 lg:col-start-9 lg:gap-4">
          <GoodToKnowCard title={tr("detail.goodToKnow")} items={goodToKnow} />
          <LinksCard
            groups={[
              ...(listen.length > 0 ? [{ label: tr("detail.listen"), content: <>{listen}</> }] : []),
              { label: tr("detail.share"), content: <ShareButtons title={title} /> },
            ]}
          />
          <div className="max-lg:hidden">
            <ButterCard href="/pronajem" kicker={tr("event.rentalKicker")} title={tr("event.rentalTitle")} />
          </div>
        </aside>
      </section>

      {more.length > 0 && (
        <section
          aria-labelledby="dalsi-akce"
          className="mx-3 mt-12 flex flex-col gap-4 rounded-tile bg-white p-4 lg:mx-6 lg:mt-24 lg:gap-8 lg:rounded-card lg:p-8"
        >
          <div className="flex items-end justify-between gap-4 px-1 lg:px-2">
            <h2 id="dalsi-akce" className="m-0 font-display text-[56px] leading-[52px] lg:text-[120px] lg:leading-[104px]">
              {tr("event.more")}
            </h2>
            <Link href="/program" className="text-[15px] font-medium whitespace-nowrap text-muted no-underline hover:text-black lg:hidden">
              {tr("event.allProgram")} →
            </Link>
            <Link href="/program" className={`${buttonClass("primary", "lg")} max-lg:hidden`}>
              {tr("event.allProgram")} →
            </Link>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {more.map((e, i) => (
              <EventTile
                key={e._id}
                event={e}
                locale={locale}
                words={words}
                size="m"
                mobileSize="m"
                className={`h-[260px] lg:h-[460px] ${i === 2 ? "max-lg:hidden" : ""}`}
                sizes="(min-width: 1024px) 33vw, 100vw"
              />
            ))}
          </div>
        </section>
      )}

      {event.ticketUrl && (
        <StickyBar
          meta={`${date} · ${time}`}
          title={title}
          action={
            <a href={event.ticketUrl} target="_blank" rel="noopener" className={stickyActionClass}>
              {ticketLabel}
            </a>
          }
        />
      )}
    </>
  );
}
