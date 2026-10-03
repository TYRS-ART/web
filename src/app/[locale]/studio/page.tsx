import type { PortableTextBlock } from "@portabletext/react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { CollaboratorList } from "@/components/studio/CollaboratorList";
import { buttonClass } from "@/components/ui/button";
import { QuoteBand } from "@/components/ui/QuoteBand";
import { InfoCards } from "@/components/venue/InfoCards";
import { VenueIntro } from "@/components/venue/VenueIntro";
import type { Locale } from "@/i18n/locales";
import { getPathname, Link } from "@/i18n/navigation";
import { t } from "@/lib/localize";
import { cleanMetadata } from "@/lib/metadata";
import { nbsp } from "@/lib/typography";
import { sanityFetch } from "@/sanity/lib/fetch";
import { STUDIO_QUERY } from "@/sanity/queries/studio";

const getData = () => sanityFetch({ query: STUDIO_QUERY, tags: ["studioPage"] });

export const generateMetadata = cleanMetadata(buildMetadata);

async function buildMetadata({ params }: PageProps<"/[locale]/studio">): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  const tr = await getTranslations({ locale, namespace: "studio" });
  const path = (l: Locale) => getPathname({ href: "/studio", locale: l });
  return {
    title: tr("title"),
    description: tr("metaDescription"),
    alternates: { canonical: path(locale), languages: { cs: path("cs"), en: path("en") } },
  };
}

/**
 * Studio: the recording studio pitch. Headline + contact, intro, the engineers and
 * producers we work with, what we offer (hire, collaboration) and an optional motto.
 * Everything comes from Sanity ("Stránka Studio"); empty parts are left out.
 */
export default async function StudioPage({ params }: PageProps<"/[locale]/studio">) {
  const locale = (await params).locale as Locale;
  setRequestLocale(locale);
  const [data, tr] = await Promise.all([getData(), getTranslations("studio")]);

  const page = data.page;
  const headline = t(page?.headline, locale) ?? tr("title");
  const intro = t(page?.intro, locale) as PortableTextBlock[] | undefined;
  const people = (page?.collaborators ?? []).filter((p) => p.name);
  const cards = page?.offerCards ?? [];
  const hasOffer = cards.some((card) => t(card.headline, locale) || t(card.body, locale));
  const motto = t(page?.motto, locale);

  return (
    <>
      <section className="flex flex-col gap-5 px-5 pt-6 lg:grid lg:grid-cols-12 lg:items-end lg:gap-8 lg:px-16 lg:pt-12">
        <h1 className="m-0 font-display text-[56px] leading-[52px] lg:col-span-9 lg:text-[128px] lg:leading-[112px]">
          {nbsp(headline)}
        </h1>
        <div className="flex flex-col items-start gap-5 lg:col-span-3">
          <Link href={{ pathname: "/pronajem", query: { typ: "studio" }, hash: "poptavka" }} className={buttonClass("primary")}>
            {tr("contact")} <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      {intro && intro.length > 0 && (
        <section className="px-5 pt-8 lg:grid lg:grid-cols-12 lg:gap-8 lg:px-16 lg:pt-14">
          <div className="lg:col-span-9">
            <VenueIntro value={intro} />
          </div>
        </section>
      )}

      {people.length > 0 && (
        <section
          aria-labelledby="spoluprace-title"
          className="mx-3 mt-10 flex flex-col gap-4 rounded-tile bg-white p-5 lg:mx-6 lg:mt-16 lg:gap-8 lg:rounded-card lg:p-10"
        >
          <h2 id="spoluprace-title" className="m-0 text-[15px] leading-5 font-medium text-muted lg:text-lg lg:leading-6">
            {tr("collaborators")}
          </h2>
          <CollaboratorList people={people} websiteLabel={tr("website")} />
        </section>
      )}

      {hasOffer && (
        <section aria-labelledby="nabidka-title" className="flex flex-col gap-4 px-3 pt-14 lg:gap-8 lg:px-6 lg:pt-28">
          <h2 id="nabidka-title" className="m-0 px-2 font-display text-[56px] leading-[52px] lg:px-10 lg:text-8xl lg:leading-[88px]">
            {tr("offer")}
          </h2>
          <InfoCards cards={cards} locale={locale} />
        </section>
      )}

      {motto && <QuoteBand text={motto} label={tr("motto")} locale={locale} size="motto" className="mt-12 lg:mt-28" />}
    </>
  );
}
