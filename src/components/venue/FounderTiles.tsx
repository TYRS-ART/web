import type { Locale } from "@/i18n/locales";
import { t } from "@/lib/localize";
import { nbsp } from "@/lib/typography";
import { SanityImage } from "@/components/ui/SanityImage";
import type { VENUE_QUERY_RESULT } from "@/sanity/types";

type Founder = NonNullable<NonNullable<VENUE_QUERY_RESULT["page"]>["founders"]>[number];

const desktopColumns = ["lg:grid-cols-1", "lg:grid-cols-2", "lg:grid-cols-3"];

/**
 * White card with the founders as photo tiles. Mobile: the first one full width, the rest
 * in pairs. Desktop: up to three in a row. A founder without a photo gets a plain tile.
 */
export function FounderTiles({ founders, locale, label }: { founders: Founder[]; locale: Locale; label: string }) {
  if (founders.length === 0) return null;
  const rest = founders.length - 1;

  return (
    <div
      className={`-mx-2 grid grid-cols-2 gap-2.5 rounded-tile bg-white p-3 lg:mx-0 lg:gap-4 lg:rounded-card lg:p-6 ${
        desktopColumns[Math.min(founders.length, 3) - 1]
      }`}
    >
      <h2 className="col-span-full m-0 text-[15px] leading-5 font-medium text-muted lg:text-lg lg:leading-6">{label}</h2>
      {founders.map((founder, i) => {
        const first = i === 0;
        // Mobile: a lone last tile in the pairs row takes the full width.
        const wide = first || (rest % 2 === 1 && i === founders.length - 1);
        const role = t(founder.role, locale);
        const hasImage = Boolean(founder.photo?.asset);
        return (
          <figure
            key={founder._id}
            className={`tile relative m-0 overflow-hidden rounded-[14px] bg-sunken lg:col-span-1 lg:h-[520px] lg:rounded-tile ${
              wide ? "col-span-2" : ""
            } ${first ? "h-[360px]" : "h-[260px]"}`}
          >
            {hasImage && (
              <>
                <SanityImage
                  image={founder.photo!}
                  alt={t(founder.photo?.alt, locale) ?? ""}
                  fill
                  sizes="(min-width: 1024px) 30vw, (min-width: 768px) 50vw, 100vw"
                  className="soft object-cover object-top"
                />
                <span className="soft absolute inset-0 bg-linear-to-t from-black/65 to-black/0 to-55%" />
              </>
            )}
            <figcaption
              className={`absolute flex flex-col gap-0.5 lg:right-6 lg:bottom-5 lg:left-6 lg:gap-1 ${
                first ? "right-4 bottom-3.5 left-4" : "right-3 bottom-3 left-3"
              } ${hasImage ? "text-white" : "text-black"}`}
            >
              <span
                className={`font-display lg:text-5xl lg:leading-[48px] ${first ? "text-[40px] leading-10" : "text-[28px] leading-7"}`}
              >
                {founder.name}
              </span>
              {role && (
                <span
                  className={`opacity-85 lg:text-lg lg:leading-6 ${first ? "text-[15px] leading-5" : "text-[13px] leading-[18px]"}`}
                >
                  {nbsp(role)}
                </span>
              )}
            </figcaption>
          </figure>
        );
      })}
    </div>
  );
}
