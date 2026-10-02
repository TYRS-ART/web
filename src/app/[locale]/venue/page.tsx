import type { PortableTextBlock } from "@portabletext/react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { MapSection } from "@/components/MapSection";
import { QuoteBand } from "@/components/ui/QuoteBand";
import { FounderTiles } from "@/components/venue/FounderTiles";
import { InfoCards } from "@/components/venue/InfoCards";
import { SectionNav } from "@/components/venue/SectionNav";
import { VenueIntro } from "@/components/venue/VenueIntro";
import type { Locale } from "@/i18n/locales";
import { t } from "@/lib/localize";
import { cleanMetadata } from "@/lib/metadata";
import { nbsp } from "@/lib/typography";
import { sanityFetch } from "@/sanity/lib/fetch";
import { VENUE_QUERY } from "@/sanity/queries/venue";

const getData = () => sanityFetch({ query: VENUE_QUERY, tags: ["venuePage", "person", "settings"] });

export const generateMetadata = cleanMetadata(buildMetadata);

async function buildMetadata({ params }: PageProps<"/[locale]/venue">): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  const [data, tr] = await Promise.all([getData(), getTranslations({ locale, namespace: "venue" })]);
  return { title: tr("title"), description: t(data.page?.statement, locale) };
}

/** Section label in the left column on desktop ("Kdo", "Jak"), above the content on mobile. */
const sectionLabel = "font-display text-[56px] leading-[52px] lg:col-span-2 lg:text-[96px] lg:leading-[88px]";
const sectionGrid = "flex flex-col px-5 lg:grid lg:grid-cols-12 lg:gap-8 lg:px-16";

export default async function VenuePage({ params }: PageProps<"/[locale]/venue">) {
  const locale = (await params).locale as Locale;
  setRequestLocale(locale);
  const [data, tr] = await Promise.all([getData(), getTranslations("venue")]);

  const page = data.page;
  const statement = t(page?.statement, locale);
  const intro = t(page?.intro, locale) as PortableTextBlock[] | undefined;
  const founders = (page?.founders ?? []).filter((f) => f?._id && f.name);
  const motto = t(page?.motto, locale);
  const cards = page?.infoCards ?? [];
  const address = data.settings?.address;

  const hasWho = Boolean(statement || intro?.length || founders.length);
  const hasWhere = Boolean(address?.street);
  const hasHow = cards.some((card) => t(card.headline, locale) || t(card.body, locale));

  const sections = [
    hasWho && { id: "kdo", title: tr("who") },
    hasWhere && { id: "kde", title: tr("where") },
    hasHow && { id: "jak", title: tr("how") },
  ].filter((s): s is { id: string; title: string } => Boolean(s));

  return (
    <>
      <SectionNav label={tr("sections")} sections={sections} />

      {!statement && <h1 className="sr-only">{tr("title")}</h1>}

      {hasWho && (
        <section id="kdo" aria-label={tr("who")} className={`${sectionGrid} gap-6 pt-8 lg:pt-12`}>
          <span aria-hidden="true" className={sectionLabel}>
            {tr("who")}
          </span>
          <div className="flex flex-col gap-6 lg:col-span-10 lg:gap-12">
            {statement && (
              <h1 className="m-0 font-display text-[44px] leading-[42px] lg:text-[112px] lg:leading-[100px]">{nbsp(statement)}</h1>
            )}
            {intro && intro.length > 0 && <VenueIntro value={intro} />}
            <FounderTiles founders={founders} locale={locale} label={tr("founders")} />
          </div>
        </section>
      )}

      {motto && (
        <QuoteBand text={motto} label={tr("motto")} locale={locale} size="motto" className="mt-12 lg:mt-28" />
      )}

      <MapSection
        id="kde"
        variant="venue"
        address={address}
        mapImage={data.settings?.mapImage}
        locale={locale}
        title={tr("address")}
        heading={tr("where")}
        className={motto ? "" : "mt-12 lg:mt-28"}
      />

      {hasHow && (
        <section id="jak" aria-labelledby="jak-title" className={`${sectionGrid} gap-3 pt-14 lg:pt-28`}>
          <h2 id="jak-title" className={`m-0 mb-2 lg:mb-0 ${sectionLabel}`}>
            {tr("how")}
          </h2>
          <div className="lg:col-span-10">
            <InfoCards cards={cards} locale={locale} />
          </div>
        </section>
      )}
    </>
  );
}
