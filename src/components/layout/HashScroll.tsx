"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Makes in-place page switches behave like full page loads:
 * - a URL with #anchor (Newsletter, the phone calendar's day circles) scrolls to it;
 * - on a new page, the link that was clicked (e.g. in the header or footer, which
 *   stay) lets go of focus, so it doesn't later show the focus ring.
 */
export function HashScroll() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const previousPath = useRef(pathname);

  useEffect(() => {
    if (pathname !== previousPath.current) {
      previousPath.current = pathname;
      const active = document.activeElement;
      if (active instanceof HTMLAnchorElement) active.blur();
    }
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (id) document.getElementById(id)?.scrollIntoView({ block: "start" });
  }, [pathname, searchParams]);
  return null;
}
