import type { Locale } from "@/i18n/locales";
import { t, tSlug } from "@/lib/localize";
import type { Lesson } from "@/lib/timetable";
import type { COURSES_PAGE_QUERY_RESULT } from "@/sanity/types";

export type TimetableLesson = Lesson<COURSES_PAGE_QUERY_RESULT[number]>;

/** "18:00–19:30 · Začátečníci · Lektorka" for a lesson. */
export function meta(lesson: TimetableLesson, locale: Locale) {
  return [`${lesson.start}–${lesson.end}`, t(lesson.course.level, locale), lesson.course.lecturer].filter(Boolean).join(" · ");
}

/** The lesson's course page, when the course has an address. */
export function href(lesson: TimetableLesson, locale: Locale) {
  const slug = tSlug(lesson.course.slug, locale);
  return slug ? ({ pathname: "/kurzy/[slug]", params: { slug } } as const) : undefined;
}
