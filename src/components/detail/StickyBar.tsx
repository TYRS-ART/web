import type { ReactNode } from "react";

/** Mobile only: black pill pinned to the bottom with date, title and the commit button. */
export function StickyBar({ meta, title, action }: { meta: string; title: string; action: ReactNode }) {
  return (
    <div className="fixed right-3 bottom-3 left-3 z-20 flex items-center justify-between gap-3 rounded-full bg-black py-2 pr-2 pl-5 text-white shadow-lg lg:hidden">
      <span className="flex min-w-0 flex-col">
        <span className="text-xs leading-[14px] opacity-70">{meta}</span>
        <span className="truncate text-[15px] leading-[18px] font-medium">{title}</span>
      </span>
      {action}
    </div>
  );
}

export const stickyActionClass =
  "inline-flex min-h-11 shrink-0 items-center rounded-full bg-lime px-[18px] text-[15px] leading-5 font-medium whitespace-nowrap text-black no-underline";
