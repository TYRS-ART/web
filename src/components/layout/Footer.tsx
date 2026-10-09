import NextLink from "@/components/ui/NextLink";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { Link } from "@/i18n/navigation";
import type { LAYOUT_QUERY_RESULT } from "@/sanity/types";

import { FooterLogo } from "./FooterLogo";

function Column({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="mb-1.5 text-[13px] leading-4 font-medium tracking-[0.06em] text-muted uppercase">{title}</span>
      {children}
    </div>
  );
}

const item = "text-[17px] leading-[26px] no-underline hover:text-green lg:text-[22px] lg:leading-8";

export async function Footer({
  settings,
  newsletterHref,
}: {
  settings: LAYOUT_QUERY_RESULT["settings"];
  newsletterHref: string;
}) {
  const tr = await getTranslations();
  const address = settings?.address;
  const socials = settings?.socials;

  return (
    <footer className="mt-14 flex flex-col gap-7 border-t-2 border-black px-5 pt-8 pb-6 lg:mt-24 lg:gap-10 lg:px-16 lg:pt-12 lg:pb-10">
      <div className="grid grid-cols-2 gap-x-4 gap-y-6 lg:grid-cols-4 lg:gap-8">
        <Column title={tr("footer.menu")}>
          <Link href="/program" className={item}>{tr("nav.program")}</Link>
          <Link href="/venue" className={item}>{tr("nav.venue")}</Link>
          <Link href="/pronajem" className={item}>{tr("nav.rental")}</Link>
          <Link href="/studio" className={item}>{tr("nav.studio")}</Link>
          <Link href="/manifest" className={item}>{tr("nav.manifesto")}</Link>
        </Column>
        <Column title={tr("footer.follow")}>
          {socials?.instagram && (
            <a href={socials.instagram} target="_blank" rel="noopener" className={item}>Instagram</a>
          )}
          {socials?.spotify && (
            <a href={socials.spotify} target="_blank" rel="noopener" className={item}>Spotify</a>
          )}
          <NextLink href={newsletterHref} className={item}>{tr("footer.newsletter")}</NextLink>
        </Column>
        {address?.street && (
          <Column title={tr("footer.where")}>
            <span className={`${item} flex flex-col`}>
              <span>{address.street}</span>
              {address.district && <span>{address.district}</span>}
              <span>{[address.postalCode, address.city].filter(Boolean).join(" ")}</span>
            </span>
          </Column>
        )}
        {(settings?.email || settings?.phone) && (
          <Column title={tr("footer.write")}>
            {settings.email && <a href={`mailto:${settings.email}`} className={item}>{settings.email}</a>}
            {settings.phone && <a href={`tel:${settings.phone.replace(/\s/g, "")}`} className={item}>{settings.phone}</a>}
            <Link href="/ochrana-soukromi" className={`${item} text-muted`}>{tr("footer.privacy")}</Link>
          </Column>
        )}
      </div>
      <FooterLogo />
    </footer>
  );
}
