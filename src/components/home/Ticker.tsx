import type { Locale } from "@/i18n/locales";
import { formatTime } from "@/lib/dates";
import { dayLabel, headlinePrice } from "@/lib/events";
import { t } from "@/lib/localize";

import type { EventCard } from "@/components/events/types";

/** Scrolling "Dnes" band between two black rules. Text is duplicated for a seamless loop. */
export function Ticker({
  events,
  locale,
  words,
  label,
}: {
  events: EventCard[];
  locale: Locale;
  words: { today: string; tomorrow: string; tickets: string };
  label: string;
}) {
  const items = events.flatMap((event) => {
    const title = t(event.tickerText, locale) ?? t(event.title, locale);
    const hall = t(event.hall, locale);
    const price = headlinePrice(t(event.priceText, locale));
    const line = [`${dayLabel(event.startsAt, locale, words)} ${formatTime(event.startsAt)}`, title, hall].filter(Boolean).join(" — ");
    return [
      { key: `${event._id}-e`, text: line, dot: true },
      ...(price && event.ticketUrl ? [{ key: `${event._id}-p`, text: `${words.tickets} ${price}`, dot: false }] : []),
    ];
  });
  // Repeat short lists so one copy is always wider than the screen.
  const copies = Math.max(1, Math.ceil(6 / items.length));
  const run = Array.from({ length: copies }, () => items).flat();

  const strip = (hidden: boolean) => (
    <div aria-hidden={hidden || undefined} className="flex shrink-0 gap-10 pr-10 lg:gap-16 lg:pr-16">
      {run.map((item, i) => (
        <span key={`${item.key}-${i}`} className="inline-flex items-center gap-3.5 lg:gap-6">
          {item.dot && <span className="size-3.5 shrink-0 rounded-full bg-lime lg:size-5" />}
          {item.text}
        </span>
      ))}
    </div>
  );

  return (
    <section
      aria-label={label}
      className="mt-8 overflow-hidden border-y-2 border-black py-[18px] lg:mt-16 lg:py-8"
    >
      <div
        className="marquee font-display text-[28px] leading-[34px] tracking-[-0.02em] whitespace-nowrap uppercase lg:text-5xl lg:leading-[56px]"
        style={{ "--marquee-duration": `${Math.max(20, run.length * 5)}s` } as React.CSSProperties}
      >
        {strip(false)}
        {strip(true)}
      </div>
    </section>
  );
}
