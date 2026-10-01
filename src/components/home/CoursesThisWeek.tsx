import { getTranslations } from "next-intl/server";

import type { Locale } from "@/i18n/locales";
import { Link } from "@/i18n/navigation";
import { flattenSlots, shortTime, weekdayShort } from "@/lib/courses";
import { t, tSlug } from "@/lib/localize";
import { buttonClass } from "@/components/ui/button";
import { CategoryChip } from "@/components/ui/CategoryChip";
import type { HOME_QUERY_RESULT } from "@/sanity/types";

const focusColour: Record<string, string> = { tanec: "bg-tanec", hudba: "bg-hudba", pohyb: "bg-pohyb" };

/** Five sage course slots for this week, one per day first. Hidden without courses. */
export async function CoursesThisWeek({ courses, locale }: { courses: HOME_QUERY_RESULT["courses"]; locale: Locale }) {
  const tr = await getTranslations();
  const all = flattenSlots(courses);
  // Spread over the week: one slot per day, each from a different course where possible.
  const picked: typeof all = [];
  const pass = (accept: (item: (typeof all)[number]) => boolean) => {
    for (const item of all) if (picked.length < 5 && !picked.includes(item) && accept(item)) picked.push(item);
  };
  pass((item) => !picked.some((p) => p.slot.weekday === item.slot.weekday || p.course._id === item.course._id));
  pass((item) => !picked.some((p) => p.course._id === item.course._id));
  pass(() => true);
  picked.sort((a, b) => all.indexOf(a) - all.indexOf(b));
  if (picked.length === 0) return null;

  return (
    <section
      aria-label={tr("home.thisWeekCourses")}
      className="mx-3 mt-3 flex flex-col gap-3 rounded-tile bg-white p-4 lg:mx-6 lg:mt-4 lg:gap-6 lg:rounded-card lg:p-8"
    >
      <div className="flex items-end justify-between gap-3 px-1 lg:gap-6 lg:px-2">
        <div className="flex flex-col gap-1.5 lg:gap-2">
          <CategoryChip category="lekce" locale={locale} className="self-start" />
          <h2 className="m-0 font-display text-4xl leading-9 lg:text-[72px] lg:leading-[66px]">{tr("home.thisWeekCourses")}</h2>
        </div>
        <Link href="/kurzy" className="pb-1 text-[15px] font-medium whitespace-nowrap text-muted no-underline lg:hidden">
          {tr("home.timetable")} →
        </Link>
        <Link href="/kurzy" className={`${buttonClass("primary", "lg")} max-lg:hidden`}>
          {tr("home.fullTimetable")} →
        </Link>
      </div>
      <div className="flex flex-col gap-2 lg:grid lg:grid-cols-5 lg:gap-3">
        {picked.map(({ course, slot }) => {
          const slug = tSlug(course.slug, locale);
          const content = (
            <>
              <span className="flex items-center justify-between gap-2">
                <span className="font-display text-xl leading-[22px] lg:text-[28px] lg:leading-[30px]">
                  {weekdayShort(slot.weekday, locale)} {shortTime(slot.startTime)}
                </span>
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
            <Link key={`${course._id}-${slot._key}`} href={{ pathname: "/kurzy/[slug]", params: { slug } }} className={classes}>
              {content}
            </Link>
          ) : (
            <div key={`${course._id}-${slot._key}`} className={classes}>
              {content}
            </div>
          );
        })}
      </div>
    </section>
  );
}
