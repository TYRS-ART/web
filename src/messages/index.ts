import type { Locale } from "@/i18n/locales";

// One file per area so pages can be worked on independently. Add new files here.
import csCommon from "./cs/common.json";
import csDetail from "./cs/detail.json";
import csHome from "./cs/home.json";
import csLayout from "./cs/layout.json";
import csNewsletter from "./cs/newsletter.json";
import enCommon from "./en/common.json";
import enDetail from "./en/detail.json";
import enHome from "./en/home.json";
import enLayout from "./en/layout.json";
import enNewsletter from "./en/newsletter.json";

export const messages = {
  cs: { ...csCommon, ...csLayout, ...csHome, ...csDetail, ...csNewsletter },
  en: { ...enCommon, ...enLayout, ...enHome, ...enDetail, ...enNewsletter },
} satisfies Record<Locale, object>;

export type Messages = (typeof messages)["cs"];
