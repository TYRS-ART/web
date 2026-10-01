"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { cardButtonClass } from "./SideCards";

/** "Sdílet" (native share sheet, falls back to copying) + "Kopírovat odkaz" with a toast. */
export function ShareButtons({ title }: { title: string }) {
  const tr = useTranslations("detail");
  const [toast, setToast] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setToast(true);
      window.setTimeout(() => setToast(false), 2400);
    } catch {
      window.prompt(tr("copyLink"), window.location.href);
    }
  }

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ title, url: window.location.href });
        return;
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
      }
    }
    await copy();
  }

  return (
    <>
      <button type="button" onClick={share} className={`${cardButtonClass.base} ${cardButtonClass.black}`}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M12 15V3M7 8l5-5 5 5" />
          <path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" />
        </svg>
        {tr("share")}
      </button>
      <button type="button" onClick={copy} className={`${cardButtonClass.base} ${cardButtonClass.outline}`}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1.5 1.5" />
          <path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.5-1.5" />
        </svg>
        {tr("copyLink")}
      </button>
      <span
        role="status"
        aria-live="polite"
        className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-black px-5 py-3 text-[15px] font-medium text-white transition-opacity duration-200 ${
          toast ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        {toast ? tr("copied") : ""}
      </span>
    </>
  );
}
