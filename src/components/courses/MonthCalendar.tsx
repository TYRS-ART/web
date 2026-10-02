import NextLink from "next/link";
import { getTranslations } from "next-intl/server";

import type { Locale } from "@/i18n/locales";
import { Link } from "@/i18n/navigation";
import { shortTime, weekdayLong, weekdayShort } from "@/lib/courses";
import { t } from "@/lib/localize";
import { calendarDays, dayMonthLabel, dayNumber } from "@/lib/program";
import { isoWeekday } from "@/lib/timetable";
import { nbsp } from "@/lib/typography";

import { focusFill } from "./FocusChip";
import { href, meta, type TimetableLesson } from "./Timetable";

/** How many lessons a desktop day cell lists before "+N". */
const PER_DAY = 3;

/**
 * Month overview of the course timetable, like the Program calendar: Monday-first
 * grid on a white card, today ringed, past days quiet, the next month dashed.
 * Each day lists its lessons as small sage slots; "+N" opens that day in the list.
 */
export async function MonthCalendar({
  lessons,
  monthKey,
  today,
  locale,
  dayHref,
  label,
}: {
  lessons: TimetableLesson[];
  monthKey: string;
  today: string;
  locale: Locale;
  /** The day in the list view (a localized URL with its #anchor). */
  dayHref: (day: string) => string;
  label: string;
}) {
  const tr = await getTranslations();
  const byDay = new Map<string, TimetableLesson[]>();
  for (const lesson of lessons) byDay.set(lesson.day, [...(byDay.get(lesson.day) ?? []), lesson]);
  const days = calendarDays(monthKey);

  return (
    <section aria-label={label} className="mx-6 mt-10 hidden flex-col gap-4 rounded-card bg-white p-8 lg:flex">
      <div aria-hidden="true" className="grid grid-cols-7 gap-2.5 px-3.5 text-base leading-5 font-medium text-muted">
        {[1, 2, 3, 4, 5, 6, 7].map((weekday) => (
          <span key={weekday}>{weekdayShort(weekday, locale)}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2.5">
        {days.map((day) => {
          const inMonth = day.startsWith(monthKey);
          if (!inMonth && day > monthKey) {
            return (
              <div key={day} aria-hidden="true" className="min-h-[170px] rounded-[14px] border-2 border-dashed border-[#cfcfcf] bg-white p-3">
                <span className="text-xl text-muted">{dayNumber(day) === 1 ? dayMonthLabel(day, locale) : dayNumber(day)}</span>
              </div>
            );
          }
          const isToday = day === today;
          const dayLessons = inMonth ? (byDay.get(day) ?? []) : [];
          const past = day < today || !inMonth;
          return (
            <div
              key={day}
              className={`flex min-h-[170px] flex-col gap-2 rounded-[14px] p-2.5 ${past && !isToday ? "bg-paper" : "bg-sunken"} ${
                isToday ? "outline-3 -outline-offset-3 outline-black" : ""
              } ${!inMonth ? "opacity-50" : ""}`}
            >
              {isToday ? (
                <span className="inline-flex items-center gap-2 self-start rounded-xs bg-black px-2.5 py-1 text-base leading-5 font-medium text-white">
                  <span className="size-2.5 rounded-full bg-lime" />
                  {dayNumber(day)} · {tr("common.today")}
                </span>
              ) : (
                <span className={`px-1 text-xl leading-6 ${past ? "text-muted" : ""}`}>{dayNumber(day)}</span>
              )}
              <ul className="m-0 flex list-none flex-col gap-1.5 p-0" aria-label={dayMonthLabel(day, locale)}>
                {dayLessons.slice(0, PER_DAY).map((lesson) => {
                  const link = href(lesson, locale);
                  const focus = lesson.course.focus;
                  const content = (
                    <>
                      <span className="flex items-center gap-1.5 text-xs leading-4 font-medium tabular-nums">
                        {focus && (
                          <span aria-hidden="true" className={`size-2 shrink-0 rounded-full${focusFill[focus]}`} />
                        )}
                        {shortTime(lesson.start)}–{shortTime(lesson.end)}
                      </span>
                      <span className="line-clamp-2 font-display text-[17px] leading-[18px] tracking-[-0.02em]">
                        {nbsp(t(lesson.course.title, locale) ?? "")}
                      </span>
                    </>
                  );
                  const classes = `flex flex-col gap-0.5 rounded-md px-2 py-1.5 text-black no-underline transition-colors duration-150 hover:bg-black hover:text-white focus-visible:bg-black focus-visible:text-white motion-reduce:transition-none ${
                    past ? "bg-lekce/60" : "bg-lekce"
                  }`;
                  return (
                    <li key={lesson.key}>
                      {link ? (
                        <Link href={link} className={classes} title={meta(lesson, locale)}>
                          {content}
                        </Link>
                      ) : (
                        <div className={classes}>{content}</div>
                      )}
                    </li>
                  );
                })}
              </ul>
              {dayLessons.length > PER_DAY && (
                <NextLink
                  href={dayHref(day)}
                  className="mt-auto self-start rounded-full bg-white px-2.5 py-1 text-xs leading-4 font-medium no-underline hover:bg-black hover:text-white"
                >
                  {tr("courses.moreLessons", { count: dayLessons.length - PER_DAY })}
                </NextLink>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

/**
 * Mobile, under the month calendar: every day with lessons from today on (a past
 * month is shown whole).
 */
export async function MonthList({
  lessons,
  today,
  locale,
}: {
  lessons: TimetableLesson[];
  today: string;
  locale: Locale;
}) {
  const tr = await getTranslations();
  const allDays = [...new Set(lessons.map((l) => l.day))];
  // In the current month, start at today; a past month is shown whole.
  const upcoming = allDays.filter((day) => day >= today);
  const days = upcoming.length > 0 ? upcoming : allDays;
  return (
    <div className="flex flex-col">
      {days.map((day) => {
        const dayLessons = lessons.filter((l) => l.day === day);
        const isToday = day === today;
        return (
          <section
            key={day}
            aria-label={`${weekdayLong(isoWeekday(day), locale)} ${dayMonthLabel(day, locale)}`}
            className="scroll-mt-4 [&:first-child>div]:border-t-0"
          >
            <div
              className={`flex items-baseline justify-between border-t-2 border-black pt-5 pb-2.5 lg:pt-8 lg:pb-4 ${day < today ? "opacity-60" : ""}`}
            >
              <h2
                className="m-0 font-display text-[28px] leading-[30px] lg:text-5xl lg:leading-[46px]"
                {...(isToday ? { "aria-current": "date" as const } : {})}
              >
                {weekdayLong(isoWeekday(day), locale)} {dayMonthLabel(day, locale)}
                {isToday && ` · ${tr("courses.today")}`}
              </h2>
              <span className="text-[13px] text-muted lg:text-base">{tr("courses.lessonCount", { count: dayLessons.length })}</span>
            </div>
            <ul className="m-0 flex list-none flex-col gap-2 p-0 pb-3 lg:grid lg:grid-cols-3 lg:gap-3 lg:pb-6">
              {dayLessons.map((lesson) => {
                const link = href(lesson, locale);
                const focus = lesson.course.focus;
                const content = (
                  <>
                    <span className="font-display text-[22px] leading-[23px] tracking-[-0.02em] lg:text-[28px] lg:leading-[30px]">
                      {nbsp(t(lesson.course.title, locale) ?? "")}
                    </span>
                    <span className="text-[13px] leading-[17px] opacity-85 lg:text-[15px] lg:leading-5">{meta(lesson, locale)}</span>
                    {focus && (
                      <span className={`mt-1 self-start rounded-full px-2 py-0.5 text-[11px] leading-[14px] font-medium text-black ${focusFill[focus]}`}>
                        {tr(`focus.${focus}`)}
                      </span>
                    )}
                  </>
                );
                const classes =
                  "flex h-full flex-col gap-0.5 rounded-md bg-lekce px-3 py-2.5 text-black lg:px-4 lg:py-3.5 no-underline transition-colors duration-150 hover:bg-black hover:text-white focus-visible:bg-black focus-visible:text-white motion-reduce:transition-none";
                return (
                  <li key={lesson.key}>
                    {link ? (
                      <Link href={link} className={classes}>
                        {content}
                      </Link>
                    ) : (
                      <div className={classes}>{content}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
