import "server-only";

/** Viewer token: reads drafts for the Presentation preview. Never sent to the browser. */
export const readToken = process.env.SANITY_API_READ_TOKEN;
