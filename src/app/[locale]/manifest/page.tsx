import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

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

/** Two text sizes and three statement sizes keep the page calm. */
const statementSize = {
  xl: "text-[34px] leading-[38px] lg:text-[52px] lg:leading-[56px]",
  l: "text-[26px] leading-[31px] lg:text-[38px] lg:leading-[44px]",
  m: "text-[22px] leading-[28px] lg:text-[28px] lg:leading-[36px]",
} as const;

const textSize = {
  lead: "text-[19px] leading-[30px] lg:text-[23px] lg:leading-[36px]",
  body: "text-[17px] leading-[28px] lg:text-[19px] lg:leading-[32px]",
} as const;

const paragraphs = (text: string) => text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

function Block({ section, locale }: { section: Section; locale: Locale }) {
  const text = t(section.text as never, locale) as string | undefined;
  switch (section._type) {
    case "mHeading":
      return text ? (
        <h2 className="m-0 border-t border-black/20 pt-5 text-[13px] leading-4 font-medium tracking-[0.08em] text-muted uppercase lg:pt-6 lg:text-sm">
          {nbsp(text)}
        </h2>
      ) : null;
    case "mText":
      return text ? (
        <div className={`flex flex-col gap-5 ${textSize[section.size === "lead" ? "lead" : "body"]}`}>
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
          className={`m-0 font-display whitespace-pre-line ${statementSize[(section.size as keyof typeof statementSize) ?? "l"] ?? statementSize.l} ${
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
        <dl className="m-0 flex flex-col">
          {items.map((item) => (
            <div
              key={item._key}
              className="flex flex-col gap-1.5 border-b border-black/15 py-5 first:pt-0 last:border-b-0 lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-8 lg:py-6"
            >
              <dt className="font-display text-[22px] leading-[28px] lg:text-[26px] lg:leading-[32px]">{nbsp(t(item.title, locale)!)}</dt>
              {t(item.text, locale) && (
                <dd className={`m-0 text-muted ${textSize.body}`}>{nbsp(t(item.text, locale)!)}</dd>
              )}
            </div>
          ))}
        </dl>
      );
    }
    case "mQuote":
      return text ? <p className={`m-0 font-display ${statementSize.l}`}>{nbsp(text)}</p> : null;
    case "mWords":
      return text ? <p className={`m-0 font-display ${statementSize.m}`}>{nbsp(text)}</p> : null;
    default:
      return null;
  }
}

/** Space above a block: section headings open a new part, statements get room to breathe. */
function spaceAbove(section: Section, previous?: Section) {
  if (section._type === "mHeading") return "mt-20 lg:mt-28";
  if (!previous || previous._type === "mHeading") return "mt-8 lg:mt-10";
  if (section._type === "mText" && previous._type === "mText") return "mt-5";
  return "mt-10 lg:mt-14";
}

/**
 * Manifest: a quiet reading page. One narrow column, a short headline, the manifesto
 * as editable blocks (Sanity → "Stránka Manifest"): section labels, text, statements,
 * the pillars as a plain list, a question and a line of words.
 */
export default async function ManifestoPage({ params }: PageProps<"/[locale]/manifest">) {
  const locale = (await params).locale as Locale;
  setRequestLocale(locale);
  const [page, tr] = await Promise.all([getData(), getTranslations("manifesto")]);
  const title = t(page?.title, locale);
  const sections = page?.sections ?? [];

  return (
    <article className="mx-5 pt-10 pb-10 lg:mx-auto lg:max-w-[820px] lg:pt-24 lg:pb-24">
      <header className="flex flex-col gap-5 lg:gap-6">
        <span className="text-[13px] leading-4 font-medium tracking-[0.08em] text-muted uppercase lg:text-sm">{tr("title")}</span>
        <h1 className="m-0 font-display text-[40px] leading-[42px] lg:text-[64px] lg:leading-[66px]">{nbsp(title ?? tr("title"))}</h1>
      </header>
      {sections.map((section, i) => (
        <div key={section._key} className={spaceAbove(section, sections[i - 1])}>
          <Block section={section} locale={locale} />
        </div>
      ))}
    </article>
  );
}
