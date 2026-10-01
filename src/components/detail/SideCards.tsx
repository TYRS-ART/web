import type { ComponentProps, ReactNode } from "react";

import { Link } from "@/i18n/navigation";
import { nbsp } from "@/lib/typography";

const card = "box-border flex flex-col rounded-[14px] bg-white p-5 lg:rounded-[20px]";

/** "Dobré vědět" bullet card. Hidden without items. */
export function GoodToKnowCard({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className={`${card} gap-3 lg:gap-4 lg:p-8`}>
      <h2 className="m-0 font-display text-[26px] leading-7 lg:text-[32px] lg:leading-[34px]">{title}</h2>
      <ul className="m-0 flex list-disc flex-col gap-1.5 pl-[18px] text-base leading-6 lg:gap-2 lg:pl-5 lg:text-lg lg:leading-7">
        {items.map((item) => (
          <li key={item}>{nbsp(item)}</li>
        ))}
      </ul>
    </div>
  );
}

/** White card with labelled groups of pill buttons ("Poslechni si", "Sdílet"). */
export function LinksCard({ groups }: { groups: { label: string; content: ReactNode }[] }) {
  return (
    <div className={`${card} gap-3 lg:gap-4 lg:px-8 lg:py-7`}>
      {groups.map((group, i) => (
        <div key={group.label} className="flex flex-col gap-3 lg:gap-4">
          {i > 0 && <div className="my-1 h-px bg-sunken lg:my-1.5" />}
          <span className="text-sm leading-5 text-muted lg:text-base">{group.label}</span>
          <div className="flex gap-2">{group.content}</div>
        </div>
      ))}
    </div>
  );
}

export const cardButtonClass = {
  base: "inline-flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-full border-2 px-4 text-[15px] font-medium whitespace-nowrap no-underline lg:min-h-12 lg:text-base",
  green: "border-green bg-green text-white",
  black: "border-black bg-black text-white hover:bg-green hover:border-green",
  outline: "border-black bg-transparent text-black hover:bg-black hover:text-white",
};

/** Butter invitation card ("Chceš u nás něco uspořádat? Pronájem prostor →"). */
export function ButterCard({
  href,
  kicker,
  title,
}: {
  href: ComponentProps<typeof Link>["href"];
  kicker: string;
  title: string;
}) {
  return (
    <Link href={href} className={`${card} gap-2 bg-butter! text-black no-underline lg:p-8`}>
      <span className="text-sm leading-5 text-muted lg:text-base">{kicker}</span>
      <span className="font-display text-[32px] leading-8 lg:text-[40px] lg:leading-10">{title}</span>
    </Link>
  );
}

export function SpotifyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="currentColor" />
      <path
        d="M7 9.5c3.5-1 7-.6 10 1M7.5 12.5c3-.8 5.8-.4 8.3.9M8 15.3c2.4-.6 4.6-.3 6.6.7"
        stroke="#204f25"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}
