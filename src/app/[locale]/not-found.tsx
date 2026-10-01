import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";

export default async function NotFound() {
  const tr = await getTranslations("notFound");
  return (
    <section className="flex flex-col gap-8 px-5 pt-8 lg:gap-10 lg:px-16 lg:pt-12">
      <h1 className="m-0 font-display text-[52px] leading-[50px] lg:text-[120px] lg:leading-[108px]">{tr("title")}</h1>
      <p className="m-0 max-w-[640px] text-[17px] leading-[26px] lg:text-[22px] lg:leading-[34px]">{tr("text")}</p>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/program"
          className="inline-flex min-h-14 items-center rounded-full bg-black px-7 text-lg font-medium text-white no-underline hover:bg-green lg:min-h-16 lg:px-8 lg:text-xl"
        >
          {tr("program")} →
        </Link>
        <Link
          href="/"
          className="inline-flex min-h-14 items-center rounded-full border-2 border-black px-7 text-lg font-medium no-underline hover:bg-black hover:text-white lg:min-h-16 lg:px-8 lg:text-xl"
        >
          {tr("home")}
        </Link>
      </div>
    </section>
  );
}
