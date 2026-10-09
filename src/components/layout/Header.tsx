import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { playlistArtwork } from "@/lib/spotify";
import type { LAYOUT_QUERY_RESULT } from "@/sanity/types";

import { LocaleNavLink } from "./LocaleSwitch";
import { MobileMenu } from "./MobileMenu";
import { NavLink } from "./NavLink";
import { NowPlaying } from "./NowPlaying";

export async function Header({ data, newsletterHref }: { data: LAYOUT_QUERY_RESULT; newsletterHref: string }) {
  const [tr, art] = await Promise.all([
    getTranslations("nav"),
    data.playlist ? playlistArtwork(data.playlist) : undefined,
  ]);
  return (
    <header className="relative z-20 flex items-center justify-between gap-6 px-5 py-4 lg:px-16 lg:py-7">
      <Link href="/" aria-label={tr("homeLabel")} className="inline-flex shrink-0">
        <Image
          src="/logos/logo-primary.svg"
          alt="TYRŠ"
          width={133}
          height={44}
          priority
          className="block h-[34px] w-auto lg:h-11"
        />
      </Link>

      <nav aria-label={tr("mainMenu")} className="hidden items-center gap-7 lg:flex xl:gap-11">
        <NavLink href="/program" label={tr("program")} match={["/program", "/kurzy"]} />
        <NavLink href="/venue" label={tr("venue")} />
        <NavLink href="/pronajem" label={tr("rental")} />
        <NavLink href="/studio" label={tr("studio")} />
        <LocaleNavLink />
      </nav>

      <div className="hidden lg:block">{data.playlist && <NowPlaying playlist={data.playlist} art={art} />}</div>

      <div className="flex items-center gap-2 lg:hidden">
        {data.playlist && <NowPlaying playlist={data.playlist} art={art} compact />}
        <MobileMenu today={data.today} settings={data.settings} newsletterHref={newsletterHref} />
      </div>
    </header>
  );
}
