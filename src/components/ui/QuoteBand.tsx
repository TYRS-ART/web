import type { Locale } from "@/i18n/locales";
import { nbsp } from "@/lib/typography";

const QUOTES: Record<Locale, [string, string]> = { cs: ["„", "“"], en: ["“", "”"] };

/** Wraps text in the language's quotation marks, replacing any the editor typed. */
export function quoted(text: string, locale: Locale) {
  const bare = text.trim().replace(/^["„“”‚‘'»«]+|["„“”‚‘'»«]+$/g, "").trim();
  const [open, close] = QUOTES[locale];
  return `${open}${bare}${close}`;
}

const sizes = {
  /** Reference quote on Pronájem. */
  quote: "text-[28px] leading-9 lg:text-[56px] lg:leading-[68px]",
  /** Motto on Venue. */
  motto: "text-[30px] leading-[38px] lg:text-[64px] lg:leading-[76px]",
} as const;

/** Full-width butter band with one Hedvig Letters Serif quote (at most one per page). */
export function QuoteBand({
  text,
  cite,
  label,
  locale,
  size = "quote",
  marks = true,
  className = "",
}: {
  text: string;
  cite?: string;
  label: string;
  locale: Locale;
  size?: keyof typeof sizes;
  /** Wrap in quotation marks (off for a question such as on the Manifest page). */
  marks?: boolean;
  className?: string;
}) {
  return (
    <section aria-label={label} className={`bg-butter px-5 py-12 text-black lg:px-16 lg:py-24 ${className}`}>
      <figure className="m-0 max-w-[1100px]">
        <blockquote className={`m-0 font-serif ${sizes[size]}`}>{nbsp(marks ? quoted(text, locale) : text)}</blockquote>
        {cite && (
          <figcaption className="mt-3 font-sans text-[15px] leading-[22px] text-muted lg:mt-5 lg:text-xl lg:leading-7">
            — {cite}
          </figcaption>
        )}
      </figure>
    </section>
  );
}
