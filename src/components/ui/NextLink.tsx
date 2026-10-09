import type { ComponentProps } from "react";
import Link from "next/link";

import { prefetchFor } from "@/lib/prefetch";

/** next/link for ready-made URLs, skipping prefetch of the pages rendered per request (see lib/prefetch). */
export default function NextLink(props: ComponentProps<typeof Link>) {
  const pathname = typeof props.href === "string" ? props.href : (props.href.pathname ?? "");
  return <Link prefetch={prefetchFor(pathname)} {...props} />;
}
