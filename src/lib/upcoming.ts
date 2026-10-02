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

type Photo = Course["heroImage"];

/** What a lesson card needs from its course (homepage and /kurzy queries both fit). */
type LessonCourse = Pick<Course, "_id" | "title" | "slug" | "focus" | "heroImage"> & { hall?: Course["hall"] };

/** A lesson as an event-like card (Lekce + the course's focus when it's also an event category). */
export function lessonCard(lesson: Lesson<LessonCourse>, heroImage: Photo = lesson.course.heroImage): EventCard {
  const course = lesson.course;
  return {
    _id: `${course._id}-${lesson.day}-${lesson.start}`,
    title: course.title,
    slug: null,
    course: { slug: course.slug },
    startsAt: lessonInstant(lesson.day, lesson.start),
    categories: ["lekce", ...(course.focus === "tanec" || course.focus === "hudba" ? [course.focus] : [])],
    featured: false,
    priceText: null,
    tickerText: null,
    ticketUrl: null,
    hall: course.hall ?? null,
    heroImage,
  };
}

/**
 * Each course's next lesson as an event-like card (category Lekce + the course's
 * focus when it's also an event category), so lists can mix events and classes.
 */
export function nextLessonCards(courses: Course[], today: string, now: Date = new Date()): EventCard[] {
  const seen = new Set<string>();
  const cards: EventCard[] = [];
  for (const lesson of upcomingLessons(courses, today, now)) {
    if (seen.has(lesson.course._id)) continue;
    seen.add(lesson.course._id);
    cards.push(lessonCard(lesson, lesson.course.heroImage));
  }
  return cards;
}

/**
 * Every upcoming lesson as a card. A course's lessons take turns with its photos
 * (main photo, "Další fotky", then the lecturer's photo) so they differ when they can.
 */
export function allLessonCards(courses: Course[], today: string, now: Date = new Date()): EventCard[] {
  const turn = new Map<string, number>();
  return upcomingLessons(courses, today, now).map((lesson) => {
    const course = lesson.course;
    const photos = [course.heroImage, ...(course.morePhotos ?? []), course.lecturerPhoto].filter(
      (photo): photo is NonNullable<Photo> => Boolean(photo?.asset),
    );
    const n = turn.get(course._id) ?? 0;
    turn.set(course._id, n + 1);
    return lessonCard(lesson, photos.length ? photos[n % photos.length] : course.heroImage);
  });
}

/** Same photo = same thing (a repeated event, or a course's lessons). */
function photoKey(card: EventCard) {
  return card.heroImage?.asset?._ref ?? `title:${card.title?.cs ?? card._id}`;
}

/** The mosaic shows at least this many tiles when the program has them… */
export const MOSAIC_MIN = 4;
/** …and at most this many (the largest layout). */
export const MOSAIC_MAX = 5;

/**
 * "Nejbližší události", shown in date order. Events come first (featured ones,
 * then the nearest), lessons fill the remaining places, and no photo appears
 * twice. When that leaves fewer than MOSAIC_MIN tiles, the nearest remaining
 * events and lessons are added even if their photo repeats.
 */
export function pickMosaic(events: EventCard[], lessons: EventCard[]): EventCard[] {
  const used = new Set<string>();
  const picked: EventCard[] = [];
  const take = (card: EventCard) => {
    if (picked.length >= MOSAIC_MAX || picked.includes(card)) return;
    const key = photoKey(card);
    if (used.has(key)) return;
    used.add(key);
    picked.push(card);
  };
  events.filter((e) => e.featured).forEach(take);
  events.forEach(take);
  lessons.forEach(take);

  const rest = [...events, ...lessons]
    .filter((card) => !picked.includes(card))
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  for (const card of rest) {
    if (picked.length >= MOSAIC_MIN) break;
    picked.push(card);
  }
  return picked.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}
