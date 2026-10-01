import { defineRouting } from "next-intl/routing";

import { defaultLocale, locales } from "./locales";

export const routing = defineRouting({
  locales,
  defaultLocale,
  // Czech lives at "/", English under "/en".
  localePrefix: "as-needed",
  localeDetection: false,
  pathnames: {
    "/": "/",
    "/program": "/program",
    "/program/[slug]": "/program/[slug]",
    "/kurzy": { cs: "/kurzy", en: "/courses" },
    "/kurzy/[slug]": { cs: "/kurzy/[slug]", en: "/courses/[slug]" },
    "/venue": "/venue",
    "/pronajem": { cs: "/pronajem", en: "/rental" },
    "/ochrana-soukromi": { cs: "/ochrana-soukromi", en: "/privacy" },
  },
});

export type AppPathname = keyof typeof routing.pathnames;
