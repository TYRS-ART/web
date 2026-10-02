"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

/**
 * After an in-place page switch to a URL with #anchor (Newsletter, the phone
 * calendar's day circles), bring that anchor into view, as a full page load would.
 */
export function HashScroll() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (!id) return;
    const frame = requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: "start" }));
    return () => cancelAnimationFrame(frame);
  }, [pathname, searchParams]);
  return null;
}
