/**
 * Program, Courses and Rental are rendered on the server for every request (their
 * filters and months live in the query string). Next.js prefetches every link that
 * scrolls into view, so a single visit used to start ~20 server renders nobody asked
 * for. Links to these pages load on click instead; every other page is pre-built
 * and stays prefetched.
 */
const PER_REQUEST = /^(?:\/en)?\/(?:program|kurzy|courses|pronajem|rental)\/?(?:[?#]|$)/;

/** `prefetch` value for a link: false for the per-request pages, default otherwise. */
export function prefetchFor(pathname: string): false | undefined {
  return PER_REQUEST.test(pathname) ? false : undefined;
}
