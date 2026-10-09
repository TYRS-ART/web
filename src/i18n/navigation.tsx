import type { ComponentProps } from "react";
import { createNavigation } from "next-intl/navigation";

import { prefetchFor } from "@/lib/prefetch";

import { routing } from "./routing";

const navigation = createNavigation(routing);

export const { redirect, usePathname, useRouter, getPathname } = navigation;

/** next-intl's Link that skips prefetching the pages rendered per request (see lib/prefetch). */
export function Link(props: ComponentProps<typeof navigation.Link>) {
  const pathname = typeof props.href === "string" ? props.href : props.href.pathname;
  return <navigation.Link prefetch={prefetchFor(pathname)} {...props} />;
}
