import { defineQuery } from "next-sanity";

import { imageFields } from "./shared";

/** Fields every course list needs (timetable slots, tiles). */
const courseCard = /* groq */ `
  _id, title, slug, focus, audienceTags, level, allowSingleLesson,
  "lecturer": lecturer->name,
  slots[]{ _key, weekday, startTime, endTime },
  runStart, runEnd, lessonsCount,
  "lessonDates": lessonDates[].date,
  heroImage{ ${imageFields} }
`;

/** /kurzy: every course whose run hasn't ended before $from (the earlier of today and the shown week). */
export const COURSES_PAGE_QUERY = defineQuery(`
  *[_type == "course" && (!defined(runEnd) || runEnd >= $from)] | order(runStart asc){ ${courseCard} }
`);

/** /kurzy/[slug]: the course in the requested language (falls back to the Czech slug) + courses still running (the page drops this one). */
export const COURSE_QUERY = defineQuery(`{
  "course": *[_type == "course" && (
    slug[$locale].current == $slug || (!defined(slug[$locale].current) && slug.cs.current == $slug)
  )][0]{
    _id, title, slug, focus, audienceTags, level,
    slots[]{ _key, weekday, startTime, endTime },
    runStart, runEnd, lessonsCount,
    lessonDates[]{ _key, date, isTrial, bookingUrl },
    coursePrice, allowSingleLesson, singleLessonPrice, trialPrice,
    bookingUrl, singleLessonBookingUrl, capacity, placesLeft,
    description, forWhom, whatToBring, goodToKnow,
    heroImage{ ${imageFields} },
    lecturer->{ name, role, bio, instagram, photo{ ${imageFields} } },
    space->{ name }
  },
  "others": *[_type == "course" && (!defined(runEnd) || runEnd >= $today)] | order(runStart asc){ ${courseCard} },
  "address": *[_id == "settings"][0].address{ street, district, postalCode, city }
}`);

/** Slugs of every course in both languages, for generateStaticParams. */
export const COURSE_SLUGS_QUERY = defineQuery(`
  *[_type == "course" && defined(slug.cs.current)]{ "cs": slug.cs.current, "en": slug.en.current }
`);
