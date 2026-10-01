"use client";

import { useState } from "react";

export type LessonRow = {
  key: string;
  /** "1. lekce · Út 6. 10. · 18:00–19:30" */
  label: string;
  /** "1. · Út 6. 10." */
  shortLabel: string;
  /** "zkušební lekce 195 Kč" / "Malý sál" */
  aside?: string;
  /** "zkušební 195 Kč" / "18:00" */
  shortAside?: string;
  past: boolean;
};

/** Mobile shows this many dates and folds the rest behind "+ 4 další do 8. 12.". */
const MOBILE_VISIBLE = 6;

/** "Termíny": every lesson date, past ones dimmed. */
export function LessonDates({ title, rows, moreLabel }: { title: string; rows: LessonRow[]; moreLabel?: string }) {
  const [open, setOpen] = useState(false);
  const folded = !open && rows.length > MOBILE_VISIBLE;
  return (
    <div>
      <h2 className="m-0 mb-3 font-display text-[32px] leading-8 lg:mb-4 lg:text-5xl lg:leading-[48px]">{title}</h2>
      <ol className="m-0 list-none border-b-2 border-black p-0">
        {rows.map((row, i) => (
          <li
            key={row.key}
            className={`flex justify-between gap-4 border-t-2 border-black py-2.5 text-base leading-[22px] lg:py-3.5 lg:text-xl lg:leading-[26px] ${
              row.past ? "opacity-40" : ""
            } ${folded && i >= MOBILE_VISIBLE ? "max-lg:hidden" : ""}`}
          >
            <span className="lg:hidden">{row.shortLabel}</span>
            <span className="max-lg:hidden">{row.label}</span>
            {row.shortAside && <span className="text-right text-muted lg:hidden">{row.shortAside}</span>}
            {row.aside && <span className="text-right text-muted max-lg:hidden">{row.aside}</span>}
          </li>
        ))}
        {folded && moreLabel && (
          <li className="border-t-2 border-black lg:hidden">
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-expanded={false}
              className="w-full cursor-pointer bg-transparent py-2.5 text-left text-base leading-[22px] text-muted hover:text-black"
            >
              {moreLabel}
            </button>
          </li>
        )}
      </ol>
    </div>
  );
}
