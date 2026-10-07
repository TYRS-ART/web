import type { Locale } from "@/i18n/locales";
import { t } from "@/lib/localize";
import { nbsp } from "@/lib/typography";
import type { RENTAL_QUERY_RESULT } from "@/sanity/types";

type Item = NonNullable<NonNullable<RENTAL_QUERY_RESULT["page"]>["included"]>[number];

const columns = ["lg:grid-cols-1", "lg:grid-cols-2", "lg:grid-cols-3", "lg:grid-cols-4"];

/** Black "Co je v ceně" band: up to four columns per row on desktop, stacked on mobile. */
export function IncludedBand({ items, locale, label }: { items: Item[]; locale: Locale; label: string }) {
  const rows = items
    .map((item) => ({ key: item._key, title: t(item.title, locale), body: t(item.body, locale) }))
    .filter((item) => item.title || item.body);
  if (rows.length === 0) return null;

  return (
    <section
      aria-labelledby="co-je-v-cene"
      className={`mx-3 mt-8 flex flex-col rounded-[14px] bg-black px-6 py-2 text-white lg:mx-6 lg:mt-16 lg:grid lg:gap-y-10 lg:rounded-[20px] lg:px-8 lg:py-12 ${
        columns[Math.min(rows.length, 4) - 1]
      }`}
    >
      <h2 id="co-je-v-cene" className="sr-only">
        {label}
      </h2>
      {rows.map((item) => (
        <div
          key={item.key}
          className="flex flex-col gap-1.5 border-t border-white/30 py-5 [&:nth-child(2)]:border-t-0 lg:gap-2 lg:border-t-0 lg:border-l-2 lg:px-8 lg:py-0 lg:[&:nth-child(4n+2)]:border-l-0"
        >
          {item.title && <h3 className="m-0 font-display text-[30px] leading-8 lg:text-4xl lg:leading-[38px]">{item.title}</h3>}
          {item.body && <p className="m-0 text-base leading-6 opacity-80 lg:text-lg lg:leading-[26px]">{nbsp(item.body)}</p>}
        </div>
      ))}
    </section>
  );
}
