import type { MetadataRoute } from "next";

import { getPathname } from "@/i18n/navigation";
import { locales } from "@/i18n/locales";
import type { AppPathname } from "@/i18n/routing";
import { siteUrl } from "@/lib/site";
import { sanityFetch } from "@/sanity/lib/fetch";
import { SITEMAP_QUERY } from "@/sanity/queries/sitemap";

type Href = Parameters<typeof getPathname>[0]["href"];

function entry(href: (locale: (typeof locales)[number]) => Href | null, lastModified?: string): MetadataRoute.Sitemap {
  const urls = Object.fromEntries(
    locales.flatMap((locale) => {
      const target = href(locale);
      return target ? [[locale, `${siteUrl}${getPathname({ href: target, locale })}`]] : [];
    }),
  );
  return Object.values(urls).map((url) => ({
    url,
    lastModified,
    alternates: { languages: urls },
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const data = await sanityFetch({ query: SITEMAP_QUERY, tags: ["event", "course"] });
  const staticPages: AppPathname[] = ["/", "/program", "/kurzy", "/venue", "/pronajem", "/ochrana-soukromi"];

  return [
    ...staticPages.flatMap((pathname) => entry(() => pathname as Href)),
    ...data.events.flatMap((event) =>
      entry((locale) => {
        const slug = event.slug?.[locale]?.current;
        return slug ? { pathname: "/program/[slug]", params: { slug } } : null;
      }, event._updatedAt),
    ),
    ...data.courses.flatMap((course) =>
      entry((locale) => {
        const slug = course.slug?.[locale]?.current;
        return slug ? { pathname: "/kurzy/[slug]", params: { slug } } : null;
      }, course._updatedAt),
    ),
  ];
}
