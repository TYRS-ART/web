import Image from "next/image";
import { getTranslations } from "next-intl/server";

import type { Locale } from "@/i18n/locales";
import { t } from "@/lib/localize";
import { buttonClass } from "@/components/ui/button";
import { SanityImage, type SanityImageValue } from "@/components/ui/SanityImage";

type Address = {
  street?: string | null;
  district?: string | null;
  googleMapsUrl?: string | null;
} | null;

/** Full-width static map with the white address card and a Google Maps button. */
export async function MapSection({
  address,
  mapImage,
  locale,
  title,
  className = "",
}: {
  address: Address | undefined;
  mapImage?: (SanityImageValue & { alt?: { cs?: string | null; en?: string | null } | null }) | null;
  locale: Locale;
  title?: string;
  className?: string;
}) {
  const tr = await getTranslations("home");
  if (!address?.street) return null;
  const heading = title ?? tr("findUs");
  const alt = t(mapImage?.alt, locale) ?? tr("mapAlt");
  // The card shows the house number only ("Nosticova 634"); the footer has the full address.
  const street = address.street.replace(/\/\d+\w*$/, "");
  const imageClass = "object-cover object-[39%_30%] lg:object-[35%_45%]";

  return (
    <section aria-label={heading} className={`relative h-[560px] overflow-hidden bg-sunken lg:h-[640px] ${className}`}>
      {mapImage?.asset ? (
        <SanityImage image={mapImage} alt={alt} fill sizes="100vw" className={imageClass} />
      ) : (
        <Image src="/images/map-mala-strana.jpg" alt={alt} fill sizes="100vw" className={imageClass} />
      )}
      <div className="absolute right-3 bottom-3 left-3 flex flex-col items-start gap-3 rounded-tile bg-white p-5 lg:right-12 lg:bottom-12 lg:left-auto lg:w-[520px] lg:gap-5 lg:rounded-card lg:p-10">
        <span className="text-sm leading-5 font-medium text-muted lg:text-lg lg:leading-6">{heading}</span>
        <span className="font-display text-4xl leading-9 lg:text-[72px] lg:leading-[66px]">
          {street}
          {address.district && (
            <>
              <br />
              {address.district}
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
