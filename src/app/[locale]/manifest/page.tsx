import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";

import { QuoteBand } from "@/components/ui/QuoteBand";
import type { Locale } from "@/i18n/locales";
import { getPathname } from "@/i18n/navigation";
import { t } from "@/lib/localize";
import { cleanMetadata } from "@/lib/metadata";
import { nbsp } from "@/lib/typography";
import { sanityFetch } from "@/sanity/lib/fetch";
import { MANIFESTO_QUERY } from "@/sanity/queries/manifesto";
import type { MANIFESTO_QUERY_RESULT } from "@/sanity/types";

type Section = NonNullable<NonNullable<MANIFESTO_QUERY_RESULT>["sections"]>[number];

const getData = () => sanityFetch({ query: MANIFESTO_QUERY, tags: ["manifestoPage"] });

export const generateMetadata = cleanMetadata(buildMetadata);

async function buildMetadata({ params }: PageProps<"/[locale]/manifest">): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  const tr = await getTranslations({ locale, namespace: "manifesto" });
  const path = (l: Locale) => getPathname({ href: "/manifest", locale: l });
  return {
    title: tr("title"),
    description: tr("metaDescription"),
    alternates: { canonical: path(locale), languages: { cs: path("cs"), en: path("en") } },
  };
}

const statementSize = {
  xl: "text-[56px] leading-[52px] lg:text-[144px] lg:leading-[128px]",
  l: "text-[40px] leading-[42px] lg:text-[88px] lg:leading-[84px]",
  m: "text-[30px] leading-[34px] lg:text-[56px] lg:leading-[60px]",
} as const;

/** Page gutter, as on the other pages. */
const gutter = "px-5 lg:px-16";

const paragraphs = (text: string) => text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

function Block({ section, locale, quoteLabel }: { section: Section; locale: Locale; quoteLabel: string }) {
  const text = t(section.text as never, locale) as string | undefined;
  switch (section._type) {
    case "mHeading":
      return text ? (
        <h2 className={`${gutter} m-0`}>
          <span className="block border-t-2 border-black pt-6 font-display text-[56px] leading-[52px] lg:pt-10 lg:text-8xl lg:leading-[88px]">
            {nbsp(text)}
          </span>
        </h2>
      ) : null;
    case "mText":
      return text ? (
        <div
          className={`${gutter} flex flex-col gap-4 lg:gap-6 ${
            section.size === "lead"
              ? "max-w-[1180px] text-[22px] leading-[32px] lg:text-[36px] lg:leading-[48px]"
              : "max-w-[1000px] text-[17px] leading-[26px] text-muted lg:text-2xl lg:leading-9"
          }`}
        >
          {paragraphs(text).map((p, i) => (
            <p key={i} className="m-0">
              {nbsp(p)}
            </p>
          ))}
        </div>
      ) : null;
    case "mStatement":
      return text ? (
        <p
          className={`${gutter} m-0 font-display whitespace-pre-line ${statementSize[(section.size as keyof typeof statementSize) ?? "l"] ?? statementSize.l} ${
            section.muted ? "text-muted" : ""
          }`}
        >
          {nbsp(text)}
        </p>
      ) : null;
    case "mPillars": {
      const items = (section.items ?? []).filter((item) => t(item.title, locale));
      if (items.length === 0) return null;
      return (
        <ol className="mx-3 my-0 flex list-none flex-col rounded-tile bg-white p-5 lg:mx-6 lg:rounded-card lg:p-10">
          {items.map((item, i) => (
            <li
              key={item._key}
              className={`flex flex-col gap-2 border-t-2 border-black py-5 lg:grid lg:grid-cols-[96px_minmax(0,5fr)_minmax(0,7fr)] lg:items-baseline lg:gap-8 lg:py-8 ${
                i === items.length - 1 ? "border-b-2" : ""
              }`}
            >
              <span aria-hidden="true" className="font-display text-xl leading-6 text-muted tabular-nums lg:text-[32px] lg:leading-9">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="m-0 font-display text-[32px] leading-[34px] font-medium lg:text-[56px] lg:leading-[56px]">
                {nbsp(t(item.title, locale)!)}
              </h3>
              {t(item.text, locale) && (
                <p className="m-0 text-[17px] leading-[26px] text-muted lg:text-2xl lg:leading-9">{nbsp(t(item.text, locale)!)}</p>
              )}
            </li>
          ))}
        </ol>
      );
    }
    case "mQuote":
      return text ? <QuoteBand text={text} label={quoteLabel} locale={locale} size="motto" marks={false} /> : null;
    case "mWords":
      return text ? (
        section.band ? (
          <p className={`m-0 bg-black py-12 font-display text-[36px] leading-[40px] text-white lg:py-24 lg:text-[80px] lg:leading-[84px] ${gutter}`}>
            {nbsp(text)}
          </p>
        ) : (
          <p className={`${gutter} m-0 font-display text-[36px] leading-[40px] lg:text-[72px] lg:leading-[76px]`}>{nbsp(text)}</p>
        )
      ) : null;
    default:
      return null;
  }
}

/** Full-bleed blocks (bands) sit closer to their neighbours than text blocks. */
const fullBleed = (section: Section) => section._type === "mQuote" || (section._type === "mWords" && section.band);

/**
 * Manifest: a big headline and the manifesto as editable blocks (Sanity → "Stránka
 * Manifest"): section headings, text, big statements, the pillars, one quote on a
 * butter band and lines of words (optionally on a black band).
 */
export default async function ManifestoPage({ params }: PageProps<"/[locale]/manifest">) {
  const locale = (await params).locale as Locale;
  setRequestLocale(locale);
  const [page, tr] = await Promise.all([getData(), getTranslations("manifesto")]);
  const title = t(page?.title, locale);
  const sections = page?.sections ?? [];

  const blocks: ReactNode[] = sections.map((section) => (
    <div key={section._key} className={fullBleed(section) ? "mt-14 lg:mt-28" : section._type === "mHeading" ? "mt-16 lg:mt-36" : "mt-8 lg:mt-16"}>
      <Block section={section} locale={locale} quoteLabel={tr("title")} />
    </div>
  ));

  return (
    <article className="pb-6 lg:pb-12">
      <header className={`${gutter} flex flex-col gap-4 pt-8 lg:gap-8 lg:pt-16`}>
        <span className="text-[15px] leading-5 font-medium text-muted lg:text-lg lg:leading-6">{tr("title")}</span>
        <h1 className="m-0 font-display text-[48px] leading-[46px] lg:text-[112px] lg:leading-[100px]">{nbsp(title ?? tr("title"))}</h1>
      </header>
      {blocks}
    </article>
  );
}
