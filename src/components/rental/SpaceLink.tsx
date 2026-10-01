"use client";

import type { MouseEvent, ReactNode } from "react";

/**
 * Space tile link. Without JS it loads `?prostor=…#poptavka` and the server preselects the
 * space. With JS it picks the space in the form right away and scrolls there, no reload.
 */
export function SpaceLink({
  href,
  space,
  className,
  children,
}: {
  href: string;
  space: string;
  className: string;
  children: ReactNode;
}) {
  function onClick(event: MouseEvent<HTMLAnchorElement>) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const select = document.getElementById("enquiry-space") as HTMLSelectElement | null;
    const target = document.getElementById("poptavka");
    // After a successful enquiry the form is gone; fall back to loading the link.
    if (!select || !target) return;
    event.preventDefault();
    if (Array.from(select.options).some((option) => option.value === space)) select.value = space;
    window.history.pushState(null, "", href);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  }

  return (
    <a href={href} onClick={onClick} className={className}>
      {children}
    </a>
  );
}
