import { defineDocuments, defineLocations, type PresentationPluginOptions } from "sanity/presentation";

type Slugs = { cs?: string; en?: string } | undefined;

/** Where each document type appears on the site (shown at the top of the editor). */
export const resolve: PresentationPluginOptions["resolve"] = {
  mainDocuments: defineDocuments([
    { route: "/program/:slug", filter: `_type == "event" && slug.cs.current == $slug` },
    { route: "/en/program/:slug", filter: `_type == "event" && (slug.en.current == $slug || slug.cs.current == $slug)` },
    { route: "/kurzy/:slug", filter: `_type == "course" && slug.cs.current == $slug` },
    { route: "/en/courses/:slug", filter: `_type == "course" && (slug.en.current == $slug || slug.cs.current == $slug)` },
    { route: "/venue", filter: `_id == "venuePage"` },
    { route: "/en/venue", filter: `_id == "venuePage"` },
    { route: "/pronajem", filter: `_id == "rentalPage"` },
    { route: "/en/rental", filter: `_id == "rentalPage"` },
    { route: "/", filter: `_id == "settings"` },
    { route: "/en", filter: `_id == "settings"` },
  ]),
  locations: {
    event: defineLocations({
      select: { title: "title.cs", cs: "slug.cs.current", en: "slug.en.current" },
      resolve: (doc) => {
        const slugs = doc as Slugs & { title?: string };
        return {
          locations: [
            ...(slugs?.cs ? [{ title: slugs.title ?? "Akce", href: `/program/${slugs.cs}` }] : []),
            ...(slugs?.en || slugs?.cs ? [{ title: `${slugs?.title ?? "Event"} (EN)`, href: `/en/program/${slugs.en ?? slugs.cs}` }] : []),
            { title: "Program", href: "/program" },
            { title: "Homepage", href: "/" },
          ],
        };
      },
    }),
    course: defineLocations({
      select: { title: "title.cs", cs: "slug.cs.current", en: "slug.en.current" },
      resolve: (doc) => {
        const slugs = doc as Slugs & { title?: string };
        return {
          locations: [
            ...(slugs?.cs ? [{ title: slugs.title ?? "Kurz", href: `/kurzy/${slugs.cs}` }] : []),
            ...(slugs?.en || slugs?.cs ? [{ title: `${slugs?.title ?? "Course"} (EN)`, href: `/en/courses/${slugs.en ?? slugs.cs}` }] : []),
            { title: "Kurzy & lekce", href: "/kurzy" },
            { title: "Homepage", href: "/" },
          ],
        };
      },
    }),
    settings: defineLocations({
      message: "Nastavení se používá na všech stránkách",
      tone: "positive",
      locations: [
        { title: "Homepage", href: "/" },
        { title: "Homepage (EN)", href: "/en" },
      ],
    }),
    venuePage: defineLocations({
      locations: [
        { title: "Venue", href: "/venue" },
        { title: "Venue (EN)", href: "/en/venue" },
      ],
    }),
    rentalPage: defineLocations({
      locations: [
        { title: "Pronájem", href: "/pronajem" },
        { title: "Rental (EN)", href: "/en/rental" },
      ],
    }),
    space: defineLocations({ locations: [{ title: "Pronájem", href: "/pronajem" }] }),
    person: defineLocations({
      locations: [
        { title: "Venue", href: "/venue" },
        { title: "Kurzy & lekce", href: "/kurzy" },
      ],
    }),
    playlist: defineLocations({ locations: [{ title: "Homepage", href: "/" }] }),
  },
};
