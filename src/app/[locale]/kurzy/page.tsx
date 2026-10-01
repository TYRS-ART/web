import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { CourseFilters } from "@/components/courses/CourseFilters";
import { CourseTile } from "@/components/courses/CourseTile";
import { DayList, Timetable } from "@/components/courses/Timetable";
import { SetAlternates } from "@/components/layout/AlternateLinks";
import { NewsletterForm } from "@/components/newsletter/NewsletterForm";
import { ProgramTabs } from "@/components/program/ProgramTabs";
import { buttonClass } from "@/components/ui/button";
import { CategoryChip } from "@/components/ui/CategoryChip";
import type { Locale } from "@/i18n/locales";
import { getPathname, Link } from "@/i18n/navigation";
import { addDays, pragueDay } from "@/lib/dates";
import { t, tSlug } from "@/lib/localize";
import {
  formatDay,
  formatWeekRange,
  lessonsInWeek,
  lessonTotal,
  matchesFilters,
  mondayOf,
  monthKey,
  parseFilters,
  parseWeek,
  type FilterId,
} from "@/lib/timetable";
import { sanityFetch } from "@/sanity/lib/fetch";
import { COURSES_PAGE_QUERY } from "@/sanity/queries/courses";

/** How far ahead "Začínáme v…" looks for new runs. */
const NEW_RUNS_DAYS = 56;

export async function generateMetadata({ params }: PageProps<"/[locale]/kurzy">): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  const tr = await getTranslations({ locale, namespace: "courses" });
  return {
    title: tr("metaTitle"),
    description: tr("metaDescription"),
    alternates: {
      canonical: getPathname({ href: "/kurzy", locale }),
      languages: { cs: getPathname({ href: "/kurzy", locale: "cs" }), en: getPathname({ href: "/kurzy", locale: "en" }) },
    },
  };
}

export default async function CoursesPage({ params, searchParams }: PageProps<"/[locale]/kurzy">) {
  const locale = (await params).locale as Locale;
  setRequestLocale(locale);
  const query = await searchParams;

  const today = pragueDay(new Date());
  const thisMonday = mondayOf(today);
  const monday = parseWeek(query.tyden, today);
  const filters = parseFilters(query.filtr);

  const [courses, tr] = await Promise.all([
    sanityFetch({ query: COURSES_PAGE_QUERY, params: { from: monday < today ? monday : today }, tags: ["course"] }),
    getTranslations(),
  ]);

  const visible = courses.filter((course) => matchesFilters(course, filters));
  const lessons = lessonsInWeek(visible, monday);
  const newRuns = visible
    .filter((c) => c.runStart && c.runStart > today && c.runStart <= addDays(today, NEW_RUNS_DAYS))
    .slice(0, 3);

  const hrefFor = (nextFilters: FilterId[], week = monday) => {
    const q: Record<string, string> = {};
    if (nextFilters.length > 0) q.filtr = nextFilters.join(",");
    if (week !== thisMonday) q.tyden = week;
    return { pathname: "/kurzy" as const, query: q };
  };
  const current = hrefFor(filters);

  // Only say it when it's true for every course shown this week.
  const shownCourses = new Set(lessons.map((l) => l.course));
  const note =
    shownCourses.size > 0 && [...shownCourses].every((c) => c.allowSingleLesson) ? tr("courses.singleOrCourse") : undefined;

  const newRunsMonths = new Set(newRuns.map((c) => monthKey(c.runStart!)));
  const newRunsTitle =
    newRunsMonths.size === 1 ? tr("courses.startingIn", { month: [...newRunsMonths][0] }) : tr("courses.startingSoon");

  const weekLabel = `${tr("courses.weekRange", { range: formatWeekRange(monday, locale) })} · ${tr("courses.lessonCount", {
    count: lessons.length,
  })}`;

  return (
    <>
      <SetAlternates cs={getPathname({ href: current, locale: "cs" })} en={getPathname({ href: current, locale: "en" })} />

      <section className="flex flex-col gap-5 px-5 pt-8 lg:gap-8 lg:px-16 lg:pt-16">
        <div className="flex items-end justify-between gap-3 lg:gap-6">
          <div className="flex flex-col gap-1.5">
            <h1 className="m-0 font-display text-[88px] leading-[84px] lg:text-[200px] lg:leading-[180px]">{tr("courses.title")}</h1>
            <span className="text-[15px] leading-5 text-muted lg:hidden">{weekLabel}</span>
          </div>
          <div className="flex items-center gap-1.5 pb-1.5 lg:gap-6 lg:pb-5">
            <span className="text-xl leading-6 text-muted max-lg:hidden" aria-live="polite">
              {weekLabel}
            </span>
            <Link
              href={hrefFor(filters, addDays(monday, -7))}
              scroll={false}
              aria-label={tr("courses.prevWeek")}
              className="inline-flex size-12 items-center justify-center rounded-full border-2 border-black bg-white text-xl no-underline hover:bg-black hover:text-white lg:size-16 lg:text-2xl"
            >
              <span aria-hidden="true">←</span>
            </Link>
            <Link
              href={hrefFor(filters, addDays(monday, 7))}
              scroll={false}
              aria-label={tr("courses.nextWeek")}
              className="inline-flex size-12 items-center justify-center rounded-full bg-black text-xl text-white no-underline hover:bg-green lg:hidden"
            >
              <span aria-hidden="true">→</span>
            </Link>
            <Link href={hrefFor(filters, addDays(monday, 7))} scroll={false} className={`${buttonClass("primary", "lg")} max-lg:hidden`}>
              {tr("courses.nextWeek")} →
            </Link>
          </div>
        </div>
        <div className="flex flex-col gap-5 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between lg:gap-6">
          <ProgramTabs active="courses" />
          <CourseFilters locale={locale} filters={filters} hrefFor={(f) => hrefFor(f)} />
        </div>
      </section>

      <section
        aria-label={tr("courses.timetable")}
        className="mx-3 mt-6 flex flex-col rounded-tile bg-white px-4 pt-1 pb-2 lg:mx-6 lg:mt-10 lg:gap-2 lg:rounded-card lg:p-8"
      >
        {lessons.length > 0 ? (
          <>
            <Timetable lessons={lessons} monday={monday} today={today} locale={locale} note={note} />
            <DayList lessons={lessons} monday={monday} today={today} locale={locale} note={note} />
          </>
        ) : (
          <div className="flex flex-col items-start gap-4 py-6 lg:gap-6 lg:px-2 lg:py-10">
            <h2 className="m-0 font-display text-4xl leading-9 lg:text-[72px] lg:leading-[66px]">
              {filters.length > 0 ? tr("courses.emptyFilteredTitle") : tr("courses.emptyTitle")}
            </h2>
            <p className="m-0 max-w-[640px] text-[17px] leading-[26px] text-muted lg:text-[22px] lg:leading-[34px]">
              {filters.length > 0 ? tr("courses.emptyFilteredText") : tr("courses.emptyText")}
            </p>
            {filters.length > 0 ? (
              <Link href={hrefFor([])} scroll={false} className={buttonClass("primary", "md")}>
                {tr("courses.clearFilter")}
              </Link>
            ) : (
              <NewsletterForm className="w-full max-w-[520px]" />
            )}
          </div>
        )}
      </section>

      {newRuns.length > 0 && (
        <section
          aria-label={tr("courses.newRuns")}
          className="mx-3 mt-12 flex flex-col gap-4 rounded-tile bg-white p-4 lg:mx-6 lg:mt-24 lg:gap-6 lg:rounded-card lg:p-8"
        >
          <div className="flex flex-col gap-2 px-1 lg:flex-row lg:items-end lg:justify-between lg:gap-6 lg:px-2">
            <h2 className="m-0 font-display text-[56px] leading-[52px] lg:text-8xl lg:leading-[88px]">{newRunsTitle}</h2>
            <span className="text-[15px] leading-5 text-muted lg:text-lg lg:leading-6">{tr("courses.startingNote")}</span>
          </div>
          <div className="flex flex-col gap-3 lg:grid lg:grid-cols-3 lg:gap-4">
            {newRuns.map((course) => {
              const total = lessonTotal(course);
              const from = tr("courses.from", { date: formatDay(course.runStart!, locale) });
              return (
                <CourseTile
                  key={course._id}
                  slug={tSlug(course.slug, locale)}
                  title={t(course.title, locale) ?? ""}
                  image={course.heroImage}
                  badge={total ? `${from} · ${tr("courses.lessonCount", { count: total })}` : from}
                  chip={<CategoryChip category="lekce" locale={locale} />}
                />
              );
            })}
          </div>
        </section>
      )}
    </>
  );
}
