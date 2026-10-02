import type { ReactNode } from "react";

import { Badge } from "@/components/detail/DetailHero";
import { SanityImage, type SanityImageValue } from "@/components/ui/SanityImage";
import { Link } from "@/i18n/navigation";
import { keepDashWithNext } from "@/lib/timetable";
import { nbsp } from "@/lib/typography";

/**
 * Course photo tile ("Začínáme v říjnu", "Další kurzy"): feathered photo, scrim, white
 * badge + chip top-left, Clash title bottom-left. Without a photo: a sage typographic tile.
 */
export function CourseTile({
  slug,
  title,
  image,
  badge,
  chip,
  className = "",
}: {
  slug: string | undefined;
  title: string;
  image: SanityImageValue | null;
  badge: string;
  chip: ReactNode;
  className?: string;
}) {
  const hasImage = Boolean(image?.asset);
  const body = (
    <>
      {hasImage ? (
        <>
          <SanityImage
            image={image!}
            alt=""
            fill
            sizes="(min-width: 1024px) 33vw, 100vw"
            className="soft absolute inset-0 block h-full w-full object-cover zoom-soft group-hover:scale-[1.03] motion-reduce:transition-none"
          />
          <span className="soft absolute inset-0 bg-linear-to-t from-black/60 to-black/0 to-55%" />
        </>
      ) : (
        <span className="cl cl-lekce absolute inset-0" />
      )}
      <span className="absolute top-3 left-3 inline-flex gap-1.5 lg:top-5 lg:left-5 lg:gap-2">
        {badge && <Badge>{badge}</Badge>}
        {chip}
      </span>
      <span
        className={`absolute right-4 bottom-3.5 left-4 font-display text-4xl leading-9 lg:right-6 lg:bottom-5 lg:left-6 lg:text-[56px] lg:leading-[52px] ${
          hasImage ? "text-white" : "text-black"
        }`}
      >
        {keepDashWithNext(nbsp(title))}
      </span>
    </>
  );
  const classes = `tile group relative block h-[240px] overflow-hidden rounded-[14px] bg-sunken no-underline lg:h-[420px] lg:rounded-tile ${className}`;
  return slug ? (
    <Link href={{ pathname: "/kurzy/[slug]", params: { slug } }} className={classes}>
      {body}
    </Link>
  ) : (
    <div className={classes}>{body}</div>
  );
}
