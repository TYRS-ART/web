import type { Locale } from "@/i18n/locales";
import { Link } from "@/i18n/navigation";
import { dateTimeLabel } from "@/lib/events";
import { t, tSlug } from "@/lib/localize";
import { CategoryChip } from "@/components/ui/CategoryChip";
import { SanityImage } from "@/components/ui/SanityImage";

import { nbsp } from "@/lib/typography";

import type { EventCard } from "./types";

export type TileSize = "xl" | "l" | "m" | "s";

const desktopTitle: Record<TileSize, string> = {
  xl: "lg:text-[120px] lg:leading-[104px]",
  l: "lg:text-[72px] lg:leading-[66px]",
  m: "lg:text-[64px] lg:leading-[60px]",
  s: "lg:text-[56px] lg:leading-[52px]",
};

const mobileTitle: Record<TileSize, string> = {
  xl: "text-[64px] leading-[58px]",
  l: "text-[40px] leading-[40px]",
  m: "text-[40px] leading-[40px]",
  s: "text-[30px] leading-[30px]",
};

/**
 * Event photo tile: feathered duotone photo, scrim, white date badge + category chip
 * top-left, Clash title bottom-left. Without a photo it becomes a typographic tile
 * in the category colour.
 */
export function EventTile({
  event,
  locale,
  size,
  mobileSize = size,
  words,
  className = "",
  hideChipOnMobile = false,
  sizes = "(min-width: 1024px) 66vw, 100vw",
}: {
  event: EventCard;
  locale: Locale;
  size: TileSize;
  mobileSize?: TileSize;
  words: { today: string; tomorrow: string };
  className?: string;
  hideChipOnMobile?: boolean;
  sizes?: string;
}) {
  const slug = tSlug(event.slug, locale);
  const courseSlug = event.course ? tSlug(event.course.slug, locale) : undefined;
  const target = courseSlug
    ? ({ pathname: "/kurzy/[slug]", params: { slug: courseSlug } } as const)
    : slug
      ? ({ pathname: "/program/[slug]", params: { slug } } as const)
      : undefined;
  const title = nbsp(t(event.title, locale) ?? "");
  const category = event.categories?.[0];
  const hasImage = Boolean(event.heroImage?.asset);
  const body = (
    <>
      {hasImage ? (
        <>
          <SanityImage
            image={event.heroImage!}
            alt=""
            fill
            sizes={sizes}
            className="soft absolute inset-0 block h-full w-full object-cover zoom-soft group-hover:scale-[1.03]"
          />
          <span className="duo" />
          <span className="soft absolute inset-0 bg-linear-to-t from-black/60 to-black/0 to-55%" />
        </>
      ) : (
        <span className={`cl cl-${category} absolute inset-0`} />
      )}
      <span className="absolute top-3 left-3 inline-flex gap-1.5 lg:top-5 lg:left-5 lg:gap-2">
        <span className="inline-flex items-center rounded-[5px] bg-white px-2.5 py-1.5 text-[13px] leading-4 font-medium text-black lg:rounded-xs lg:px-3.5 lg:py-2 lg:text-base lg:leading-5">
          {dateTimeLabel(event.startsAt, locale, words)}
        </span>
        {event.categories?.map((c) => (
          <CategoryChip key={c} category={c} locale={locale} className={hideChipOnMobile ? "max-lg:hidden" : ""} />
        ))}
      </span>
      <span
        className={`font-display absolute right-4 bottom-3.5 left-4 lg:right-7 lg:bottom-6 lg:left-7 ${
          hasImage ? "text-white" : "text-black"
        } ${mobileTitle[mobileSize]} ${desktopTitle[size]}`}
      >
        {title}
      </span>
    </>
  );
  const classes = `tile duo-host feathered group relative block overflow-hidden rounded-[14px] bg-sunken text-white no-underline lg:rounded-tile ${className}`;
  return target ? (
    <Link href={target} className={classes}>
      {body}
    </Link>
  ) : (
    <div className={classes}>{body}</div>
  );
}
