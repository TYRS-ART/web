import type { ReactNode } from "react";

import { SanityImage, type SanityImageValue } from "@/components/ui/SanityImage";
import { nbsp } from "@/lib/typography";

/**
 * Large photo header of event and course pages: feathered photo, scrim, hall badge
 * + chips top-left, huge title bottom-left. Without a photo: category-colour tile.
 */
export function DetailHero({
  image,
  title,
  badges,
  fallbackClass,
  label,
}: {
  image?: SanityImageValue | null;
  title: string;
  badges: ReactNode;
  /** e.g. "cl cl-hudba" for the typographic tile */
  fallbackClass: string;
  label: string;
}) {
  const hasImage = Boolean(image?.asset);
  return (
    <section
      aria-label={label}
      className="tile relative mx-3 h-[520px] overflow-hidden rounded-[14px] bg-sunken lg:mx-6 lg:h-[800px] lg:rounded-[20px]"
    >
      {hasImage ? (
        <>
          <SanityImage
            image={image!}
            alt=""
            fill
            priority
            sizes="100vw"
            className="soft absolute inset-0 h-full w-full object-cover"
          />
          <span className="soft absolute inset-0 bg-linear-to-t from-black/60 to-black/0 to-55%" />
        </>
      ) : (
        <span className={`absolute inset-0 ${fallbackClass}`} />
      )}
      <span className="absolute top-3 left-3 flex flex-wrap gap-1.5 lg:top-6 lg:left-6 lg:gap-2">{badges}</span>
      <h1
        className={`absolute right-4 bottom-3.5 left-4 m-0 font-display text-[72px] leading-[64px] lg:right-8 lg:bottom-6 lg:left-8 lg:text-[180px] lg:leading-[150px] ${
          hasImage ? "text-white" : "text-black"
        }`}
      >
        {nbsp(title)}
      </h1>
    </section>
  );
}

/** White badge used on photos (hall name, date). */
export function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-[5px] bg-white px-2.5 py-1.5 text-[13px] leading-4 font-medium text-black lg:rounded-xs lg:px-3.5 lg:py-2 lg:text-base lg:leading-5">
      {children}
    </span>
  );
}
