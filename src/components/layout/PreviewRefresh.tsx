"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Draft preview only: re-renders the page shortly after any edit in the Studio,
 * by polling the latest edit time. Visitors never load this.
 */
export function PreviewRefresh({ interval = 1500 }: { interval?: number }) {
  const router = useRouter();
  useEffect(() => {
    let last: string | null | undefined;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    const tick = async () => {
      try {
        const response = await fetch("/api/draft-mode/revision", { cache: "no-store" });
        if (response.ok) {
          const { revision } = (await response.json()) as { revision: string | null };
          if (last !== undefined && revision !== last) router.refresh();
          last = revision;
        }
      } catch {
        // Offline or restarting dev server: try again next time.
      }
      // Background tabs check less often.
      if (!stopped) timer = setTimeout(tick, document.visibilityState === "visible" ? interval : interval * 6);
    };
    tick();
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [interval, router]);
  return null;
}
