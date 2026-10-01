import { getTranslations } from "next-intl/server";

import { filterChipClass } from "@/components/program/ProgramTabs";
import type { Locale } from "@/i18n/locales";
import { Link } from "@/i18n/navigation";
import { audienceTags, courseFocuses } from "@/lib/taxonomy";
import type { FilterId } from "@/lib/timetable";

/** Solid colour + darker ring when selected. */
const focusChip: Record<string, string> = {
  tanec: "bg-tanec! border-tanec! hover:shadow-[0_0_0_3px_var(--color-tanec-edge)] aria-[current]:shadow-[0_0_0_3px_var(--color-tanec-edge)]",
  hudba: "bg-hudba! border-hudba! hover:shadow-[0_0_0_3px_var(--color-hudba-edge)] aria-[current]:shadow-[0_0_0_3px_var(--color-hudba-edge)]",
  pohyb: "bg-pohyb! border-pohyb! hover:shadow-[0_0_0_3px_#e0c23a] aria-[current]:shadow-[0_0_0_3px_#e0c23a]",
};

/**
 * Vše / Tanec / Hudba / Pohyb / Pro děti / Začátečníci. Plain links that toggle the
 * `?filtr=` value, so filtered views are shareable and the back button works.
 */
export async function CourseFilters({
  locale,
  filters,
  hrefFor,
}: {
  locale: Locale;
  filters: FilterId[];
  hrefFor: (filters: FilterId[]) => { pathname: "/kurzy"; query: Record<string, string> };
}) {
  const tr = await getTranslations("courses");
  const toggle = (id: FilterId) => (filters.includes(id) ? filters.filter((f) => f !== id) : [...filters, id]);
  const anyFocus = courseFocuses.some((f) => filters.includes(f.id));

  return (
    <nav
      aria-label={tr("filters")}
      className="-mx-5 flex gap-2 overflow-x-auto px-5 py-1 [scrollbar-width:none] lg:mx-0 lg:flex-wrap lg:gap-2.5 lg:overflow-visible lg:px-0 [&::-webkit-scrollbar]:hidden"
    >
      <Link href={hrefFor([])} scroll={false} className={filterChipClass} aria-current={filters.length === 0 ? "true" : undefined}>
        {tr("all")}
      </Link>
      {courseFocuses.map((focus) => {
        const on = filters.includes(focus.id);
        return (
          <Link
            key={focus.id}
            href={hrefFor(toggle(focus.id))}
            scroll={false}
            aria-current={on ? "true" : undefined}
            className={`${filterChipClass} ${focusChip[focus.id]} text-black! transition-[box-shadow,opacity] duration-150 ${
              anyFocus && !on ? "opacity-45" : ""
            }`}
          >
            {focus[locale]}
            {on && (
              <span aria-hidden="true" className="ml-2.5 font-bold">
                ✓
              </span>
            )}
          </Link>
        );
      })}
      {audienceTags
        .filter((tag) => tag.id !== "pokrocili")
        .map((tag) => (
          <Link
            key={tag.id}
            href={hrefFor(toggle(tag.id))}
            scroll={false}
            className={filterChipClass}
            aria-current={filters.includes(tag.id) ? "true" : undefined}
          >
            {tag[locale]}
          </Link>
        ))}
    </nav>
  );
}
