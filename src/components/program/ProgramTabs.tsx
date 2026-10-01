import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";

const tab =
  "inline-flex min-h-12 items-center rounded-full border-2 border-transparent px-[18px] text-base leading-5 font-medium whitespace-nowrap text-muted no-underline hover:border-black hover:text-black lg:min-h-16 lg:px-8 lg:text-2xl lg:leading-7 aria-[current]:bg-black aria-[current]:text-white aria-[current]:hover:text-white";

/** "Akce | Kurzy & lekce" switch shared by /program and /kurzy. */
export async function ProgramTabs({ active }: { active: "events" | "courses" }) {
  const tr = await getTranslations("programTabs");
  return (
    <nav aria-label={tr("label")} className="flex gap-2">
      <Link href="/program" className={tab} aria-current={active === "events" ? "page" : undefined}>
        {tr("events")}
      </Link>
      <Link href="/kurzy" className={tab} aria-current={active === "courses" ? "page" : undefined}>
        {tr("courses")}
      </Link>
    </nav>
  );
}

/** Black/white outline filter chip ("Vše", "Kalendář", "Seznam", "Pro děti"…). */
export const filterChipClass =
  "inline-flex min-h-12 cursor-pointer items-center rounded-full border-2 border-black bg-white px-[18px] text-base leading-5 font-medium whitespace-nowrap text-black no-underline transition-opacity lg:min-h-14 lg:px-6 lg:text-lg lg:leading-6 aria-pressed:bg-black aria-pressed:text-white aria-[current]:bg-black aria-[current]:text-white";
