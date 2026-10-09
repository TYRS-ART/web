import { getTranslations } from "next-intl/server";

import type { Locale } from "@/i18n/locales";
import { Link } from "@/i18n/navigation";
import { formatMonth } from "@/lib/dates";
import { buttonClass } from "@/components/ui/button";
import { EventRow } from "@/components/events/EventRow";
import type { EventCard } from "@/components/events/types";

/** "Říjen": the next four events as rows on a white card. */
export async function MonthList({ events, locale }: { events: EventCard[]; locale: Locale }) {
  const tr = await getTranslations();
  if (events.length === 0) return null;
  const words = { today: tr("common.today"), tomorrow: tr("common.tomorrow"), until: (date: string) => tr("common.until", { date }) };
  return (
    <section
      id="program"
      className="mx-3 mt-12 flex flex-col rounded-tile bg-white px-5 pt-11 pb-5 lg:mx-6 lg:mt-24 lg:rounded-card lg:px-10 lg:pt-[88px] lg:pb-10"
    >
      <div className="mb-4 flex items-end justify-between lg:mb-0 lg:pb-8">
        <h2 className="m-0 font-display text-[104px] leading-[92px] tracking-[-0.01em] lg:text-[200px] lg:leading-[168px]">
          {formatMonth(new Date(), locale)}
        </h2>
        <Link href="/program" className={`${buttonClass()} max-lg:hidden`}>
          {tr("home.allProgram")} →
        </Link>
      </div>
      {events.map((event, i) => (
        <EventRow key={event._id} event={event} locale={locale} words={words} last={i === events.length - 1} duotone={false} />
      ))}
      <Link href="/program" className={`${buttonClass()} mt-5 self-start lg:hidden`}>
        {tr("home.allProgram")} →
      </Link>
    </section>
  );
}
