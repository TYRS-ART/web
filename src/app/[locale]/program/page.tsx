import type { Metadata } from "next";
import NextLink from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { EventRow } from "@/components/events/EventRow";
import { newsletterEnabled } from "@/components/newsletter/actions";
import { NewsletterForm } from "@/components/newsletter/NewsletterForm";
import { ChannelsBand } from "@/components/program/ChannelsBand";
import { DayCircles, MonthGrid, WeekStrip, type DayInfo, type ProgramEvent } from "@/components/program/ProgramCalendar";
import { filterChipClass, ProgramTabs } from "@/components/program/ProgramTabs";
import { QueryToggle } from "@/components/program/QueryToggle";
import { categoryLabel } from "@/components/ui/CategoryChip";
import { buttonClass } from "@/components/ui/button";
import type { Locale } from "@/i18n/locales";
import { getPathname } from "@/i18n/navigation";
import { addDays, formatMonthKey, pragueDay, pragueMidnight } from "@/lib/dates";
import { icsBase } from "@/lib/event-ics";
import {
  byDay,
  calendarDays,
  dayAnchor,
  isOver,
  matchesCategories,
  monthRange,
  parseProgramState,
  programQuery,
  roundedNow,
  shiftMonth,
  startOfWeek,
  toggleCategory,
  weekRangeLabel,
  type ProgramState,
} from "@/lib/program";
import { siteUrl } from "@/lib/site";
import { eventCategories } from "@/lib/taxonomy";
import { sanityFetch } from "@/sanity/lib/fetch";
import { PROGRAM_QUERY } from "@/sanity/queries/program";

export async function generateMetadata({ params }: PageProps<"/[locale]/program">): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  const tr = await getTranslations({ locale, namespace: "program" });
  const path = (l: Locale) => getPathname({ href: "/program", locale: l });
  return {
    title: tr("metaTitle"),
    description: tr("metaDescription"),
    alternates: { canonical: path(locale), languages: { cs: path("cs"), en: path("en") } },
  };
}

const categoryChip =
  "chip cl cat-edge inline-flex min-h-12 shrink-0 cursor-pointer items-center rounded-full px-[18px] text-base leading-5 font-medium whitespace-nowrap transition-opacity lg:min-h-14 lg:px-6 lg:text-lg lg:leading-6 aria-pressed:after:ml-2.5 aria-pressed:after:font-bold aria-pressed:after:content-['✓']";

export default async function ProgramPage({ params, searchParams }: PageProps<"/[locale]/program">) {
  const locale = (await params).locale as Locale;
  setRequestLocale(locale);
  const state = parseProgramState(await searchParams);

  const { now, today } = roundedNow();
  const currentMonth = today.slice(0, 7);
  const monthKey = state.month ?? currentMonth;
  const isCurrentMonth = monthKey === currentMonth;
  const weekStart = startOfWeek(today);

  const [data, tr, showForm] = await Promise.all([
    sanityFetch({
      query: PROGRAM_QUERY,
      params: {
        ...monthRange(monthKey),
        weekStart: pragueMidnight(weekStart).toISOString(),
        weekEnd: pragueMidnight(addDays(weekStart, 7)).toISOString(),
      },
      tags: ["event", "settings"],
    }),
    getTranslations(),
    newsletterEnabled(),
  ]);

  const base = getPathname({ href: "/program", locale });
  const href = (next: ProgramState, hash = "") => `${base}${programQuery(next)}${hash}`;
  const listHref = (hash = "") => href({ ...state, view: "seznam", month: state.month ?? monthKey }, hash);
  const words = { today: tr("common.today"), tomorrow: tr("common.tomorrow") };
  const calendarWords = { today: words.today, more: (count: number) => tr("program.moreThatDay", { count }) };

  const filter = state.categories;
  const filtering = filter.length > 0;
  const monthEvents: ProgramEvent[] = data.month;
  const shown = monthEvents.filter((e) => matchesCategories(e, filter));
  const monthName = formatMonthKey(monthKey, locale);
  const monthLower = locale === "cs" ? monthName.toLocaleLowerCase("cs") : monthName;
  const nextName = formatMonthKey(shiftMonth(monthKey, 1), locale);
  const year = monthKey.slice(0, 4);

  // Calendar cells: first matching event of the day; days with only filtered-out events stay, dimmed.
  const dayInfo = (day: string, events: ProgramEvent[]): DayInfo => {
    const matching = events.filter((e) => matchesCategories(e, filter));
    const list = matching.length > 0 ? matching : events;
    return {
      day,
      event: list[0],
      more: matching.length > 0 ? matching.length - 1 : 0,
      dimmed: matching.length === 0 && events.length > 0,
      href: listHref(`#${dayAnchor(day)}`),
    };
  };
  const monthByDay = byDay(monthEvents);
  const gridDays = calendarDays(monthKey).map((day) => dayInfo(day, monthByDay.get(day) ?? []));
  const weekDays = new Map([...byDay(data.week)].map(([day, events]) => [day, dayInfo(day, events)]));
  const thisWeek = data.week.filter((e) => !isOver(e, now) && matchesCategories(e, filter));
  const upcoming = (isCurrentMonth ? shown.filter((e) => !isOver(e, now)) : shown).slice(0, 6);

  const feedUrl = `${siteUrl.replace(/^https?:/, "webcal:")}${icsBase[locale]}.ics`;
  const emptyMonth = monthEvents.length === 0;
  const emptyFilter = !emptyMonth && shown.length === 0;
  const showCalendar = state.view === "kalendar" && !emptyMonth && !emptyFilter;
  const showList = state.view === "seznam" && !emptyMonth && !emptyFilter;
  const formInEmptyCard = emptyMonth && showForm;

  const summary = { month: monthLower, year, count: shown.length };
  const monthNavState = (delta: number): ProgramState => ({ ...state, month: shiftMonth(monthKey, delta) });

  return (
    <>
      <section className="flex flex-col gap-5 px-5 pt-8 lg:gap-8 lg:px-16 lg:pt-16">
        <div className="flex items-end justify-between gap-6">
          <div className="flex flex-col gap-1.5">
            <h1 className="m-0 font-display text-[88px] leading-[84px] lg:text-[200px] lg:leading-[180px]">{monthName}</h1>
            <span className="text-[15px] leading-5 text-muted lg:hidden">{tr("program.summaryShort", summary)}</span>
          </div>
          <nav aria-label={tr("program.monthNav")} className="flex items-center gap-1.5 pb-1.5 lg:gap-6 lg:pb-5">
            <span className="hidden text-xl leading-6 text-muted lg:inline">{tr("program.summary", summary)}</span>
            <NextLink
              href={href(monthNavState(-1))}
              aria-label={tr("program.prevMonth")}
              className="inline-flex size-12 items-center justify-center rounded-full border-2 border-black bg-white text-xl no-underline hover:bg-black hover:text-white lg:size-16 lg:text-2xl"
            >
              ←
            </NextLink>
            <NextLink
              href={href(monthNavState(1))}
              aria-label={`${tr("program.nextMonth")}: ${nextName}`}
              className="inline-flex size-12 items-center justify-center rounded-full bg-black text-xl text-white no-underline hover:bg-green lg:size-auto lg:min-h-16 lg:px-8 lg:text-xl lg:leading-6 lg:font-medium"
            >
              <span aria-hidden="true" className="hidden lg:inline">
                {nextName}&nbsp;
              </span>
              →
            </NextLink>
          </nav>
        </div>

        <ProgramTabs active="events" />

        <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between lg:gap-6">
          <div
            role="group"
            aria-label={tr("program.categories")}
            className="-mx-5 flex gap-2 overflow-x-auto px-5 py-[3px] [scrollbar-width:none] lg:mx-0 lg:flex-wrap lg:gap-2.5 lg:overflow-visible lg:px-0"
          >
            <QueryToggle
              href={href({ ...state, categories: [] })}
              pressed={!filtering}
              pressedAfter
              className={`${filterChipClass} shrink-0`}
            >
              {tr("program.all")}
            </QueryToggle>
            {eventCategories.map(({ id }) => {
              const pressed = filter.includes(id);
              return (
                <QueryToggle
                  key={id}
                  href={href(toggleCategory(state, id))}
                  pressed={pressed}
                  className={`${categoryChip} cl-${id} ${filtering && !pressed ? "opacity-40 hover:opacity-100" : ""}`}
                >
                  {categoryLabel(id, locale)}
                </QueryToggle>
              );
            })}
          </div>
          <div role="group" aria-label={tr("program.view")} className="flex gap-2">
            <QueryToggle
              href={href({ ...state, view: "kalendar" })}
              pressed={state.view === "kalendar"}
              pressedAfter
              className={filterChipClass}
            >
              {tr("program.calendar")}
            </QueryToggle>
            <QueryToggle
              href={href({ ...state, view: "seznam" })}
              pressed={state.view === "seznam"}
              pressedAfter
              className={filterChipClass}
            >
              {tr("program.list")}
            </QueryToggle>
          </div>
        </div>
      </section>

      {emptyMonth && (
        <section
          id={formInEmptyCard ? "newsletter" : undefined}
          className="mx-3 mt-6 flex scroll-mt-4 flex-col gap-4 rounded-tile bg-white p-5 lg:mx-6 lg:mt-10 lg:gap-6 lg:rounded-card lg:p-10"
        >
          <h2 className="m-0 max-w-[16ch] font-display text-[40px] leading-[42px] lg:text-[96px] lg:leading-[88px]">
            {tr("program.emptyMonth", { month: monthLower })}
          </h2>
          {showForm && (
            <>
              <p className="m-0 text-base leading-6 text-muted lg:text-xl lg:leading-7">{tr("program.emptyMonthNewsletter")}</p>
              <NewsletterForm className="max-w-[640px]" />
            </>
          )}
        </section>
      )}

      {emptyFilter && (
        <section className="mx-3 mt-6 flex flex-col items-start gap-5 rounded-tile bg-white p-5 lg:mx-6 lg:mt-10 lg:gap-8 lg:rounded-card lg:p-10">
          <h2 className="m-0 font-display text-[40px] leading-[42px] lg:text-[72px] lg:leading-[72px]">{tr("program.emptyFilter")}</h2>
          <NextLink href={href({ ...state, categories: [] })} className={buttonClass("secondary", "md")}>
            {tr("program.showAll")}
          </NextLink>
        </section>
      )}

      {showCalendar && (
        <>
          <MonthGrid
            days={gridDays}
            monthKey={monthKey}
            today={today}
            locale={locale}
            words={calendarWords}
            label={tr("program.calendar")}
          />

          <section aria-label={tr("program.calendar")} className="mx-3 mt-6 flex flex-col gap-4 rounded-tile bg-white p-4 lg:hidden">
            <DayCircles
              days={gridDays}
              monthKey={monthKey}
              today={today}
              locale={locale}
              label={tr("program.daysInMonth")}
              todayHref={isCurrentMonth ? "#tyden" : undefined}
            />
            {isCurrentMonth && (
              <WeekStrip
                days={weekDays}
                weekStart={weekStart}
                today={today}
                locale={locale}
                words={calendarWords}
                title={tr("program.thisWeek")}
                meta={`${weekRangeLabel(weekStart, locale)} · ${tr("program.swipe")}`}
              />
            )}
          </section>

          {isCurrentMonth && thisWeek.length > 0 && (
            <section className="mx-6 mt-24 hidden flex-col rounded-card bg-white p-10 lg:flex">
              <h2 className="m-0 mb-8 font-display text-[96px] leading-[88px]">{tr("program.thisWeek")}</h2>
              {thisWeek.map((event, i) => (
                <EventRow key={event._id} event={event} locale={locale} words={words} last={i === thisWeek.length - 1} />
              ))}
            </section>
          )}

          {upcoming.length > 0 && (
            <section className="mx-3 mt-12 flex flex-col rounded-tile bg-white p-5 lg:hidden">
              <h2 className="m-0 mb-5 font-display text-5xl leading-[46px]">{tr("program.upcoming")}</h2>
              {upcoming.slice(0, 5).map((event, i, all) => (
                <EventRow key={event._id} event={event} locale={locale} words={words} last={i === all.length - 1} />
              ))}
              {upcoming.length > 5 && (
                <NextLink href={listHref("#seznam")} className={`${buttonClass("secondary", "md")} mt-5 self-start bg-white`}>
                  {tr("program.loadMore")}
                </NextLink>
              )}
            </section>
          )}
        </>
      )}

      {showList && (
        <section
          id="seznam"
          aria-labelledby="seznam-nadpis"
          className="mx-3 mt-6 flex scroll-mt-4 flex-col rounded-tile bg-white p-5 lg:mx-6 lg:mt-10 lg:rounded-card lg:p-10"
        >
          <h2 id="seznam-nadpis" className="sr-only">
            {tr("program.eventsList")}
          </h2>
          {shown.map((event, i) => {
            const day = pragueDay(event.startsAt);
            const firstOfDay = i === 0 || pragueDay(shown[i - 1].startsAt) !== day;
            return (
              <div key={event._id} id={firstOfDay ? dayAnchor(day) : undefined} className="scroll-mt-4">
                <EventRow event={event} locale={locale} words={words} last={i === shown.length - 1} />
              </div>
            );
          })}
        </section>
      )}

      <ChannelsBand socials={data.settings?.socials} feedUrl={feedUrl} showForm={showForm && !formInEmptyCard} anchor={!formInEmptyCard} />
    </>
  );
}
