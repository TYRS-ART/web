import { getTranslations } from "next-intl/server";

import { NewsletterForm } from "@/components/newsletter/NewsletterForm";

type Channel = { name: string; note: string; href: string; external: boolean };

/** "@tyrs.human.lab" from "https://www.instagram.com/tyrs.human.lab/" */
function instagramHandle(url: string) {
  const handle = url.replace(/^https?:\/\/(www\.)?instagram\.com\//, "").split(/[/?#]/)[0];
  return handle ? `@${handle}` : undefined;
}

/**
 * Black band "Nechceš nic propásnout?": Instagram, WhatsApp, Spotify (each only when set in
 * Sanity), the iCal feed and, when Mailchimp is configured, the email signup.
 */
export async function ChannelsBand({
  socials,
  feedUrl,
  showForm,
  anchor,
}: {
  socials: { instagram?: string; spotify?: string; whatsapp?: string } | null | undefined;
  feedUrl: string;
  showForm: boolean;
  /** Carries id="newsletter" (footer link target) unless the empty-month card has the form. */
  anchor: boolean;
}) {
  const tr = await getTranslations("program");
  const channels: Channel[] = [];
  if (socials?.instagram) {
    const handle = instagramHandle(socials.instagram);
    channels.push({
      name: "Instagram",
      note: [handle, tr("instagramNote")].filter(Boolean).join(" · "),
      href: socials.instagram,
      external: true,
    });
  }
  if (socials?.whatsapp) {
    channels.push({ name: tr("whatsapp"), note: tr("whatsappNote"), href: socials.whatsapp, external: true });
  }
  if (socials?.spotify) {
    channels.push({ name: "Spotify", note: tr("spotifyNote"), href: socials.spotify, external: true });
  }
  channels.push({ name: tr("calendarFeed"), note: tr("calendarFeedNote"), href: feedUrl, external: false });

  return (
    <section
      id={anchor ? "newsletter" : undefined}
      aria-labelledby="kanaly"
      className="mt-16 grid scroll-mt-4 gap-4 bg-black px-5 py-12 text-white lg:mt-28 lg:grid-cols-12 lg:items-center lg:gap-8 lg:px-16 lg:py-20"
    >
      <h2 id="kanaly" className="m-0 font-display text-5xl leading-[46px] lg:col-span-5 lg:text-[96px] lg:leading-[88px]">
        {tr("channelsTitle")}
      </h2>
      <div className="flex flex-col gap-4 lg:col-span-7 lg:gap-5">
        <p className="m-0 text-base leading-6 opacity-80 lg:text-xl lg:leading-7">{tr("channelsText")}</p>
        <ul className="m-0 grid list-none gap-2 p-0 lg:grid-cols-2 lg:gap-3">
          {channels.map((channel) => (
            <li key={channel.name}>
              <a
                href={channel.href}
                {...(channel.external ? { target: "_blank", rel: "noopener" } : {})}
                className="flex min-h-16 items-center justify-between gap-3 rounded-tile border-2 border-white/50 px-5 text-white no-underline transition-colors hover:border-white lg:min-h-[88px] lg:rounded-[20px] lg:px-7"
              >
                <span className="flex flex-col">
                  <span className="font-display text-2xl leading-[26px] lg:text-[32px] lg:leading-[34px]">{channel.name}</span>
                  <span className="text-[13px] leading-4 opacity-70 lg:text-sm lg:leading-[18px]">{channel.note}</span>
                </span>
                <span aria-hidden="true" className="text-[22px] lg:text-[28px]">
                  →
                </span>
              </a>
            </li>
          ))}
        </ul>
        {showForm && (
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
            <span className="text-sm leading-[18px] whitespace-nowrap opacity-70 lg:text-base lg:leading-5">{tr("orEmail")}</span>
            <NewsletterForm band className="lg:flex-1" />
          </div>
        )}
      </div>
    </section>
  );
}
