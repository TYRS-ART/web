import Image from "next/image";
import { getTranslations } from "next-intl/server";

import type { Locale } from "@/i18n/locales";
import { t } from "@/lib/localize";
import { buttonClass } from "@/components/ui/button";
import { SanityImage, type SanityImageValue } from "@/components/ui/SanityImage";

type Address = {
  street?: string | null;
  district?: string | null;
  postalCode?: string | null;
  city?: string | null;
  googleMapsUrl?: string | null;
} | null;

const variants = {
  // Homepage: "Nosticova 634 / Malá Strana".
  home: {
    section: "h-[560px] lg:h-[640px]",
    address: "text-4xl leading-9 lg:text-[72px] lg:leading-[66px]",
  },
  // Venue "Kde": big section title over the map, full street and postcode.
  venue: {
    section: "h-[600px] lg:h-[720px]",
    address: "text-[34px] leading-[34px] lg:text-[64px] lg:leading-[60px]",
  },
} as const;

/** Full-width static map with the white address card and a Google Maps button. */
export async function MapSection({
  address,
  mapImage,
  locale,
  title,
  heading,
  id,
  variant = "home",
  className = "",
}: {
  address: Address | undefined;
  mapImage?: (SanityImageValue & { alt?: { cs?: string | null; en?: string | null } | null }) | null;
  locale: Locale;
  /** Small label on the address card. */
  title?: string;
  /** Optional big section title over the map (Venue "Kde"). */
  heading?: string;
  id?: string;
  variant?: keyof typeof variants;
  className?: string;
}) {
  const tr = await getTranslations("home");
  if (!address?.street) return null;
  const label = title ?? tr("findUs");
  const alt = t(mapImage?.alt, locale) ?? tr("mapAlt");
  const full = variant === "venue";
  // The homepage card shows the house number only ("Nosticova 634"); the footer has the full address.
  const street = full ? address.street : address.street.replace(/\/\d+\w*$/, "");
  const secondLine = (full && [address.postalCode, address.city].filter(Boolean).join(" ")) || address.district;
  const imageClass = "object-cover object-[39%_30%] lg:object-[35%_45%]";

  return (
    <section
      id={id}
      aria-label={heading ?? label}
      className={`relative overflow-hidden bg-sunken ${variants[variant].section} ${className}`}
    >
      {mapImage?.asset ? (
        <SanityImage image={mapImage} alt={alt} fill sizes="100vw" className={imageClass} />
      ) : (
        <Image src="/images/map-mala-strana.jpg" alt={alt} fill sizes="100vw" className={imageClass} />
      )}
      {heading && (
        <h2 className="absolute top-5 left-5 m-0 font-display text-[56px] leading-[52px] lg:top-12 lg:left-16 lg:text-[96px] lg:leading-[88px]">
          {heading}
        </h2>
      )}
      <div className="absolute right-3 bottom-3 left-3 flex flex-col items-start gap-3 rounded-tile bg-white p-5 lg:right-12 lg:bottom-12 lg:left-auto lg:w-[520px] lg:gap-5 lg:rounded-card lg:p-10">
        <span className="text-sm leading-5 font-medium text-muted lg:text-lg lg:leading-6">{label}</span>
        <span className={`font-display ${variants[variant].address}`}>
          {street}
          {secondLine && (
            <>
              <br />
              {secondLine}
            </>
          )}
        </span>
        {address.googleMapsUrl && (
          <a href={address.googleMapsUrl} target="_blank" rel="noopener" className={buttonClass("primary", "md")}>
            <span className="lg:hidden">Google Maps →</span>
            <span className="max-lg:hidden">{tr("openMaps")} →</span>
          </a>
        )}
      </div>
    </section>
  );
}
