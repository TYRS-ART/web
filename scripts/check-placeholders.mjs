/**
 * Launch rule (BRIEF §10): fails the build if any prerendered page shows design
 * placeholder text ("[Název akce]", "doplnit", "Lorem…"). Runs after `next build`
 * when the site is built against the production dataset.
 */
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

// Local builds read .env files the way Next.js does; on Vercel the variables are already set.
for (const file of [".env.production.local", ".env.local", ".env.production", ".env"]) {
  try {
    process.loadEnvFile(file);
  } catch {}
}

const PLACEHOLDER = /\[[^\]<>{}"]{1,80}\]|doplnit|lorem/gi;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;

if (dataset !== "production" && !process.argv.includes("--force")) {
  console.log(`check-placeholders: skipped (dataset "${dataset}", run with --force to check anyway)`);
  process.exit(0);
}

async function* htmlFiles(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* htmlFiles(path);
    else if (entry.name.endsWith(".html")) yield path;
  }
}

/** Visible text only: drop scripts, styles, tags and decode a few entities. */
function visibleText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ");
}

const problems = [];
for await (const file of htmlFiles(".next/server/app")) {
  if (file.includes("/studio")) continue;
  const hits = visibleText(await readFile(file, "utf8")).match(PLACEHOLDER);
  if (hits) problems.push(`${file.replace(".next/server/app", "")}: ${[...new Set(hits)].join(", ")}`);
}

if (problems.length) {
  console.error("check-placeholders: placeholder text found on rendered pages:\n" + problems.map((p) => `  - ${p}`).join("\n"));
  process.exit(1);
}
console.log("check-placeholders: no placeholder text on rendered pages");
