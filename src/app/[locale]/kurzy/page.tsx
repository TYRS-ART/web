import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { CourseFilters } from "@/components/courses/CourseFilters";
import { CourseTile } from "@/components/courses/CourseTile";
import { EventRow } from "@/components/events/EventRow";
import { MonthCalendar, MonthList } from "@/components/courses/MonthCalendar";
import { SetAlternates } from "@/components/layout/AlternateLinks";
import { NewsletterForm } from "@/components/newsletter/NewsletterForm";
import { DayCircles, type DayInfo } from "@/components/program/ProgramCalendar";
import { filterChipClass, ProgramTabs } from "@/components/program/ProgramTabs";
import { buttonClass } from "@/components/ui/button";
import { CategoryChip } from "@/components/ui/CategoryChip";
import type { Locale } from "@/i18n/locales";
import { getPathname, Link } from "@/i18n/navigation";
import { addDays, formatMonthKey, pragueDay } from "@/lib/dates";
import { t, tSlug } from "@/lib/localize";
import { calendarDays, dayAnchor, shiftMonth } from "@/lib/program";
import {
  formatDay,
  lessonsBetween,
  lessonTotal,
  matchesFilters,
  monthKey as monthKeyOf,
  parseFilters,
  parseMonth,
  parseView,
  type CoursesView,
  type FilterId,
} from "@/lib/timetable";
import { lessonCard } from "@/lib/upcoming";
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
  const thisMonth = today.slice(0, 7);
  const view = parseView(query.zobrazeni);
  const monthKey = parseMonth(query.mesic, today);
  const filters = parseFilters(query.filtr);
  const gridDays = calendarDays(monthKey);

  const [courses, tr] = await Promise.all([
    sanityFetch({ query: COURSES_PAGE_QUERY, params: { from: gridDays[0] < today ? gridDays[0] : today }, tags: ["course"] }),
    getTranslations(),
  ]);

  const visible = courses.filter((course) => matchesFilters(course, filters));
  // Only the month's own days (the grid's neighbour days stay empty).
  const monthLessons = lessonsBetween(visible, `${monthKey}-01`, addDays(`${shiftMonth(monthKey, 1)}-01`, -1));
  const newRuns = visible
    .filter((c) => c.runStart && c.runStart > today && c.runStart <= addDays(today, NEW_RUNS_DAYS))
    .slice(0, 3);

  type Target = { filters?: FilterId[]; month?: string; view?: CoursesView };
  const hrefFor = (target: Target = {}) => {
    const next = { filters, view, month: monthKey, ...target };
    const q: Record<string, string> = {};
    if (next.filters.length > 0) q.filtr = next.filters.join(",");
    if (next.month !== thisMonth) q.mesic = next.month;
    if (next.view === "seznam") q.zobrazeni = "seznam";
    return { pathname: "/kurzy" as const, query: q };
  };
  const current = hrefFor();
  // A day in the list view, for the calendar's "+N" and the mobile day circles.
  const listUrl = getPathname({ href: hrefFor({ view: "seznam" }), locale });
  const dayHref = (day: string) => `${listUrl}#${dayAnchor(day)}`;

  const newRunsMonths = new Set(newRuns.map((c) => monthKeyOf(c.runStart!)));
  const newRunsTitle =
    newRunsMonths.size === 1 ? tr("courses.startingIn", { month: [...newRunsMonths][0] }) : tr("courses.startingSoon");

  const monthName = formatMonthKey(monthKey, locale);
  const headLabel = tr("courses.monthSummary", {
    month: `${locale === "cs" ? monthName.toLowerCase() : monthName} ${monthKey.slice(0, 4)}`,
    count: monthLessons.length,
  });
  const nextLabel = formatMonthKey(shiftMonth(monthKey, 1), locale);
  const words = { today: tr("common.today"), tomorrow: tr("common.tomorrow") };
  const lessonDays = new Set(monthLessons.map((l) => l.day));
  const circles: DayInfo[] = gridDays.map((day) => ({
    day,
    marked: lessonDays.has(day),
    more: 0,
    dimmed: false,
    href: dayHref(day),
  }));

  return (
    <>
      <SetAlternates cs={getPathname({ href: current, locale: "cs" })} en={getPathname({ href: current, locale: "en" })} />

      <section className="flex flex-col gap-5 px-5 pt-8 lg:gap-8 lg:px-16 lg:pt-16">
        <div className="flex items-end justify-between gap-3 lg:gap-6">
          <div className="flex flex-col gap-1.5">
            <h1 className="m-0 font-display text-[88px] leading-[84px] tracking-[-0.01em] lg:text-[200px] lg:leading-[180px]">{monthName}</h1>
            <span className="text-[15px] leading-5 text-muted lg:hidden">{headLabel}</span>
          </div>
          <div className="flex items-center gap-1.5 pb-1.5 lg:gap-6 lg:pb-5">
            <span className="text-xl leading-6 text-muted max-lg:hidden" aria-live="polite">
              {headLabel}
            </span>
            <Link
              href={hrefFor({ month: shiftMonth(monthKey, -1) })}
              scroll={false}
              aria-label={tr("courses.prevMonth")}
              className="inline-flex size-12 items-center justify-center rounded-full border-2 border-black bg-white text-xl no-underline hover:bg-black hover:text-white lg:size-16 lg:text-2xl"
            >
              <span aria-hidden="true">←</span>
            </Link>
            <Link
              href={hrefFor({ month: shiftMonth(monthKey, 1) })}
              scroll={false}
              aria-label={`${tr("courses.nextMonth")}: ${nextLabel}`}
              className="inline-flex size-12 items-center justify-center rounded-full bg-black text-xl text-white no-underline hover:bg-green lg:hidden"
            >
              <span aria-hidden="true">→</span>
            </Link>
            <Link href={hrefFor({ month: shiftMonth(monthKey, 1) })} scroll={false} className={`${buttonClass("primary", "lg")} max-lg:hidden`}>
              {nextLabel} →
            </Link>
          </div>
        </div>
        <div className="flex flex-col gap-5 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between lg:gap-6">
          <ProgramTabs active="courses" />
          <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center lg:gap-6">
            <CourseFilters locale={locale} filters={filters} hrefFor={(f) => hrefFor({ filters: f })} />
            <nav aria-label={tr("courses.view")} className="flex gap-2">
              <Link href={hrefFor({ view: "kalendar" })} scroll={false} className={filterChipClass} aria-current={view === "kalendar" ? "true" : undefined}>
                {tr("courses.viewCalendar")}
              </Link>
              <Link href={hrefFor({ view: "seznam" })} scroll={false} className={filterChipClass} aria-current={view === "seznam" ? "true" : undefined}>
                {tr("courses.viewList")}
              </Link>
            </nav>
          </div>
        </div>
      </section>

      {monthLessons.length === 0 ? (
        <section className="mx-3 mt-6 flex flex-col items-start gap-4 rounded-tile bg-white p-5 lg:mx-6 lg:mt-10 lg:gap-6 lg:rounded-card lg:p-10">
          <h2 className="m-0 font-display text-4xl leading-9 lg:text-[72px] lg:leading-[66px]">
            {filters.length > 0 ? tr("courses.emptyMonthFilteredTitle") : tr("courses.emptyMonthTitle")}
          </h2>
          <p className="m-0 max-w-[640px] text-[17px] leading-[26px] text-muted lg:text-[22px] lg:leading-[34px]">
            {filters.length > 0 ? tr("courses.emptyMonthFilteredText") : tr("courses.emptyMonthText")}
          </p>
          {filters.length > 0 ? (
            <Link href={hrefFor({ filters: [] })} scroll={false} className={buttonClass("primary", "md")}>
              {tr("courses.clearFilter")}
            </Link>
          ) : (
            <NewsletterForm className="w-full max-w-[520px]" />
          )}
        </section>
      ) : view === "kalendar" ? (
        <>
          <MonthCalendar
            lessons={monthLessons}
            monthKey={monthKey}
            today={today}
            locale={locale}
            dayHref={dayHref}
            label={tr("courses.monthCalendar")}
          />
          <section aria-label={tr("courses.monthCalendar")} className="mx-3 mt-6 flex flex-col gap-4 rounded-tile bg-white p-4 lg:hidden">
            <DayCircles days={circles} monthKey={monthKey} today={today} locale={locale} label={tr("courses.daysInMonth")} />
            <MonthList lessons={monthLessons} today={today} locale={locale} />
          </section>
        </>
      ) : (
        // The same rows as the Akce list: date · course + chips · time · photo.
        <section
          id="seznam"
          aria-label={tr("courses.lessonsList")}
          className="mx-3 mt-6 flex scroll-mt-4 flex-col rounded-tile bg-white p-5 lg:mx-6 lg:mt-10 lg:rounded-card lg:p-10"
        >
          {monthLessons.map((lesson, i) => {
            const firstOfDay = i === 0 || monthLessons[i - 1].day !== lesson.day;
            return (
              <div key={lesson.key} id={firstOfDay ? dayAnchor(lesson.day) : undefined} className="scroll-mt-4">
                <EventRow event={lessonCard(lesson)} locale={locale} words={words} last={i === monthLessons.length - 1} />
              </div>
            );
          })}
        </section>
      )}

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
