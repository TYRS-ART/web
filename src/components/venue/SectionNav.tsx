"use client";

import { useEffect, useState } from "react";

/** Mobile "Kdo / Kde / Jak" chips. The chip of the section in view is filled black. */
export function SectionNav({ label, sections }: { label: string; sections: { id: string; title: string }[] }) {
  const [active, setActive] = useState(sections[0]?.id);

  useEffect(() => {
    const elements = sections.map((s) => document.getElementById(s.id)).filter((el): el is HTMLElement => Boolean(el));
    const visible = new Map<string, boolean>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) visible.set(entry.target.id, entry.isIntersecting);
        const first = sections.find((s) => visible.get(s.id));
        if (first) setActive(first.id);
      },
      // A section counts as current while it crosses the upper part of the screen.
      { rootMargin: "-20% 0px -60% 0px" },
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [sections]);

  if (sections.length < 2) return null;

  return (
    <nav aria-label={label} className="flex gap-2 px-5 pt-4 lg:hidden">
      {sections.map((s) => {
        const on = s.id === active;
        return (
          <a
            key={s.id}
            href={`#${s.id}`}
            aria-current={on ? "location" : undefined}
            onClick={() => setActive(s.id)}
            className={`inline-flex min-h-12 items-center rounded-full border-2 border-black px-[18px] text-base leading-5 font-medium no-underline ${
              on ? "bg-black text-white" : "bg-white text-black"
            }`}
          >
            {s.title}
          </a>
        );
      })}
    </nav>
  );
}
