import type { ComponentProps } from "react";

import { Link } from "@/i18n/navigation";

export function BackLink({ href, label, ariaLabel }: { href: ComponentProps<typeof Link>["href"]; label: string; ariaLabel: string }) {
  return (
    <nav aria-label={ariaLabel} className="flex gap-3 px-5 pt-1 pb-3 text-base leading-5 lg:px-16 lg:pt-2 lg:pb-6 lg:text-lg lg:leading-6">
      <Link href={href} className="text-muted no-underline hover:text-black">
        ← {label}
      </Link>
    </nav>
  );
}
