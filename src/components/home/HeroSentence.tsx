import { PortableText, type PortableTextComponents } from "@portabletext/react";

import type { Locale } from "@/i18n/locales";
import { Link } from "@/i18n/navigation";
import { nbspBlocks } from "@/lib/typography";
import type { HOME_QUERY_RESULT } from "@/sanity/types";

type Blocks = NonNullable<NonNullable<NonNullable<HOME_QUERY_RESULT["settings"]>["heroSentence"]>["cs"]>;

const pill =
  "pill cl cat-edge relative -top-[0.06em] mx-[3px] inline-flex items-center rounded-full border-2 px-4 py-[3px] align-middle text-[0.72em] leading-none no-underline lg:mx-1.5 lg:border-3 lg:px-8 lg:py-1.5";

const components: PortableTextComponents = {
  block: { normal: ({ children }) => <>{children} </> },
  marks: {
    categoryPill: ({ children, value }) => {
      const category = value?.category as string;
      // Lekce → courses; the others → programme filtered to that category.
      return category === "lekce" ? (
        <Link href="/kurzy" className={`${pill} cl-lekce`}>
          {children}
        </Link>
      ) : (
        <Link href={{ pathname: "/program", query: { kategorie: category } }} className={`${pill} cl-${category}`}>
          {children}
        </Link>
      );
    },
  },
};

/** "Ráno Lekce, odpoledne Tanec…" with clickable drifting category pills. */
export function HeroSentence({ blocks }: { blocks: Blocks; locale: Locale }) {
  return (
    <section className="flex flex-col px-5 pt-8 lg:px-16 lg:pt-12">
      <h1 className="m-0 font-display text-[52px] leading-[50px] lg:text-[120px] lg:leading-[108px]">
        <PortableText value={nbspBlocks(blocks)} components={components} />
      </h1>
    </section>
  );
}
