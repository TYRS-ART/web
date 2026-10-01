import type { Locale } from "@/i18n/locales";

import { EventTile, type TileSize } from "./EventTile";
import type { EventCard } from "./types";

type Slot = { span: string; height: string; size: TileSize };

const big: Slot = { span: "lg:col-span-8", height: "lg:h-[720px]", size: "xl" };
const tall: Slot = { span: "lg:col-span-4", height: "lg:h-[720px]", size: "m" };
const row = (spans: string[], sizes: TileSize[]): Slot[] =>
  spans.map((span, i) => ({ span, height: "lg:h-[480px]", size: sizes[i] }));

/** One large + one tall tile, then a row of up to three. No empty slots for 1–5 events. */
const layouts: Record<number, Slot[]> = {
  1: [{ span: "lg:col-span-12", height: "lg:h-[720px]", size: "xl" }],
  2: [big, tall],
  3: [big, tall, ...row(["lg:col-span-12"], ["xl"])],
  4: [big, tall, ...row(["lg:col-span-6", "lg:col-span-6"], ["l", "l"])],
  5: [big, tall, ...row(["lg:col-span-3", "lg:col-span-5", "lg:col-span-4"], ["s", "l", "l"])],
};

/** Mobile: one big tile, one medium, then pairs. */
function mobileClasses(index: number, count: number) {
  if (index === 0) return { height: "h-[440px]", size: "xl" as const, pair: false };
  if (index === 1) return { height: "h-[300px]", size: "m" as const, pair: false };
  const pairs = count - 2;
  const lonely = pairs % 2 === 1 && index === count - 1;
  return lonely
    ? { height: "h-[300px]", size: "m" as const, pair: false }
    : { height: "h-[240px]", size: "s" as const, pair: true };
}

export function EventMosaic({
  events,
  locale,
  words,
}: {
  events: EventCard[];
  locale: Locale;
  words: { today: string; tomorrow: string };
}) {
  const items = events.slice(0, 5);
  const slots = layouts[items.length];
  if (!slots) return null;
  return (
    <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-12 lg:gap-4">
      {items.map((event, index) => {
        const slot = slots[index];
        const mobile = mobileClasses(index, items.length);
        return (
          <EventTile
            key={event._id}
            event={event}
            locale={locale}
            words={words}
            size={slot.size}
            mobileSize={mobile.size}
            hideChipOnMobile={mobile.pair}
            className={`${mobile.pair ? "col-span-1" : "col-span-2"} ${mobile.height} ${slot.span} ${slot.height}`}
            sizes={index === 0 ? "(min-width: 1024px) 66vw, 100vw" : "(min-width: 1024px) 40vw, 100vw"}
          />
        );
      })}
    </div>
  );
}
