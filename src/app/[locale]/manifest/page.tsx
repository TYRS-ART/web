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

/** One text size for the whole manifesto; key sentences are only a little bolder. */
const text = "text-[18px] leading-[30px] lg:text-[21px] lg:leading-[35px]";
const strong = "font-medium text-black";

const paragraphs = (value: string) => value.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

function Block({ section, locale }: { section: Section; locale: Locale }) {
  const value = t(section.text as never, locale) as string | undefined;
  switch (section._type) {
    case "mHeading":
      return value ? (
        <h2 className="m-0 border-t border-black/20 pt-5 text-[13px] leading-4 font-medium tracking-[0.08em] text-muted uppercase lg:text-sm">
          {nbsp(value)}
        </h2>
      ) : null;
    case "mText":
      return value ? (
        <div className={`flex flex-col gap-4 text-muted ${text}`}>
          {paragraphs(value).map((p, i) => (
            <p key={i} className="m-0">
              {nbsp(p)}
            </p>
          ))}
        </div>
      ) : null;
    case "mStatement":
    case "mQuote":
    case "mWords":
      return value ? (
        <p className={`m-0 whitespace-pre-line ${text} ${section._type === "mStatement" && section.muted ? "text-muted" : strong}`}>
          {nbsp(value)}
        </p>
      ) : null;
    case "mPillars": {
      const items = (section.items ?? []).filter((item) => t(item.title, locale));
      if (items.length === 0) return null;
      return (
        <ul className={`m-0 flex list-none flex-col gap-4 p-0 ${text}`}>
          {items.map((item) => (
            <li key={item._key} className="text-muted">
              <span className={strong}>{nbsp(t(item.title, locale)!)}</span>
              {t(item.text, locale) && <> — {nbsp(t(item.text, locale)!)}</>}
            </li>
          ))}
        </ul>
      );
    }
    default:
      return null;
  }
}

/** Space above a block: section headings open a new part, statements get room to breathe. */
function spaceAbove(section: Section, previous?: Section) {
  if (section._type === "mHeading") return "mt-16 lg:mt-20";
  if (!previous || previous._type === "mHeading") return "mt-6";
  return "mt-6 lg:mt-7";
}

/**
 * Manifest: a quiet reading page. One narrow column, one headline, and the manifesto
 * in a single text size (Sanity → "Stránka Manifest"). Statements, the question and
 * the lines of words are just a little bolder; small labels mark the three parts.
 */
export default async function ManifestoPage({ params }: PageProps<"/[locale]/manifest">) {
  const locale = (await params).locale as Locale;
  setRequestLocale(locale);
  const [page, tr] = await Promise.all([getData(), getTranslations("manifesto")]);
  const title = t(page?.title, locale);
  const sections = page?.sections ?? [];

  return (
    <article className="mx-5 pt-10 pb-16 lg:mx-auto lg:max-w-[720px] lg:pt-24 lg:pb-28">
      <header className="flex flex-col gap-5 lg:gap-6">
        <span className="text-[13px] leading-4 font-medium tracking-[0.08em] text-muted uppercase lg:text-sm">{tr("title")}</span>
        <h1 className="m-0 font-display text-[36px] leading-[40px] lg:text-[52px] lg:leading-[58px]">{nbsp(title ?? tr("title"))}</h1>
      </header>
      {sections.map((section, i) => (
        <div key={section._key} className={spaceAbove(section, sections[i - 1])}>
          <Block section={section} locale={locale} />
        </div>
      ))}
    </article>
  );
}
