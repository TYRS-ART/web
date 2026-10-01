"use client";

import Image, { type ImageProps } from "next/image";

import { urlFor } from "@/sanity/lib/image";

export type SanityImageValue = {
  asset?: { _ref: string } | null;
  hotspot?: { x?: number; y?: number } | null;
  crop?: object | null;
  lqip?: string | null;
};

/** next/image served straight from the Sanity CDN; the hotspot drives object-position. */
export function SanityImage({
  image,
  alt,
  className,
  style,
  ...props
}: Omit<ImageProps, "src" | "alt" | "loader"> & { image: SanityImageValue; alt: string }) {
  if (!image.asset) return null;
  const position = image.hotspot
    ? `${(image.hotspot.x ?? 0.5) * 100}% ${(image.hotspot.y ?? 0.5) * 100}%`
    : undefined;
  return (
    <Image
      {...props}
      src={urlFor(image as Parameters<typeof urlFor>[0]).url()}
      loader={({ width, quality }) =>
        urlFor(image as Parameters<typeof urlFor>[0]).width(width).quality(quality ?? 75).fit("max").url()
      }
      alt={alt}
      className={className}
      placeholder={image.lqip ? "blur" : "empty"}
      blurDataURL={image.lqip ?? undefined}
      style={{ objectPosition: position, ...style }}
    />
  );
}
