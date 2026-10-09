import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  // Preview deployments (and the development dataset) stay out of search engines.
  const isProduction = process.env.VERCEL_ENV ? process.env.VERCEL_ENV === "production" : true;
  // "/*?": filter, month and view variants of Program and Courses. Each is rendered on
  // request, there are thousands of them, and the plain pages (in the sitemap) cover the content.
  return {
    rules: isProduction ? { userAgent: "*", allow: "/", disallow: ["/admin", "/api/", "/*?"] } : { userAgent: "*", disallow: "/" },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
