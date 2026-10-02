"use client";

import { usePathname } from "next/navigation";
import { useIsPresentationTool } from "next-sanity/hooks";

/** Shown when draft preview is on outside the Studio: a way back to the published site. */
export function PreviewBar() {
  const inPresentation = useIsPresentationTool();
  const pathname = usePathname();
  if (inPresentation !== false) return null;
  return (
    <a
      href={`/api/draft-mode/disable?redirect=${encodeURIComponent(pathname)}`}
      className="fixed right-4 bottom-4 z-50 rounded-full bg-black px-5 py-3 text-[15px] font-medium text-white no-underline shadow-lg hover:bg-green"
    >
      Náhled konceptů · ukončit
    </a>
  );
}
