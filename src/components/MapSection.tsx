import Image from "next/image";
import { getTranslations } from "next-intl/server";

import type { Locale } from "@/i18n/locales";
import { buttonClass } from "@/components/ui/button";

import map from "../../public/images/map-kampa.jpg";
import bubble from "../../public/images/map-kampa-bubble.png";
import mapMobile from "../../public/images/map-kampa-mobile.jpg";
import bubbleMobile from "../../public/images/map-kampa-mobile-bubble.png";

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

/**
 * Full-width map with the white address card and a Google Maps button. The map is
 * drawn from OpenStreetMap data in the canvas style, with the house in an aerial-photo
 * bubble (scripts/map/build-map.mjs): a wide crop for desktop, a tall one for phones.
 */
export async function MapSection({
  address,
  title,
  heading,
  id,
  variant = "home",
  className = "",
}: {
  address: Address | undefined;
  /** Kept for callers; the map itself has no language-specific content. */
  locale?: Locale;
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
  const alt = tr("mapAlt");
  const full = variant === "venue";
  // The homepage card shows the house number only ("Nosticova 634"); the footer has the full address.
  const street = full ? address.street : address.street.replace(/\/\d+\w*$/, "");
  const secondLine = (full && [address.postalCode, address.city].filter(Boolean).join(" ")) || address.district;
  // Desktop: extra width is cropped from the left so the house stays clear of the card.

  return (
    <section
      id={id}
      aria-label={heading ?? label}
      className={`map-section relative overflow-hidden bg-paper ${variants[variant].section} ${className}`}
    >
      <Image
        src={mapMobile}
        alt={alt}
        fill
        sizes="100vw"
        quality={85}
        placeholder="blur"
        className="map-fade object-cover object-top lg:hidden"
      />
      <Image
        src={map}
        alt={alt}
        fill
        sizes="100vw"
        quality={85}
        placeholder="blur"
        className="map-fade object-cover object-[100%_100%] max-lg:hidden"
      />
      {/* The photo bubble sits on its own layer, aligned with the map but never faded. */}
      <Image src={bubbleMobile} alt="" fill sizes="100vw" quality={90} className="object-cover object-top lg:hidden" />
      <Image src={bubble} alt="" fill sizes="100vw" quality={90} className="object-cover object-[100%_100%] max-lg:hidden" />
      <a
        href="https://www.openstreetmap.org/copyright"
        target="_blank"
        rel="noopener"
        className="absolute top-2 right-2 rounded-xs bg-paper/85 px-1.5 py-0.5 text-[10px] leading-3 text-muted no-underline hover:text-black lg:top-auto lg:right-auto lg:bottom-2 lg:left-2 lg:text-[11px]"
      >
        © OpenStreetMap
      </a>
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
