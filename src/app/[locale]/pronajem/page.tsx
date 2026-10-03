import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { EnquiryForm } from "@/components/enquiry/EnquiryForm";
import { SPACE_UNKNOWN, spaceKey } from "@/components/enquiry/fields";
import { IncludedBand } from "@/components/rental/IncludedBand";
import { SpaceTile } from "@/components/rental/SpaceTile";
import { buttonClass } from "@/components/ui/button";
import { QuoteBand } from "@/components/ui/QuoteBand";
import type { Locale } from "@/i18n/locales";
import { pragueDay } from "@/lib/dates";
import { cleanMetadata } from "@/lib/metadata";
import { t } from "@/lib/localize";
import { nbsp } from "@/lib/typography";
import { sanityFetch } from "@/sanity/lib/fetch";
import { RENTAL_QUERY } from "@/sanity/queries/rental";

/** Confirmed booking address (BRIEF §11), used when Settings has no email. */
const CONTACT_EMAIL = "hello@tyrs.art";

const getData = () => sanityFetch({ query: RENTAL_QUERY, tags: ["rentalPage", "space", "settings"] });

export const generateMetadata = cleanMetadata(buildMetadata);

async function buildMetadata({ params }: PageProps<"/[locale]/pronajem">): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  const [data, tr] = await Promise.all([getData(), getTranslations({ locale, namespace: "rental" })]);
  return {
    title: tr("title"),
    description: t(data.page?.intro, locale) ?? t(data.page?.headline, locale),
  };
}

export default async function RentalPage({ params, searchParams }: PageProps<"/[locale]/pronajem">) {
  const locale = (await params).locale as Locale;
  setRequestLocale(locale);
  const [data, tr, query] = await Promise.all([getData(), getTranslations("rental"), searchParams]);

  const page = data.page;
  const email = data.email || CONTACT_EMAIL;
  const headline = t(page?.headline, locale) ?? tr("title");
  const intro = t(page?.intro, locale);
  const formIntro = t(page?.formIntro, locale);
  const quote = t(page?.quote?.text, locale);
  const cite = [page?.quote?.author, page?.quote?.organisation].filter(Boolean).join(", ");

  const spaces = data.spaces.filter((space) => t(space.name, locale));
  const options = spaces.map((space) => ({ key: spaceKey(space), name: t(space.name, locale)! }));
  // ?prostor=velky-sal (from a space tile) preselects that space in the form.
  const requested = typeof query.prostor === "string" ? query.prostor : undefined;
  const defaultSpace =
    requested && (requested === SPACE_UNKNOWN || options.some((o) => o.key === requested)) ? requested : undefined;

  const mail = (
    <a href={`mailto:${email}`} className="font-medium text-black hover:text-green">
      {email}
    </a>
  );

  return (
    <>
      <section className="flex flex-col gap-5 px-5 pt-6 lg:grid lg:grid-cols-12 lg:items-end lg:gap-8 lg:px-16 lg:pt-12">
        <h1 className="m-0 font-display text-[56px] leading-[52px] lg:col-span-9 lg:text-[128px] lg:leading-[112px]">
          {nbsp(headline)}
        </h1>
        <div className="flex flex-col items-start gap-5 lg:col-span-3">
          {intro && <p className="m-0 text-[17px] leading-[26px] text-muted lg:text-xl lg:leading-[30px]">{nbsp(intro)}</p>}
          <a href="#poptavka" className={buttonClass("primary")}>
            {tr("enquire")}
          </a>
        </div>
      </section>

      {spaces.length > 0 && (
        <section
          id="prostory"
          aria-labelledby="prostory-title"
          className="mx-3 mt-10 flex flex-col gap-2.5 rounded-tile bg-white p-4 lg:mx-6 lg:mt-16 lg:grid lg:grid-cols-2 lg:gap-4 lg:rounded-card lg:p-8"
        >
          <div className="flex items-center justify-between pb-1 lg:col-span-2 lg:pb-2">
            <h2 id="prostory-title" className="m-0 text-[15px] leading-5 font-medium text-muted lg:text-lg lg:leading-6">
              {tr("spaces")}
            </h2>
            <span className="text-lg leading-6 text-muted max-lg:hidden">{tr("spacesHint")}</span>
          </div>
          {spaces.map((space, i) => (
            <SpaceTile
              key={space._id}
              space={space}
              locale={locale}
              // An odd last tile takes the full row on desktop.
              className={i === spaces.length - 1 && spaces.length % 2 === 1 ? "lg:col-span-2" : ""}
            />
          ))}
        </section>
      )}

      <IncludedBand items={page?.included ?? []} locale={locale} label={tr("included")} />

      <section
        id="poptavka"
        aria-labelledby="poptavka-title"
        className="flex flex-col gap-5 px-5 pt-16 lg:grid lg:grid-cols-12 lg:gap-8 lg:px-16 lg:pt-28"
      >
        <div className="flex flex-col gap-5 lg:col-span-4 lg:gap-6">
          <h2 id="poptavka-title" className="m-0 font-display text-[60px] leading-[56px] lg:text-[112px] lg:leading-[100px]">
            {tr("enquire")}
          </h2>
          <p className={`m-0 text-[17px] leading-[26px] text-muted lg:text-xl lg:leading-[30px] ${formIntro ? "" : "lg:hidden"}`}>
            {formIntro && <>{nbsp(formIntro)} </>}
            <span className="lg:hidden">{tr.rich("orDirectInline", { email: () => mail })}</span>
          </p>
          <p className="m-0 font-display text-4xl leading-[38px] max-lg:hidden">
            {tr("orDirect")}
            <br />
            <a href={`mailto:${email}`} className="hover:text-green">
              {email}
            </a>
          </p>
        </div>
        <EnquiryForm
          spaces={options}
          defaultSpace={defaultSpace}
          email={email}
          today={pragueDay(new Date())}
          className="lg:col-span-8"
        />
      </section>

      {quote && (
        <QuoteBand
          text={quote}
          cite={cite || undefined}
          label={tr("reference")}
          locale={locale}
          size="quote"
          className="mt-14 lg:mt-28"
        />
      )}
    </>
  );
}
