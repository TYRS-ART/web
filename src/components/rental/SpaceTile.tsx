import { getTranslations } from "next-intl/server";

import type { Locale } from "@/i18n/locales";
import { getPathname } from "@/i18n/navigation";
import { t } from "@/lib/localize";
import { nbsp } from "@/lib/typography";
import { SanityImage } from "@/components/ui/SanityImage";
import { spaceKey } from "@/components/enquiry/fields";
import type { RENTAL_QUERY_RESULT } from "@/sanity/types";

import { SpaceLink } from "./SpaceLink";

type Space = RENTAL_QUERY_RESULT["spaces"][number];

/**
 * Rentable space: feathered photo (or a plain typographic tile), capacity badge, name and
 * features. Links to the enquiry form with the space preselected.
 */
export async function SpaceTile({ space, locale, className = "" }: { space: Space; locale: Locale; className?: string }) {
  const tr = await getTranslations("rental");
  const name = t(space.name, locale);
  if (!name) return null;
  const features = t(space.features, locale);
  const hasImage = Boolean(space.photo?.asset);
  const badge = [
    space.capacity ? tr("capacity", { count: space.capacity }) : null,
    space.area ? tr("area", { area: new Intl.NumberFormat(locale).format(space.area) }) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const key = spaceKey(space);
  const href = `${getPathname({ href: { pathname: "/pronajem", query: { prostor: key } }, locale })}#poptavka`;

  return (
    <SpaceLink
      href={href}
      space={key}
      className={`tile group relative block h-80 overflow-hidden rounded-[14px] bg-sunken no-underline lg:h-[560px] lg:rounded-tile ${
        hasImage ? "text-white" : "text-black"
      } ${className}`}
    >
      {hasImage && (
        <>
          <SanityImage
            image={space.photo!}
            alt=""
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="soft object-cover zoom-soft group-hover:scale-[1.03] motion-reduce:transition-none"
          />
          <span className="soft absolute inset-0 bg-linear-to-t from-black/65 to-black/0 to-55%" />
        </>
      )}
      {badge && (
        <span className="absolute top-3 left-3 inline-flex items-center rounded-[5px] bg-white px-2.5 py-1.5 text-[13px] leading-4 font-medium text-black lg:top-5 lg:left-5 lg:rounded-xs lg:px-3.5 lg:py-2 lg:text-base lg:leading-5">
          {badge}
        </span>
      )}
      <span className="absolute right-4 bottom-3.5 left-4 flex flex-col gap-1 lg:right-7 lg:bottom-6 lg:left-7 lg:gap-2">
        <span className="font-display text-[52px] leading-[50px] lg:text-[96px] lg:leading-[88px]">{nbsp(name)}</span>
        {features && <span className="text-sm leading-5 lg:text-xl lg:leading-7">{nbsp(features)}</span>}
        <span className="sr-only"> – {tr("enquire")}</span>
      </span>
    </SpaceLink>
  );
}
