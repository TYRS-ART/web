import type { PortableTextBlock } from "@portabletext/react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { CourseTile } from "@/components/courses/CourseTile";
import { FocusChip } from "@/components/courses/FocusChip";
import { LessonDates, type LessonRow } from "@/components/courses/LessonDates";
import { BackLink } from "@/components/detail/BackLink";
import { Badge, DetailHero } from "@/components/detail/DetailHero";
import { BandNote, bandCommitClass, bandOutlineClass, InfoBand, type InfoItem } from "@/components/detail/InfoBand";
import { Lead, RichText } from "@/components/detail/RichText";
import { ShareButtons } from "@/components/detail/ShareButtons";
import { ButterCard, GoodToKnowCard, LinksCard } from "@/components/detail/SideCards";
import { StickyBar, stickyActionClass } from "@/components/detail/StickyBar";
import { SetAlternates } from "@/components/layout/AlternateLinks";
import { buttonClass } from "@/components/ui/button";
import { CategoryChip } from "@/components/ui/CategoryChip";
import { SanityImage } from "@/components/ui/SanityImage";
import { locales, type Locale } from "@/i18n/locales";
import { getPathname, Link } from "@/i18n/navigation";
import { minutes, shortTime, weekdayShort } from "@/lib/courses";
import { formatShortDate, pragueDay } from "@/lib/dates";
import { t, tSlug } from "@/lib/localize";
import { formatDay, formatPrice, formatRun, keepDashWithNext, lessonTimes, lessonTotal, slotsBadge } from "@/lib/timetable";
import { nbsp } from "@/lib/typography";
import { sanityFetch } from "@/sanity/lib/fetch";
import { urlFor } from "@/sanity/lib/image";
import { COURSE_QUERY, COURSE_SLUGS_QUERY } from "@/sanity/queries/courses";
import type { COURSE_QUERY_RESULT } from "@/sanity/types";

type Course = NonNullable<COURSE_QUERY_RESULT["course"]>;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tyrs.art";
const schemaDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export async function generateStaticParams({ params }: { params: { locale: string } }) {
  const slugs = await sanityFetch({ query: COURSE_SLUGS_QUERY, tags: ["course"] });
  return slugs
    .map((s) => (params.locale === "en" ? (s.en ?? s.cs) : s.cs))
    .filter((slug): slug is string => Boolean(slug))
    .map((slug) => ({ slug }));
}

async function load(locale: Locale, slug: string) {
  const today = pragueDay(new Date());
  return sanityFetch({ query: COURSE_QUERY, params: { locale, slug: decodeURIComponent(slug), today }, tags: ["course", "settings"] });
}

/** Path of the course in each language (English falls back to the Czech slug). */
function paths(course: Course) {
  return Object.fromEntries(
    locales.map((l) => {
      const slug = tSlug(course.slug, l)!;
      return [l, getPathname({ href: { pathname: "/kurzy/[slug]", params: { slug } }, locale: l })];
    }),
  ) as Record<Locale, string>;
}

function plainText(blocks: PortableTextBlock[] | undefined) {
  const first = blocks?.find((b) => b._type === "block");
  return (first?.children as { text?: string }[] | undefined)?.map((c) => c.text ?? "").join("") ?? "";
}

function sortedSlots(course: Pick<Course, "slots">) {
  return [...(course.slots ?? [])].sort((a, b) => a.weekday - b.weekday || minutes(a.startTime) - minutes(b.startTime));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/kurzy/[slug]">): Promise<Metadata> {
  const { locale: raw, slug } = await params;
  const locale = raw as Locale;
  const { course } = await load(locale, slug);
  if (!course) return {};
  const title = t(course.title, locale) ?? "";
  const description =
    plainText(t(course.description, locale) as PortableTextBlock[] | undefined) ||
    [t(course.level, locale), slotsBadge(course.slots, locale)].filter(Boolean).join(" · ");
  const urls = paths(course);
  const image = course.heroImage?.asset
    ? urlFor(course.heroImage as Parameters<typeof urlFor>[0]).width(1200).height(630).fit("crop").url()
    : undefined;
  return {
    title,
    description: description.length > 160 ? `${description.slice(0, 157).trimEnd()}…` : description,
    alternates: { canonical: urls[locale], languages: urls },
    openGraph: {
      title,
      description,
      url: urls[locale],
      type: "website",
      ...(image ? { images: [{ url: image, width: 1200, height: 630 }] } : {}),
    },
  };
}

export default async function CoursePage({ params }: PageProps<"/[locale]/kurzy/[slug]">) {
  const { locale: raw, slug } = await params;
  const locale = raw as Locale;
  setRequestLocale(locale);

  const [{ course, others, address }, tr] = await Promise.all([load(locale, slug), getTranslations()]);
  if (!course) notFound();

  const now = new Date();
  const today = pragueDay(now);
  const title = t(course.title, locale) ?? "";
  const slots = sortedSlots(course);
  const level = t(course.level, locale);
  const spaceName = t(course.space?.name, locale);
  const street = address?.street?.replace(/\/\d+\w*$/, "");
  const urls = paths(course);
  const price = (amount: number) => formatPrice(amount, locale);
  const singlePrice = course.allowSingleLesson && course.singleLessonPrice != null ? course.singleLessonPrice : undefined;

  /* ----- Info band */
  const items: InfoItem[] = [];
  if (slots.length > 0) {
    const sameTime = slots.every((s) => s.startTime === slots[0].startTime && s.endTime === slots[0].endTime);
    const time = (s: (typeof slots)[number]) => `${s.startTime}–${s.endTime}`;
    items.push({
      label: tr("course.when"),
      value:
        slots.length === 1 ? (
          <>
            {tr("course.every", { weekday: String(slots[0].weekday) })}
            <br />
            {time(slots[0])}
          </>
        ) : sameTime ? (
          <>
            {slots.map((s) => weekdayShort(s.weekday, locale)).join(" · ")}
            <br />
            {time(slots[0])}
          </>
        ) : (
          slots.map((s, i) => (
            <span key={s._key}>
              {i > 0 && <br />}
              {weekdayShort(s.weekday, locale)} {time(s)}
            </span>
          ))
        ),
    });
  }

  const dates = [...(course.lessonDates ?? [])].sort((a, b) => a.date.localeCompare(b.date));
  const runStart = course.runStart ?? (dates[0] ? pragueDay(dates[0].date) : undefined);
  const runEnd = course.runEnd ?? (dates.length > 0 ? pragueDay(dates[dates.length - 1].date) : undefined);
  const total = lessonTotal(course);
  if (runStart && runEnd) {
    items.push({
      label: tr("course.run"),
      value: formatRun(runStart, runEnd, locale),
      sub: total ? tr("courses.lessonCount", { count: total }) : undefined,
    });
  }

  const place = spaceName || street;
  const placeLink = place ? (
    <Link href="/venue" className="text-white underline underline-offset-2 hover:text-lime">
      {spaceName && street ? (
        <>
          {spaceName}
          <span className="max-lg:hidden">, {street}</span>
        </>
      ) : (
        place
      )}
    </Link>
  ) : undefined;
  if (course.lecturer?.name) {
    items.push({ label: t(course.lecturer.role, locale) || tr("course.lecturer"), value: course.lecturer.name, sub: placeLink });
  } else if (spaceName) {
    items.push({ label: tr("course.where"), value: spaceName, sub: street });
  }

  if (course.coursePrice != null) {
    items.push({
      label: tr("course.price"),
      value: price(course.coursePrice),
      sub: (
        <>
          <span className="lg:hidden">{tr("course.wholeCourseShort")}</span>
          <span className="max-lg:hidden">{tr("course.wholeCourse")}</span>
          {singlePrice != null && ` · ${tr("course.perLesson", { price: price(singlePrice) })}`}
        </>
      ),
    });
  } else if (singlePrice != null) {
    items.push({ label: tr("course.price"), value: tr("course.perLesson", { price: price(singlePrice) }) });
  }

  const placesNote =
    course.placesLeft == null
      ? undefined
      : course.placesLeft === 0
        ? tr("course.full")
        : course.capacity
          ? tr("course.placesLeftOf", { left: course.placesLeft, capacity: course.capacity })
          : tr("course.placesLeft", { left: course.placesLeft });

  /* ----- Body */
  const description = (t(course.description, locale) ?? []) as PortableTextBlock[];
  const leadBlock = description[0]?._type === "block" && (description[0].style ?? "normal") === "normal" ? description[0] : undefined;
  const lead = leadBlock ? plainText([leadBlock]) : "";
  const rest = leadBlock ? description.slice(1) : description;

  const infoCards = [
    { label: tr("course.forWhom"), text: t(course.forWhom, locale) },
    { label: tr("course.whatToBring"), text: t(course.whatToBring, locale) },
  ].filter((c): c is { label: string; text: string } => Boolean(c.text?.trim()));

  const rows: LessonRow[] = dates.map((lesson, i) => {
    const times = lessonTimes(slots, lesson.date);
    const trial = lesson.isTrial
      ? {
          aside: [tr("course.trial"), course.trialPrice != null && price(course.trialPrice)].filter(Boolean).join(" "),
          shortAside: [tr("course.trialShort"), course.trialPrice != null && price(course.trialPrice)].filter(Boolean).join(" "),
        }
      : undefined;
    return {
      key: lesson._key,
      label: `${tr("course.lessonNo", { n: i + 1 })} · ${formatShortDate(lesson.date, locale)} · ${times.start}–${times.end}`,
      shortLabel: `${tr("course.lessonNoShort", { n: i + 1 })} · ${formatShortDate(lesson.date, locale)}`,
      aside: trial?.aside ?? spaceName,
      shortAside: trial?.shortAside ?? times.start,
      past: new Date(lesson.date) < now,
    };
  });
  const lastDay = dates.length > 0 ? pragueDay(dates[dates.length - 1].date) : undefined;

  const goodToKnow = (course.goodToKnow ?? []).map((item) => t(item, locale)).filter((s): s is string => Boolean(s));

  /* ----- Other courses: new runs first, then the ones already running, by weekday */
  const more = others
    .filter((c) => c._id !== course._id)
    .map((c) => ({ c, first: sortedSlots(c)[0] }))
    .sort((a, b) => {
      const aNew = a.c.runStart && a.c.runStart >= today ? 0 : 1;
      const bNew = b.c.runStart && b.c.runStart >= today ? 0 : 1;
      if (aNew !== bNew) return aNew - bNew;
      if (aNew === 0) return a.c.runStart!.localeCompare(b.c.runStart!);
      return (a.first?.weekday ?? 8) - (b.first?.weekday ?? 8) || minutes(a.first?.startTime ?? "0:00") - minutes(b.first?.startTime ?? "0:00");
    })
    .slice(0, 3)
    .map(({ c }) => c);

  /* ----- Mobile sticky bar */
  const stickyMeta = [
    slots.length === 1 ? `${weekdayShort(slots[0].weekday, locale)} ${shortTime(slots[0].startTime)}` : slotsBadge(slots, locale),
    runStart && runStart > today ? tr("courses.from", { date: formatDay(runStart, locale) }) : undefined,
  ]
    .filter(Boolean)
    .join(" · ");

  /* ----- schema.org */
  const location = {
    "@type": "Place",
    name: spaceName ? `TYRŠ — ${spaceName}` : "TYRŠ",
    ...(address?.street
      ? {
          address: {
            "@type": "PostalAddress",
            streetAddress: address.street,
            postalCode: address.postalCode ?? undefined,
            addressLocality: address.city ?? undefined,
            addressCountry: "CZ",
          },
        }
      : {}),
  };
  const offers = [
    course.coursePrice != null && {
      "@type": "Offer",
      category: "Paid",
      price: course.coursePrice,
      priceCurrency: "CZK",
      url: course.bookingUrl,
      ...(course.placesLeft === 0 ? { availability: "https://schema.org/SoldOut" } : {}),
    },
    singlePrice != null && {
      "@type": "Offer",
      category: "Paid",
      name: tr("course.singleLesson"),
      price: singlePrice,
      priceCurrency: "CZK",
      url: course.singleLessonBookingUrl || course.bookingUrl,
    },
  ].filter(Boolean);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: title,
    description: plainText(description) || undefined,
    url: `${SITE_URL}${urls[locale]}`,
    inLanguage: locale,
    ...(course.heroImage?.asset ? { image: urlFor(course.heroImage as Parameters<typeof urlFor>[0]).width(1200).url() } : {}),
    provider: { "@type": "Organization", name: "TYRŠ", url: SITE_URL },
    ...(offers.length > 0 ? { offers } : {}),
    hasCourseInstance: slots.map((s) => ({
      "@type": "CourseInstance",
      courseMode: "Onsite",
      location,
      ...(runStart ? { startDate: runStart } : {}),
      ...(runEnd ? { endDate: runEnd } : {}),
      ...(course.lecturer?.name ? { instructor: { "@type": "Person", name: course.lecturer.name } } : {}),
      courseSchedule: {
        "@type": "Schedule",
        repeatFrequency: "P1W",
        byDay: `https://schema.org/${schemaDays[s.weekday - 1]}`,
        startTime: s.startTime,
        endTime: s.endTime,
        scheduleTimezone: "Europe/Prague",
        ...(runStart ? { startDate: runStart } : {}),
        ...(runEnd ? { endDate: runEnd } : {}),
      },
    })),
  };

  return (
    <>
      <SetAlternates cs={urls.cs} en={urls.en} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      <BackLink href="/kurzy" label={tr("course.back")} ariaLabel={tr("detail.breadcrumb")} />

      <DetailHero
        size="course"
        image={course.heroImage}
        title={keepDashWithNext(nbsp(title))}
        label={tr("course.photo")}
        fallbackClass="cl cl-lekce"
        badges={
          <>
            {spaceName && (
              <span className="max-lg:hidden">
                <Badge>{spaceName}</Badge>
              </span>
            )}
            <CategoryChip category="lekce" locale={locale} />
            {course.focus && <FocusChip focus={course.focus} />}
            {level && <Badge>{level}</Badge>}
          </>
        }
      />

      <InfoBand
        label={tr("course.facts")}
        items={items}
        actions={
          <>
            {course.bookingUrl && (
              <a href={course.bookingUrl} target="_blank" rel="noopener" className={bandCommitClass}>
                {tr("course.book")}
              </a>
            )}
            {course.allowSingleLesson && (course.singleLessonBookingUrl || course.bookingUrl) && (
              <a href={course.singleLessonBookingUrl || course.bookingUrl || undefined} target="_blank" rel="noopener" className={bandOutlineClass}>
                {tr("course.singleLesson")}
                {singlePrice != null && ` · ${price(singlePrice)}`}
              </a>
            )}
            {placesNote && <BandNote>{placesNote}</BandNote>}
          </>
        }
      />

      <section className="flex flex-col gap-6 px-5 pt-12 lg:grid lg:grid-cols-12 lg:gap-8 lg:px-16 lg:pt-24">
        <article className="flex flex-col gap-6 lg:col-span-8 lg:gap-10">
          {lead && <Lead>{nbsp(lead)}</Lead>}
          {rest.length > 0 && (
            <div className="flex flex-col gap-4 text-muted lg:gap-6">
              <RichText value={rest} />
            </div>
          )}

          {infoCards.length > 0 && (
            <div className="flex flex-col gap-6 lg:grid lg:grid-cols-2 lg:gap-4">
              {infoCards.map(({ label, text }) => {
                const [first, ...more] = text.trim().split(/\n+/);
                return (
                  <div key={label} className="flex flex-col gap-2 rounded-[14px] bg-white p-5 lg:gap-3 lg:rounded-[20px] lg:p-8">
                    <span className="text-sm leading-[18px] text-muted lg:text-base lg:leading-5">{label}</span>
                    <span className="font-display text-[26px] leading-7 lg:text-[32px] lg:leading-[34px]">{nbsp(first)}</span>
                    {more.length > 0 && (
                      <span className="text-base leading-6 text-muted lg:text-lg lg:leading-[26px]">{nbsp(more.join(" "))}</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {course.lecturer?.name && (
            <div className="flex items-center gap-4 rounded-[14px] bg-white p-5 lg:gap-6 lg:rounded-[20px] lg:p-8">
              {course.lecturer.photo?.asset && (
                <div className="tile relative h-[120px] w-24 shrink-0 overflow-hidden rounded-[10px] lg:h-[200px] lg:w-40 lg:rounded-md">
                  <SanityImage
                    image={course.lecturer.photo}
                    alt={t(course.lecturer.photo.alt, locale) ?? course.lecturer.name}
                    fill
                    sizes="160px"
                    className="soft object-cover object-top"
                  />
                </div>
              )}
              <div className="flex flex-col gap-1.5 lg:gap-2.5">
                <span className="text-sm leading-[18px] text-muted lg:text-base lg:leading-5">
                  {t(course.lecturer.role, locale) || tr("course.lecturer")}
                </span>
                <span className="font-display text-[26px] leading-7 lg:text-[40px] lg:leading-10">{course.lecturer.name}</span>
                {t(course.lecturer.bio, locale) && (
                  <span className="text-[15px] leading-[22px] text-muted lg:text-lg lg:leading-7">
                    {nbsp(t(course.lecturer.bio, locale)!)}
                  </span>
                )}
              </div>
            </div>
          )}

          {rows.length > 0 && (
            <LessonDates
              title={tr("course.dates")}
              rows={rows}
              moreLabel={lastDay ? tr("course.moreDates", { count: rows.length - 6, date: formatDay(lastDay, locale) }) : undefined}
            />
          )}
        </article>

        <aside className="flex flex-col gap-4 lg:col-span-4">
          <GoodToKnowCard title={tr("detail.goodToKnow")} items={goodToKnow} />
          <div className="max-lg:hidden">
            <LinksCard groups={[{ label: tr("detail.share"), content: <ShareButtons title={title} /> }]} />
          </div>
          <div className="flex flex-col max-lg:hidden">
            <ButterCard
              href="/kurzy"
              kicker={
                new Set(slots.map((s) => s.weekday)).size === 1
                  ? tr("course.notSuitable", { weekday: String(slots[0].weekday) })
                  : tr("course.notSuitableAny")
              }
              title={`${tr("course.fullTimetable")} →`}
            />
          </div>
        </aside>
      </section>

      {more.length > 0 && (
        <section
          aria-label={tr("course.more")}
          className="mx-3 mt-12 flex flex-col gap-4 rounded-tile bg-white p-4 lg:mx-6 lg:mt-24 lg:gap-8 lg:rounded-card lg:p-8"
        >
          <div className="flex items-end justify-between gap-3 px-1 lg:px-2">
            <h2 className="m-0 font-display text-[56px] leading-[52px] whitespace-nowrap lg:text-[120px] lg:leading-[104px]">{tr("course.more")}</h2>
            <Link href="/kurzy" className="pb-1 text-[15px] font-medium whitespace-nowrap text-muted no-underline hover:text-black lg:hidden">
              {tr("course.timetable")} →
            </Link>
            <Link href="/kurzy" className={`${buttonClass("primary", "lg")} max-lg:hidden`}>
              {tr("course.allCourses")} →
            </Link>
          </div>
          <div className="flex flex-col gap-3 lg:grid lg:grid-cols-3 lg:gap-4">
            {more.map((c, i) => (
              <CourseTile
                key={c._id}
                slug={tSlug(c.slug, locale)}
                title={t(c.title, locale) ?? ""}
                image={c.heroImage}
                badge={slotsBadge(c.slots, locale)}
                chip={c.focus ? <FocusChip focus={c.focus} /> : <CategoryChip category="lekce" locale={locale} />}
                className={i === 2 ? "max-lg:hidden" : ""}
              />
            ))}
          </div>
        </section>
      )}

      {course.bookingUrl && (
        <StickyBar
          meta={stickyMeta}
          title={title}
          action={
            <a href={course.bookingUrl} target="_blank" rel="noopener" className={stickyActionClass}>
              {tr("course.bookShort")}
            </a>
          }
        />
      )}
    </>
  );
}
