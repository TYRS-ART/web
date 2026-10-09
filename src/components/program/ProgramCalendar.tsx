import NextLink from "@/components/ui/NextLink";

import type { Locale } from "@/i18n/locales";
import { Link } from "@/i18n/navigation";
import { weekdayShort } from "@/lib/courses";
import { addDays, formatShortDate, formatTime } from "@/lib/dates";
import { t, tSlug } from "@/lib/localize";
import { dayMonthLabel, dayNumber, isoWeekday } from "@/lib/program";
import { nbsp } from "@/lib/typography";
import { SanityImage } from "@/components/ui/SanityImage";
import type { PROGRAM_QUERY_RESULT } from "@/sanity/types";

export type ProgramEvent = PROGRAM_QUERY_RESULT["month"][number];

/** What one calendar day shows: its first (matching) event, how many more, dimmed if filtered out. */
export type DayInfo = {
  day: string;
  event?: ProgramEvent;
  /** Marks the day as busy without an event (Kurzy: the day has lessons). */
  marked?: boolean;
  more: number;
  dimmed: boolean;
  /** Link for "+N" and the mobile day circles: the day in the list view. */
  href: string;
};

type Words = { today: string; more: (count: number) => string };

const variants = {
  grid: {
    box: "h-[200px] rounded-[14px]",
    badge: "top-3 left-3 gap-2 rounded-xs px-2.5 py-1.5 text-base leading-5",
    dot: "size-2.5",
    time: "top-3 right-3 px-2.5 py-1.5 text-sm leading-[18px]",
    title: "right-3.5 bottom-3 left-3.5 text-[30px] leading-[30px]",
    empty: "top-3.5 left-3.5 text-xl",
    sizes: "200px",
  },
  strip: {
    box: "h-[190px] w-[132px] shrink-0 snap-start rounded-[14px]",
    badge: "top-2.5 left-2.5 gap-1.5 rounded-[5px] px-2 py-[5px] text-sm leading-[18px]",
    dot: "size-2",
    time: "bottom-9 left-3 px-2 py-[3px] text-xs leading-4",
    title: "right-3 bottom-2.5 left-3 text-[22px] leading-[23px]",
    empty: "top-3 left-3 text-lg",
    sizes: "132px",
  },
} as const;

/** One day as a photo tile (event) or an empty well. Shared by the desktop grid and the mobile week strip. */
function DayTile({
  info,
  label,
  isToday,
  isPast,
  locale,
  words,
  variant,
}: {
  info: DayInfo;
  label: string;
  isToday: boolean;
  isPast: boolean;
  locale: Locale;
  words: Words;
  variant: keyof typeof variants;
}) {
  const v = variants[variant];
  const event = info.event;
  const slug = event ? tSlug(event.slug, locale) : undefined;
  const todayRing = isToday ? "outline-3 -outline-offset-3 outline-black" : "";

  if (!event || !slug) {
    return (
      <div
        aria-hidden="true"
        className={`relative ${v.box} ${isPast && !isToday ? "bg-paper" : "bg-sunken"} ${todayRing}`}
      >
        {isToday ? (
          <span className={`absolute inline-flex items-center bg-black font-medium text-white ${v.badge}`}>
            <span className={`${v.dot} rounded-full bg-lime`} />
            {label}
          </span>
        ) : (
          <span className={`absolute ${v.empty} ${isPast ? "text-[#b3b3b3]" : "text-muted"}`}>{label}</span>
        )}
      </div>
    );
  }

  const category = event.categories?.[0];
  const title = nbsp(t(event.title, locale) ?? "");
  const time = formatTime(event.startsAt);
  const hasImage = Boolean(event.heroImage?.asset);
  return (
    <div className={`relative overflow-hidden ${v.box} ${todayRing} ${info.dimmed ? "opacity-[0.22]" : ""} transition-opacity`}>
      <Link
        href={{ pathname: "/program/[slug]", params: { slug } }}
        className={`tile group absolute inset-0 block rounded-[inherit] bg-sunken no-underline focus-visible:-outline-offset-4 ${
          hasImage ? "text-white" : "text-black"
        }`}
      >
        {hasImage ? (
          <>
            <span className="soft absolute inset-0 overflow-hidden">
              <SanityImage
                image={event.heroImage}
                alt=""
                fill
                sizes={v.sizes}
                className="object-cover zoom-soft group-hover:scale-[1.04] motion-reduce:transition-none"
              />
            </span>
            <span className="soft absolute inset-0 bg-linear-to-t from-black/60 to-black/0 to-60%" />
          </>
        ) : (
          <span className={`cl cl-${category} absolute inset-0`} />
        )}
        <span
          aria-hidden="true"
          className={`absolute inline-flex items-center font-medium ${v.badge} ${isToday ? "bg-black text-white" : "bg-white text-black"}`}
        >
          {isToday && <span className={`${v.dot} rounded-full bg-lime`} />}
          {label}
        </span>
        <span className={`absolute truncate font-display tracking-[-0.02em] ${v.title}`}>{title}</span>
        <span className="sr-only">
          {" "}
          · {formatShortDate(event.startsAt, locale)} · {time}
        </span>
      </Link>
      <span className={`pointer-events-none absolute z-10 inline-flex items-center gap-1 rounded-full font-medium cl cl-${category} ${v.time}`}>
        <span aria-hidden="true">{time}</span>
        {info.more > 0 && (
          <NextLink
            href={info.href}
            aria-label={words.more(info.more)}
            className="pointer-events-auto rounded-full text-black no-underline hover:underline"
          >
            +{info.more}
          </NextLink>
        )}
      </span>
    </div>
  );
}

/** Desktop: the month as a Monday-first grid of photo tiles on a white card. */
export function MonthGrid({
  days,
  monthKey,
  today,
  locale,
  words,
  label,
}: {
  days: DayInfo[];
  monthKey: string;
  today: string;
  locale: Locale;
  words: Words;
  label: string;
}) {
  return (
    <section aria-label={label} className="mx-6 mt-10 hidden flex-col gap-4 rounded-card bg-white p-8 lg:flex">
      <div aria-hidden="true" className="grid grid-cols-7 gap-2.5 px-3.5 text-base leading-5 font-medium text-muted">
        {[1, 2, 3, 4, 5, 6, 7].map((weekday) => (
          <span key={weekday}>{weekdayShort(weekday, locale)}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2.5">
        {days.map((info) => {
          const inMonth = info.day.startsWith(monthKey);
          if (!inMonth && info.day > monthKey) {
            // Days of the next month: dashed outline, "1. 11." on the first one.
            return (
              <div key={info.day} aria-hidden="true" className="relative h-[200px] rounded-[14px] border-2 border-dashed border-[#cfcfcf] bg-white">
                <span className="absolute top-3 left-3 text-xl text-muted">
                  {dayNumber(info.day) === 1 ? dayMonthLabel(info.day, locale) : dayNumber(info.day)}
                </span>
              </div>
            );
          }
          const isToday = info.day === today;
          return (
            <DayTile
              key={info.day}
              info={inMonth ? info : { ...info, event: undefined }}
              label={isToday ? `${dayNumber(info.day)} · ${words.today}` : String(dayNumber(info.day))}
              isToday={isToday}
              isPast={info.day < today || !inMonth}
              locale={locale}
              words={words}
              variant="grid"
            />
          );
        })}
      </div>
    </section>
  );
}

/** Mobile: compact day circles; days with events link to that day. */
export function DayCircles({
  days,
  monthKey,
  today,
  locale,
  label,
  todayHref,
}: {
  days: DayInfo[];
  monthKey: string;
  today: string;
  locale: Locale;
  label: string;
  todayHref?: string;
}) {
  const circle = "inline-flex size-11 items-center justify-center rounded-full text-[15px] leading-[18px] no-underline";
  return (
    <ul aria-label={label} className="m-0 grid list-none grid-cols-7 justify-items-center gap-y-1.5 p-0">
      {days.map((info) => {
        const n = dayNumber(info.day);
        if (!info.day.startsWith(monthKey)) {
          return (
            <li key={info.day} aria-hidden="true" className={`${circle} text-muted opacity-40`}>
              {n}
            </li>
          );
        }
        const isToday = info.day === today;
        const hasEvent = (info.marked ?? Boolean(info.event)) && !info.dimmed;
        const style = isToday
          ? "bg-black font-medium text-white hover:text-white"
          : hasEvent
            ? "border-2 border-black bg-white font-medium text-black"
            : "text-muted";
        const href = isToday && todayHref ? todayHref : hasEvent ? info.href : undefined;
        return (
          <li key={info.day}>
            {href ? (
              <NextLink href={href} aria-label={formatShortDate(`${info.day}T12:00:00Z`, locale)} className={`${circle} ${style}`}>
                {n}
              </NextLink>
            ) : (
              <span className={`${circle} ${style}`}>{n}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/** Mobile "Tento týden": seven day cards, Monday to Sunday, scrolled sideways. */
export function WeekStrip({
  days,
  weekStart,
  today,
  locale,
  words,
  title,
  meta,
}: {
  days: Map<string, DayInfo>;
  weekStart: string;
  today: string;
  locale: Locale;
  words: Words;
  title: string;
  meta: string;
}) {
  const week = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  return (
    <div className="flex flex-col gap-4">
      <div id="tyden" className="flex scroll-mt-4 items-baseline justify-between gap-3">
        <h2 className="m-0 shrink-0 font-display text-[28px] leading-[30px] whitespace-nowrap">{title}</h2>
        <span className="text-right text-sm leading-[18px] text-muted">{meta}</span>
      </div>
      <div className="-mx-4 flex snap-x scroll-px-4 gap-2 overflow-x-auto px-4 [scrollbar-width:none]">
        {week.map((day) => {
          const isToday = day === today;
          const info = days.get(day) ?? { day, more: 0, dimmed: false, href: "" };
          return (
            <DayTile
              key={day}
              info={info}
              label={isToday ? words.today : `${weekdayShort(isoWeekday(day), locale)} ${dayNumber(day)}`}
              isToday={isToday}
              isPast={false}
              locale={locale}
              words={words}
              variant="strip"
            />
          );
        })}
      </div>
    </div>
  );
}
