import { getTranslations } from "next-intl/server";

import type { Locale } from "@/i18n/locales";
import { Link } from "@/i18n/navigation";
import { t } from "@/lib/localize";
import { buttonClass } from "@/components/ui/button";
import type { HOME_QUERY_RESULT } from "@/sanity/types";

type Band = NonNullable<HOME_QUERY_RESULT["settings"]>["rentalBand"];

/** Butter "Pronájem" invitation band. */
export async function RentalBand({ band, locale }: { band: Band; locale: Locale }) {
  const tr = await getTranslations("home");
  const title = t(band?.title, locale);
  if (!title) return null;
  const text = t(band?.text, locale);
  return (
    <section
      aria-label={tr("spaces")}
      className="mt-16 flex flex-col gap-5 bg-butter px-5 py-12 text-black lg:mt-28 lg:grid lg:grid-cols-12 lg:items-end lg:gap-8 lg:px-16 lg:py-24"
    >
      <h2 className="m-0 font-display text-[52px] leading-[50px] lg:col-span-8 lg:text-[112px] lg:leading-[100px]">{title}</h2>
      <div className="flex flex-col gap-5 lg:col-span-4 lg:gap-6">
        {text && <p className="m-0 text-[17px] leading-[26px] lg:text-[22px] lg:leading-8">{text}</p>}
        <div className="flex flex-wrap gap-3">
          <Link href={{ pathname: "/pronajem", hash: "poptavka" }} className={buttonClass("primary")}>
            {tr("enquire")}
          </Link>
          <Link href={{ pathname: "/pronajem", hash: "prostory" }} className={buttonClass("secondary")}>
            {tr("spaces")}
          </Link>
        </div>
      </div>
    </section>
  );
}
