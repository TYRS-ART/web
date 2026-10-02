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

/** Same photo = same thing (a repeated event, or a course's lessons). */
function photoKey(card: EventCard) {
  return card.heroImage?.asset?._ref ?? `title:${card.title?.cs ?? card._id}`;
}

/**
 * "Nejbližší události": up to `count` tiles, never the same photo twice. Events
 * come first (featured ones before the rest, then the nearest); lessons fill the
 * remaining places. The result is shown in date order.
 */
export function pickMosaic(events: EventCard[], lessons: EventCard[], count = 5): EventCard[] {
  const used = new Set<string>();
  const picked: EventCard[] = [];
  const take = (card: EventCard) => {
    if (picked.length >= count || picked.includes(card)) return;
    const key = photoKey(card);
    if (used.has(key)) return;
    used.add(key);
    picked.push(card);
  };
  events.filter((e) => e.featured).forEach(take);
  events.forEach(take);
  lessons.forEach(take);
  return picked.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}
