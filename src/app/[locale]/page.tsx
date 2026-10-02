import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { EventMosaic } from "@/components/events/EventMosaic";
import { CoursesThisWeek } from "@/components/home/CoursesThisWeek";
import { HeroSentence } from "@/components/home/HeroSentence";
import { MonthList } from "@/components/home/MonthList";
import { RentalBand } from "@/components/home/RentalBand";
import { Ticker } from "@/components/home/Ticker";
import { MapSection } from "@/components/MapSection";
import type { Locale } from "@/i18n/locales";
import { Link } from "@/i18n/navigation";
import { alternates } from "@/lib/metadata";
import { addDays, dayOffset, pragueDay, pragueDayRange } from "@/lib/dates";
import { nextLessonCards, pickMosaic } from "@/lib/upcoming";
import { sanityFetch } from "@/sanity/lib/fetch";
import { HOME_QUERY } from "@/sanity/queries/home";

export async function generateMetadata({ params }: PageProps<"/[locale]">): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  const tr = await getTranslations({ locale, namespace: "home" });
  return { title: { absolute: "TYRŠ" }, description: tr("metaDescription"), alternates: alternates("/", locale) };
}

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const locale = (await params).locale as Locale;
  setRequestLocale(locale);

  const now = new Date();
  const today = pragueDay(now);
  const weekStart = addDays(today, -((new Date(`${today}T12:00:00Z`).getUTCDay() + 6) % 7));
  const [data, tr] = await Promise.all([
    sanityFetch({
      query: HOME_QUERY,
      params: { now: now.toISOString(), ...pragueDayRange(today), today },
      tags: ["settings", "event", "course"],
    }),
    getTranslations(),
  ]);

  // Events still running (started earlier, end later) show "do 11. 10." instead of their start.
  const words = { today: tr("common.today"), tomorrow: tr("common.tomorrow"), until: (date: string) => tr("common.until", { date }) };
  // Events and each course's next lesson, in one timeline.
  const lessonCards = nextLessonCards(data.courses, today, now);
  const upcoming = [...data.upcoming, ...lessonCards].sort((a, b) => a.startsAt.localeCompare(b.startsAt));

  // Ticker: today's and the next events, shown only when something is on today or tomorrow.
  const ticker = upcoming.filter((e) => dayOffset(e.startsAt, now) <= 1).length > 0 ? upcoming.slice(0, 5) : [];

  // Mosaic: events first, then each course once (its next lesson), in date order (see pickMosaic).
  const mosaic = pickMosaic(data.upcoming, lessonCards);

  const heroBlocks = data.settings?.heroSentence?.[locale] ?? data.settings?.heroSentence?.cs;

  return (
    <>
      {heroBlocks && <HeroSentence blocks={heroBlocks} locale={locale} />}

      {ticker.length > 0 && (
        <Ticker events={ticker} locale={locale} words={{ ...words, tickets: tr("home.tickets") }} label={tr("home.tickerLabel")} />
      )}

      {mosaic.length > 0 && (
        <section
          aria-label={tr("home.upcoming")}
          className="mx-3 mt-3 flex flex-col gap-2.5 rounded-tile bg-white p-4 lg:mx-6 lg:mt-6 lg:gap-4 lg:rounded-card lg:p-8"
        >
          <div className="flex items-center justify-between pb-1 lg:pb-2">
            <span className="text-[15px] leading-5 font-medium text-muted lg:text-lg lg:leading-6">{tr("home.upcoming")}</span>
            <Link href="/program" className="text-[15px] leading-5 font-medium no-underline hover:text-green lg:text-lg lg:leading-6">
              {tr("home.allProgram")} <span aria-hidden="true">→</span>
            </Link>
          </div>
          <EventMosaic events={mosaic} locale={locale} words={words} />
        </section>
      )}

      <CoursesThisWeek courses={data.courses} locale={locale} today={today} weekStart={weekStart} />

      <MonthList events={upcoming.slice(0, 4)} locale={locale} />

      <RentalBand band={data.settings?.rentalBand ?? null} locale={locale} />

      <MapSection address={data.settings?.address} locale={locale} />
    </>
  );
}
