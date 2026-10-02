import { getTranslations } from "next-intl/server";

import type { Locale } from "@/i18n/locales";
import { Link } from "@/i18n/navigation";
import { shortTime, weekdayShort } from "@/lib/courses";
import { addDays } from "@/lib/dates";
import { t, tSlug } from "@/lib/localize";
import { formatDay, isoWeekday } from "@/lib/timetable";
import { upcomingLessons } from "@/lib/upcoming";
import { buttonClass } from "@/components/ui/button";
import { CategoryChip } from "@/components/ui/CategoryChip";
import type { HOME_QUERY_RESULT } from "@/sanity/types";

const focusColour: Record<string, string> = { tanec: "bg-tanec", hudba: "bg-hudba", pohyb: "bg-pohyb" };

/**
 * Five sage course slots: what's left of this week, or — when nothing is on this
 * week — the next lessons ahead ("Nadcházející lekce"). Different courses first.
 * Hidden when no lessons are planned.
 */
export async function CoursesThisWeek({
  courses,
  locale,
  today,
  weekStart,
}: {
  courses: HOME_QUERY_RESULT["courses"];
  locale: Locale;
  today: string;
  weekStart: string;
}) {
  const tr = await getTranslations();
  const all = upcomingLessons(courses, today);
  const thisWeek = all.filter((lesson) => lesson.day <= addDays(weekStart, 6));
  const pool = thisWeek.length > 0 ? thisWeek : all;
  const later = thisWeek.length === 0;

  // Spread out: one slot per day and per course first, then fill up.
  const picked: typeof pool = [];
  const pass = (accept: (lesson: (typeof pool)[number]) => boolean) => {
    for (const lesson of pool) if (picked.length < 5 && !picked.includes(lesson) && accept(lesson)) picked.push(lesson);
  };
  pass((l) => !picked.some((p) => p.day === l.day || p.course._id === l.course._id));
  pass((l) => !picked.some((p) => p.course._id === l.course._id));
  pass(() => true);
  picked.sort((a, b) => pool.indexOf(a) - pool.indexOf(b));
  if (picked.length === 0) return null;

  const title = later ? tr("home.laterCourses") : tr("home.thisWeekCourses");

  return (
    <section
      aria-label={title}
      className="mx-3 mt-3 flex flex-col gap-3 rounded-tile bg-white p-4 lg:mx-6 lg:mt-4 lg:gap-6 lg:rounded-card lg:p-8"
    >
      <div className="flex items-end justify-between gap-3 px-1 lg:gap-6 lg:px-2">
        <div className="flex flex-col gap-1.5 lg:gap-2">
          <CategoryChip category="lekce" locale={locale} className="self-start" />
          <h2 className="m-0 font-display text-4xl leading-9 lg:text-[72px] lg:leading-[66px]">{title}</h2>
        </div>
        <Link href="/kurzy" className="pb-1 text-[15px] font-medium whitespace-nowrap text-muted no-underline lg:hidden">
          {tr("home.timetable")} →
        </Link>
        <Link href="/kurzy" className={`${buttonClass("primary", "lg")} max-lg:hidden`}>
          {tr("home.fullTimetable")} →
        </Link>
      </div>
      <div className="flex flex-col gap-2 lg:grid lg:grid-cols-5 lg:gap-3">
        {picked.map((lesson) => {
          const course = lesson.course;
          const slug = tSlug(course.slug, locale);
          const when = `${weekdayShort(isoWeekday(lesson.day), locale)}${later ? ` ${formatDay(lesson.day, locale)}` : ""} ${shortTime(lesson.start)}`;
          const content = (
            <>
              <span className="flex items-center justify-between gap-2">
                <span className="font-display text-xl leading-[22px] lg:text-[28px] lg:leading-[30px]">{when}</span>
                {course.focus && (
                  <span className={`rounded-full px-2.5 py-0.5 text-xs leading-4 font-medium text-black ${focusColour[course.focus]}`}>
                    {tr(`focus.${course.focus}`)}
                  </span>
                )}
              </span>
              <span className="font-display text-xl leading-[22px] lg:text-[28px] lg:leading-[30px]">{t(course.title, locale)}</span>
            </>
          );
          const classes =
            "flex flex-col justify-between gap-3 rounded-md bg-lekce px-4 py-3.5 text-black no-underline transition-colors hover:bg-black hover:text-white lg:min-h-[200px] lg:rounded-tile lg:px-[22px] lg:py-5";
          return slug ? (
            <Link key={lesson.key} href={{ pathname: "/kurzy/[slug]", params: { slug } }} className={classes}>
              {content}
            </Link>
          ) : (
            <div key={lesson.key} className={classes}>
              {content}
            </div>
          );
        })}
      </div>
    </section>
  );
}
