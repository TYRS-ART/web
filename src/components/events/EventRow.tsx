import type { Locale } from "@/i18n/locales";
import { Link } from "@/i18n/navigation";
import { formatTime } from "@/lib/dates";
import { dayLabel } from "@/lib/events";
import { t, tSlug } from "@/lib/localize";
import { CategoryChip } from "@/components/ui/CategoryChip";
import { SanityImage } from "@/components/ui/SanityImage";

import { nbsp } from "@/lib/typography";

import type { EventCard } from "./types";

/**
 * Programme row: date · title + chip · time · 160×100 thumbnail, 2px rule above.
 * Mobile stacks date + time, title and chip. No underline or colour change on hover.
 */
export function EventRow({
  event,
  locale,
  words,
  last = false,
}: {
  event: EventCard;
  locale: Locale;
  words: { today: string; tomorrow: string };
  last?: boolean;
}) {
  const slug = tSlug(event.slug, locale);
  const title = nbsp(t(event.title, locale) ?? "");
  const day = dayLabel(event.startsAt, locale, words);
  const time = formatTime(event.startsAt);
  const category = event.categories?.[0];
  const classes = `duo-host flex flex-col gap-2 border-t-2 border-black py-5 text-black no-underline lg:grid lg:grid-cols-[160px_1fr_auto_160px] lg:items-center lg:gap-8 lg:py-7 ${
    last ? "border-b-2" : ""
  }`;
  const body = (
    <>
      <span className="text-sm text-muted lg:text-xl">
        {day}
        <span className="lg:hidden"> · {time}</span>
      </span>
      <span className="flex flex-col gap-2 lg:min-w-0 lg:flex-row lg:items-center lg:gap-4">
        <span className="font-display text-[36px] leading-9 lg:truncate lg:text-[56px] lg:leading-[56px]">{title}</span>
        {event.categories?.map((c) => (
          <CategoryChip key={c} category={c} locale={locale} className="self-start lg:self-auto" />
        ))}
      </span>
      <span className="hidden text-[32px] tabular-nums lg:block">{time}</span>
      <span className="relative hidden h-[100px] w-[160px] overflow-hidden rounded-sm bg-sunken lg:block">
        {event.heroImage?.asset ? (
          <>
            <SanityImage image={event.heroImage} alt="" fill sizes="160px" className="object-cover" />
            <span className="duo" />
          </>
        ) : (
          <span className={`cl cl-${category} absolute inset-0`} />
        )}
      </span>
    </>
  );
  return slug ? (
    <Link href={{ pathname: "/program/[slug]", params: { slug } }} className={classes}>
      {body}
    </Link>
  ) : (
    <div className={classes}>{body}</div>
  );
}
