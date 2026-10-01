"use client";

import { useRouter } from "next/navigation";
import { useOptimistic, useTransition, type ReactNode } from "react";

/**
 * Toggle button (filters, Kalendář / Seznam) that pushes a new query string, so the
 * state stays in the URL and the back button works. The page re-renders on the server.
 */
export function QueryToggle({
  href,
  pressed,
  pressedAfter = !pressed,
  className,
  children,
}: {
  href: string;
  pressed: boolean;
  /** State right after the click, shown while the page loads ("Vše" and view buttons stay on). */
  pressedAfter?: boolean;
  className: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(pressed);
  return (
    <button
      type="button"
      aria-pressed={optimistic}
      aria-busy={pending || undefined}
      className={className}
      onClick={() =>
        startTransition(() => {
          setOptimistic(pressedAfter);
          router.push(href, { scroll: false });
        })
      }
    >
      {children}
    </button>
  );
}
