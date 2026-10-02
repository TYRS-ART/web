"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { cardButtonClass } from "./SideCards";

/** "Sdílet" (native share sheet, falls back to copying) + "Kopírovat odkaz", which confirms in place. */
export function ShareButtons({ title }: { title: string }) {
  const tr = useTranslations("detail");
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2400);
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
      <button
        type="button"
        onClick={copy}
        className={`${cardButtonClass.base} ${copied ? "border-black bg-black text-white" : cardButtonClass.outline} transition-colors duration-150`}
      >
        {copied ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1.5 1.5" />
            <path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.5-1.5" />
          </svg>
        )}
        {/* Announced to screen readers too. */}
        <span aria-live="polite">{copied ? tr("copied") : tr("copyLink")}</span>
      </button>
    </>
  );
}
