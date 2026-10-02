import type { EventCard } from "@/components/events/types";
import type { HOME_QUERY_RESULT } from "@/sanity/types";

import { minutes } from "./courses";
import { addDays, pragueMidnight } from "./dates";
import { lessonsBetween, type Lesson } from "./timetable";

type Course = HOME_QUERY_RESULT["courses"][number];

/** How far ahead the homepage looks for course lessons. */
export const LESSON_HORIZON_DAYS = 60;

/** UTC instant of a Prague day + "HH:MM". */
export function lessonInstant(day: string, time: string): string {
  return new Date(pragueMidnight(day).getTime() + minutes(time) * 60_000).toISOString();
}

/** Lessons from now on (today's already started ones dropped). */
export function upcomingLessons(courses: Course[], today: string, now: Date = new Date()): Lesson<Course>[] {
  return lessonsBetween(courses, today, addDays(today, LESSON_HORIZON_DAYS)).filter(
    (lesson) => Date.parse(lessonInstant(lesson.day, lesson.end)) > now.getTime(),
  );
}

/**
 * Each course's next lesson as an event-like card (category Lekce + the course's
 * focus when it's also an event category), so lists can mix events and classes.
 */
export function nextLessonCards(courses: Course[], today: string, now: Date = new Date()): EventCard[] {
  const seen = new Set<string>();
  const cards: EventCard[] = [];
  for (const lesson of upcomingLessons(courses, today, now)) {
    const course = lesson.course;
    if (seen.has(course._id)) continue;
    seen.add(course._id);
    cards.push({
      _id: `${course._id}-${lesson.day}`,
      title: course.title,
      slug: null,
      course: { slug: course.slug },
      startsAt: lessonInstant(lesson.day, lesson.start),
      categories: ["lekce", ...(course.focus === "tanec" || course.focus === "hudba" ? [course.focus] : [])],
      featured: false,
      priceText: null,
      tickerText: null,
      ticketUrl: null,
      hall: course.hall,
      heroImage: course.heroImage,
    });
  }
  return cards;
}
