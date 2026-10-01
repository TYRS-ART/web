import { getTranslations } from "next-intl/server";

import type { Locale } from "@/i18n/locales";
import { Link } from "@/i18n/navigation";
import { minutes, weekdayLong } from "@/lib/courses";
import { t, tSlug } from "@/lib/localize";
import { addDays } from "@/lib/dates";
import { layoutDay, type Lesson } from "@/lib/timetable";
import { nbsp } from "@/lib/typography";
import type { COURSES_PAGE_QUERY_RESULT } from "@/sanity/types";

import { focusDot, focusFill } from "./FocusChip";

export type TimetableLesson = Lesson<COURSES_PAGE_QUERY_RESULT[number]>;

/** Pixels per half hour in the desktop grid. */
const ROW = 34;

function meta(lesson: TimetableLesson, locale: Locale) {
  return [`${lesson.start}–${lesson.end}`, t(lesson.course.level, locale), lesson.course.lecturer].filter(Boolean).join(" · ");
}

function href(lesson: TimetableLesson, locale: Locale) {
  const slug = tSlug(lesson.course.slug, locale);
  return slug ? ({ pathname: "/kurzy/[slug]", params: { slug } } as const) : undefined;
}

/** Desktop: 7 day columns × half-hour rows, sage slots placed by start and end time. */
export async function Timetable({
  lessons,
  monday,
  today,
  locale,
  note,
}: {
  lessons: TimetableLesson[];
  monday: string;
  today: string;
  locale: Locale;
  note?: string;
}) {
  const tr = await getTranslations();
  const firstHour = Math.min(8, ...lessons.map((l) => Math.floor(minutes(l.start) / 60)));
  const lastHour = Math.max(22, ...lessons.map((l) => Math.ceil(minutes(l.end) / 60)));
  const rows = (lastHour - firstHour) * 2;
  const hours = Array.from({ length: lastHour - firstHour }, (_, i) => firstHour + i);
  const days = Array.from({ length: 7 }, (_, i) => ({ weekday: i + 1, day: addDays(monday, i) }));
  const y = (time: string) => ((minutes(time) - firstHour * 60) / 30) * ROW;

  return (
    <div className="max-lg:hidden">
      <div className="grid grid-cols-[72px_repeat(7,minmax(0,1fr))] gap-x-2">
        <div />
        {days.map(({ weekday, day }) => (
          <div
            key={day}
            className={`pb-3 pl-2 text-base leading-5 font-medium ${day === today ? "text-lekce" : ""}`}
            {...(day === today ? { "aria-current": "date" as const } : {})}
          >
            {weekdayLong(weekday, locale)}
            {day === today && ` · ${tr("courses.today")}`}
          </div>
        ))}

        <div className="grid text-[13px] leading-4 text-muted" style={{ gridTemplateRows: `repeat(${rows}, ${ROW}px)` }} aria-hidden="true">
          {hours.map((h) => (
            <span key={h} className="row-span-2 border-t border-sunken pt-0.5">
              {h}:00
            </span>
          ))}
        </div>

        {days.map(({ day }) => {
          const placed = layoutDay(lessons.filter((l) => l.day === day));
          return (
            <ul
              key={day}
              className="relative m-0 list-none rounded-sm p-0"
              style={{
                height: rows * ROW,
                backgroundImage: `repeating-linear-gradient(to bottom, var(--color-sunken) 0, var(--color-sunken) 1px, transparent 1px, transparent ${ROW * 2}px)`,
              }}
            >
              {placed.map(({ lesson, column, columns }) => {
                const link = href(lesson, locale);
                const focus = lesson.course.focus;
                const content = (
                  <>
                    <span className="truncate font-display text-lg leading-[19px] tracking-[-0.02em]">
                      {nbsp(t(lesson.course.title, locale) ?? "")}
                    </span>
                    <span className="truncate text-xs leading-[14px]">
                      {focus && (
                        <span
                          className={`mr-1.5 inline-flex items-center gap-[5px] rounded-full bg-white px-[7px] py-px text-[11px] leading-[14px] font-medium text-black before:size-[7px] before:rounded-full before:content-[''] ${focusDot[focus]}`}
                        >
                          {tr(`focus.${focus}`)}
                        </span>
                      )}
                      <span className="opacity-85">{meta(lesson, locale)}</span>
                    </span>
                  </>
                );
                const classes =
                  "absolute flex flex-col gap-0.5 overflow-hidden rounded-[10px] bg-lekce px-2.5 py-2 text-black no-underline transition-colors duration-150 hover:bg-black hover:text-white focus-visible:bg-black focus-visible:text-white motion-reduce:transition-none";
                const style = {
                  top: y(lesson.start) + 2,
                  height: Math.max(ROW - 4, y(lesson.end) - y(lesson.start) - 4),
                  left: `calc(${(column / columns) * 100}% + ${column > 0 ? 2 : 0}px)`,
                  width: `calc(${100 / columns}% - ${columns > 1 ? 2 : 0}px)`,
                };
                return (
                  <li key={lesson.key}>
                    {link ? (
                      <Link href={link} className={classes} style={style}>
                        {content}
                      </Link>
                    ) : (
                      <div className={classes} style={style}>
                        {content}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-6 pt-4 text-base leading-6 text-muted">
        <span>{note}</span>
        <span className="inline-flex gap-4" aria-label={tr("courses.legend")}>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-3 rounded-[3px] bg-lekce" />
            {tr("courses.lessons")}
          </span>
          {(["tanec", "hudba", "pohyb"] as const).map((f) => (
            <span key={f} className="inline-flex items-center gap-1.5">
              <span className={`size-3 rounded-full ${focusFill[f]}`} />
              {tr(`focus.${f}`)}
            </span>
          ))}
        </span>
      </div>
    </div>
  );
}

/** Mobile: day-by-day list, days without lessons left out. */
export async function DayList({
  lessons,
  monday,
  today,
  locale,
  note,
}: {
  lessons: TimetableLesson[];
  monday: string;
  today: string;
  locale: Locale;
  note?: string;
}) {
  const tr = await getTranslations();
  const days = Array.from({ length: 7 }, (_, i) => ({ weekday: i + 1, day: addDays(monday, i) }))
    .map((d) => ({ ...d, lessons: lessons.filter((l) => l.day === d.day) }))
    .filter((d) => d.lessons.length > 0);

  return (
    <div className="flex flex-col lg:hidden">
      {days.map(({ weekday, day, lessons: dayLessons }) => (
        <section key={day} aria-label={weekdayLong(weekday, locale)}>
          <div className="flex items-baseline justify-between border-t-2 border-black pt-5 pb-2.5">
            <h2
              className={`m-0 font-display text-[28px] leading-[30px] ${day === today ? "text-lekce" : ""}`}
              {...(day === today ? { "aria-current": "date" as const } : {})}
            >
              {weekdayLong(weekday, locale)}
              {day === today && ` · ${tr("courses.today")}`}
            </h2>
            <span className="text-[13px] text-muted">{tr("courses.lessonCount", { count: dayLessons.length })}</span>
          </div>
          <ul className="m-0 flex list-none flex-col gap-2 p-0 pb-3">
            {dayLessons.map((lesson) => {
              const link = href(lesson, locale);
              const focus = lesson.course.focus;
              const content = (
                <>
                  <span className="font-display text-[22px] leading-[23px] tracking-[-0.02em]">
                    {nbsp(t(lesson.course.title, locale) ?? "")}
                  </span>
                  <span className="text-[13px] leading-[17px] opacity-85">{meta(lesson, locale)}</span>
                  {focus && (
                    <span className={`mt-1 self-start rounded-full px-2 py-0.5 text-[11px] leading-[14px] font-medium text-black ${focusFill[focus]}`}>
                      {tr(`focus.${focus}`)}
                    </span>
                  )}
                </>
              );
              const classes =
                "flex flex-col gap-0.5 rounded-md bg-lekce px-3 py-2.5 text-black no-underline transition-colors duration-150 hover:bg-black hover:text-white focus-visible:bg-black focus-visible:text-white motion-reduce:transition-none";
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
      ))}
      {note && <span className="pt-3 pb-2 text-sm leading-5 text-muted">{note}</span>}
    </div>
  );
}
