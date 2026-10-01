"use client";

import type { ComponentProps } from "react";

import { Link, usePathname } from "@/i18n/navigation";

type Href = ComponentProps<typeof Link>["href"];

/** Desktop nav word: rolls on hover, underline wipes in; current section keeps it. */
export function NavLink({ href, label, match }: { href: Href; label: string; match?: string[] }) {
  const pathname = usePathname();
  const target = typeof href === "string" ? href : href.pathname;
  const current = (match ?? [target]).some((p) => pathname === p || pathname.startsWith(`${p}/`));
  return (
    <Link href={href} className="navlink" aria-current={current ? "page" : undefined}>
      <span className="rl">
        <i data-t={label}>{label}</i>
      </span>
    </Link>
  );
}
