import type { ComponentProps } from "react";

import type { Locale } from "@/i18n/locales";
import { Link } from "@/i18n/navigation";
import { eventCategories, type EventCategory } from "@/lib/taxonomy";

const sizes = {
  md: "px-2.5 py-1.5 text-[13px] leading-4 lg:px-4 lg:py-2 lg:text-base lg:leading-5",
  sm: "px-2.5 py-1.5 text-[13px] leading-4 lg:px-3 lg:py-1.5 lg:text-sm lg:leading-4",
} as const;

export function categoryLabel(category: string, locale: Locale) {
  return eventCategories.find((c) => c.id === category)?.[locale] ?? category;
}

/** Coloured category chip with the drifting gradient. Black text, always. */
export function CategoryChip({
  category,
  locale,
  size = "md",
  className = "",
}: {
  category: EventCategory | string;
  locale: Locale;
  size?: keyof typeof sizes;
  className?: string;
}) {
  return (
    <span className={`chip cl cl-${category} inline-flex items-center rounded-full font-medium whitespace-nowrap ${sizes[size]} ${className}`}>
      {categoryLabel(category, locale)}
    </span>
  );
}

/** Same chip as a link, with the darker border on hover. */
export function CategoryChipLink({
  category,
  locale,
  href,
  size = "md",
  className = "",
}: {
  category: EventCategory | string;
  locale: Locale;
  href: ComponentProps<typeof Link>["href"];
  size?: keyof typeof sizes;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`chip cl cl-${category} cat-edge inline-flex items-center rounded-full font-medium whitespace-nowrap no-underline ${sizes[size]} ${className}`}
    >
      {categoryLabel(category, locale)}
    </Link>
  );
}
