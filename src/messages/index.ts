import type { Locale } from "@/i18n/locales";

// One file per area so pages can be worked on independently. Add new files here.
import csCommon from "./cs/common.json";
import csCourses from "./cs/courses.json";
import csDetail from "./cs/detail.json";
import csHome from "./cs/home.json";
import csLayout from "./cs/layout.json";
import csNewsletter from "./cs/newsletter.json";
import csPrivacy from "./cs/privacy.json";
import csProgram from "./cs/program.json";
import csRental from "./cs/rental.json";
import csStudio from "./cs/studio.json";
import csVenue from "./cs/venue.json";
import enCommon from "./en/common.json";
import enCourses from "./en/courses.json";
import enDetail from "./en/detail.json";
import enHome from "./en/home.json";
import enLayout from "./en/layout.json";
import enNewsletter from "./en/newsletter.json";
import enPrivacy from "./en/privacy.json";
import enProgram from "./en/program.json";
import enRental from "./en/rental.json";
import enStudio from "./en/studio.json";
import enVenue from "./en/venue.json";

export const messages = {
  cs: { ...csCommon, ...csLayout, ...csHome, ...csDetail, ...csNewsletter, ...csPrivacy, ...csCourses, ...csProgram, ...csRental, ...csStudio, ...csVenue },
  en: { ...enCommon, ...enLayout, ...enHome, ...enDetail, ...enNewsletter, ...enPrivacy, ...enCourses, ...enProgram, ...enRental, ...enStudio, ...enVenue },
} satisfies Record<Locale, object>;

export type Messages = (typeof messages)["cs"];
